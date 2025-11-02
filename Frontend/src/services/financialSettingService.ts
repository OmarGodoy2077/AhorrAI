import api from './api'
import type { FinancialSetting, PaginatedResponse } from '@/types'

export const financialSettingService = {
  /**
   * Crear una nueva configuración financiera
   */
  async create(data: {
    default_currency_id?: string
    effective_date?: string
  }): Promise<FinancialSetting> {
    const response = await api.post<FinancialSetting>(
      '/financial-settings',
      data
    )
    return response.data
  },

  /**
   * Obtener todas las configuraciones financieras del usuario (paginado)
   */
  async getAll(params?: {
    page?: number
    limit?: number
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
  }): Promise<PaginatedResponse<FinancialSetting>> {
    const response = await api.get<PaginatedResponse<FinancialSetting>>(
      '/financial-settings',
      { params }
    )
    return response.data
  },

  /**
   * Obtener la configuración financiera actual del usuario
   */
  async getCurrent(): Promise<FinancialSetting> {
    const response = await api.get<FinancialSetting>(
      '/financial-settings/current'
    )
    return response.data
  },

  /**
   * Obtener una configuración financiera específica por ID
   */
  async getById(id: string): Promise<FinancialSetting> {
    const response = await api.get<FinancialSetting>(
      `/financial-settings/${id}`
    )
    return response.data
  },

  /**
   * Actualizar una configuración financiera
   */
  async update(
    id: string,
    data: Partial<{
      default_currency_id: string
      effective_date: string
      is_current: boolean
    }>
  ): Promise<FinancialSetting> {
    const response = await api.put<FinancialSetting>(
      `/financial-settings/${id}`,
      data
    )
    return response.data
  },

  /**
   * Eliminar una configuración financiera
   */
  async delete(id: string): Promise<void> {
    await api.delete(`/financial-settings/${id}`)
  },
}
