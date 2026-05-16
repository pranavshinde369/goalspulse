import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'

const THRUST_AREAS = ['Sales', 'Customer', 'Safety', 'Quality', 'Finance', 'Operations', 'HR', 'Technology']
const UOM_TYPES = [
  { value: 'MIN', label: 'Min (higher is better, e.g. Revenue)' },
  { value: 'MAX', label: 'Max (lower is better, e.g. TAT, Cost)' },
  { value: 'TIMELINE', label: 'Timeline (date-based completion)' },
  { value: 'ZERO', label: 'Zero (zero = success, e.g. Incidents)' },
]

const emptyGoal = () => ({ thrustArea: 'Sales', title: '', description: '', uomType: 'MIN', target: '', weightage: '' })

export default function EmployeeDashboard() {
  const [goals, setGoals] = useState([])
  const [form, setForm] = useState([emptyGoal()])
  const [view, setView] = useState('dashboard') // dashboard | create | checkin
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')
  const [selectedGoal, setSelectedGoal] = useState(null)
  const [checkinData, setCheckinData] = useState({ quarter: 1, actual: '', status: 'On Track', comment: '' })
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user'))

  useEffect(() => { fetchGoals() }, [])

  const fetchGoals = async () => {
    try {
      const res = await api.get('/goals/my')
      setGoals(res.data)
    } catch (e) { console.error(e) }
  }

  const totalWeightage = form.reduce((s, g) => s + Number(g.weightage || 0), 0)

  const updateGoal = (i, field, value) => {
    const updated = [...form]
    updated[i][field] = value
    setForm(updated)
  }

  const addGoal = () => {
    if (form.length >= 8) return setError('Maximum 8 goals allowed')
    setForm([...form, emptyGoal()])
    setError('')
  }

  const removeGoal = (i) => setForm(form.filter((_, idx) => idx !== i))

  const handleCreate = async () => {
    setError('')
    if (totalWeightage !== 100) return setError(`Total weightage must be 100% (currently ${totalWeightage}%)`)
    for (const g of form) {
      if (!g.title) return setError('All goals must have a title')
      if (Number(g.weightage) < 10) return setError('Each goal must have at least 10% weightage')
    }
    try {
      await api.post('/goals', { goals: form })
      setMsg('Goals saved as draft!')
      setForm([emptyGoal()])
      setView('dashboard')
      fetchGoals()
    } catch (e) { setError(e.response?.data?.error || 'Error creating goals') }
  }

  const handleSubmit = async () => {
    try {
      await api.post('/goals/submit')
      setMsg('Goals submitted for manager approval!')
      fetchGoals()
    } catch (e) { setError(e.response?.data?.error || 'Error submitting') }
  }

  const handleCheckin = async () => {
    try {
      await api.post(`/goals/${selectedGoal.id}/checkin`, checkinData)
      setMsg('Check-in recorded!')
      setView('dashboard')
      setSelectedGoal(null)
      fetchGoals()
    } catch (e) { setError(e.response?.data?.error || 'Error recording check-in') }
  }

  const logout = () => {
    localStorage.clear()
    navigate('/login')
  }

  const statusColor = { DRAFT: '#6b7280', SUBMITTED: '#2563eb', APPROVED: '#16a34a', REJECTED: '#dc2626', LOCKED: '#7c3aed' }
  const hasDrafts = goals.some(g => g.status === 'DRAFT')
  const hasSubmitted = goals.some(g => g.status === 'SUBMITTED')

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.header}>
        <div>
          <div style={s.headerTitle}>GoalsPulse</div>
          <div style={s.headerSub}>Welcome, {user?.name} · Employee</div>
        </div>
        <div style={{display:'flex',gap:'8px'}}>
          {view === 'dashboard' && (
            <button style={s.btnPrimary} onClick={() => { setView('create'); setMsg(''); setError('') }}>+ Add Goals</button>
          )}
          {view !== 'dashboard' && (
            <button style={s.btnSecondary} onClick={() => setView('dashboard')}>← Back</button>
          )}
          <button style={s.btnSecondary} onClick={logout}>Logout</button>
        </div>
      </div>

      <div style={s.body}>
        {msg && <div style={s.success}>{msg}</div>}
        {error && <div style={s.errorBox}>{error}</div>}

        {/* DASHBOARD VIEW */}
        {view === 'dashboard' && (
          <>
            <div style={s.sectionTitle}>My Goals</div>
            {goals.length === 0 && (
              <div style={s.empty}>No goals yet. Click "Add Goals" to get started.</div>
            )}
            {goals.map(g => (
              <div key={g.id} style={s.goalCard}>
                <div style={s.goalTop}>
                  <div>
                    <div style={s.goalTitle}>{g.title}</div>
                    <div style={s.goalMeta}>{g.thrustArea} · {g.uomType} · Weightage: {g.weightage}%</div>
                    <div style={s.goalMeta}>Target: {g.target} {g.actual != null ? `· Actual: ${g.actual}` : ''}</div>
                  </div>
                  <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:'8px'}}>
                    <span style={{...s.badge, background: statusColor[g.status]+'20', color: statusColor[g.status]}}>{g.status}</span>
                    {g.status === 'LOCKED' && (
                      <button style={s.btnSmall} onClick={() => { setSelectedGoal(g); setView('checkin') }}>Log Check-in</button>
                    )}
                  </div>
                </div>
                {g.progressPct != null && (
                  <div style={{marginTop:'8px'}}>
                    <div style={s.progressLabel}>Progress: {Math.round(g.progressPct)}%</div>
                    <div style={s.progressBg}>
                      <div style={{...s.progressFill, width: `${Math.min(g.progressPct,100)}%`, background: g.progressPct >= 100 ? '#16a34a' : g.progressPct >= 60 ? '#ca8a04' : '#dc2626'}} />
                    </div>
                  </div>
                )}
              </div>
            ))}
            {hasDrafts && (
              <button style={{...s.btnPrimary, marginTop:'1rem'}} onClick={handleSubmit}>Submit All Drafts for Approval</button>
            )}
            {hasSubmitted && (
              <div style={s.infoBox}>Goals submitted — waiting for manager approval.</div>
            )}
          </>
        )}

        {/* CREATE GOALS VIEW */}
        {view === 'create' && (
          <>
            <div style={s.sectionTitle}>Create Goal Sheet</div>
            <div style={{...s.weightageBar, background: totalWeightage === 100 ? '#dcfce7' : totalWeightage > 100 ? '#fee2e2' : '#fef9c3'}}>
              <span style={{fontWeight:500}}>Total Weightage: {totalWeightage}%</span>
              <span style={{fontSize:'13px', color: totalWeightage === 100 ? '#16a34a' : '#dc2626'}}>
                {totalWeightage === 100 ? '✓ Ready to save' : totalWeightage > 100 ? '⚠ Over 100%' : `${100 - totalWeightage}% remaining`}
              </span>
            </div>
            {form.map((g, i) => (
              <div key={i} style={s.formCard}>
                <div style={s.formCardHeader}>
                  <span style={{fontWeight:500}}>Goal {i + 1}</span>
                  {form.length > 1 && <button style={s.btnDanger} onClick={() => removeGoal(i)}>Remove</button>}
                </div>
                <div style={s.grid2}>
                  <div style={s.field}>
                    <label style={s.label}>Thrust Area</label>
                    <select style={s.input} value={g.thrustArea} onChange={e => updateGoal(i, 'thrustArea', e.target.value)}>
                      {THRUST_AREAS.map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div style={s.field}>
                    <label style={s.label}>Unit of Measurement</label>
                    <select style={s.input} value={g.uomType} onChange={e => updateGoal(i, 'uomType', e.target.value)}>
                      {UOM_TYPES.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
                    </select>
                  </div>
                </div>
                <div style={s.field}>
                  <label style={s.label}>Goal Title</label>
                  <input style={s.input} value={g.title} onChange={e => updateGoal(i, 'title', e.target.value)} placeholder="e.g. Increase Sales Revenue" />
                </div>
                <div style={s.field}>
                  <label style={s.label}>Description</label>
                  <input style={s.input} value={g.description} onChange={e => updateGoal(i, 'description', e.target.value)} placeholder="Brief description of this goal" />
                </div>
                <div style={s.grid2}>
                  <div style={s.field}>
                    <label style={s.label}>Target</label>
                    <input style={s.input} type="number" value={g.target} onChange={e => updateGoal(i, 'target', e.target.value)} placeholder="e.g. 1000000" />
                  </div>
                  <div style={s.field}>
                    <label style={s.label}>Weightage (%)</label>
                    <input style={s.input} type="number" value={g.weightage} onChange={e => updateGoal(i, 'weightage', e.target.value)} placeholder="Min 10%" />
                  </div>
                </div>
              </div>
            ))}
            <div style={{display:'flex',gap:'8px',marginTop:'1rem'}}>
              {form.length < 8 && <button style={s.btnSecondary} onClick={addGoal}>+ Add Another Goal</button>}
              <button style={{...s.btnPrimary, opacity: totalWeightage !== 100 ? 0.5 : 1}} onClick={handleCreate}>Save Goals as Draft</button>
            </div>
          </>
        )}

        {/* CHECKIN VIEW */}
        {view === 'checkin' && selectedGoal && (
          <>
            <div style={s.sectionTitle}>Log Check-in: {selectedGoal.title}</div>
            <div style={s.goalCard}>
              <div style={s.goalMeta}>Target: {selectedGoal.target} · UoM: {selectedGoal.uomType} · Weightage: {selectedGoal.weightage}%</div>
            </div>
            <div style={s.formCard}>
              <div style={s.grid2}>
                <div style={s.field}>
                  <label style={s.label}>Quarter</label>
                  <select style={s.input} value={checkinData.quarter} onChange={e => setCheckinData({...checkinData, quarter: Number(e.target.value)})}>
                    <option value={1}>Q1 (July)</option>
                    <option value={2}>Q2 (October)</option>
                    <option value={3}>Q3 (January)</option>
                    <option value={4}>Q4 (March/April)</option>
                  </select>
                </div>
                <div style={s.field}>
                  <label style={s.label}>Status</label>
                  <select style={s.input} value={checkinData.status} onChange={e => setCheckinData({...checkinData, status: e.target.value})}>
                    <option>Not Started</option>
                    <option>On Track</option>
                    <option>Completed</option>
                  </select>
                </div>
              </div>
              <div style={s.field}>
                <label style={s.label}>Actual Achievement</label>
                <input style={s.input} type="number" value={checkinData.actual} onChange={e => setCheckinData({...checkinData, actual: e.target.value})} placeholder="Enter actual value" />
              </div>
              <div style={s.field}>
                <label style={s.label}>Comment (optional)</label>
                <input style={s.input} value={checkinData.comment} onChange={e => setCheckinData({...checkinData, comment: e.target.value})} placeholder="Any notes on your progress" />
              </div>
              <button style={s.btnPrimary} onClick={handleCheckin}>Save Check-in</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

const s = {
  page: { minHeight:'100vh', background:'#f5f7fa' },
  header: { background:'#fff', padding:'1rem 2rem', borderBottom:'1px solid #e5e7eb', display:'flex', justifyContent:'space-between', alignItems:'center' },
  headerTitle: { fontSize:'20px', fontWeight:'600', color:'#1a1a1a' },
  headerSub: { fontSize:'13px', color:'#6b7280', marginTop:'2px' },
  body: { maxWidth:'800px', margin:'0 auto', padding:'2rem 1rem' },
  sectionTitle: { fontSize:'18px', fontWeight:'600', marginBottom:'1rem', color:'#1a1a1a' },
  goalCard: { background:'#fff', border:'1px solid #e5e7eb', borderRadius:'10px', padding:'1rem 1.25rem', marginBottom:'0.75rem' },
  goalTop: { display:'flex', justifyContent:'space-between', alignItems:'flex-start' },
  goalTitle: { fontSize:'15px', fontWeight:'500', color:'#1a1a1a', marginBottom:'4px' },
  goalMeta: { fontSize:'13px', color:'#6b7280', marginBottom:'2px' },
  badge: { fontSize:'12px', fontWeight:'500', padding:'3px 10px', borderRadius:'20px' },
  formCard: { background:'#fff', border:'1px solid #e5e7eb', borderRadius:'10px', padding:'1.25rem', marginBottom:'0.75rem' },
  formCardHeader: { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem' },
  grid2: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' },
  field: { marginBottom:'0.75rem' },
  label: { display:'block', fontSize:'13px', fontWeight:'500', marginBottom:'4px', color:'#374151' },
  input: { width:'100%', padding:'8px 10px', border:'1px solid #d1d5db', borderRadius:'6px', fontSize:'14px', boxSizing:'border-box' },
  weightageBar: { padding:'0.75rem 1rem', borderRadius:'8px', marginBottom:'1rem', display:'flex', justifyContent:'space-between', alignItems:'center' },
  progressLabel: { fontSize:'12px', color:'#6b7280', marginBottom:'4px' },
  progressBg: { height:'6px', background:'#e5e7eb', borderRadius:'3px', overflow:'hidden' },
  progressFill: { height:'100%', borderRadius:'3px', transition:'width 0.3s' },
  btnPrimary: { padding:'8px 16px', background:'#2563eb', color:'#fff', border:'none', borderRadius:'6px', cursor:'pointer', fontWeight:'500', fontSize:'14px' },
  btnSecondary: { padding:'8px 16px', background:'#fff', color:'#374151', border:'1px solid #d1d5db', borderRadius:'6px', cursor:'pointer', fontSize:'14px' },
  btnSmall: { padding:'4px 10px', background:'#7c3aed', color:'#fff', border:'none', borderRadius:'4px', cursor:'pointer', fontSize:'12px' },
  btnDanger: { padding:'4px 10px', background:'#fee2e2', color:'#dc2626', border:'none', borderRadius:'4px', cursor:'pointer', fontSize:'12px' },
  success: { background:'#dcfce7', color:'#16a34a', padding:'0.75rem 1rem', borderRadius:'8px', marginBottom:'1rem', fontSize:'14px' },
  errorBox: { background:'#fee2e2', color:'#dc2626', padding:'0.75rem 1rem', borderRadius:'8px', marginBottom:'1rem', fontSize:'14px' },
  infoBox: { background:'#dbeafe', color:'#1d4ed8', padding:'0.75rem 1rem', borderRadius:'8px', marginTop:'0.5rem', fontSize:'14px' },
  empty: { background:'#fff', border:'1px solid #e5e7eb', borderRadius:'10px', padding:'2rem', textAlign:'center', color:'#6b7280' },
}