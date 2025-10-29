import api from './api'
import type { SavingsGoal, PaginatedResponse } from '@/types'

export const savingsGoalService = {
  /**
   * Crear una nueva meta de ahorro
   */
  async create(data: {
    name: string
    target_amount: number
    currency: string
    goal_type: 'monthly' | 'global' | 'custom'
    is_monthly_target?: boolean
    is_custom_excluded_from_global?: boolean
    target_date?: string
    description?: string
  }): Promise<SavingsGoal> {
    const response = await api.post<SavingsGoal>('/savings-goals', data)
    return response.data
  },

  /**
   * Obtener todas las metas de ahorro del usuario (paginado)
   */
  async getAll(params?: {
    page?: number
    limit?: number
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
  }): Promise<PaginatedResponse<SavingsGoal>> {
    const response = await api.get<PaginatedResponse<SavingsGoal>>(
      '/savings-goals',
      { params }
    )
    return response.data
  },

  /**
   * Obtener una meta de ahorro específica por ID
   */
  async getById(id: string): Promise<SavingsGoal> {
    const response = await api.get<SavingsGoal>(`/savings-goals/${id}`)
    return response.data
  },

  /**
   * Actualizar una meta de ahorro
   */
  async update(
    id: string,
    data: Partial<{
      name: string
      target_amount: number
      currency: string
      goal_type: 'monthly' | 'global' | 'custom'
      status: 'active' | 'completed' | 'paused'
      is_monthly_target: boolean
      is_custom_excluded_from_global: boolean
      target_date: string
      description: string
    }>
  ): Promise<SavingsGoal> {
    const response = await api.put<SavingsGoal>(`/savings-goals/${id}`, data)
    return response.data
  },

  /**
   * Eliminar una meta de ahorro
   */
  async delete(id: string): Promise<void> {
    await api.delete(`/savings-goals/${id}`)
  },

  /**
   * Establecer una meta como objetivo mensual de ahorro
   */
  async setAsMonthlyTarget(id: string): Promise<SavingsGoal> {
    const response = await api.post<SavingsGoal>(
      `/savings-goals/${id}/set-monthly-target`
    )
    return response.data
  },

  /**
   * Marcar una meta como personalizada (excluida del global)
   */
  async excludeFromGlobal(id: string): Promise<SavingsGoal> {
    const response = await api.post<SavingsGoal>(
      `/savings-goals/${id}/exclude-from-global`
    )
    return response.data
  },

  /**
   * Marcar una meta para contribuir al acumulado global
   */
  async includeInGlobal(id: string): Promise<SavingsGoal> {
    const response = await api.post<SavingsGoal>(
      `/savings-goals/${id}/include-in-global`
    )
    return response.data
  },

  /**
   * Obtener todas las metas personalizadas (excluidas del global)
   */
  async getCustomGoals(): Promise<SavingsGoal[]> {
    const response = await api.get<SavingsGoal[]>('/savings-goals/goals/custom')
    return response.data
  },

  /**
   * Obtener todas las metas que contribuyen al global
   */
  async getGlobalContributors(): Promise<SavingsGoal[]> {
    const response = await api.get<SavingsGoal[]>(
      '/savings-goals/goals/global-contributors'
    )
    return response.data
  },
}
