const router = require('express').Router()
const { authenticate } = require('../middleware/auth')
const { GoogleGenerativeAI } = require('@google/generative-ai')

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

router.post('/suggest-goal', authenticate, async (req, res) => {
  try {
    const { thrustArea, description } = req.body
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

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
router.post('/appraisal-summary', authenticate, async (req, res) => {
  try {
    const { employeeName, goals } = req.body
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

    const goalSummary = goals.map(g =>
      `- ${g.title} (${g.thrustArea}, ${g.uomType}, target: ${g.target}, progress: ${g.progressPct != null ? Math.round(g.progressPct)+'%' : 'not started'}, status: ${g.status})`
    ).join('\n')

    const prompt = `You are an HR performance management expert writing a professional appraisal summary.
Employee: ${employeeName}
Goals this year:
${goalSummary}

Write a concise 3-sentence appraisal summary covering: overall performance, key achievements, and one area for growth.
Be professional, specific, and encouraging. Use the employee's name. Return only the summary, no headings.`

    const result = await model.generateContent(prompt)
    res.json({ summary: result.response.text().trim() })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})
module.exports = router