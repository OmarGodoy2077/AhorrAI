import api from './api'
import type { Currency } from '@/types'

export const currencyService = {
  /**
   * Obtener todas las monedas disponibles
   */
  async getAll(): Promise<Currency[]> {
    const response = await api.get<Currency[]>('/currencies')
    return response.data
  },
}