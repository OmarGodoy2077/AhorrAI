import api from './api'
import type { Category, PaginatedResponse } from '@/types'

export const categoryService = {
  /**
   * Crear una nueva categoría
   */
  async create(data: {
    name: string
    type: 'necessary' | 'unnecessary'
    parent_category_id?: string
    description?: string
  }): Promise<Category> {
    const response = await api.post<Category>('/categories', data)
    return response.data
  },

  /**
   * Obtener todas las categorías del usuario (paginado)
   */
  async getAll(params?: {
    page?: number
    limit?: number
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
  }): Promise<PaginatedResponse<Category>> {
    const response = await api.get<PaginatedResponse<Category>>(
      '/categories',
      { params }
    )
    return response.data
  },

  /**
   * Obtener una categoría específica por ID
   */
  async getById(id: string): Promise<Category> {
    const response = await api.get<Category>(`/categories/${id}`)
    return response.data
  },

  /**
   * Actualizar una categoría
   */
  async update(
    id: string,
    data: Partial<{
      name: string
      type: 'necessary' | 'unnecessary'
      parent_category_id: string
      description: string
    }>
  ): Promise<Category> {
    const response = await api.put<Category>(`/categories/${id}`, data)
    return response.data
  },

  /**
   * Eliminar una categoría
   */
  async delete(id: string): Promise<void> {
    await api.delete(`/categories/${id}`)
  },
}
