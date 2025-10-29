import api from './api'
import type { Account, PaginatedResponse } from '@/types'

export const accountService = {
  /**
   * Crear una nueva cuenta
   */
  async create(data: {
    name: string
    type: 'cash' | 'bank' | 'platform'
    balance: number
    currency: string
    description?: string
  }): Promise<Account> {
    const response = await api.post<Account>('/accounts', data)
    return response.data
  },

  /**
   * Obtener todas las cuentas del usuario (paginado)
   */
  async getAll(params?: {
    page?: number
    limit?: number
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
  }): Promise<PaginatedResponse<Account>> {
    const response = await api.get<PaginatedResponse<Account>>('/accounts', {
      params,
    })
    return response.data
  },

  /**
   * Obtener una cuenta específica por ID
   */
  async getById(id: string): Promise<Account> {
    const response = await api.get<Account>(`/accounts/${id}`)
    return response.data
  },

  /**
   * Actualizar una cuenta
   */
  async update(
    id: string,
    data: Partial<{
      name: string
      type: 'cash' | 'bank' | 'platform'
      balance: number
      currency: string
      description: string
    }>
  ): Promise<Account> {
    const response = await api.put<Account>(`/accounts/${id}`, data)
    return response.data
  },

  /**
   * Eliminar una cuenta
   */
  async delete(id: string): Promise<void> {
    await api.delete(`/accounts/${id}`)
  },
}
