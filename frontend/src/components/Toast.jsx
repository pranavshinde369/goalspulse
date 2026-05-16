import { useState, useEffect, createContext, useContext, useCallback } from 'react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const toast = useCallback((message, type = 'success') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500)
  }, [])

  const colors = {
    success: { bg: '#dcfce7', color: '#16a34a', border: '#86efac' },
    error:   { bg: '#fee2e2', color: '#dc2626', border: '#fca5a5' },
    info:    { bg: '#dbeafe', color: '#1d4ed8', border: '#93c5fd' },
    warning: { bg: '#fef9c3', color: '#854d0e', border: '#fde68a' },
  }

  const icons = { success: '✓', error: '⚠', info: 'ℹ', warning: '⚡' }

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {toasts.map(t => (
          <div key={t.id} style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '12px 16px', borderRadius: '10px', minWidth: '280px', maxWidth: '380px',
            background: colors[t.type].bg, color: colors[t.type].color,
            border: `1px solid ${colors[t.type].border}`,
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            animation: 'slideIn 0.25s ease',
            fontSize: '14px', fontWeight: '500'
          }}>
            <span style={{ fontSize: '16px' }}>{icons[t.type]}</span>
            <span style={{ flex: 1 }}>{t.message}</span>
          </div>
        ))}
      </div>
      <style>{`@keyframes slideIn { from { opacity:0; transform:translateX(40px); } to { opacity:1; transform:translateX(0); } }`}</style>
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}