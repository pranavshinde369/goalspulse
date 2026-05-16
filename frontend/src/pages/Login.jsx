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
    } catch (e) {
      setError('Invalid email or password')
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>GoalsPulse</h1>
        <p style={styles.sub}>Goal Setting & Tracking Portal</p>
        <form onSubmit={handleLogin}>
          <div style={styles.field}>
            <label style={styles.label}>Email</label>
            <input style={styles.input} type="email" value={email}
              onChange={e => setEmail(e.target.value)} required />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input style={styles.input} type="password" value={password}
              onChange={e => setPassword(e.target.value)} required />
          </div>
          {error && <p style={styles.error}>{error}</p>}
          <button style={styles.btn} type="submit">Login</button>
        </form>
        <div style={styles.creds}>
          <p><strong>Demo credentials:</strong></p>
          <p>Employee: employee@goalspulse.com / employee123</p>
          <p>Manager: manager@goalspulse.com / manager123</p>
          <p>Admin: admin@goalspulse.com / admin123</p>
        </div>
      </div>
    </div>
  )
}

const styles = {
  container: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5' },
  card: { background: '#fff', padding: '2rem', borderRadius: '12px', width: '400px', boxShadow: '0 2px 12px rgba(0,0,0,0.1)' },
  title: { fontSize: '24px', fontWeight: '600', marginBottom: '4px', color: '#1a1a1a' },
  sub: { color: '#666', marginBottom: '1.5rem', fontSize: '14px' },
  field: { marginBottom: '1rem' },
  label: { display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '4px', color: '#333' },
  input: { width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' },
  btn: { width: '100%', padding: '10px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '15px', fontWeight: '500', cursor: 'pointer', marginTop: '0.5rem' },
  error: { color: '#dc2626', fontSize: '13px', marginBottom: '0.5rem' },
  creds: { marginTop: '1.5rem', padding: '1rem', background: '#f8f8f8', borderRadius: '8px', fontSize: '12px', color: '#555', lineHeight: '1.8' }
}