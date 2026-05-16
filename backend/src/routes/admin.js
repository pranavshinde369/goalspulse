const router = require('express').Router()
const { authenticate, requireRole } = require('../middleware/auth')

router.get('/users', authenticate, requireRole('ADMIN'), (req, res) => {
  res.json({ message: 'admin route working' })
})

module.exports = router
