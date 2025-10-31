import api from './api'
import type { SalarySchedule, PaginatedResponse } from '@/types'

export const salaryScheduleService = {
  /**
   * Crear un nuevo horario de salario
   */
  async create(data: {
    name: string
    type: 'fixed' | 'average'
    amount: number
    frequency?: 'monthly' | 'weekly'
    start_date?: string
    salary_day?: number
    currency_id?: string
    account_id?: string
    description?: string
  }): Promise<SalarySchedule> {
    const response = await api.post<SalarySchedule>('/salary-schedules', data)
    return response.data
  },

  /**
   * Obtener todos los horarios de salario del usuario
   */
  async getAll(params?: {
    page?: number
    limit?: number
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
  }): Promise<PaginatedResponse<SalarySchedule>> {
    const response = await api.get<PaginatedResponse<SalarySchedule>>('/salary-schedules', {
      params,
    })
    return response.data
  },

  /**
   * Obtener un horario de salario específico por ID
   */
  async getById(id: string): Promise<SalarySchedule> {
    const response = await api.get<SalarySchedule>(`/salary-schedules/${id}`)
    return response.data
  },

  /**
   * Actualizar un horario de salario
   */
  async update(
    id: string,
    data: Partial<{
      name: string
      type: 'fixed' | 'average'
      amount: number
      frequency?: 'monthly' | 'weekly'
      start_date?: string
      salary_day?: number
      currency_id: string
      account_id: string
      is_active: boolean
      description: string
    }>
  ): Promise<SalarySchedule> {
    const response = await api.put<SalarySchedule>(`/salary-schedules/${id}`, data)
    return response.data
  },

  /**
   * Eliminar un horario de salario
   */
  async delete(id: string): Promise<void> {
    await api.delete(`/salary-schedules/${id}`)
  },

  /**
   * Activar/desactivar un horario de salario
   */
  async toggleActive(id: string, isActive: boolean): Promise<SalarySchedule> {
    const response = await api.patch<SalarySchedule>(`/salary-schedules/${id}/toggle`, { is_active: isActive })
    return response.data
  },
}