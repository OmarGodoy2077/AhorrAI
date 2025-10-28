import React, { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import { authService } from '@/services/authService'
import { getErrorMessage } from '@/services/api'
import type { User, LoginCredentials, RegisterData } from '@/types'

interface AuthContextType {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (credentials: LoginCredentials) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => void
  updateUser: (user: User) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Cargar usuario desde localStorage al iniciar
  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedToken = localStorage.getItem('token')
        const storedUser = localStorage.getItem('user')

        // Validar que ambos existan y no sean "undefined"
        if (storedToken && storedUser && storedUser !== 'undefined') {
          try {
            setToken(storedToken)
            setUser(JSON.parse(storedUser))

            // Verificar que el token sea válido obteniendo el perfil
            try {
              const profile = await authService.getProfile()
              setUser(profile)
              localStorage.setItem('user', JSON.stringify(profile))
            } catch (error) {
              // Si el token no es válido, limpiar
              console.error('Token inválido:', getErrorMessage(error))
              localStorage.removeItem('token')
              localStorage.removeItem('user')
              setUser(null)
              setToken(null)
            }
          } catch (parseError) {
            // Si JSON.parse falla, limpiar
            console.error('Error al parsear usuario guardado:', parseError)
            localStorage.removeItem('token')
            localStorage.removeItem('user')
            setUser(null)
            setToken(null)
          }
        }
      } catch (error) {
        console.error('Error al cargar usuario:', error)
        // Asegurarse de limpiar en caso de error
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      } finally {
        setIsLoading(false)
      }
    }

    loadUser()
  }, [])

  const login = async (credentials: LoginCredentials) => {
    try {
      const response = await authService.login(credentials)
      setUser(response.user)
      setToken(response.token)
      localStorage.setItem('token', response.token)
      localStorage.setItem('user', JSON.stringify(response.user))
    } catch (error) {
      throw new Error(getErrorMessage(error))
    }
  }

  const register = async (data: RegisterData) => {
    try {
      const response = await authService.register(data)
      setUser(response.user)
      setToken(response.token)
      localStorage.setItem('token', response.token)
      localStorage.setItem('user', JSON.stringify(response.user))
    } catch (error) {
      throw new Error(getErrorMessage(error))
    }
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser)
    localStorage.setItem('user', JSON.stringify(updatedUser))
  }

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!user && !!token,
    isLoading,
    login,
    register,
    logout,
    updateUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider')
  }
  return context
}
