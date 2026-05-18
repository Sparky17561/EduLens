import React, { createContext, useContext, useState, useCallback } from 'react'

type ToastType = 'success' | 'error' | 'info'

interface ToastItem { id: number; message: string; type: ToastType }

const ToastCtx = createContext<{ toast: (msg: string, type?: ToastType) => void }>({ toast: () => {} })

export function useToast() {
  return useContext(ToastCtx)
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Date.now()
    setItems(prev => [...prev, { id, message, type }])
    setTimeout(() => setItems(prev => prev.filter(t => t.id !== id)), 4000)
  }, [])

  return (
    <ToastCtx.Provider value={{ toast }}>
      {children}
      <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 999, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {items.map(t => (
          <div
            key={t.id}
            className="toast"
            style={{
              borderColor: t.type === 'success' ? 'var(--success)' : t.type === 'error' ? 'var(--danger)' : 'var(--primary)',
              color: 'var(--text-primary)'
            }}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}
