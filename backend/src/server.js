const express = require('express')
const cors = require('cors')
require('dotenv').config()

const authRoutes = require('./routes/auth')
const goalRoutes = require('./routes/goals')
const adminRoutes = require('./routes/admin')
const aiRoutes = require('./routes/ai')

const app = express()

app.use(cors({
  origin: [
    'http://localhost:5173',
    'goalspulse-zze6.vercel.app',  // replace with your actual Vercel URL
    /\.vercel\.app$/  // allows all vercel preview URLs
  ],
  credentials: true
}))

app.use(express.json())

app.use('/api/auth', authRoutes)
app.use('/api/goals', goalRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/ai', aiRoutes)

app.get('/', (req, res) => res.json({ status: 'GoalsPulse API running' }))

const PORT = process.env.PORT || 4000
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))