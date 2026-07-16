import React, { useState, useCallback, createContext, useContext } from 'react'

interface Toast {
  id: string
  type: 'success' | 'error' | 'info' | 'warning'
  message: string
}

interface ToastContextValue {
  toasts: Toast[]
  addToast: (type: Toast['type'], message: string) => void
  removeToast: (id: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export const useToast = () => {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

let toastCounter = 0

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const addToast = useCallback((type: Toast['type'], message: string) => {
    const id = `toast-${++toastCounter}`
    setToasts((prev) => [...prev, { id, type, message }])
    setTimeout(() => removeToast(id), 3500)
  }, [removeToast])

  const iconMap = {
    success: (
      <svg className="w-4 h-4" style={{ color: '#34d399' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
    error: (
      <svg className="w-4 h-4" style={{ color: '#f87171' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
    info: (
      <svg className="w-4 h-4" style={{ color: '#60a5fa' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    warning: (
      <svg className="w-4 h-4" style={{ color: '#fbbf24' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86l-8.4 14.6A1 1 0 002.67 20h18.66a1 1 0 00.78-1.54l-8.4-14.6a1 1 0 00-1.72 0z" />
      </svg>
    ),
  }

  const bgMap = {
    success: { bg: 'rgba(52, 211, 153, 0.1)', border: 'rgba(52, 211, 153, 0.2)', dot: '#34d399' },
    error: { bg: 'rgba(248, 113, 113, 0.1)', border: 'rgba(248, 113, 113, 0.2)', dot: '#f87171' },
    info: { bg: 'rgba(96, 165, 250, 0.1)', border: 'rgba(96, 165, 250, 0.2)', dot: '#60a5fa' },
    warning: { bg: 'rgba(251, 191, 36, 0.1)', border: 'rgba(251, 191, 36, 0.2)', dot: '#fbbf24' },
  }

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="flex items-center gap-3 px-4 py-3 rounded-2xl min-w-[300px] max-w-[420px] animate-toast-in"
            style={{
              background: bgMap[toast.type].bg,
              border: `1px solid ${bgMap[toast.type].border}`,
              backdropFilter: 'blur(10px)',
              boxShadow: `0 8px 32px rgba(0,0,0,0.3), 0 0 15px ${bgMap[toast.type].dot}10`,
            }}
          >
            {iconMap[toast.type]}
            <p className="text-sm text-foreground flex-1">{toast.message}</p>
            <button
              className="text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => removeToast(toast.id)}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
