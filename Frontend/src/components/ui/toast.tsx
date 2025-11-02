import * as React from "react"
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react'

interface Toast {
  id: string
  title: string
  description?: string
  variant?: 'default' | 'destructive' | 'success' | 'warning' | 'info'
  duration?: number
}

const ToastContext = React.createContext<{
  toasts: Toast[]
  toast: (toast: Omit<Toast, 'id'>) => void
  success: (title: string, description?: string) => void
  error: (title: string, description?: string) => void
  info: (title: string, description?: string) => void
  warning: (title: string, description?: string) => void
  removeToast: (id: string) => void
} | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([])

  const addToast = React.useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    const duration = toast.duration || 5000
    const newToast = { ...toast, id }
    setToasts((prev) => [...prev, newToast])

    // Auto remove after duration
    setTimeout(() => {
      removeToast(id)
    }, duration)
  }, [])

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const success = React.useCallback((title: string, description?: string) => {
    addToast({ title, description, variant: 'success' })
  }, [addToast])

  const error = React.useCallback((title: string, description?: string) => {
    addToast({ title, description, variant: 'destructive' })
  }, [addToast])

  const info = React.useCallback((title: string, description?: string) => {
    addToast({ title, description, variant: 'info' })
  }, [addToast])

  const warning = React.useCallback((title: string, description?: string) => {
    addToast({ title, description, variant: 'warning' })
  }, [addToast])

  return (
    <ToastContext.Provider value={{ toasts, toast: addToast, success, error, info, warning, removeToast }}>
      {children}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = React.useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return context
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: () => void }) {
  const [isExiting, setIsExiting] = React.useState(false)

  const handleRemove = () => {
    setIsExiting(true)
    setTimeout(() => {
      onRemove()
    }, 300)
  }

  const variants = {
    default: {
      bg: 'bg-card border-border',
      icon: <Info className="h-5 w-5 text-foreground" />,
    },
    destructive: {
      bg: 'bg-destructive/10 border-destructive/50 dark:bg-destructive/20',
      icon: <AlertCircle className="h-5 w-5 text-destructive" />,
    },
    success: {
      bg: 'bg-success/10 border-success/50 dark:bg-success/20',
      icon: <CheckCircle className="h-5 w-5 text-success" />,
    },
    warning: {
      bg: 'bg-warning/10 border-warning/50 dark:bg-warning/20',
      icon: <AlertCircle className="h-5 w-5 text-warning" />,
    },
    info: {
      bg: 'bg-blue-500/10 border-blue-500/50 dark:bg-blue-500/20',
      icon: <Info className="h-5 w-5 text-blue-500" />,
    },
  }

  const variant = variants[toast.variant || 'default']

  return (
    <div
      className={`
        flex items-start gap-3 p-4 rounded-lg border shadow-lg
        backdrop-blur-sm transition-all duration-300
        ${variant.bg}
        ${isExiting 
          ? 'animate-out slide-out-to-right-full opacity-0' 
          : 'animate-in slide-in-from-right-full'
        }
        max-w-md w-full sm:w-96
      `}
    >
      <div className="flex-shrink-0 mt-0.5">
        {variant.icon}
      </div>
      <div className="flex-1 space-y-1">
        <div className="font-semibold text-foreground">{toast.title}</div>
        {toast.description && (
          <div className="text-sm text-muted-foreground">{toast.description}</div>
        )}
      </div>
      <button
        onClick={handleRemove}
        className="flex-shrink-0 rounded-sm opacity-70 hover:opacity-100 transition-opacity"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

export function Toaster() {
  const { toasts, removeToast } = useToast()

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      <div className="pointer-events-auto space-y-2">
        {toasts.map((toast) => (
          <ToastItem
            key={toast.id}
            toast={toast}
            onRemove={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </div>
  )
}
