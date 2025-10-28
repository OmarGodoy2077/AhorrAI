import axios from 'axios'
import type { AxiosInstance, AxiosError } from 'axios'

// Configuración de la URL del backend
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

// Crear instancia de axios
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
})

// Interceptor para agregar el token JWT a cada solicitud
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Interceptor para manejar errores de respuesta
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Si el token expiró o es inválido, limpiar el localStorage y redirigir
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      // Solo redirigir si no estamos en login/register
      if (!window.location.pathname.includes('/auth')) {
        window.location.href = '/auth'
      }
    }
    return Promise.reject(error)
  }
)

// Helper para extraer mensajes de error
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ error?: string; details?: Array<{ message: string }> }>
    
    // Si hay detalles de validación
    if (axiosError.response?.data?.details) {
      return axiosError.response.data.details.map(d => d.message).join(', ')
    }
    
    // Si hay un mensaje de error general
    if (axiosError.response?.data?.error) {
      return axiosError.response.data.error
    }
    
    // Mensajes según el código de estado
    if (axiosError.response?.status === 404) {
      return 'Recurso no encontrado'
    }
    if (axiosError.response?.status === 500) {
      return 'Error del servidor. Intenta nuevamente más tarde.'
    }
    
    return axiosError.message || 'Error desconocido'
  }
  
  if (error instanceof Error) {
    return error.message
  }
  
  return 'Error desconocido'
}

export default api
