import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'
import { useToast } from '../components/Toast'

const THRUST_AREAS = ['Sales', 'Customer', 'Safety', 'Quality', 'Finance', 'Operations', 'HR', 'Technology']
const UOM_TYPES = [
  { value: 'MIN', label: 'Min — higher is better (e.g. Revenue)' },
  { value: 'MAX', label: 'Max — lower is better (e.g. TAT, Cost)' },
  { value: 'TIMELINE', label: 'Timeline — date-based completion' },
  { value: 'ZERO', label: 'Zero — zero = success (e.g. Incidents)' },
]

const emptyGoal = () => ({ thrustArea: 'Sales', title: '', description: '', uomType: 'MIN', target: '', weightage: '', suggestions: [] })

export default function EmployeeDashboard() {
  const [goals, setGoals] = useState([])
  const [form, setForm] = useState([emptyGoal()])
  const [view, setView] = useState('dashboard')
  const [selectedGoal, setSelectedGoal] = useState(null)
  const [checkinData, setCheckinData] = useState({ quarter: 1, actual: '', status: 'On Track', comment: '' })
  const [aiLoading, setAiLoading] = useState(null)
  const [btnLoading, setBtnLoading] = useState({})
  const navigate = useNavigate()
  const toast = useToast()
  const user = JSON.parse(localStorage.getItem('user'))

  useEffect(() => { fetchGoals() }, [])

  const fetchGoals = async () => {
    try {
      const res = await api.get('/goals/my')
      setGoals(res.data)
    } catch (e) { toast('Failed to load goals', 'error') }
  }

  const setBtn = (key, val) => setBtnLoading(prev => ({ ...prev, [key]: val }))
  const totalWeightage = form.reduce((s, g) => s + Number(g.weightage || 0), 0)

  const updateGoal = (i, field, value) => {
    const updated = [...form]
    updated[i][field] = value
    setForm(updated)
  }

  const addGoal = () => {
    if (form.length >= 8) return toast('Maximum 8 goals allowed', 'warning')
    setForm([...form, emptyGoal()])
  }

  const removeGoal = (i) => setForm(form.filter((_, idx) => idx !== i))

  const fetchSuggestions = async (i, g) => {
    if (!g.description || g.description.length < 10) return toast('Type a longer description first', 'warning')
    setAiLoading(i)
    try {
      const res = await api.post('/ai/suggest-goal', { thrustArea: g.thrustArea, description: g.description })
      const updated = [...form]
      updated[i].suggestions = res.data.suggestions
      setForm(updated)
      toast('AI suggestions ready!', 'success')
    } catch (e) { toast('AI suggestion failed', 'error') }
    finally { setAiLoading(null) }
  }

  const handleCreate = async () => {
    if (totalWeightage !== 100) return toast(`Total weightage must be 100% (currently ${totalWeightage}%)`, 'error')
    for (const g of form) {
      if (!g.title) return toast('All goals must have a title', 'error')
      if (Number(g.weightage) < 10) return toast('Each goal must have at least 10% weightage', 'error')
    }
    setBtn('create', true)
    try {
      await api.post('/goals', { goals: form })
      toast('Goals saved as draft!', 'success')
      setForm([emptyGoal()])
      setView('dashboard')
      fetchGoals()
    } catch (e) { toast(e.response?.data?.error || 'Error creating goals', 'error') }
    finally { setBtn('create', false) }
  }

  const handleSubmit = async () => {
    setBtn('submit', true)
    try {
      await api.post('/goals/submit')
      toast('Goals submitted for manager approval!', 'success')
      fetchGoals()
    } catch (e) { toast(e.response?.data?.error || 'Error submitting', 'error') }
    finally { setBtn('submit', false) }
  }

  const handleCheckin = async () => {
    if (!checkinData.actual) return toast('Please enter actual value', 'error')
    setBtn('checkin', true)
    try {
      await api.post(`/goals/${selectedGoal.id}/checkin`, checkinData)
      toast('Check-in recorded! Progress calculated.', 'success')
      setView('dashboard')
      setSelectedGoal(null)
      setCheckinData({ quarter: 1, actual: '', status: 'On Track', comment: '' })
      fetchGoals()
    } catch (e) { toast(e.response?.data?.error || 'Error recording check-in', 'error') }
    finally { setBtn('checkin', false) }
  }

  const logout = () => { localStorage.clear(); navigate('/login') }

  const statusColor = { DRAFT: '#6b7280', SUBMITTED: '#2563eb', APPROVED: '#16a34a', REJECTED: '#dc2626', LOCKED: '#7c3aed' }
  const hasDrafts = goals.some(g => g.status === 'DRAFT')
  const hasSubmitted = goals.some(g => g.status === 'SUBMITTED')
  const withProgress = goals.filter(g => g.progressPct != null)
  const avgProgress = withProgress.length > 0
    ? Math.round(withProgress.reduce((a, g) => a + g.progressPct, 0) / withProgress.length)
    : null

  const previewProgress = (uomType, target, actual) => {
    const t = Number(target), a = Number(actual)
    if (!a) return null
    if (uomType === 'MIN') return Math.min(Math.round((a / t) * 100), 200)
    if (uomType === 'MAX') return Math.min(Math.round((t / a) * 100), 200)
    if (uomType === 'ZERO') return a === 0 ? 100 : 0
    if (uomType === 'TIMELINE') return a <= t ? 100 : Math.round((t / a) * 100)
    return null
  }

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div>
          <div style={s.headerTitle}>GoalsPulse</div>
          <div style={s.headerSub}>Welcome, {user?.name} · Employee</div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {view === 'dashboard' && (
            <button style={s.btnPrimary} onClick={() => setView('create')}>+ Add Goals</button>
          )}
          {view !== 'dashboard' && (
            <button style={s.btnSecondary} onClick={() => { setView('dashboard') }}>← Back</button>
          )}
          <button style={s.btnSecondary} onClick={logout}>Logout</button>
        </div>
      </div>

      <div style={s.body}>

        {/* DASHBOARD */}
        {view === 'dashboard' && (
          <>
            {goals.length > 0 && (
              <div style={s.summaryStrip}>
                <div style={s.summaryItem}><span style={s.summaryVal}>{goals.length}</span><span style={s.summaryLabel}>Total Goals</span></div>
                <div style={s.summaryItem}><span style={{ ...s.summaryVal, color: '#7c3aed' }}>{goals.filter(g => g.status === 'LOCKED').length}</span><span style={s.summaryLabel}>Locked</span></div>
                <div style={s.summaryItem}><span style={{ ...s.summaryVal, color: '#2563eb' }}>{goals.filter(g => g.status === 'SUBMITTED').length}</span><span style={s.summaryLabel}>Pending</span></div>
                <div style={s.summaryItem}><span style={{ ...s.summaryVal, color: '#16a34a' }}>{avgProgress != null ? `${avgProgress}%` : '—'}</span><span style={s.summaryLabel}>Avg Progress</span></div>
              </div>
            )}

            <div style={s.sectionTitle}>My Goals</div>

            {goals.length === 0 && (
              <div style={s.empty}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>🎯</div>
                <div style={{ fontWeight: '500', marginBottom: '4px' }}>No goals yet</div>
                <div style={{ fontSize: '13px' }}>Click "+ Add Goals" to create your goal sheet</div>
              </div>
            )}

            {goals.map(g => (
              <div key={g.id} style={s.goalCard}>
                <div style={s.goalTop}>
                  <div style={{ flex: 1 }}>
                    <div style={s.goalTitle}>{g.title}</div>
                    <div style={s.goalMeta}>{g.thrustArea} · {g.uomType} · Weightage: {g.weightage}%</div>
                    <div style={s.goalMeta}>Target: {g.target}{g.actual != null ? ` · Actual: ${g.actual}` : ''}</div>
                    {g.description && <div style={{ ...s.goalMeta, fontStyle: 'italic', marginTop: '2px' }}>{g.description}</div>}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                    <span style={{ ...s.badge, background: statusColor[g.status] + '20', color: statusColor[g.status] }}>
                      {g.status}
                    </span>
                    {g.status === 'LOCKED' && (
                      <button style={s.btnCheckin} onClick={() => { setSelectedGoal(g); setView('checkin') }}>
                        📝 Log Check-in
                      </button>
                    )}
                  </div>
                </div>

                {g.progressPct != null && (
                  <div style={{ marginTop: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={s.progressLabel}>Progress</span>
                      <span style={{ ...s.progressLabel, fontWeight: '500', color: g.progressPct >= 100 ? '#16a34a' : g.progressPct >= 60 ? '#ca8a04' : '#dc2626' }}>
                        {Math.round(g.progressPct)}%
                      </span>
                    </div>
                    <div style={s.progressBg}>
                      <div style={{ ...s.progressFill, width: `${Math.min(g.progressPct, 100)}%`, background: g.progressPct >= 100 ? '#16a34a' : g.progressPct >= 60 ? '#ca8a04' : '#dc2626' }} />
                    </div>
                  </div>
                )}

                {g.status === 'REJECTED' && (
                  <div style={{ marginTop: '8px', padding: '8px 10px', background: '#fee2e2', borderRadius: '6px', fontSize: '12px', color: '#dc2626' }}>
                    ✕ Returned for rework — click "+ Add Goals" to create a revised version.
                  </div>
                )}

                {g.status === 'LOCKED' && g.progressPct == null && (
                  <div style={{ marginTop: '8px', fontSize: '12px', color: '#9ca3af' }}>
                    🔒 Locked · No check-in yet · Click "Log Check-in" to record progress
                  </div>
                )}
              </div>
            ))}

            {hasDrafts && (
              <button style={{ ...s.btnPrimary, marginTop: '1rem', opacity: btnLoading['submit'] ? 0.7 : 1 }}
                onClick={handleSubmit} disabled={btnLoading['submit']}>
                {btnLoading['submit'] ? '⏳ Submitting...' : '🚀 Submit All Drafts for Approval'}
              </button>
            )}
            {hasSubmitted && (
              <div style={s.infoBox}>⏳ Goals submitted — waiting for manager approval.</div>
            )}
          </>
        )}

        {/* CREATE GOALS */}
        {view === 'create' && (
          <>
            <div style={s.sectionTitle}>Create Goal Sheet</div>
            <div style={{
              ...s.weightageBar,
              background: totalWeightage === 100 ? '#dcfce7' : totalWeightage > 100 ? '#fee2e2' : '#fef9c3',
              border: `1px solid ${totalWeightage === 100 ? '#86efac' : totalWeightage > 100 ? '#fca5a5' : '#fde68a'}`
            }}>
              <div>
                <span style={{ fontWeight: '600', fontSize: '15px' }}>Total: {totalWeightage}%</span>
                <span style={{ fontSize: '13px', marginLeft: '8px', color: totalWeightage === 100 ? '#16a34a' : '#dc2626' }}>
                  {totalWeightage === 100 ? '✓ Ready to save' : totalWeightage > 100 ? '⚠ Over 100%' : `${100 - totalWeightage}% remaining`}
                </span>
              </div>
              <span style={{ fontSize: '12px', color: '#6b7280' }}>{form.length}/8 goals</span>
            </div>

            {form.map((g, i) => (
              <div key={i} style={s.formCard}>
                <div style={s.formCardHeader}>
                  <span style={{ fontWeight: '600', color: '#1a1a1a' }}>Goal {i + 1}</span>
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
                  <label style={s.label}>Description <span style={{ color: '#9ca3af', fontWeight: 400 }}>(type 10+ chars to unlock AI)</span></label>
                  <input style={s.input} value={g.description}
                    onChange={e => updateGoal(i, 'description', e.target.value)}
                    placeholder="Describe what you want to achieve..." />
                  {g.description.length >= 10 && (
                    <button type="button"
                      style={{ ...s.btnAI, opacity: aiLoading === i ? 0.7 : 1 }}
                      onClick={() => fetchSuggestions(i, g)} disabled={aiLoading === i}>
                      {aiLoading === i ? '⏳ Getting suggestions...' : '✨ Get AI Goal Suggestions'}
                    </button>
                  )}
                  {g.suggestions && g.suggestions.length > 0 && (
                    <div style={{ marginTop: '8px' }}>
                      <div style={{ fontSize: '12px', color: '#7c3aed', fontWeight: '500', marginBottom: '6px' }}>
                        💡 Click a suggestion to use it as your title:
                      </div>
                      {g.suggestions.map((sug, si) => (
                        <div key={si} style={s.suggestionChip} onClick={() => updateGoal(i, 'title', sug)}>
                          {sug}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div style={s.field}>
                  <label style={s.label}>Goal Title</label>
                  <input style={s.input} value={g.title}
                    onChange={e => updateGoal(i, 'title', e.target.value)}
                    placeholder="e.g. Increase quarterly revenue to ₹10L by March" />
                </div>

                <div style={s.grid2}>
                  <div style={s.field}>
                    <label style={s.label}>Target Value</label>
                    <input style={s.input} type="number" value={g.target}
                      onChange={e => updateGoal(i, 'target', e.target.value)} placeholder="e.g. 1000000" />
                  </div>
                  <div style={s.field}>
                    <label style={s.label}>Weightage (%) <span style={{ color: '#9ca3af', fontWeight: 400 }}>min 10%</span></label>
                    <input style={{ ...s.input, borderColor: g.weightage && Number(g.weightage) < 10 ? '#dc2626' : '#d1d5db' }}
                      type="number" value={g.weightage}
                      onChange={e => updateGoal(i, 'weightage', e.target.value)} placeholder="e.g. 40" />
                  </div>
                </div>
              </div>
            ))}

            <div style={{ display: 'flex', gap: '8px', marginTop: '1rem', flexWrap: 'wrap' }}>
              {form.length < 8 && <button style={s.btnSecondary} onClick={addGoal}>+ Add Another Goal</button>}
              <button style={{ ...s.btnPrimary, opacity: (totalWeightage !== 100 || btnLoading['create']) ? 0.5 : 1 }}
                onClick={handleCreate} disabled={totalWeightage !== 100 || btnLoading['create']}>
                {btnLoading['create'] ? '⏳ Saving...' : '💾 Save Goals as Draft'}
              </button>
            </div>
            {totalWeightage !== 100 && (
              <div style={{ fontSize: '12px', color: '#dc2626', marginTop: '6px' }}>
                Total weightage must equal exactly 100% before saving.
              </div>
            )}
          </>
        )}

        {/* CHECK-IN */}
        {view === 'checkin' && selectedGoal && (
          <>
            <div style={s.sectionTitle}>📝 Quarterly Check-in</div>
            <div style={{ ...s.goalCard, borderLeft: '4px solid #7c3aed', marginBottom: '1.5rem' }}>
              <div style={s.goalTitle}>{selectedGoal.title}</div>
              <div style={s.goalMeta}>{selectedGoal.thrustArea} · UoM: <strong>{selectedGoal.uomType}</strong> · Target: <strong>{selectedGoal.target}</strong> · Weightage: {selectedGoal.weightage}%</div>
              <div style={{ marginTop: '8px', fontSize: '12px', padding: '8px 10px', background: '#f5f3ff', borderRadius: '6px', color: '#5b21b6' }}>
                {selectedGoal.uomType === 'MIN' && '📈 MIN: Progress = (Actual ÷ Target) × 100. Higher actual = better.'}
                {selectedGoal.uomType === 'MAX' && '📉 MAX: Progress = (Target ÷ Actual) × 100. Lower actual = better.'}
                {selectedGoal.uomType === 'ZERO' && '🎯 ZERO: 100% score if actual = 0, else 0%.'}
                {selectedGoal.uomType === 'TIMELINE' && '📅 TIMELINE: 100% if done within target days, less if overdue.'}
              </div>
            </div>

            <div style={s.formCard}>
              <div style={s.grid2}>
                <div style={s.field}>
                  <label style={s.label}>Quarter</label>
                  <select style={s.input} value={checkinData.quarter}
                    onChange={e => setCheckinData({ ...checkinData, quarter: Number(e.target.value) })}>
                    <option value={1}>Q1 — July Review</option>
                    <option value={2}>Q2 — October Review</option>
                    <option value={3}>Q3 — January Review</option>
                    <option value={4}>Q4 — Annual Appraisal</option>
                  </select>
                </div>
                <div style={s.field}>
                  <label style={s.label}>Status</label>
                  <select style={s.input} value={checkinData.status}
                    onChange={e => setCheckinData({ ...checkinData, status: e.target.value })}>
                    <option>Not Started</option>
                    <option>On Track</option>
                    <option>At Risk</option>
                    <option>Completed</option>
                  </select>
                </div>
              </div>

              <div style={s.field}>
                <label style={s.label}>Actual Achievement</label>
                <input style={s.input} type="number" value={checkinData.actual}
                  onChange={e => setCheckinData({ ...checkinData, actual: e.target.value })}
                  placeholder={`Enter actual value (target is ${selectedGoal.target})`} />
                {checkinData.actual && (
                  <div style={{ marginTop: '6px', fontSize: '13px', color: '#7c3aed', fontWeight: '500' }}>
                    Preview: ~{previewProgress(selectedGoal.uomType, selectedGoal.target, checkinData.actual)}% progress
                  </div>
                )}
              </div>

              <div style={s.field}>
                <label style={s.label}>Notes <span style={{ color: '#9ca3af', fontWeight: 400 }}>(optional)</span></label>
                <input style={s.input} value={checkinData.comment}
                  onChange={e => setCheckinData({ ...checkinData, comment: e.target.value })}
                  placeholder="Any context about this quarter's performance..." />
              </div>

              <button style={{ ...s.btnPrimary, opacity: btnLoading['checkin'] ? 0.7 : 1 }}
                onClick={handleCheckin} disabled={btnLoading['checkin']}>
                {btnLoading['checkin'] ? '⏳ Saving...' : '✓ Save Check-in & Calculate Progress'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

const s = {
  page: { minHeight: '100vh', background: '#f5f7fa' },
  header: { background: '#fff', padding: '1rem 2rem', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 10 },
  headerTitle: { fontSize: '20px', fontWeight: '600', color: '#1a1a1a' },
  headerSub: { fontSize: '13px', color: '#6b7280', marginTop: '2px' },
  body: { maxWidth: '800px', margin: '0 auto', padding: '2rem 1rem' },
  summaryStrip: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1rem', marginBottom: '1.5rem' },
  summaryItem: { background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '0.85rem', textAlign: 'center' },
  summaryVal: { display: 'block', fontSize: '24px', fontWeight: '600', color: '#1a1a1a' },
  summaryLabel: { fontSize: '11px', color: '#6b7280', marginTop: '2px' },
  sectionTitle: { fontSize: '18px', fontWeight: '600', marginBottom: '1rem', color: '#1a1a1a' },
  goalCard: { background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '1rem 1.25rem', marginBottom: '0.75rem' },
  goalTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' },
  goalTitle: { fontSize: '15px', fontWeight: '500', color: '#1a1a1a', marginBottom: '4px' },
  goalMeta: { fontSize: '13px', color: '#6b7280', marginBottom: '2px' },
  badge: { fontSize: '12px', fontWeight: '500', padding: '3px 10px', borderRadius: '20px', whiteSpace: 'nowrap' },
  progressLabel: { fontSize: '12px', color: '#6b7280' },
  progressBg: { height: '8px', background: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: '4px', transition: 'width 0.4s ease' },
  formCard: { background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '1.25rem', marginBottom: '0.75rem' },
  formCardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' },
  field: { marginBottom: '0.75rem' },
  label: { display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '4px', color: '#374151' },
  input: { width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' },
  weightageBar: { padding: '0.85rem 1rem', borderRadius: '8px', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  btnPrimary: { padding: '9px 18px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500', fontSize: '14px' },
  btnSecondary: { padding: '9px 18px', background: '#fff', color: '#374151', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' },
  btnCheckin: { padding: '5px 12px', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '500' },
  btnDanger: { padding: '4px 10px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' },
  btnAI: { marginTop: '6px', padding: '6px 12px', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '500', display: 'block' },
  suggestionChip: { padding: '8px 12px', background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', color: '#5b21b6', marginBottom: '6px', lineHeight: '1.4' },
  infoBox: { background: '#dbeafe', color: '#1d4ed8', padding: '0.75rem 1rem', borderRadius: '8px', marginTop: '0.5rem', fontSize: '14px' },
  empty: { background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '3rem', textAlign: 'center', color: '#6b7280' },
}