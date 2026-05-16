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
    success: { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0', icon: '#dcfce7' },
    error:   { bg: '#fef2f2', color: '#dc2626', border: '#fecaca', icon: '#fee2e2' },
    info:    { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe', icon: '#dbeafe' },
    warning: { bg: '#fffbeb', color: '#b45309', border: '#fde68a', icon: '#fef3c7' },
  }

  const icons = { success: '✓', error: '✕', info: 'ℹ', warning: '⚠' }

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {toasts.map(t => (
          <div key={t.id} style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            padding: '14px 18px', borderRadius: '12px', minWidth: '300px', maxWidth: '400px',
            background: colors[t.type].bg, color: colors[t.type].color,
            border: `1px solid ${colors[t.type].border}`,
            boxShadow: '0 4px 16px rgba(0,0,0,0.1), 0 1px 4px rgba(0,0,0,0.06)',
            animation: 'gpToastIn 0.3s cubic-bezier(0.4,0,0.2,1)',
            fontSize: '14px', fontWeight: '500',
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            letterSpacing: '0.1px',
            lineHeight: '1.5',
          }}>
            <span style={{
              fontSize: '14px',
              width: '28px', height: '28px', borderRadius: '8px',
              background: colors[t.type].icon,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, fontWeight: '700',
            }}>{icons[t.type]}</span>
            <span style={{ flex: 1 }}>{t.message}</span>
          </div>
        ))}
      </div>
      <style>{`
        @keyframes gpToastIn {
          from { opacity: 0; transform: translateX(40px) scale(0.95); }
          to { opacity: 1; transform: translateX(0) scale(1); }
        }
      `}</style>
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}