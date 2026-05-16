const router = require('express').Router()
const { authenticate, requireRole } = require('../middleware/auth')
const prisma = require('../lib/prisma')
const ExcelJS = require('exceljs')

router.get('/users', authenticate, requireRole('ADMIN'), async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      include: { goals: true },
      orderBy: { createdAt: 'asc' }
    })
    res.json(users)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

router.get('/report', authenticate, requireRole('ADMIN'), async (req, res) => {
  try {
    const users = await prisma.user.findMany({ include: { goals: { include: { checkIns: true } } } })

    const workbook = new ExcelJS.Workbook()
    const sheet = workbook.addWorksheet('Achievement Report')

    sheet.columns = [
      { header: 'Employee', key: 'employee', width: 20 },
      { header: 'Goal Title', key: 'title', width: 25 },
      { header: 'Thrust Area', key: 'thrustArea', width: 15 },
      { header: 'UoM Type', key: 'uomType', width: 12 },
      { header: 'Target', key: 'target', width: 12 },
      { header: 'Actual', key: 'actual', width: 12 },
      { header: 'Progress %', key: 'progress', width: 12 },
      { header: 'Weightage %', key: 'weightage', width: 13 },
      { header: 'Status', key: 'status', width: 12 },
    ]

    // Style header row
    sheet.getRow(1).eachCell(cell => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } }
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
      cell.alignment = { horizontal: 'center' }
    })

    users.forEach(u => {
      u.goals.forEach(g => {
        const row = sheet.addRow({
          employee: u.name,
          title: g.title,
          thrustArea: g.thrustArea,
          uomType: g.uomType,
          target: g.target,
          actual: g.actual ?? '—',
          progress: g.progressPct != null ? `${Math.round(g.progressPct)}%` : '—',
          weightage: `${g.weightage}%`,
          status: g.status,
        })
        // Color status cell
        const statusCell = row.getCell('status')
        const colors = { LOCKED: 'FF7C3AED', SUBMITTED: 'FF2563EB', DRAFT: 'FF6B7280', REJECTED: 'FFDC2626' }
        statusCell.font = { color: { argb: colors[g.status] || 'FF000000' }, bold: true }
      })
    })

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.setHeader('Content-Disposition', 'attachment; filename=achievement_report.xlsx')
    await workbook.xlsx.write(res)
    res.end()
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

module.exports = router