import api from './api'
import type { Expense, PaginatedResponse } from '@/types'

export const expenseService = {
  /**
   * Crear un nuevo gasto
   */
  async create(data: {
    account_id?: string
    category_id?: string
    amount: number
    currency: string
    expense_date: string
    description?: string
  }): Promise<Expense> {
    const response = await api.post<Expense>('/expenses', data)
    return response.data
  },

  /**
   * Obtener todos los gastos del usuario (paginado)
   */
  async getAll(params?: {
    page?: number
    limit?: number
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
  }): Promise<PaginatedResponse<Expense>> {
    const response = await api.get<PaginatedResponse<Expense>>('/expenses', {
      params,
    })
    return response.data
  },

  /**
   * Obtener un gasto específico por ID
   */
  async getById(id: string): Promise<Expense> {
    const response = await api.get<Expense>(`/expenses/${id}`)
    return response.data
  },

  /**
   * Actualizar un gasto
   */
  async update(
    id: string,
    data: Partial<{
      account_id: string
      category_id: string
      amount: number
      currency: string
      expense_date: string
      description: string
    }>
  ): Promise<Expense> {
    const response = await api.put<Expense>(`/expenses/${id}`, data)
    return response.data
  },

  /**
   * Eliminar un gasto
   */
  async delete(id: string): Promise<void> {
    await api.delete(`/expenses/${id}`)
  },
}
