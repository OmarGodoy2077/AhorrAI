import { useState, useEffect } from 'react'
import { categoryService, getErrorMessage } from '@/services'
import type { Category } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import { DataTable } from '@/components/ui/DataTable'
import { Trash2, Edit, Plus } from 'lucide-react'

export const CategoryPage = () => {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  const [formData, setFormData] = useState({
    name: '',
    type: 'necessary' as 'necessary' | 'unnecessary',
    description: '',
    parent_category_id: '',
  })

  const fetchCategories = async (pageNum: number = 1) => {
    try {
      setLoading(true)
      setError('')
      const response = await categoryService.getAll({
        page: pageNum,
        limit: 10,
        sortBy: 'created_at',
        sortOrder: 'desc',
      })
      setCategories(response.data)
      setTotal(response.total || 0)
      setPage(pageNum)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setError('')
      const data = {
        ...formData,
        parent_category_id: formData.parent_category_id || undefined,
      }
      if (editingId) {
        await categoryService.update(editingId, data)
      } else {
        await categoryService.create(data)
      }
      resetForm()
      fetchCategories(1)
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar esta categoría?')) return
    try {
      setError('')
      await categoryService.delete(id)
      fetchCategories(1)
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  const handleEdit = (category: Category) => {
    setFormData({
      name: category.name,
      type: category.type,
      description: category.description || '',
      parent_category_id: category.parent_category_id || '',
    })
    setEditingId(category.id)
    setShowForm(true)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'necessary',
      description: '',
      parent_category_id: '',
    })
    setEditingId(null)
    setShowForm(false)
  }

  const columns = [
    {
      header: 'Nombre',
      render: (item: Category) => <span className="font-medium">{item.name}</span>,
    },
    {
      header: 'Tipo',
      render: (item: Category) => (
        <span className={`text-xs px-2 py-1 rounded ${
          item.type === 'necessary'
            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
        }`}>
          {item.type === 'necessary' ? 'Necesario' : 'No necesario'}
        </span>
      ),
    },
    {
      header: 'Descripción',
      render: (item: Category) => (
        <span className="text-sm text-muted-foreground">
          {item.description || 'Sin descripción'}
        </span>
      ),
    },
    {
      header: 'Acciones',
      render: (item: Category) => (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(item)}
            title="Editar categoría"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(item.id)}
            title="Eliminar categoría"
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-0 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 animate-slide-in-down">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold truncate">Categorías de Gastos</h1>
          <p className="text-xs sm:text-base text-muted-foreground mt-1 truncate">
            Gestiona las categorías para organizar tus gastos
          </p>
        </div>
        <Button onClick={() => setShowForm(true)} className="w-full sm:w-auto flex items-center gap-2 transition-all duration-300 hover:scale-105">
          <Plus className="h-4 w-4" />
          Nueva Categoría
        </Button>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-3 rounded-lg animate-slide-in-down">
          {error}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <Card className="animate-slide-in-up border-2 border-primary/20">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">
              {editingId ? 'Editar Categoría' : 'Nueva Categoría'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="name">Nombre</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ej: Alimentación"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="type">Tipo</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData({ ...formData, type: value as 'necessary' | 'unnecessary' })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="necessary">Necesario</SelectItem>
                      <SelectItem value="unnecessary">No necesario</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Descripción (Opcional)</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descripción de la categoría"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-4 sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                  className="w-full sm:w-auto transition-all duration-300 hover:scale-105"
                >
                  Cancelar
                </Button>
                <Button type="submit" className="w-full sm:w-auto transition-all duration-300 hover:scale-105">
                  {editingId ? 'Actualizar' : 'Crear'} Categoría
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Categories Table */}
      <Card>
        <CardHeader>
          <CardTitle>Categorías</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={categories}
            columns={columns}
            loading={loading}
            pagination={{
              page,
              limit: 10,
              total,
              onPageChange: fetchCategories,
            }}
          />
        </CardContent>
      </Card>
    </div>
  )
}