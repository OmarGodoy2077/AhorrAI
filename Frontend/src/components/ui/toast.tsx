import * as React from "react"

interface ToastProps {
  id: string
  title: string
  description?: string
  variant?: 'default' | 'destructive' | 'success'
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface Toast {
  id: string
  title: string
  description?: string
  variant?: 'default' | 'destructive' | 'success'
}

const ToastContext = React.createContext<{
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
} | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([])

  const addToast = React.useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newToast = { ...toast, id }
    setToasts((prev) => [...prev, newToast])

    // Auto remove after 5 seconds
    setTimeout(() => {
      removeToast(id)
    }, 5000)
  }, [])

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
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

export function Toast({
  title,
  description,
  variant = 'default',
  open,
  onOpenChange,
}: ToastProps) {
  React.useEffect(() => {
    if (open) {
      const timer = setTimeout(() => onOpenChange(false), 5000)
      return () => clearTimeout(timer)
    }
  }, [open, onOpenChange])

  if (!open) return null

  const variantClasses = {
    default: 'bg-foreground text-background',
    destructive: 'bg-destructive text-destructive-foreground',
    success: 'bg-green-600 text-white',
  }

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 rounded-lg p-4 ${variantClasses[variant]} shadow-lg animate-in slide-in-from-bottom-5 duration-300`}
    >
      <div className="font-semibold">{title}</div>
      {description && <div className="text-sm opacity-90">{description}</div>}
    </div>
  )
}

export function Toaster() {
  const { toasts, removeToast } = useToast()

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          id={toast.id}
          title={toast.title}
          description={toast.description}
          variant={toast.variant}
          open={true}
          onOpenChange={(open) => {
            if (!open) removeToast(toast.id)
          }}
        />
      ))}
    </div>
  )
}
