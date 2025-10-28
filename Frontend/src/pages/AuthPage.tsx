import { useState, useEffect } from 'react'
import { useSearchParams, Navigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { LoginForm } from '@/components/auth/LoginForm'
import { RegisterForm } from '@/components/auth/RegisterForm'
import { Button } from '@/components/ui/button'
import { PiggyBank } from 'lucide-react'

export const AuthPage = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const { isAuthenticated } = useAuth()
  const [mode, setMode] = useState<'login' | 'register'>('login')

  useEffect(() => {
    const modeParam = searchParams.get('mode')
    if (modeParam === 'register') {
      setMode('register')
    } else {
      setMode('login')
    }
  }, [searchParams])

  // Si ya está autenticado, redirigir al dashboard
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  const toggleMode = () => {
    const newMode = mode === 'login' ? 'register' : 'login'
    setMode(newMode)
    setSearchParams({ mode: newMode })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-secondary p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo y título */}
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <PiggyBank className="h-12 w-12 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-primary">AhorraAI</h1>
          <p className="text-muted-foreground">
            Tu asistente de finanzas personales
          </p>
        </div>

        {/* Formulario */}
        {mode === 'login' ? <LoginForm /> : <RegisterForm />}

        {/* Toggle entre login y registro */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            {mode === 'login' ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}
          </p>
          <Button variant="link" onClick={toggleMode} className="text-primary">
            {mode === 'login' ? 'Crear una cuenta' : 'Iniciar sesión'}
          </Button>
        </div>
      </div>
    </div>
  )
}
