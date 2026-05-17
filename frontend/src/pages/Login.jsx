import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const res = await api.post('/auth/login', { email, password })
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('user', JSON.stringify(res.data.user))
      const role = res.data.user.role
      if (role === 'EMPLOYEE') navigate('/employee')
      else if (role === 'MANAGER') navigate('/manager')
      else if (role === 'ADMIN') navigate('/admin')
    } catch (err) {
      if (err.response) {
        // The server responded with a status code that falls out of the range of 2xx
        if (err.response.status === 401 || err.response.status === 404) {
          setError(err.response.data?.error || 'Invalid email or password')
        } else {
          setError(err.response.data?.error || 'Server error, please try again later.')
        }
      } else if (err.request) {
        // The request was made but no response was received
        setError('Cannot connect to server. Please verify the backend is running locally on port 4000.')
      } else {
        // Something happened in setting up the request that triggered an Error
        setError(err.message || 'An unexpected error occurred.')
      }
    }
  }

  return (
    <div style={styles.container}>
      <style>{`
        @keyframes loginFadeIn {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes loginPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        .gp-login-input:focus {
          outline: none;
          border-color: #2563eb !important;
          box-shadow: 0 0 0 3px rgba(37,99,235,0.1) !important;
        }
        .gp-login-btn:hover {
          background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%) !important;
          box-shadow: 0 4px 12px rgba(37,99,235,0.35) !important;
          transform: translateY(-1px);
        }
        .gp-login-btn:active {
          transform: translateY(0);
        }
      `}</style>

      {/* Left brand panel */}
      <div style={styles.brandPanel}>
        <div style={styles.brandContent}>
          <div style={styles.brandLogo}>
            <div style={styles.logoIcon}>
              <span style={{ fontSize: '28px' }}>🎯</span>
            </div>
            <span style={styles.logoText}>GoalsPulse</span>
          </div>
          <h2 style={styles.brandHeading}>Align. Track. Achieve.</h2>
          <p style={styles.brandDesc}>
            Enterprise-grade goal setting and performance tracking for modern teams. Set OKRs, track progress with AI-powered insights, and drive organizational alignment.
          </p>
          <div style={styles.brandFeatures}>
            <div style={styles.brandFeature}>
              <span style={styles.featureIcon}>📊</span>
              <span>Real-time progress tracking</span>
            </div>
            <div style={styles.brandFeature}>
              <span style={styles.featureIcon}>✨</span>
              <span>AI-powered goal suggestions</span>
            </div>
            <div style={styles.brandFeature}>
              <span style={styles.featureIcon}>🔒</span>
              <span>Manager approval workflows</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right login card */}
      <div style={styles.rightPanel}>
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h1 style={styles.title}>Welcome back</h1>
            <p style={styles.sub}>Sign in to your GoalsPulse account</p>
          </div>
          <form onSubmit={handleLogin}>
            <div style={styles.field}>
              <label style={styles.label}>EMAIL</label>
              <input className="gp-login-input" style={styles.input} type="email" value={email}
                onChange={e => setEmail(e.target.value)} required
                placeholder="you@company.com" />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>PASSWORD</label>
              <input className="gp-login-input" style={styles.input} type="password" value={password}
                onChange={e => setPassword(e.target.value)} required
                placeholder="Enter your password" />
            </div>
            {error && <p style={styles.error}>
              <span style={{ marginRight: '6px' }}>⚠</span>{error}
            </p>}
            <button className="gp-login-btn" style={styles.btn} type="submit">Sign In</button>
          </form>
          <div style={styles.creds}>
            <div style={styles.credsHeader}>
              <span style={styles.credsDot}></span>
              <span style={styles.credsTitle}>Demo Credentials</span>
            </div>
            <div style={styles.credRow}>
              <span style={styles.credRole}>Employee</span>
              <code style={styles.credCode}>employee@goalspulse.com / employee123</code>
            </div>
            <div style={styles.credRow}>
              <span style={styles.credRole}>Manager</span>
              <code style={styles.credCode}>manager@goalspulse.com / manager123</code>
            </div>
            <div style={styles.credRow}>
              <span style={styles.credRole}>Admin</span>
              <code style={styles.credCode}>admin@goalspulse.com / admin123</code>
            </div>
          </div>
          <div style={styles.footer}>
            <span style={styles.footerText}>GoalsPulse © 2026 · Enterprise Performance Platform</span>
          </div>
        </div>
      </div>
    </div>
  )
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    background: 'linear-gradient(135deg, #f0f4ff 0%, #faf5ff 50%, #ffffff 100%)',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  brandPanel: {
    flex: '0 0 45%',
    background: 'linear-gradient(135deg, #1e3a5f 0%, #1e40af 50%, #3b82f6 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '3rem',
    position: 'relative',
    overflow: 'hidden',
  },
  brandContent: {
    position: 'relative',
    zIndex: 2,
    maxWidth: '420px',
    animation: 'loginFadeIn 0.6s ease',
  },
  brandLogo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '2rem',
  },
  logoIcon: {
    width: '48px',
    height: '48px',
    borderRadius: '14px',
    background: 'rgba(255,255,255,0.15)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: '-0.5px',
  },
  brandHeading: {
    fontSize: '32px',
    fontWeight: '700',
    color: '#ffffff',
    lineHeight: '1.3',
    marginBottom: '1rem',
    letterSpacing: '-0.5px',
  },
  brandDesc: {
    fontSize: '15px',
    color: 'rgba(255,255,255,0.75)',
    lineHeight: '1.7',
    marginBottom: '2rem',
  },
  brandFeatures: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  brandFeature: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '14px',
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },
  featureIcon: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    background: 'rgba(255,255,255,0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px',
    flexShrink: 0,
  },
  rightPanel: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem',
  },
  card: {
    background: '#ffffff',
    padding: '2.5rem',
    borderRadius: '16px',
    width: '420px',
    maxWidth: '100%',
    boxShadow: '0 4px 24px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04)',
    animation: 'loginFadeIn 0.5s ease',
  },
  cardHeader: {
    marginBottom: '2rem',
  },
  title: {
    fontSize: '24px',
    fontWeight: '700',
    marginBottom: '6px',
    color: '#0f172a',
    lineHeight: '1.3',
    letterSpacing: '-0.3px',
  },
  sub: {
    color: '#64748b',
    fontSize: '14px',
    lineHeight: '1.6',
  },
  field: { marginBottom: '1.25rem' },
  label: {
    display: 'block',
    fontSize: '11px',
    fontWeight: '600',
    marginBottom: '6px',
    color: '#64748b',
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
  },
  input: {
    width: '100%',
    padding: '10px 14px',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '14px',
    boxSizing: 'border-box',
    color: '#0f172a',
    background: '#ffffff',
    transition: 'all 0.15s ease',
    outline: 'none',
  },
  btn: {
    width: '100%',
    padding: '11px',
    background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '0.5rem',
    transition: 'all 0.2s ease',
    boxShadow: '0 2px 8px rgba(37,99,235,0.25)',
    letterSpacing: '0.2px',
  },
  error: {
    color: '#dc2626',
    fontSize: '13px',
    marginBottom: '0.75rem',
    padding: '8px 12px',
    background: '#fef2f2',
    borderRadius: '8px',
    border: '1px solid #fecaca',
    display: 'flex',
    alignItems: 'center',
  },
  creds: {
    marginTop: '2rem',
    padding: '1rem 1.25rem',
    background: '#f8fafc',
    borderRadius: '10px',
    border: '1px solid #e2e8f0',
  },
  credsHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '12px',
  },
  credsDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    background: '#16a34a',
    display: 'inline-block',
  },
  credsTitle: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#0f172a',
    letterSpacing: '0.3px',
  },
  credRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '6px',
    fontSize: '12px',
  },
  credRole: {
    fontSize: '11px',
    fontWeight: '600',
    color: '#64748b',
    minWidth: '65px',
    textTransform: 'uppercase',
    letterSpacing: '0.3px',
  },
  credCode: {
    fontFamily: "'SF Mono', 'Fira Code', 'Cascadia Code', monospace",
    fontSize: '12px',
    color: '#475569',
    background: '#f1f5f9',
    padding: '2px 8px',
    borderRadius: '4px',
    letterSpacing: '0.2px',
  },
  footer: {
    marginTop: '1.5rem',
    textAlign: 'center',
    paddingTop: '1rem',
    borderTop: '1px solid #f1f5f9',
  },
  footerText: {
    fontSize: '11px',
    color: '#94a3b8',
    letterSpacing: '0.2px',
  },
}