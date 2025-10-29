import api from './api'
import type { Loan, PaginatedResponse } from '@/types'

export const loanService = {
  /**
   * Crear un nuevo préstamo
   */
  async create(data: {
    creditor_name: string
    principal_amount: number
    remaining_amount: number
    currency: string
    interest_rate: number
    start_date: string
    due_date?: string
    description?: string
  }): Promise<Loan> {
    const response = await api.post<Loan>('/loans', data)
    return response.data
  },

  /**
   * Obtener todos los préstamos del usuario (paginado)
   */
  async getAll(params?: {
    page?: number
    limit?: number
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
  }): Promise<PaginatedResponse<Loan>> {
    const response = await api.get<PaginatedResponse<Loan>>('/loans', {
      params,
    })
    return response.data
  },

  /**
   * Obtener un préstamo específico por ID
   */
  async getById(id: string): Promise<Loan> {
    const response = await api.get<Loan>(`/loans/${id}`)
    return response.data
  },

  /**
   * Actualizar un préstamo
   */
  async update(
    id: string,
    data: Partial<{
      creditor_name: string
      principal_amount: number
      remaining_amount: number
      currency: string
      interest_rate: number
      start_date: string
      due_date: string
      status: 'active' | 'paid-off' | 'deferred'
      description: string
    }>
  ): Promise<Loan> {
    const response = await api.put<Loan>(`/loans/${id}`, data)
    return response.data
  },

  /**
   * Eliminar un préstamo
   */
  async delete(id: string): Promise<void> {
    await api.delete(`/loans/${id}`)
  },
}
