import api from './api'
import type { SpendingLimit, PaginatedResponse } from '@/types'

interface SpendingStatus {
  limit_amount: number
  spent_amount: number
  remaining_amount: number
  percentage: number
  status: 'ok' | 'warning' | 'exceeded'
}

export const spendingLimitService = {
  /**
   * Crear un nuevo límite de gasto
   */
  async create(data: {
    category_id?: string
    limit_amount: number
    currency: string
    year: number
    month: number
    description?: string
  }): Promise<SpendingLimit> {
    const response = await api.post<SpendingLimit>('/spending-limits', data)
    return response.data
  },

  /**
   * Obtener todos los límites de gasto del usuario (paginado)
   */
  async getAll(params?: {
    page?: number
    limit?: number
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
  }): Promise<PaginatedResponse<SpendingLimit>> {
    const response = await api.get<PaginatedResponse<SpendingLimit>>(
      '/spending-limits',
      { params }
    )
    return response.data
  },

  /**
   * Obtener un límite de gasto específico por ID
   */
  async getById(id: string): Promise<SpendingLimit> {
    const response = await api.get<SpendingLimit>(`/spending-limits/${id}`)
    return response.data
  },

  /**
   * Obtener el límite de gasto para un mes específico
   */
  async getForMonth(year: number, month: number): Promise<SpendingLimit> {
    const response = await api.get<SpendingLimit>(
      `/spending-limits/${year}/${month}`
    )
    return response.data
  },

  /**
   * Obtener el estado de gastos para un mes específico
   */
  async getMonthStatus(year: number, month: number): Promise<SpendingStatus> {
    const response = await api.get<SpendingStatus>(
      `/spending-limits/${year}/${month}/status`
    )
    return response.data
  },

  /**
   * Actualizar un límite de gasto
   */
  async update(
    id: string,
    data: Partial<{
      category_id: string
      limit_amount: number
      currency: string
      year: number
      month: number
      status: 'active' | 'inactive'
      description: string
    }>
  ): Promise<SpendingLimit> {
    const response = await api.put<SpendingLimit>(`/spending-limits/${id}`, data)
    return response.data
  },

  /**
   * Eliminar un límite de gasto
   */
  async delete(id: string): Promise<void> {
    await api.delete(`/spending-limits/${id}`)
  },
}
