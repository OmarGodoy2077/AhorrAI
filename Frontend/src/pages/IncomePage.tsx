import { useState, useEffect } from 'react'
import { incomeService, accountService, currencyService, getErrorMessage } from '@/services'
import type { Income, Account, IncomeType, IncomeFrequency, Currency } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select'
import { DataTable } from '@/components/ui/DataTable'
import { DatePicker } from '@/components/ui/DatePicker'
import { Trash2, Edit, Plus, CheckCircle } from 'lucide-react'

export const IncomePage = () => {
  const [incomes, setIncomes] = useState<Income[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [currencies, setCurrencies] = useState<Currency[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [formData, setFormData] = useState<{
    name: string
    type: IncomeType
    amount: number
    currency_id: string
    frequency: IncomeFrequency
    income_date: string
    description: string
    account_id: string
  }>({
    name: '',
    type: 'fixed',
    amount: 0,
    currency_id: '',
    frequency: 'monthly',
    income_date: new Date().toISOString().split('T')[0],
    description: '',
    account_id: '',
  })

  const fetchIncomes = async (pageNum: number = 1) => {
    try {
      setLoading(true)
      setError('')
      const response = await incomeService.getAll({
        page: pageNum,
        limit: 10,
        sortBy: 'income_date',
        sortOrder: 'desc',
      })
      setIncomes(response.data)
      setTotal(response.total || 0)
      setPage(pageNum)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
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

  const fetchCurrencies = async () => {
    try {
      const currencies = await currencyService.getAll()
      setCurrencies(currencies)
      if (currencies.length > 0 && !formData.currency_id) {
        setFormData(prev => ({ ...prev, currency_id: currencies[0].id }))
      }
    } catch (err) {
      console.error(getErrorMessage(err))
    }
  }

  useEffect(() => {
    fetchIncomes()
    fetchAccounts()
    fetchCurrencies()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setError('')
      if (editingId) {
        await incomeService.update(editingId, formData)
      } else {
        await incomeService.create(formData)
      }
      resetForm()
      fetchIncomes(1)
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Estás seguro?')) return
    try {
      setError('')
      await incomeService.delete(id)
      fetchIncomes(1)
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  const handleConfirm = async (id: string) => {
    try {
      setError('')
      await incomeService.confirm(id)
      fetchIncomes(page)
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  const handleEdit = (income: Income) => {
    setFormData({
      name: income.name,
      type: income.type,
      amount: income.amount,
      currency_id: income.currency_id || '',
      frequency: income.frequency,
      income_date: income.income_date,
      description: income.description || '',
      account_id: income.account_id || '',
    })
    setEditingId(income.id)
    setShowForm(true)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'fixed',
      amount: 0,
      currency_id: '',
      frequency: 'monthly',
      income_date: new Date().toISOString().split('T')[0],
      description: '',
      account_id: '',
    })
    setEditingId(null)
    setShowForm(false)
  }

  const confirmedCount = incomes.filter(i => i.is_confirmed).length
  const totalIncome = incomes.reduce((sum, i) => sum + i.amount, 0)

  const columns = [
    {
      header: 'Nombre',
      render: (item: Income) => <span className="font-medium">{item.name}</span>,
    },
    {
      header: 'Tipo',
      render: (item: Income) => (
        <span className="text-xs bg-muted px-2 py-1 rounded capitalize">
          {item.type}
        </span>
      ),
    },
    {
      header: 'Monto',
      render: (item: Income) => (
        <span className="font-semibold">
          {item.currencies?.code || 'N/A'} {item.amount.toFixed(2)}
        </span>
      ),
    },
    {
      header: 'Frecuencia',
      render: (item: Income) => (
        <span className="text-sm text-muted-foreground capitalize">
          {item.frequency}
        </span>
      ),
    },
    {
      header: 'Estado',
      render: (item: Income) => (
        <span className={`text-xs px-2 py-1 rounded ${item.is_confirmed ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100'}`}>
          {item.is_confirmed ? 'Confirmado' : 'Pendiente'}
        </span>
      ),
    },
    {
      header: 'Acciones',
      render: (item: Income) => (
        <div className="flex gap-2">
          {!item.is_confirmed && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleConfirm(item.id)}
              title="Confirmar ingreso"
            >
              <CheckCircle className="h-4 w-4 text-green-600" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(item)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(item.id)}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Ingresos</h1>
        <p className="text-muted-foreground mt-1">
          Gestiona tus fuentes de ingresos
        </p>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Ingresos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{incomes.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Confirmado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{confirmedCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Monto Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">USD {totalIncome.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      <Button
        onClick={() => setShowForm(!showForm)}
        className="w-full sm:w-auto"
      >
        <Plus className="h-4 w-4 mr-2" />
        Nuevo Ingreso
      </Button>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? 'Editar' : 'Nuevo'} Ingreso</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Nombre</Label>
                <Input
                  id="name"
                  placeholder="Ej: Salario"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="type">Tipo</Label>
                  <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value as IncomeType })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed">Fijo</SelectItem>
                      <SelectItem value="variable">Variable</SelectItem>
                      <SelectItem value="extra">Extra</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="frequency">Frecuencia</Label>
                  <Select value={formData.frequency} onValueChange={(value) => setFormData({ ...formData, frequency: value as IncomeFrequency })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Semanal</SelectItem>
                      <SelectItem value="monthly">Mensual</SelectItem>
                      <SelectItem value="one-time">Una sola vez</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
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
                <div>
                  <Label htmlFor="currency_id">Moneda</Label>
                  <Select value={formData.currency_id} onValueChange={(value) => setFormData({ ...formData, currency_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar moneda" />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.map((currency) => (
                        <SelectItem key={currency.id} value={currency.id}>
                          {currency.code} - {currency.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="income_date">Fecha</Label>
                <DatePicker
                  value={formData.income_date}
                  onChange={(date) => setFormData({ ...formData, income_date: date })}
                />
              </div>

              <div>
                <Label htmlFor="account_id">Cuenta (Opcional)</Label>
                <Select value={formData.account_id || "none"} onValueChange={(value) => setFormData({ ...formData, account_id: value === "none" ? "" : value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar cuenta" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin cuenta</SelectItem>
                    {accounts.map((acc) => (
                      <SelectItem key={acc.id} value={acc.id}>
                        {acc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="description">Descripción</Label>
                <Input
                  id="description"
                  placeholder="Detalles adicionales"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingId ? 'Actualizar' : 'Crear'} Ingreso
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <DataTable
        data={incomes}
        columns={columns}
        loading={loading}
        pagination={{
          page,
          limit: 10,
          total,
          onPageChange: fetchIncomes,
        }}
      />
    </div>
  )
}
