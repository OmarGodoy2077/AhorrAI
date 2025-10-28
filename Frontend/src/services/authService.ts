import api from './api'
import type { User, AuthResponse, LoginCredentials, RegisterData } from '@/types'

export const authService = {
  /**
   * Registro de nuevo usuario
   */
  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/register', {
      email: data.email,
      password: data.password,
      fullName: data.fullName,
    })
    return response.data
  },

  /**
   * Login de usuario
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/login', credentials)
    return response.data
  },

  /**
   * Obtener perfil del usuario actual
   */
  async getProfile(): Promise<User> {
    const response = await api.get<User>('/profile')
    return response.data
  },

  /**
   * Actualizar perfil del usuario
   */
  async updateProfile(data: Partial<User>): Promise<User> {
    const response = await api.put<User>('/profile', data)
    return response.data
  },

  /**
   * Eliminar cuenta del usuario
   */
  async deleteAccount(): Promise<void> {
    await api.delete('/profile')
  },

  /**
   * Subir avatar del usuario
   */
  async uploadAvatar(file: File): Promise<User> {
    const formData = new FormData()
    formData.append('avatar', file)
    
    const response = await api.put<User>('/profile', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },
}
