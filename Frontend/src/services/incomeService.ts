import api from './api'
import type { Income, PaginatedResponse } from '@/types'

export const incomeService = {
  /**
   * Crear un nuevo ingreso
   */
  async create(data: {
    account_id?: string
    name: string
    type: 'fixed' | 'variable' | 'extra'
    amount: number
    currency_id: string
    frequency: 'monthly' | 'weekly' | 'one-time'
    income_date: string
    description?: string
  }): Promise<Income> {
    const response = await api.post<Income>('/incomes', data)
    return response.data
  },

  /**
   * Obtener todos los ingresos del usuario (paginado)
   */
  async getAll(params?: {
    page?: number
    limit?: number
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
  }): Promise<PaginatedResponse<Income>> {
    const response = await api.get<PaginatedResponse<Income>>('/incomes', {
      params,
    })
    return response.data
  },

  /**
   * Obtener un ingreso específico por ID
   */
  async getById(id: string): Promise<Income> {
    const response = await api.get<Income>(`/incomes/${id}`)
    return response.data
  },

  /**
   * Actualizar un ingreso
   */
  async update(
    id: string,
    data: Partial<{
      account_id: string
      name: string
      type: 'fixed' | 'variable' | 'extra'
      amount: number
      currency: string
      frequency: string
      income_date: string
      description: string
    }>
  ): Promise<Income> {
    const response = await api.put<Income>(`/incomes/${id}`, data)
    return response.data
  },

  /**
   * Eliminar un ingreso
   */
  async delete(id: string): Promise<void> {
    await api.delete(`/incomes/${id}`)
  },

  /**
   * Confirmar recepción de un ingreso
   */
  async confirm(id: string): Promise<Income> {
    const response = await api.post<Income>(`/incomes/${id}/confirm`)
    return response.data
  },

  /**
   * Generar ingresos pendientes desde salarios fijos
   */
  async generateSalaryIncomes(): Promise<{ message: string; generated: Income[] }> {
    const response = await api.post<{ message: string; generated: Income[] }>('/incomes/generate/salary-incomes')
    return response.data
  },
}
