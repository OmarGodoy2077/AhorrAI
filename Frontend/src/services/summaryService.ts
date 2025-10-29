import api from './api'
import type { MonthlySummary, YearlySummary } from '@/types'

export const summaryService = {
  /**
   * Obtener resumen mensual para un año y mes específico
   */
  async getMonthlySummary(year: number, month: number): Promise<MonthlySummary> {
    const response = await api.get<MonthlySummary>(
      `/summaries/monthly/${year}/${month}`
    )
    return response.data
  },

  /**
   * Obtener resumen anual para un año específico
   */
  async getYearlySummary(year: number): Promise<YearlySummary> {
    const response = await api.get<YearlySummary>(`/summaries/yearly/${year}`)
    return response.data
  },

  /**
   * Generar resumen mensual (si es necesario hacer esto manualmente)
   */
  async generateMonthlySummary(): Promise<MonthlySummary> {
    const response = await api.post<MonthlySummary>(
      '/summaries/monthly/generate'
    )
    return response.data
  },
}
