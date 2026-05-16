import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'
import { useToast } from '../components/Toast'

export default function ManagerDashboard() {
  const [team, setTeam] = useState([])
  const [selected, setSelected] = useState(null)
  const [editingGoal, setEditingGoal] = useState(null)
  const [editValues, setEditValues] = useState({})
  const [managerComments, setManagerComments] = useState({})
  const [loading, setLoading] = useState({})
  const navigate = useNavigate()
  const toast = useToast()
  const user = JSON.parse(localStorage.getItem('user'))

  useEffect(() => { fetchTeam() }, [])

  const fetchTeam = async () => {
    try {
      const res = await api.get('/goals/team')
      setTeam(res.data)
      if (selected) setSelected(res.data.find(m => m.id === selected.id))
    } catch (e) { toast('Failed to load team', 'error') }
  }

  const setBtn = (key, val) => setLoading(prev => ({ ...prev, [key]: val }))

  const handleApprove = async (goalId) => {
    setBtn(goalId, true)
    try {
      await api.post(`/goals/${goalId}/approve`)
      toast('Goal approved and locked!', 'success')
      fetchTeam()
    } catch (e) { toast(e.response?.data?.error || 'Error approving', 'error') }
    finally { setBtn(goalId, false) }
  }

  const handleReject = async (goalId) => {
    setBtn('reject_' + goalId, true)
    try {
      await api.post(`/goals/${goalId}/reject`, { comment: 'Please revise and resubmit.' })
      toast('Goal returned for rework.', 'warning')
      fetchTeam()
    } catch (e) { toast(e.response?.data?.error || 'Error', 'error') }
    finally { setBtn('reject_' + goalId, false) }
  }

  const handleEdit = async (goalId) => {
    setBtn('edit_' + goalId, true)
    try {
      await api.patch(`/goals/${goalId}`, editValues)
      toast('Goal updated successfully!', 'success')
      setEditingGoal(null)
      setEditValues({})
      fetchTeam()
    } catch (e) { toast(e.response?.data?.error || 'Error', 'error') }
    finally { setBtn('edit_' + goalId, false) }
  }

  const logout = () => { localStorage.clear(); navigate('/login') }

  const statusColor = {
    DRAFT: '#6b7280', SUBMITTED: '#2563eb',
    APPROVED: '#16a34a', REJECTED: '#dc2626', LOCKED: '#7c3aed'
  }

  const totalGoals = team.reduce((s, m) => s + m.goals.length, 0)
  const lockedGoals = team.reduce((s, m) => s + m.goals.filter(g => g.status === 'LOCKED').length, 0)
  const pendingGoals = team.reduce((s, m) => s + m.goals.filter(g => g.status === 'SUBMITTED').length, 0)

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div>
          <div style={s.headerTitle}>GoalsPulse</div>
          <div style={s.headerSub}>Welcome, {user?.name} · Manager</div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {selected && (
            <button style={s.btnSecondary} onClick={() => { setSelected(null); setEditingGoal(null) }}>
              ← All Members
            </button>
          )}
          <button style={s.btnSecondary} onClick={logout}>Logout</button>
        </div>
      </div>

      <div style={s.body}>

        {/* TEAM LIST */}
        {!selected && (
          <>
            <div style={s.statsRow}>
              <div style={s.statCard}><div style={s.statVal}>{team.length}</div><div style={s.statLabel}>Team Members</div></div>
              <div style={s.statCard}><div style={s.statVal}>{totalGoals}</div><div style={s.statLabel}>Total Goals</div></div>
              <div style={s.statCard}><div style={{ ...s.statVal, color: '#2563eb' }}>{pendingGoals}</div><div style={s.statLabel}>Pending Approval</div></div>
              <div style={s.statCard}><div style={{ ...s.statVal, color: '#7c3aed' }}>{lockedGoals}</div><div style={s.statLabel}>Locked Goals</div></div>
            </div>

            <div style={s.sectionTitle}>My Team</div>
            {team.length === 0 && <div style={s.empty}>No team members found under your account.</div>}

            {team.map(member => {
              const submitted = member.goals.filter(g => g.status === 'SUBMITTED').length
              const locked = member.goals.filter(g => g.status === 'LOCKED').length
              const withProgress = member.goals.filter(g => g.progressPct != null)
              const avgProgress = withProgress.length > 0
                ? Math.round(withProgress.reduce((a, g) => a + g.progressPct, 0) / withProgress.length)
                : null
              const lockPct = member.goals.length > 0 ? Math.round((locked / member.goals.length) * 100) : 0

              return (
                <div key={member.id} style={s.memberCard} onClick={() => setSelected(member)}>
                  <div style={s.memberLeft}>
                    <div style={s.avatar}>{member.name[0]}</div>
                    <div style={{ flex: 1 }}>
                      <div style={s.memberName}>{member.name}</div>
                      <div style={s.memberMeta}>{member.email}</div>
                      <div style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
                        <span style={{ ...s.chip, background: '#dbeafe', color: '#1d4ed8' }}>{member.goals.length} goals</span>
                        {submitted > 0 && <span style={{ ...s.chip, background: '#fef9c3', color: '#854d0e' }}>⏳ {submitted} pending</span>}
                        {locked > 0 && <span style={{ ...s.chip, background: '#ede9fe', color: '#7c3aed' }}>🔒 {locked} locked</span>}
                        {avgProgress != null && <span style={{ ...s.chip, background: '#dcfce7', color: '#16a34a' }}>📈 avg {avgProgress}%</span>}
                      </div>
                      {member.goals.length > 0 && (
                        <div style={{ marginTop: '8px' }}>
                          <div style={{ height: '4px', background: '#e5e7eb', borderRadius: '2px', overflow: 'hidden', maxWidth: '200px' }}>
                            <div style={{
                              height: '100%', borderRadius: '2px',
                              width: `${lockPct}%`,
                              background: lockPct === 100 ? '#16a34a' : lockPct > 50 ? '#ca8a04' : '#7c3aed',
                              transition: 'width 0.3s'
                            }} />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={s.memberArrow}>→</div>
                </div>
              )
            })}
          </>
        )}

        {/* MEMBER GOAL DETAIL */}
        {selected && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.25rem' }}>
              <div style={s.avatar}>{selected.name[0]}</div>
              <div>
                <div style={s.sectionTitle} style={{ margin: 0 }}>{selected.name}'s Goals</div>
                <div style={{ fontSize: '13px', color: '#6b7280' }}>{selected.email}</div>
              </div>
            </div>

            {selected.goals.length === 0 && <div style={s.empty}>This member has no goals yet.</div>}

            {selected.goals.map(g => (
              <div key={g.id} style={s.goalCard}>
                <div style={s.goalTop}>
                  <div style={{ flex: 1 }}>
                    <div style={s.goalTitle}>{g.title}</div>
                    <div style={s.goalMeta}>{g.thrustArea} · {g.uomType} · Weightage: {g.weightage}%</div>
                    <div style={s.goalMeta}>Target: {g.target}</div>
                    {g.description && <div style={{ ...s.goalMeta, fontStyle: 'italic', marginTop: '2px' }}>{g.description}</div>}
                  </div>
                  <span style={{ ...s.badge, background: statusColor[g.status] + '20', color: statusColor[g.status] }}>
                    {g.status}
                  </span>
                </div>

                {/* Progress bar for locked goals */}
                {g.status === 'LOCKED' && (
                  <div style={{ marginTop: '10px' }}>
                    <div style={{ fontSize: '12px', color: '#7c3aed', marginBottom: '6px' }}>
                      🔒 Locked on {new Date(g.lockedAt).toLocaleDateString()}
                    </div>
                    {g.progressPct != null && (
                      <div style={{ marginBottom: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#6b7280', marginBottom: '3px' }}>
                          <span>Progress</span>
                          <span style={{ fontWeight: '500', color: g.progressPct >= 100 ? '#16a34a' : g.progressPct >= 60 ? '#ca8a04' : '#dc2626' }}>
                            {Math.round(g.progressPct)}%
                          </span>
                        </div>
                        <div style={{ height: '8px', background: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{
                            height: '100%', borderRadius: '4px', transition: 'width 0.3s',
                            width: `${Math.min(g.progressPct, 100)}%`,
                            background: g.progressPct >= 100 ? '#16a34a' : g.progressPct >= 60 ? '#ca8a04' : '#dc2626'
                          }} />
                        </div>
                      </div>
                    )}
                    <div style={s.field}>
                      <label style={s.label}>Manager comment on this goal</label>
                      <input
                        style={s.input}
                        placeholder="Add your feedback or observation..."
                        value={managerComments[g.id] || ''}
                        onChange={e => setManagerComments(prev => ({ ...prev, [g.id]: e.target.value }))}
                      />
                    </div>
                  </div>
                )}

                {/* Rejected state */}
                {g.status === 'REJECTED' && (
                  <div style={{ marginTop: '8px', padding: '8px 10px', background: '#fee2e2', borderRadius: '6px', fontSize: '12px', color: '#dc2626' }}>
                    ✕ Returned for rework — employee needs to revise and resubmit.
                  </div>
                )}

                {/* Edit form */}
                {editingGoal === g.id && (
                  <div style={s.editBox}>
                    <div style={{ fontSize: '13px', fontWeight: '500', marginBottom: '10px', color: '#1a1a1a' }}>Edit before approving</div>
                    <div style={s.grid2}>
                      <div style={s.field}>
                        <label style={s.label}>Target</label>
                        <input style={s.input} type="number"
                          value={editValues.target ?? g.target}
                          onChange={e => setEditValues({ ...editValues, target: e.target.value })} />
                      </div>
                      <div style={s.field}>
                        <label style={s.label}>Weightage (%)</label>
                        <input style={s.input} type="number"
                          value={editValues.weightage ?? g.weightage}
                          onChange={e => setEditValues({ ...editValues, weightage: e.target.value })} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button style={{ ...s.btnApprove, opacity: loading['edit_' + g.id] ? 0.7 : 1 }}
                        onClick={() => handleEdit(g.id)} disabled={loading['edit_' + g.id]}>
                        {loading['edit_' + g.id] ? 'Saving...' : '✓ Save Changes'}
                      </button>
                      <button style={s.btnSecondary} onClick={() => setEditingGoal(null)}>Cancel</button>
                    </div>
                  </div>
                )}

                {/* Action buttons for SUBMITTED */}
                {g.status === 'SUBMITTED' && editingGoal !== g.id && (
                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                    <button style={{ ...s.btnApprove, opacity: loading[g.id] ? 0.7 : 1 }}
                      onClick={() => handleApprove(g.id)} disabled={loading[g.id]}>
                      {loading[g.id] ? 'Approving...' : '✓ Approve & Lock'}
                    </button>
                    <button style={s.btnEdit}
                      onClick={() => { setEditingGoal(g.id); setEditValues({ target: g.target, weightage: g.weightage }) }}>
                      ✎ Edit
                    </button>
                    <button style={{ ...s.btnReject, opacity: loading['reject_' + g.id] ? 0.7 : 1 }}
                      onClick={() => handleReject(g.id)} disabled={loading['reject_' + g.id]}>
                      {loading['reject_' + g.id] ? 'Returning...' : '✕ Return'}
                    </button>
                  </div>
                )}
              </div>
            ))}
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
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1rem', marginBottom: '1.5rem' },
  statCard: { background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '1rem', textAlign: 'center' },
  statVal: { fontSize: '28px', fontWeight: '600', color: '#1a1a1a' },
  statLabel: { fontSize: '12px', color: '#6b7280', marginTop: '4px' },
  sectionTitle: { fontSize: '18px', fontWeight: '600', marginBottom: '1rem', color: '#1a1a1a' },
  memberCard: { background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '1rem 1.25rem', marginBottom: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', transition: 'border-color 0.15s' },
  memberLeft: { display: 'flex', gap: '12px', alignItems: 'flex-start', flex: 1 },
  avatar: { width: '40px', height: '40px', borderRadius: '50%', background: '#2563eb', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '600', fontSize: '16px', flexShrink: 0 },
  memberName: { fontSize: '15px', fontWeight: '500', color: '#1a1a1a' },
  memberMeta: { fontSize: '13px', color: '#6b7280' },
  memberArrow: { fontSize: '18px', color: '#9ca3af', marginLeft: '12px' },
  chip: { fontSize: '11px', padding: '2px 8px', borderRadius: '10px', fontWeight: '500' },
  goalCard: { background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '1rem 1.25rem', marginBottom: '0.75rem' },
  goalTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' },
  goalTitle: { fontSize: '15px', fontWeight: '500', color: '#1a1a1a', marginBottom: '4px' },
  goalMeta: { fontSize: '13px', color: '#6b7280', marginBottom: '2px' },
  badge: { fontSize: '12px', fontWeight: '500', padding: '3px 10px', borderRadius: '20px', whiteSpace: 'nowrap' },
  editBox: { marginTop: '12px', padding: '1rem', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' },
  field: { marginBottom: '0.75rem' },
  label: { display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '4px', color: '#374151' },
  input: { width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' },
  btnSecondary: { padding: '8px 16px', background: '#fff', color: '#374151', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' },
  btnApprove: { padding: '7px 14px', background: '#dcfce7', color: '#16a34a', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500', fontSize: '13px' },
  btnEdit: { padding: '7px 14px', background: '#fef9c3', color: '#854d0e', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' },
  btnReject: { padding: '7px 14px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' },
  empty: { background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '2rem', textAlign: 'center', color: '#6b7280' },
}