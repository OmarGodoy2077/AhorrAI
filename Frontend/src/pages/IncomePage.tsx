import { useState, useEffect } from 'react'
import { incomeService, accountService, currencyService, salaryScheduleService, getErrorMessage } from '@/services'
import type { Income, Account, IncomeType, IncomeFrequency, Currency, SalarySchedule, SalaryFrequency } from '@/types'
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
import { useFormatCurrency } from '@/hooks/useFormatCurrency'
import { DatePicker } from '@/components/ui/DatePicker'
import { Trash2, Edit, Plus, TrendingUp, CheckCircle } from 'lucide-react'
import { parseISODate } from '@/lib/utils'

type SalaryType = 'fixed' | 'average'

export const IncomePage = () => {
  const { formatCurrency, defaultCurrency } = useFormatCurrency()
  const [allIncomes, setAllIncomes] = useState<Income[]>([])
  const [salarySchedules, setSalarySchedules] = useState<SalarySchedule[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [currencies, setCurrencies] = useState<Currency[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [currentTab, setCurrentTab] = useState<'salaries' | 'incomes'>('incomes')
  const [showSalaryForm, setShowSalaryForm] = useState(false)
  const [editingSalaryId, setEditingSalaryId] = useState<string | null>(null)

  // Salary form state
  const [salaryFormData, setSalaryFormData] = useState<{
    name: string
    type: SalaryType
    amount: number
    currency_id: string
    frequency: SalaryFrequency
    start_date: string
    salary_day: number
    description: string
    account_id: string
  }>({
    name: '',
    type: 'fixed',
    amount: 0,
    currency_id: defaultCurrency?.id || '',
    frequency: 'monthly',
    start_date: new Date().toISOString().split('T')[0],
    salary_day: new Date().getDate(),
    description: '',
    account_id: '',
  })

  // Regular income form state - SIMPLIFIED
  const [formData, setFormData] = useState<{
    name: string
    amount: number
    currency_id: string
    income_date?: string  // Optional for average monthly incomes
    description: string
    account_id: string
  }>({
    name: '',
    amount: 0,
    currency_id: defaultCurrency?.id || '',
    income_date: new Date().toISOString().split('T')[0], // Default but optional
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
      setAllIncomes(response.data)
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
        setFormData(prev => ({ ...prev, currency_id: defaultCurrency?.id || currencies[0].id }))
        setSalaryFormData(prev => ({ ...prev, currency_id: defaultCurrency?.id || currencies[0].id }))
      }
    } catch (err) {
      console.error(getErrorMessage(err))
    }
  }

  const fetchSalarySchedules = async () => {
    try {
      const response = await salaryScheduleService.getAll({ limit: 100 })
      setSalarySchedules(response.data)
    } catch (err) {
      console.error(getErrorMessage(err))
    }
  }

  useEffect(() => {
    fetchIncomes()
    fetchAccounts()
    fetchCurrencies()
    fetchSalarySchedules()
  }, [])

  // Salary handlers
  const handleSalarySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setError('')
      
      const dataToSubmit = {
        name: salaryFormData.name,
        type: salaryFormData.type,
        amount: salaryFormData.amount,
        ...(salaryFormData.type === 'fixed' && {
          frequency: salaryFormData.frequency,
          start_date: salaryFormData.start_date,
          salary_day: salaryFormData.salary_day,
          account_id: salaryFormData.account_id || undefined,
        }),
        currency_id: salaryFormData.currency_id || undefined,
        description: salaryFormData.description,
      }

      if (editingSalaryId) {
        await salaryScheduleService.update(editingSalaryId, dataToSubmit)
      } else {
        await salaryScheduleService.create(dataToSubmit)
      }
      resetSalaryForm()
      fetchSalarySchedules()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  const handleSalaryEdit = (schedule: SalarySchedule) => {
    setSalaryFormData({
      name: schedule.name,
      type: schedule.type || 'fixed',
      amount: schedule.amount,
      currency_id: schedule.currency_id || '',
      frequency: schedule.frequency || 'monthly',
      start_date: schedule.start_date || new Date().toISOString().split('T')[0],
      salary_day: schedule.salary_day || new Date().getDate(),
      description: schedule.description || '',
      account_id: schedule.account_id || '',
    })
    setEditingSalaryId(schedule.id)
    setShowSalaryForm(true)
  }

  const handleSalaryDelete = async (id: string) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar esta fuente de salario?')) return
    try {
      setError('')
      await salaryScheduleService.delete(id)
      fetchSalarySchedules()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  const resetSalaryForm = () => {
    setSalaryFormData({
      name: '',
      type: 'fixed',
      amount: 0,
      currency_id: defaultCurrency?.id || '',
      frequency: 'monthly',
      start_date: new Date().toISOString().split('T')[0],
      salary_day: new Date().getDate(),
      description: '',
      account_id: '',
    })
    setEditingSalaryId(null)
    setShowSalaryForm(false)
  }

  // Regular income handlers - SIMPLIFIED
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setError('')
      
      // Simple income submission - all incomes are 'extra' type
      const dataToSubmit = {
        name: formData.name,
        type: 'extra' as IncomeType, // All incomes in this page are 'extra'
        amount: formData.amount,
        currency_id: formData.currency_id,
        account_id: formData.account_id,
        description: formData.description,
        frequency: 'one-time' as IncomeFrequency, // Default frequency
        income_date: formData.income_date, // Optional - if not set, it's a monthly average
        is_confirmed: true, // All incomes are confirmed automatically
      }

      if (editingId) {
        await incomeService.update(editingId, dataToSubmit)
      } else {
        await incomeService.create(dataToSubmit)
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

  const handleGenerateSalaryIncomes = async () => {
    try {
      setError('')
      setLoading(true)
      const result = await incomeService.generateSalaryIncomes()
      if (result.generated.length > 0) {
        setError(`Se generaron ${result.generated.length} ingresos pendientes de salarios.`)
      } else {
        setError('No hay nuevos ingresos para generar.')
      }
      fetchIncomes(page)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
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
    const editData = {
      name: income.name,
      amount: income.amount,
      currency_id: income.currency_id || '',
      income_date: income.income_date,
      description: income.description || '',
      account_id: income.account_id || '',
    }

    setFormData(editData)
    setEditingId(income.id)
    setShowForm(true)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      amount: 0,
      currency_id: defaultCurrency?.id || '',
      income_date: undefined,
      description: '',
      account_id: '',
    })
    setEditingId(null)
    setShowForm(false)
  }

  // Separate incomes by type
  const salaries = salarySchedules // Now salaries come directly from salary_schedules table
  const regularIncomes = allIncomes.filter(i =>
    !i.description?.includes('Generado desde:')
  )
  const generatedSalaryIncomes = allIncomes.filter(i =>
    i.description?.includes('Generado desde:')
  )

  // Calculate statistics
  const salaryTotal = salaries.reduce((sum, s) => sum + s.amount, 0)
  const activeSalaries = salaries.filter(s => s.is_active).length

  const regularIncomesTotal = [...regularIncomes, ...generatedSalaryIncomes].filter(i => i.is_confirmed).reduce((sum, i) => sum + i.amount, 0)
  const confirmedRegularIncomes = [...regularIncomes, ...generatedSalaryIncomes].length

  // Salary columns
  const salaryColumns = [
    {
      header: 'Nombre',
      render: (item: SalarySchedule) => <span className="font-medium">{item.name}</span>,
    },
    {
      header: 'Tipo',
      render: (item: SalarySchedule) => (
        <span className={`text-xs px-2 py-1 rounded ${
          item.type === 'fixed' 
            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900' 
            : 'bg-orange-100 text-orange-800 dark:bg-orange-900'
        }`}>
          {item.type === 'fixed' ? 'Fijo' : 'Promedio'}
        </span>
      ),
    },
    {
      header: 'Monto',
      render: (item: SalarySchedule) => (
        <span className="font-semibold">
          {item.currencies?.code || 'N/A'} {item.amount.toFixed(2)}
        </span>
      ),
    },
    {
      header: 'Frecuencia',
      render: (item: SalarySchedule) => (
        <span className="text-sm text-muted-foreground capitalize">
          {item.frequency || 'N/A'}
        </span>
      ),
    },
    {
      header: 'Día de pago',
      render: (item: SalarySchedule) => (
        <span className="text-sm text-muted-foreground">
          {item.type === 'fixed' && item.frequency && item.salary_day !== undefined
            ? (item.frequency === 'monthly' ? `${item.salary_day}` : `Día ${item.salary_day}`)
            : 'N/A'
          }
        </span>
      ),
    },
    {
      header: 'Próximo pago',
      render: (item: SalarySchedule) => {
        if (!item.next_generation_date || item.type !== 'fixed') return <span className="text-sm text-muted-foreground">N/A</span>;
        
        const date = parseISODate(item.next_generation_date);
        
        return (
          <span className="text-sm text-muted-foreground">
            {date.toLocaleDateString()}
          </span>
        );
      },
    },
    {
      header: 'Estado',
      render: (item: SalarySchedule) => (
        <span className={`text-xs px-2 py-1 rounded ${item.is_active ? 'bg-green-100 text-green-800 dark:bg-green-900' : 'bg-gray-100 text-gray-800 dark:bg-gray-900'}`}>
          {item.is_active ? 'Activo' : 'Inactivo'}
        </span>
      ),
    },
    {
      header: 'Acciones',
      render: (item: SalarySchedule) => (
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => handleSalaryEdit(item)}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleSalaryDelete(item.id)}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ]

  // Regular income columns
  const incomeColumns = [
    {
      header: 'Nombre',
      render: (item: Income) => <span className="font-medium">{item.name}</span>,
    },
    {
      header: 'Tipo',
      render: (item: Income) => {
        if (item.description?.includes('Generado desde:')) {
          return (
            <span className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100 px-2 py-1 rounded">
              Generado
            </span>
          );
        }
        return (
          <span className="text-xs bg-muted px-2 py-1 rounded capitalize">
            {item.type}
          </span>
        );
      },
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
      render: (item: Income) => {
        if (item.is_confirmed) {
          return (
            <span className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 px-2 py-1 rounded">
              Confirmado
            </span>
          );
        }
        return (
          <span className="text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100 px-2 py-1 rounded">
            Pendiente
          </span>
        );
      },
    },
    {
      header: 'Acciones',
      render: (item: Income) => (
        <div className="flex gap-2">
          {/* Show confirm button only for generated incomes that are not confirmed */}
          {item.description?.includes('Generado desde:') && !item.is_confirmed && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleConfirm(item.id)}
              title="Confirmar ingreso"
            >
              <CheckCircle className="h-4 w-4 text-green-600" />
            </Button>
          )}
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
        <h1 className="text-3xl font-bold">Ingresos</h1>
        <p className="text-muted-foreground mt-1">
          Gestiona tus fuentes de ingresos recurrentes y puntuales
        </p>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Tab navigation */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setCurrentTab('incomes')}
          className={`px-4 py-2 font-medium border-b-2 -mb-0.5 transition-colors ${
            currentTab === 'incomes'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Ingresos ({regularIncomes.length})
        </button>
        <button
          onClick={() => setCurrentTab('salaries')}
          className={`px-4 py-2 font-medium border-b-2 -mb-0.5 transition-colors ${
            currentTab === 'salaries'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Salarios ({salaries.length})
        </button>
      </div>

      {/* INCOMES TAB */}
      {currentTab === 'incomes' && (
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total de Ingresos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{regularIncomes.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total de Ingresos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{confirmedRegularIncomes}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Monto Total</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(regularIncomesTotal)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Ingresos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(regularIncomesTotal)}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex gap-2">
            <Button onClick={() => setShowForm(!showForm)} className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Ingreso
            </Button>
            <Button 
              onClick={handleGenerateSalaryIncomes} 
              variant="outline" 
              className="w-full sm:w-auto"
              disabled={loading}
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Generar de Salarios
            </Button>
          </div>

          {showForm && (
            <Card>
              <CardHeader>
                <CardTitle>{editingId ? 'Editar' : 'Nuevo'} Ingreso</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Nombre del Ingreso *</Label>
                    <Input
                      id="name"
                      placeholder="Ej: Trabajo freelance, Bono, etc."
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label htmlFor="amount">Monto *</Label>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="currency_id">Moneda *</Label>
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
                    <Label htmlFor="income_date">Fecha específica (opcional)</Label>
                    <DatePicker
                      value={formData.income_date}
                      onChange={(date) => setFormData({ ...formData, income_date: date })}
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Si no especificas una fecha, se considerará como ingreso mensual promedio
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="account_id">Cuenta (opcional)</Label>
                    <Select value={formData.account_id || 'none'} onValueChange={(value) => setFormData({ ...formData, account_id: value === 'none' ? '' : value })}>
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
                    <Label htmlFor="description">Descripción (opcional)</Label>
                    <Input
                      id="description"
                      placeholder="Detalles adicionales del ingreso"
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
            data={[...regularIncomes, ...generatedSalaryIncomes]}
            columns={incomeColumns}
            loading={loading}
            pagination={{
              page,
              limit: 10,
              total: regularIncomes.length + generatedSalaryIncomes.length,
              onPageChange: fetchIncomes,
            }}
          />
        </div>
      )}

      {/* SALARIES TAB */}
      {currentTab === 'salaries' && (
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total de Salarios</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{salaries.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Salarios Activos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activeSalaries}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Monto Total</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(salaryTotal)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Próximos Pagos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {salaries.filter(s => s.next_generation_date && new Date(s.next_generation_date) > new Date()).length}
                </div>
              </CardContent>
            </Card>
            {salaries.some(s => s.type === 'average') && (
              <Card className="col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Progreso de Salario Promedio</CardTitle>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const averageSalaries = salaries.filter(s => s.type === 'average');
                    const totalTargetAverage = averageSalaries.reduce((sum, salary) => sum + (salary.amount || 0), 0);
                    const currentMonthIncomes = allIncomes.filter(income => {
                      const incomeDate = new Date(income.income_date);
                      const now = new Date();
                      return incomeDate.getMonth() === now.getMonth() && incomeDate.getFullYear() === now.getFullYear();
                    });
                    const currentMonthTotal = currentMonthIncomes.reduce((sum, income) => sum + (income.amount || 0), 0);
                    const remaining = totalTargetAverage - currentMonthTotal;
                    const progress = (currentMonthTotal / totalTargetAverage) * 100;

                    return (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Objetivo Mensual:</span>
                          <span className="font-medium">{formatCurrency(totalTargetAverage)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Ingresos del Mes:</span>
                          <span className="font-medium">{formatCurrency(currentMonthTotal)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Faltante:</span>
                          <span className={`font-medium ${remaining > 0 ? 'text-destructive' : 'text-green-600'}`}>
                            {remaining > 0 ? formatCurrency(remaining) : 'Meta Alcanzada!'}
                          </span>
                        </div>
                        <div className="mt-4">
                          <div className="h-2 bg-muted rounded overflow-hidden">
                            <div
                              className={`h-full ${remaining > 0 ? 'bg-primary' : 'bg-green-600'}`}
                              style={{ width: `${Math.min(progress, 100)}%` }}
                            />
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 text-right">{Math.round(progress)}% completado</p>
                        </div>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            )}
          </div>

          <Button onClick={() => setShowSalaryForm(!showSalaryForm)} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Nueva Fuente de Salario
          </Button>

          {showSalaryForm && (
            <Card>
              <CardHeader>
                <CardTitle>{editingSalaryId ? 'Editar' : 'Nueva'} Fuente de Salario</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSalarySubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="salary-name">Nombre de la Fuente</Label>
                    <Input
                      id="salary-name"
                      placeholder="Ej: Trabajo en X, Freelance habitual"
                      value={salaryFormData.name}
                      onChange={(e) => setSalaryFormData({ ...salaryFormData, name: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="salary-type">Tipo de Ingreso</Label>
                    <Select value={salaryFormData.type} onValueChange={(value) => setSalaryFormData({ ...salaryFormData, type: value as SalaryType })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fixed">
                          <div>
                            <p className="font-medium">Fijo</p>
                            <p className="text-xs text-muted-foreground">Monto exacto, genera confirmaciones automáticas</p>
                          </div>
                        </SelectItem>
                        <SelectItem value="average">
                          <div>
                            <p className="font-medium">Promedio</p>
                            <p className="text-xs text-muted-foreground">Monto promedio, solo para seguimiento</p>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="bg-muted p-3 rounded-lg text-sm">
                    <p>
                      <strong>Salarios Programados:</strong> Configura tu salario recurrente y se generarán automáticamente ingresos pendientes de confirmación según la frecuencia y día especificado. Puedes asociarlo a una cuenta específica (opcional).
                    </p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label htmlFor="salary-amount">Monto</Label>
                      <Input
                        id="salary-amount"
                        type="number"
                        step="0.01"
                        value={salaryFormData.amount}
                        onChange={(e) => setSalaryFormData({ ...salaryFormData, amount: parseFloat(e.target.value) })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="salary-currency">Moneda</Label>
                      <Select value={salaryFormData.currency_id} onValueChange={(value) => setSalaryFormData({ ...salaryFormData, currency_id: value })}>
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

                  {salaryFormData.type === 'fixed' && (
                    <>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <Label htmlFor="salary-frequency">Frecuencia</Label>
                          <Select value={salaryFormData.frequency} onValueChange={(value) => setSalaryFormData({ ...salaryFormData, frequency: value as SalaryFrequency })}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="weekly">Semanal</SelectItem>
                              <SelectItem value="monthly">Mensual</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="salary-day">Día de Pago</Label>
                          <Input
                            id="salary-day"
                            type="number"
                            min={salaryFormData.frequency === 'monthly' ? 1 : 0}
                            max={salaryFormData.frequency === 'monthly' ? 31 : 6}
                            value={salaryFormData.salary_day}
                            onChange={(e) => setSalaryFormData({ ...salaryFormData, salary_day: parseInt(e.target.value) || 1 })}
                            placeholder={salaryFormData.frequency === 'monthly' ? 'Ej: 15' : 'Ej: 1 (Lunes)'}
                          />
                        </div>
                        <div>
                          <Label htmlFor="salary-date">Fecha de Inicio</Label>
                          <DatePicker
                            value={salaryFormData.start_date}
                            onChange={(date) => setSalaryFormData({ ...salaryFormData, start_date: date })}
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="salary-account">Cuenta Destino (Opcional)</Label>
                        <Select value={salaryFormData.account_id || 'none'} onValueChange={(value) => setSalaryFormData({ ...salaryFormData, account_id: value === 'none' ? '' : value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar cuenta" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Sin cuenta específica</SelectItem>
                            {accounts.map((acc) => (
                              <SelectItem key={acc.id} value={acc.id}>
                                {acc.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}

                  <div>
                    <Label htmlFor="salary-description">Descripción (Opcional)</Label>
                    <Input
                      id="salary-description"
                      placeholder="Notas adicionales"
                      value={salaryFormData.description}
                      onChange={(e) => setSalaryFormData({ ...salaryFormData, description: e.target.value })}
                    />
                  </div>

                  <div className="flex gap-2 justify-end">
                    <Button type="button" variant="outline" onClick={resetSalaryForm}>
                      Cancelar
                    </Button>
                    <Button type="submit">
                      {editingSalaryId ? 'Actualizar' : 'Crear'} Salario
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          <DataTable
            data={salaries}
            columns={salaryColumns}
            loading={loading}
            pagination={{
              page,
              limit: 10,
              total: salaries.length,
              onPageChange: fetchIncomes,
            }}
          />
        </div>
      )}
    </div>
  )
}
