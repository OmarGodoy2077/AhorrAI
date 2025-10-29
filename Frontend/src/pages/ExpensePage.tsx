import { useState, useEffect } from 'react'
import { expenseService, categoryService, accountService, getErrorMessage } from '@/services'
import type { Expense, Category, Account } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import { DataTable } from '@/components/ui/DataTable'
import { DatePicker } from '@/components/ui/DatePicker'
import { Trash2, Edit, Plus } from 'lucide-react'

export const ExpensePage = () => {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [filterType, setFilterType] = useState<'all' | 'necessary' | 'unnecessary'>('all')
  
  const [formData, setFormData] = useState({
    amount: 0,
    currency: 'USD',
    expense_date: new Date().toISOString().split('T')[0],
    description: '',
    category_id: '',
    account_id: '',
  })

  const fetchExpenses = async (pageNum: number = 1) => {
    try {
      setLoading(true)
      setError('')
      const response = await expenseService.getAll({
        page: pageNum,
        limit: 10,
        sortBy: 'expense_date',
        sortOrder: 'desc',
      })
      setExpenses(response.data)
      setPage(pageNum)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await categoryService.getAll({ limit: 100 })
      setCategories(response.data)
    } catch (err) {
      console.error(getErrorMessage(err))
    }
  }

  const fetchAccounts = async () => {
    try {
      const response = await accountService.getAll({ limit: 100 })
      setAccounts(response.data)
    } catch (err) {
      console.error(getErrorMessage(err))
    }
  }

  useEffect(() => {
    fetchExpenses()
    fetchCategories()
    fetchAccounts()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setError('')
      if (editingId) {
        await expenseService.update(editingId, formData)
      } else {
        await expenseService.create(formData)
      }
      resetForm()
      fetchExpenses(1)
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Estás seguro?')) return
    try {
      setError('')
      await expenseService.delete(id)
      fetchExpenses(page)
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  const handleEdit = (expense: Expense) => {
    setFormData({
      amount: expense.amount,
      currency: expense.currency,
      expense_date: expense.expense_date,
      description: expense.description || '',
      category_id: expense.category_id || '',
      account_id: expense.account_id || '',
    })
    setEditingId(expense.id)
    setShowForm(true)
  }

  const resetForm = () => {
    setFormData({
      amount: 0,
      currency: 'USD',
      expense_date: new Date().toISOString().split('T')[0],
      description: '',
      category_id: '',
      account_id: '',
    })
    setEditingId(null)
    setShowForm(false)
  }

  const getFilteredExpenses = () => {
    if (filterType === 'all') return expenses
    return expenses.filter(e => e.category?.type === filterType)
  }

  const filteredExpenses = getFilteredExpenses()
  const necessaryTotal = expenses.filter(e => e.category?.type === 'necessary').reduce((sum, e) => sum + e.amount, 0)
  const unnecessaryTotal = expenses.filter(e => e.category?.type === 'unnecessary').reduce((sum, e) => sum + e.amount, 0)

  const columns = [
    {
      header: 'Descripción',
      render: (item: Expense) => <span className="font-medium">{item.description || 'Sin descripción'}</span>,
    },
    {
      header: 'Categoría',
      render: (item: Expense) => (
        <span className="text-sm">{item.category?.name || 'Sin categoría'}</span>
      ),
    },
    {
      header: 'Tipo',
      render: (item: Expense) => (
        <span className={`text-xs px-2 py-1 rounded ${item.category?.type === 'necessary' ? 'bg-red-100 text-red-800 dark:bg-red-900' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900'}`}>
          {item.category?.type === 'necessary' ? 'Necesario' : 'Innecesario'}
        </span>
      ),
    },
    {
      header: 'Monto',
      render: (item: Expense) => (
        <span className="font-semibold">
          {item.currency} {item.amount.toFixed(2)}
        </span>
      ),
    },
    {
      header: 'Acciones',
      render: (item: Expense) => (
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => handleEdit(item)}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Gastos</h1>
        <p className="text-muted-foreground mt-1">Gestiona tus gastos e ingresos</p>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Gastos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">USD {(necessaryTotal + unnecessaryTotal).toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Necesarios</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">USD {necessaryTotal.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Innecesarios</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">USD {unnecessaryTotal.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-2">
        <Button onClick={() => setShowForm(!showForm)} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Gasto
        </Button>
        <Select value={filterType} onValueChange={(value) => setFilterType(value as 'all' | 'necessary' | 'unnecessary')}>
          <SelectTrigger className="w-full sm:w-auto">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="necessary">Necesarios</SelectItem>
            <SelectItem value="unnecessary">Innecesarios</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? 'Editar' : 'Nuevo'} Gasto</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="description">Descripción</Label>
                <Input
                  id="description"
                  placeholder="Ej: Almuerzo"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="category_id">Categoría</Label>
                  <Select value={formData.category_id} onValueChange={(value) => setFormData({ ...formData, category_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Sin categoría</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="amount">Monto</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                    required
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="expense_date">Fecha</Label>
                  <DatePicker
                    value={formData.expense_date}
                    onChange={(date) => setFormData({ ...formData, expense_date: date })}
                  />
                </div>
                <div>
                  <Label htmlFor="account_id">Cuenta</Label>
                  <Select value={formData.account_id} onValueChange={(value) => setFormData({ ...formData, account_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Sin cuenta</SelectItem>
                      {accounts.map((acc) => (
                        <SelectItem key={acc.id} value={acc.id}>
                          {acc.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
                <Button type="submit">{editingId ? 'Actualizar' : 'Crear'} Gasto</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <DataTable
        data={filteredExpenses}
        columns={columns}
        loading={loading}
        pagination={{
          page,
          limit: 10,
          total: filteredExpenses.length,
          onPageChange: fetchExpenses,
        }}
      />
    </div>
  )
}
