const router = require('express').Router()
const prisma = require('../lib/prisma')
const { authenticate, requireRole } = require('../middleware/auth')

// Validation helper
function validateGoals(goals) {
  if (goals.length > 8)
    return 'Maximum 8 goals allowed'
  for (const g of goals) {
    if (g.weightage < 10)
      return `Goal "${g.title}" must have at least 10% weightage`
  }
  const total = goals.reduce((sum, g) => sum + Number(g.weightage), 0)
  if (Math.round(total) !== 100)
    return `Total weightage must equal 100% (currently ${total}%)`
  return null
}

// Progress formula
function calcProgress(uomType, target, actual) {
  if (!actual) return 0
  if (uomType === 'MIN')      return Math.min((actual / target) * 100, 200)
  if (uomType === 'MAX')      return Math.min((target / actual) * 100, 200)
  if (uomType === 'ZERO')     return actual === 0 ? 100 : 0
  if (uomType === 'TIMELINE') return actual <= target ? 100 : Math.round((target / actual) * 100)
  return 0
}

// POST /api/goals — create goals (full sheet submission)
router.post('/', authenticate, requireRole('EMPLOYEE'), async (req, res) => {
  try {
    const { goals } = req.body // array of goal objects
    const error = validateGoals(goals)
    if (error) return res.status(400).json({ error })

    const created = await prisma.goal.createMany({
      data: goals.map(g => ({
        userId: req.user.id,
        thrustArea: g.thrustArea,
        title: g.title,
        description: g.description,
        uomType: g.uomType,
        target: Number(g.target),
        weightage: Number(g.weightage),
        status: 'DRAFT'
      }))
    })
    res.json({ message: `${created.count} goals created` })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// GET /api/goals/my — employee sees their own goals
router.get('/my', authenticate, async (req, res) => {
  try {
    const goals = await prisma.goal.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' }
    })
    res.json(goals)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// POST /api/goals/submit — employee submits all draft goals for approval
router.post('/submit', authenticate, requireRole('EMPLOYEE'), async (req, res) => {
  try {
    const goals = await prisma.goal.findMany({
      where: { userId: req.user.id, status: 'DRAFT' }
    })
    if (goals.length === 0)
      return res.status(400).json({ error: 'No draft goals to submit' })

    const error = validateGoals(goals)
    if (error) return res.status(400).json({ error })

    await prisma.goal.updateMany({
      where: { userId: req.user.id, status: 'DRAFT' },
      data: { status: 'SUBMITTED' }
    })
    res.json({ message: 'Goals submitted for approval' })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// GET /api/goals/team — manager sees their team's goals
router.get('/team', authenticate, requireRole('MANAGER', 'ADMIN'), async (req, res) => {
  try {
    const team = await prisma.user.findMany({
      where: { managerId: req.user.id },
      include: { goals: true }
    })
    res.json(team)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// PATCH /api/goals/:id — manager edits a goal before approval
router.patch('/:id', authenticate, requireRole('MANAGER', 'ADMIN'), async (req, res) => {
  try {
    const { target, weightage } = req.body
    const goal = await prisma.goal.findUnique({ where: { id: req.params.id } })
    if (!goal) return res.status(404).json({ error: 'Goal not found' })
    if (goal.status === 'LOCKED')
      return res.status(403).json({ error: 'Goal is locked' })

    const updated = await prisma.goal.update({
      where: { id: req.params.id },
      data: { target: Number(target), weightage: Number(weightage) }
    })
    res.json(updated)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// POST /api/goals/:id/approve — manager approves, goal locks
router.post('/:id/approve', authenticate, requireRole('MANAGER', 'ADMIN'), async (req, res) => {
  try {
    const goal = await prisma.goal.update({
      where: { id: req.params.id },
      data: { status: 'LOCKED', lockedAt: new Date() }
    })
    res.json({ message: 'Goal approved and locked', goal })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// POST /api/goals/:id/reject — manager rejects, goes back to employee
router.post('/:id/reject', authenticate, requireRole('MANAGER', 'ADMIN'), async (req, res) => {
  try {
    const { comment } = req.body
    const goal = await prisma.goal.update({
      where: { id: req.params.id },
      data: { status: 'REJECTED' }
    })
    res.json({ message: 'Goal returned for rework', goal })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// POST /api/goals/:id/checkin — employee logs quarterly achievement
router.post('/:id/checkin', authenticate, async (req, res) => {
  try {
    const { quarter, actual, status } = req.body
    const goal = await prisma.goal.findUnique({ where: { id: req.params.id } })
    if (!goal) return res.status(404).json({ error: 'Goal not found' })

    const progressPct = calcProgress(goal.uomType, goal.target, Number(actual))

    const checkIn = await prisma.checkIn.create({
      data: {
        goalId: goal.id,
        userId: req.user.id,
        quarter: Number(quarter),
        actual: Number(actual),
        status,
        comment: req.body.comment || null
      }
    })

    await prisma.goal.update({
      where: { id: goal.id },
      data: { actual: Number(actual), progressPct }
    })

    res.json({ checkIn, progressPct })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

module.exports = router