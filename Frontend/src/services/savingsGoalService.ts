import api from './api'
import type { SavingsGoal, PaginatedResponse } from '@/types'

export const savingsGoalService = {
  /**
   * Crear una nueva meta de ahorro
   * Para metas 'custom': crea automáticamente una cuenta fantasma
   * Para metas 'monthly' y 'global': no crea depósitos, se calculan desde ingresos/gastos
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
    goal_type?: 'monthly' | 'global' | 'custom'
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
   * Para metas custom: también elimina la cuenta fantasma asociada
   */
  async delete(id: string): Promise<void> {
    await api.delete(`/savings-goals/${id}`)
  },

  /**
   * Obtener metas de ahorro separadas por tipo
   * Useful para calcular diferentes totales
   */
  async getByType(goal_type: 'monthly' | 'global' | 'custom'): Promise<SavingsGoal[]> {
    const response = await api.get<PaginatedResponse<SavingsGoal>>(
      '/savings-goals',
      { params: { goal_type, limit: 100 } }
    )
    return response.data.data
  },

  /**
   * Transferir dinero desde la cuenta fantasma de una meta custom
   * Este endpoint debe existir en el backend para permitir transferencias
   */
  async transferFromVirtualAccount(
    goalId: string,
    amount: number,
    targetAccountId: string,
    description?: string
  ): Promise<{ success: boolean; message: string }> {
    const response = await api.post<{ success: boolean; message: string }>(
      `/savings-goals/${goalId}/transfer-from-virtual`,
      {
        amount,
        target_account_id: targetAccountId,
        description: description || 'Transfer from custom savings goal'
      }
    )
    return response.data
  },

  /**
   * Actualizar los montos calculados de las metas monthly y global
   * Calcula automáticamente desde monthly_summaries y yearly_summaries
   */
  async updateCalculated(): Promise<{ message: string; monthly: number; global: number }> {
    const response = await api.post<{ message: string; monthly: number; global: number }>(
      '/savings-goals/update-calculated'
    )
    return response.data
  }
}
