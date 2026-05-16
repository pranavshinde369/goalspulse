import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'
import { useToast } from '../components/Toast'

export default function AdminDashboard() {
  const [users, setUsers] = useState([])
  const [auditLogs, setAuditLogs] = useState([])
  const [activeTab, setActiveTab] = useState('overview')
  const [aiSummary, setAiSummary] = useState({})
  const [aiLoading, setAiLoading] = useState(null)
  const [resetting, setResetting] = useState(false)
  const chartRef = useRef(null)
  const chartInstance = useRef(null)
  const navigate = useNavigate()
  const toast = useToast()
  const user = JSON.parse(localStorage.getItem('user'))

  useEffect(() => {
    fetchUsers()
    fetchAudit()
    loadChartJS()
  }, [])

  useEffect(() => {
    if (activeTab === 'overview' && users.length > 0 && window.Chart) {
      setTimeout(drawChart, 150)
    }
  }, [activeTab, users])

  const loadChartJS = () => {
    if (window.Chart) return
    const script = document.createElement('script')
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.0/chart.umd.min.js'
    script.onload = () => { if (users.length > 0) setTimeout(drawChart, 150) }
    document.head.appendChild(script)
  }

  const fetchUsers = async () => {
    try {
      const res = await api.get('/admin/users')
      setUsers(res.data)
    } catch (e) { toast('Failed to load users', 'error') }
  }

  const fetchAudit = async () => {
    try {
      const res = await api.get('/admin/audit')
      setAuditLogs(res.data)
    } catch (e) { console.error(e) }
  }

  const drawChart = () => {
    const canvas = chartRef.current
    if (!canvas || !window.Chart) return
    if (chartInstance.current) chartInstance.current.destroy()
    const allGoals = users.flatMap(u => u.goals || [])
    const areas = {}
    allGoals.forEach(g => {
      if (!areas[g.thrustArea]) areas[g.thrustArea] = 0
      if (g.status === 'LOCKED') areas[g.thrustArea]++
    })
    const labels = Object.keys(areas)
    const data = labels.map(l => areas[l])
    const colors = ['#2563eb', '#7c3aed', '#16a34a', '#ca8a04', '#dc2626', '#0891b2', '#db2777', '#65a30d']
    chartInstance.current = new window.Chart(canvas.getContext('2d'), {
      type: 'bar',
      data: {
        labels,
        datasets: [{ label: 'Locked Goals', data, backgroundColor: colors.slice(0, labels.length), borderRadius: 6, borderSkipped: false }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, ticks: { stepSize: 1 }, grid: { color: '#f3f4f6' } },
          x: { grid: { display: false } }
        }
      }
    })
  }

  const generateSummary = async (u) => {
    setAiLoading(u.id)
    try {
      const res = await api.post('/ai/appraisal-summary', { employeeName: u.name, goals: u.goals })
      setAiSummary(prev => ({ ...prev, [u.id]: res.data.summary }))
      toast('Appraisal summary generated!', 'success')
    } catch (e) { toast('AI summary failed — check Gemini API key', 'error') }
    finally { setAiLoading(null) }
  }

  const handleExport = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('http://localhost:4000/api/admin/report', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = 'achievement_report.xlsx'
      document.body.appendChild(a); a.click(); a.remove()
      toast('Report downloaded!', 'success')
    } catch (e) { toast('Export failed', 'error') }
  }

  const handleReset = async () => {
    if (!window.confirm('Reset all goals and check-ins? Users will be kept.')) return
    setResetting(true)
    try {
      await api.post('/admin/reset-demo')
      toast('Demo reset! Fresh start ready.', 'info')
      fetchUsers(); fetchAudit()
    } catch (e) { toast('Reset failed', 'error') }
    finally { setResetting(false) }
  }

  const logout = () => { localStorage.clear(); navigate('/login') }

  const statusColor = { DRAFT: '#6b7280', SUBMITTED: '#2563eb', APPROVED: '#16a34a', REJECTED: '#dc2626', LOCKED: '#7c3aed' }
  const allGoals = users.flatMap(u => u.goals || [])
  const lockedGoals = allGoals.filter(g => g.status === 'LOCKED').length
  const submittedGoals = allGoals.filter(g => g.status === 'SUBMITTED').length
  const draftGoals = allGoals.filter(g => g.status === 'DRAFT').length
  const completionRate = users.length > 0
    ? Math.round((users.filter(u => (u.goals || []).some(g => g.status === 'LOCKED')).length / users.length) * 100)
    : 0

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div>
          <div style={s.headerTitle}>GoalsPulse</div>
          <div style={s.headerSub}>Welcome, {user?.name} · Admin</div>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button style={s.btnExport} onClick={handleExport}>⬇ Export Report</button>
          <button style={{ ...s.btnSecondary, color: '#dc2626', borderColor: '#fca5a5' }}
            onClick={handleReset} disabled={resetting}>
            {resetting ? 'Resetting...' : '🔄 Reset Demo'}
          </button>
          <button style={s.btnSecondary} onClick={logout}>Logout</button>
        </div>
      </div>

      <div style={s.body}>
        <div style={s.statsRow}>
          <div style={s.statCard}><div style={s.statVal}>{users.length}</div><div style={s.statLabel}>Employees</div></div>
          <div style={s.statCard}><div style={s.statVal}>{allGoals.length}</div><div style={s.statLabel}>Total Goals</div></div>
          <div style={s.statCard}><div style={{ ...s.statVal, color: '#7c3aed' }}>{lockedGoals}</div><div style={s.statLabel}>Locked</div></div>
          <div style={s.statCard}><div style={{ ...s.statVal, color: '#2563eb' }}>{submittedGoals}</div><div style={s.statLabel}>Pending</div></div>
          <div style={s.statCard}><div style={{ ...s.statVal, color: '#16a34a' }}>{completionRate}%</div><div style={s.statLabel}>Completion</div></div>
        </div>

        <div style={s.tabs}>
          {[
            { id: 'overview', label: '📊 Overview' },
            { id: 'goals', label: '🎯 All Goals' },
            { id: 'users', label: '👥 Users' },
            { id: 'audit', label: '🔍 Audit Trail' },
          ].map(tab => (
            <button key={tab.id}
              style={{ ...s.tab, ...(activeTab === tab.id ? s.tabActive : {}) }}
              onClick={() => setActiveTab(tab.id)}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* OVERVIEW */}
        {activeTab === 'overview' && (
          <>
            <div style={s.grid3}>
              <div style={{ ...s.statCard, textAlign: 'left' }}>
                <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>Draft</div>
                <div style={{ fontSize: '28px', fontWeight: '600', color: '#6b7280' }}>{draftGoals}</div>
              </div>
              <div style={{ ...s.statCard, textAlign: 'left' }}>
                <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>Submitted</div>
                <div style={{ fontSize: '28px', fontWeight: '600', color: '#2563eb' }}>{submittedGoals}</div>
              </div>
              <div style={{ ...s.statCard, textAlign: 'left' }}>
                <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>Locked</div>
                <div style={{ fontSize: '28px', fontWeight: '600', color: '#7c3aed' }}>{lockedGoals}</div>
              </div>
            </div>

            <div style={s.chartCard}>
              <div style={s.sectionTitle}>Locked goals by thrust area</div>
              <div style={{ height: '200px', position: 'relative' }}>
                <canvas ref={chartRef} />
              </div>
            </div>

            <div style={s.sectionTitle}>Employee progress</div>
            {users.map(u => {
              const uGoals = u.goals || []
              const locked = uGoals.filter(g => g.status === 'LOCKED').length
              const withProgress = uGoals.filter(g => g.progressPct != null)
              const avgProgress = withProgress.length > 0
                ? Math.round(withProgress.reduce((a, g) => a + g.progressPct, 0) / withProgress.length)
                : null
              const pct = uGoals.length > 0 ? Math.round((locked / uGoals.length) * 100) : 0

              return (
                <div key={u.id} style={s.userRow}>
                  <div style={s.avatar}>{u.name[0]}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', alignItems: 'center' }}>
                      <span style={{ fontSize: '14px', fontWeight: '500', color: '#1a1a1a' }}>{u.name}</span>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        {avgProgress != null && <span style={{ fontSize: '12px', color: '#7c3aed', fontWeight: '500' }}>avg {avgProgress}%</span>}
                        <span style={{ fontSize: '12px', color: '#6b7280' }}>{locked}/{uGoals.length} locked</span>
                      </div>
                    </div>
                    <div style={s.progressBg}>
                      <div style={{ ...s.progressFill, width: `${pct}%`, background: pct === 100 ? '#16a34a' : pct > 50 ? '#ca8a04' : '#2563eb' }} />
                    </div>
                    <div style={{ display: 'flex', gap: '5px', marginTop: '6px', flexWrap: 'wrap' }}>
                      {uGoals.map(g => (
                        <span key={g.id} style={{ fontSize: '11px', padding: '1px 6px', borderRadius: '4px', background: statusColor[g.status] + '20', color: statusColor[g.status] }}>
                          {g.title.slice(0, 14)}{g.title.length > 14 ? '…' : ''} · {g.status}
                        </span>
                      ))}
                    </div>
                    <div style={{ marginTop: '8px' }}>
                      <button style={{ ...s.btnAI, opacity: aiLoading === u.id ? 0.7 : 1 }}
                        onClick={() => generateSummary(u)} disabled={aiLoading === u.id}>
                        {aiLoading === u.id ? '⏳ Generating...' : '✨ Generate Appraisal Summary'}
                      </button>
                      {aiSummary[u.id] && (
                        <div style={{ marginTop: '8px', padding: '10px 12px', background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: '8px', fontSize: '13px', color: '#5b21b6', lineHeight: '1.6' }}>
                          {aiSummary[u.id]}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </>
        )}

        {/* ALL GOALS */}
        {activeTab === 'goals' && (
          <>
            <div style={s.sectionTitle}>All goals</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={s.table}>
                <thead>
                  <tr style={s.thead}>
                    {['Employee', 'Goal', 'Thrust Area', 'UoM', 'Target', 'Actual', 'Progress', 'Weightage', 'Status'].map(h => (
                      <th key={h} style={s.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.flatMap(u => (u.goals || []).map(g => (
                    <tr key={g.id} style={s.tr}>
                      <td style={s.td}>{u.name}</td>
                      <td style={s.td}>{g.title}</td>
                      <td style={s.td}>{g.thrustArea}</td>
                      <td style={s.td}>{g.uomType}</td>
                      <td style={s.td}>{g.target}</td>
                      <td style={s.td}>{g.actual ?? '—'}</td>
                      <td style={s.td}>{g.progressPct != null ? `${Math.round(g.progressPct)}%` : '—'}</td>
                      <td style={s.td}>{g.weightage}%</td>
                      <td style={s.td}>
                        <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '10px', background: statusColor[g.status] + '20', color: statusColor[g.status], fontWeight: '500' }}>
                          {g.status}
                        </span>
                      </td>
                    </tr>
                  )))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* USERS */}
        {activeTab === 'users' && (
          <>
            <div style={s.sectionTitle}>All users</div>
            {users.map(u => (
              <div key={u.id} style={s.memberCard}>
                <div style={s.avatar}>{u.name[0]}</div>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: '500', color: '#1a1a1a' }}>{u.name}</div>
                  <div style={{ fontSize: '13px', color: '#6b7280' }}>{u.email}</div>
                  <div style={{ marginTop: '4px', display: 'flex', gap: '6px' }}>
                    <span style={{ ...s.chip, background: '#dbeafe', color: '#1d4ed8' }}>{u.role}</span>
                    <span style={{ ...s.chip, background: '#f3f4f6', color: '#6b7280' }}>{(u.goals || []).length} goals</span>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}

        {/* AUDIT TRAIL */}
        {activeTab === 'audit' && (
          <>
            <div style={s.sectionTitle}>Audit trail</div>
            {auditLogs.length === 0 && (
              <div style={s.empty}>
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>🔍</div>
                <div style={{ fontWeight: '500', marginBottom: '4px' }}>No audit events yet</div>
                <div style={{ fontSize: '13px' }}>Audit logs appear when locked goals are modified by admin.</div>
              </div>
            )}
            {auditLogs.map(log => (
              <div key={log.id} style={s.auditRow}>
                <div style={s.auditDot} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: '500', color: '#1a1a1a' }}>
                    {log.user?.name} · <span style={{ color: '#7c3aed' }}>{log.action}</span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                    Goal: {log.goal?.title} · {new Date(log.createdAt).toLocaleString()}
                  </div>
                  {log.before && (
                    <div style={{ fontSize: '11px', marginTop: '4px', padding: '6px 8px', background: '#f9fafb', borderRadius: '6px', color: '#6b7280', fontFamily: 'monospace' }}>
                      Before: {JSON.stringify(log.before)} → After: {JSON.stringify(log.after)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  )
}

const s = {
  page: { minHeight: '100vh', background: '#e2e8f0', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" },
  header: { background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', padding: '0.85rem 2rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 10, borderBottom: '1px solid #cbd5e1' },
  headerTitle: { fontSize: '20px', fontWeight: '700', color: '#0f172a', letterSpacing: '-0.3px' },
  headerSub: { fontSize: '13px', color: '#475569', marginTop: '2px', lineHeight: '1.3' },
  body: { maxWidth: '960px', margin: '0 auto', padding: '2rem 1.5rem' },
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '1rem', marginBottom: '1.5rem' },
  statCard: { background: '#fff', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '1.1rem 1rem', textAlign: 'center', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)', borderTop: '4px solid #cbd5e1' },
  statVal: { fontSize: '26px', fontWeight: '700', color: '#0f172a', lineHeight: '1.3' },
  statLabel: { fontSize: '11px', color: '#475569', marginTop: '4px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' },
  grid3: { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1rem', marginBottom: '1.5rem' },
  chartCard: { background: '#fff', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)' },
  tabs: { display: 'flex', gap: '4px', marginBottom: '1.5rem', background: '#e2e8f0', borderRadius: '10px', padding: '4px', border: '1px solid #cbd5e1', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)' },
  tab: { padding: '8px 16px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '14px', color: '#475569', borderRadius: '8px', fontWeight: '600', transition: 'all 0.15s ease' },
  tabActive: { color: '#0f172a', background: '#fff', fontWeight: '700', boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)' },
  sectionTitle: { fontSize: '16px', fontWeight: '700', marginBottom: '1rem', color: '#0f172a', letterSpacing: '-0.2px', lineHeight: '1.3' },
  userRow: { display: 'flex', gap: '14px', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '1.25rem', marginBottom: '0.75rem', alignItems: 'flex-start', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)', transition: 'all 0.15s ease' },
  avatar: { width: '38px', height: '38px', borderRadius: '50%', background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '15px', flexShrink: 0, boxShadow: '0 2px 6px rgba(37,99,235,0.25)', border: '2px solid rgba(255,255,255,0.9)' },
  progressBg: { height: '6px', background: '#cbd5e1', borderRadius: '3px', overflow: 'hidden', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.1)' },
  progressFill: { height: '100%', borderRadius: '3px', transition: 'width 0.6s cubic-bezier(0.4,0,0.2,1)' },
  table: { width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: '12px', overflow: 'hidden', border: '1px solid #cbd5e1', minWidth: '700px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' },
  thead: { background: '#f1f5f9' },
  th: { padding: '12px 14px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#475569', borderBottom: '1px solid #cbd5e1', whiteSpace: 'nowrap', textTransform: 'uppercase', letterSpacing: '0.5px', position: 'sticky', top: 0, background: '#f1f5f9' },
  tr: { borderBottom: '1px solid #e2e8f0' },
  td: { padding: '11px 14px', fontSize: '13px', color: '#0f172a', lineHeight: '1.5' },
  memberCard: { display: 'flex', gap: '14px', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '1.25rem', marginBottom: '0.75rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)', transition: 'all 0.15s ease' },
  chip: { fontSize: '11px', padding: '3px 10px', borderRadius: '20px', fontWeight: '700', letterSpacing: '0.2px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' },
  auditRow: { display: 'flex', gap: '14px', padding: '1rem 1.25rem', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '12px', marginBottom: '0.6rem', alignItems: 'flex-start', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)', borderLeft: '4px solid #7c3aed' },
  auditDot: { width: '10px', height: '10px', borderRadius: '50%', background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', marginTop: '4px', flexShrink: 0, boxShadow: '0 2px 4px rgba(124,58,237,0.3)' },
  btnExport: { padding: '9px 18px', background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '14px', boxShadow: '0 4px 12px rgba(22,163,74,0.3)', transition: 'all 0.15s ease', display: 'inline-flex', alignItems: 'center', gap: '6px' },
  btnSecondary: { padding: '9px 18px', background: '#fff', color: '#0f172a', border: '1px solid #94a3b8', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', transition: 'all 0.15s ease', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' },
  btnAI: { padding: '6px 14px', background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', boxShadow: '0 4px 12px rgba(124,58,237,0.3)', transition: 'all 0.15s ease', display: 'inline-flex', alignItems: 'center', gap: '5px' },
  empty: { background: '#fff', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '3rem 2rem', textAlign: 'center', color: '#475569', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' },
}