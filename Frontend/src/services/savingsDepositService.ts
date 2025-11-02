import api from './api'
import type { SavingsDeposit, PaginatedResponse } from '@/types'

interface MonthlySavingsStatus {
  target_amount: number
  current_amount: number
  status: 'on-track' | 'below' | 'exceeded'
  percentage: number
}

export const savingsDepositService = {
  /**
   * Crear un nuevo depósito de ahorro
   * Soporta depósitos a metas (goal_id) o a cuentas fantasma (virtual_account_id)
   * El dinero se resta de source_account_id (cuenta real)
   */
  async create(data: {
    goal_id?: string
    virtual_account_id?: string
    source_account_id: string
    amount: number
    deposit_date: string
    description?: string
  }): Promise<SavingsDeposit> {
    const response = await api.post<SavingsDeposit>(
      '/savings-deposits',
      data
    )
    return response.data
  },

  /**
   * Obtener todos los depósitos del usuario (paginado)
   */
  async getAll(params?: {
    page?: number
    limit?: number
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
  }): Promise<PaginatedResponse<SavingsDeposit>> {
    const response = await api.get<PaginatedResponse<SavingsDeposit>>(
      '/savings-deposits',
      { params }
    )
    return response.data
  },

  /**
   * Obtener un depósito específico por ID
   */
  async getById(id: string): Promise<SavingsDeposit> {
    const response = await api.get<SavingsDeposit>(`/savings-deposits/${id}`)
    return response.data
  },

  /**
   * Obtener todos los depósitos de una meta específica
   */
  async getByGoalId(goalId: string): Promise<SavingsDeposit[]> {
    const response = await api.get<SavingsDeposit[]>(
      `/savings-deposits/goal/${goalId}`
    )
    return response.data
  },

  /**
   * Actualizar un depósito
   */
  async update(
    id: string,
    data: Partial<{
      goal_id: string
      amount: number
      deposit_date: string
      description: string
    }>
  ): Promise<SavingsDeposit> {
    const response = await api.put<SavingsDeposit>(`/savings-deposits/${id}`, data)
    return response.data
  },

  /**
   * Eliminar un depósito
   */
  async delete(id: string): Promise<void> {
    await api.delete(`/savings-deposits/${id}`)
  },

  /**
   * Obtener el estado mensual de ahorros (meta vs actual)
   */
  async getMonthlySavingsStatus(
    year: number,
    month: number
  ): Promise<MonthlySavingsStatus> {
    const response = await api.get<MonthlySavingsStatus>(
      `/savings-deposits/monthly-status/${year}/${month}`
    )
    return response.data
  },
}
