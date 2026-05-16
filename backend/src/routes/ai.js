const router = require('express').Router()
const { authenticate } = require('../middleware/auth')
const { GoogleGenerativeAI } = require('@google/generative-ai')

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

router.post('/suggest-goal', authenticate, async (req, res) => {
  try {
    const { thrustArea, description } = req.body
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    const prompt = `You are an HR performance management expert. 
A ${thrustArea} professional wants to set a work goal.
Their rough idea: "${description}"

Rewrite this as 3 SMART goal suggestions (Specific, Measurable, Achievable, Relevant, Time-bound).
Each should be one clear sentence, professional, and include a measurable target.
Return ONLY a JSON array of 3 strings, no explanation, no markdown.
Example: ["Goal 1 text", "Goal 2 text", "Goal 3 text"]`

    const result = await model.generateContent(prompt)
    const text = result.response.text().trim()
    const clean = text.replace(/```json|```/g, '').trim()
    const suggestions = JSON.parse(clean)
    res.json({ suggestions })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

module.exports = router