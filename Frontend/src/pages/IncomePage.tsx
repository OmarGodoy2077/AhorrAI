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
import { useFormatCurrency } from '@/hooks/useFormatCurrency'
import { DatePicker } from '@/components/ui/DatePicker'
import { useDashboard } from '@/context/DashboardContext'
import { Trash2, Edit, Plus, CheckCircle, TrendingUp } from 'lucide-react'

type SalaryType = 'fixed' | 'average'
const SALARY_AVERAGE_PREFIX = '[PROMEDIO]'
const SALARY_FIXED_PREFIX = '[FIJO]'

export const IncomePage = () => {
  const { formatCurrency, defaultCurrency } = useFormatCurrency()
  const { refreshDashboard } = useDashboard()
  const [allIncomes, setAllIncomes] = useState<Income[]>([])
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
    frequency: IncomeFrequency
    income_date: string
    description: string
    account_id: string
  }>({
    name: '',
    type: 'fixed',
    amount: 0,
    currency_id: defaultCurrency?.id || '',
    frequency: 'monthly',
    income_date: new Date().toISOString().split('T')[0],
    description: '',
    account_id: '',
  })

  // Regular income form state
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
    type: 'extra',
    amount: 0,
    currency_id: defaultCurrency?.id || '',
    frequency: 'one-time',
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

  useEffect(() => {
    fetchIncomes()
    fetchAccounts()
    fetchCurrencies()
  }, [])

  // Salary handlers
  const handleSalarySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setError('')
      // Store salary type in description with prefix
      const prefix = salaryFormData.type === 'average' ? SALARY_AVERAGE_PREFIX : SALARY_FIXED_PREFIX
      const descriptionWithPrefix = `${prefix} ${salaryFormData.description}`
      
      const dataToSubmit = {
        name: salaryFormData.name,
        type: salaryFormData.type === 'average' ? 'variable' as IncomeType : 'fixed' as IncomeType,
        amount: salaryFormData.amount,
        currency_id: salaryFormData.currency_id,
        frequency: salaryFormData.type === 'average' ? 'one-time' as IncomeFrequency : salaryFormData.frequency,
        income_date: salaryFormData.income_date,
        description: descriptionWithPrefix,
        account_id: salaryFormData.account_id,
        is_confirmed: false, // Los salarios requieren confirmación manual
      }

      if (editingSalaryId) {
        await incomeService.update(editingSalaryId, dataToSubmit)
      } else {
        await incomeService.create(dataToSubmit)
      }
      resetSalaryForm()
      fetchIncomes(1)
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  const handleSalaryEdit = (income: Income) => {
    // Detect salary type from description prefix or income type
    const isSalaryAverage = income.description?.includes(SALARY_AVERAGE_PREFIX) || income.type === 'variable'
    const salaryType: SalaryType = isSalaryAverage ? 'average' : 'fixed'
    
    // Remove prefix from description for display
    const descriptionClean = income.description
      ?.replace(SALARY_AVERAGE_PREFIX, '')
      ?.replace(SALARY_FIXED_PREFIX, '')
      ?.trim() || ''
    
    setSalaryFormData({
      name: income.name,
      type: salaryType,
      amount: income.amount,
      currency_id: income.currency_id || '',
      frequency: income.frequency,
      income_date: income.income_date,
      description: descriptionClean,
      account_id: income.account_id || '',
    })
    setEditingSalaryId(income.id)
    setShowSalaryForm(true)
  }

  const handleSalaryDelete = async (id: string) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar esta fuente de salario?')) return
    try {
      setError('')
      await incomeService.delete(id)
      fetchIncomes(1)
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
      income_date: new Date().toISOString().split('T')[0],
      description: '',
      account_id: '',
    })
    setEditingSalaryId(null)
    setShowSalaryForm(false)
  }

  // Regular income handlers
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setError('')
      const dataToSubmit = {
        ...formData,
        is_confirmed: true, // Ingresos regulares se confirman automáticamente
      }
      if (editingId) {
        await incomeService.update(editingId, dataToSubmit)
      } else {
        // Crear ingreso extra - se marca como confirmado automáticamente
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

  const handleConfirm = async (id: string) => {
    try {
      setError('')
      await incomeService.confirm(id)
      fetchIncomes(page)
      // Refrescar el dashboard para actualizar los totales
      await refreshDashboard()
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
      type: 'extra',
      amount: 0,
      currency_id: defaultCurrency?.id || '',
      frequency: 'one-time',
      income_date: new Date().toISOString().split('T')[0],
      description: '',
      account_id: '',
    })
    setEditingId(null)
    setShowForm(false)
  }

  // Separate incomes by type
  const salaries = allIncomes.filter(i =>
    (i.description?.includes(SALARY_AVERAGE_PREFIX) || i.description?.includes(SALARY_FIXED_PREFIX)) &&
    !i.description?.includes('Generado desde:')
  )
  const regularIncomes = allIncomes.filter(i =>
    !i.description?.includes(SALARY_AVERAGE_PREFIX) && 
    !i.description?.includes(SALARY_FIXED_PREFIX) &&
    !i.description?.includes('Generado desde:')
  )
  const generatedSalaryIncomes = allIncomes.filter(i =>
    i.description?.includes('Generado desde:')
  )

  // Calculate statistics
  const salaryTotal = salaries.filter(i => i.description?.includes(SALARY_FIXED_PREFIX)).reduce((sum, i) => sum + i.amount, 0)
  const confirmedSalaries = salaries.filter(i => i.is_confirmed || i.description?.includes(SALARY_FIXED_PREFIX)).length
  const averageSalaries = salaries.filter(i => i.description?.includes(SALARY_AVERAGE_PREFIX)).length
  const fixedSalaries = salaries.filter(i => i.description?.includes(SALARY_FIXED_PREFIX)).length

  const regularIncomesTotal = [...regularIncomes, ...generatedSalaryIncomes].filter(i => i.is_confirmed).reduce((sum, i) => sum + i.amount, 0)
  const confirmedRegularIncomes = [...regularIncomes, ...generatedSalaryIncomes].length

  // Average tracking calculation
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()
  const monthlyAverageSalaries = salaries.filter(i => {
    const date = new Date(i.income_date)
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear && i.description?.includes(SALARY_AVERAGE_PREFIX)
  })
  const expectedAverageAmount = monthlyAverageSalaries.reduce((sum, i) => sum + i.amount, 0)
  const receivedConfirmedAmount = regularIncomes.reduce((sum, i) => sum + i.amount, 0)
  const difference = expectedAverageAmount - receivedConfirmedAmount

  // Salary columns
  const salaryColumns = [
    {
      header: 'Nombre',
      render: (item: Income) => <span className="font-medium">{item.name}</span>,
    },
    {
      header: 'Tipo',
      render: (item: Income) => (
        <span className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100 px-2 py-1 rounded">
          {item.type === 'variable' || item.description?.includes(SALARY_AVERAGE_PREFIX) ? 'Promedio' : 'Fijo'}
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
      render: (item: Income) => {
        const isAverage = item.type === 'variable' || item.description?.includes(SALARY_AVERAGE_PREFIX);
        const isFixed = item.description?.includes(SALARY_FIXED_PREFIX);
        
        if (isAverage) {
          return (
            <span className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100 px-2 py-1 rounded">
              Solo seguimiento
            </span>
          );
        }
        
        if (isFixed) {
          return (
            <span className={`text-xs px-2 py-1 rounded ${item.is_confirmed ? 'bg-green-100 text-green-800 dark:bg-green-900' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900'}`}>
              {item.is_confirmed ? 'Confirmado' : 'Pendiente'}
            </span>
          );
        }
        
        return (
          <span className={`text-xs px-2 py-1 rounded ${item.is_confirmed ? 'bg-green-100 text-green-800 dark:bg-green-900' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900'}`}>
            {item.is_confirmed ? 'Confirmado' : 'Pendiente'}
          </span>
        );
      },
    },
    {
      header: 'Acciones',
      render: (item: Income) => (
        <div className="flex gap-2">
          {!item.is_confirmed && !(item.type === 'variable' || item.description?.includes(SALARY_AVERAGE_PREFIX)) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleConfirm(item.id)}
              title="Confirmar salario"
            >
              <CheckCircle className="h-4 w-4 text-green-600" />
            </Button>
          )}
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
      render: () => (
        <span className="text-xs bg-green-100 text-green-800 dark:bg-green-900 px-2 py-1 rounded">
          Confirmado
        </span>
      ),
    },
    {
      header: 'Acciones',
      render: (item: Income) => (
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
                    <Label htmlFor="name">Nombre</Label>
                    <Input
                      id="name"
                      placeholder="Ej: Ingreso extra, Regalo"
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
                          <SelectItem value="extra">Extra</SelectItem>
                          <SelectItem value="variable">Variable</SelectItem>
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
                          <SelectItem value="one-time">Una sola vez</SelectItem>
                          <SelectItem value="weekly">Semanal</SelectItem>
                          <SelectItem value="monthly">Mensual</SelectItem>
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
                <CardTitle className="text-sm font-medium">Salarios Fijos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{fixedSalaries}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Salarios Promedio</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{averageSalaries}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Salario</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(salaryTotal)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Confirmados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{confirmedSalaries}</div>
              </CardContent>
            </Card>
          </div>

          {/* Average tracking card */}
          {expectedAverageAmount > 0 && (
            <Card className="border-2 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Seguimiento de Promedio Mensual
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Promedio Esperado</p>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{formatCurrency(expectedAverageAmount)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Ingresos Confirmados</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">{formatCurrency(receivedConfirmedAmount)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Diferencia</p>
                    <p className={`text-2xl font-bold ${difference > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                      {difference > 0 ? 'Falta ' : 'Superado '}{formatCurrency(Math.abs(difference))}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

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
                    {salaryFormData.type === 'fixed' ? (
                      <p>
                        <strong>Fijo:</strong> Basado en la fecha de primer pago y frecuencia, se generarán confirmaciones automáticas para que las valides. Se asocia a una cuenta específica (opcional).
                      </p>
                    ) : (
                      <p>
                        <strong>Promedio:</strong> Solo un índice mensual de tu promedio de salario. No genera confirmaciones automáticas. Perfectamente para salarios variables o comisiones. Se compara automáticamente con tus ingresos confirmados del mes.
                      </p>
                    )}
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
                          <Select value={salaryFormData.frequency} onValueChange={(value) => setSalaryFormData({ ...salaryFormData, frequency: value as IncomeFrequency })}>
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
                          <Label htmlFor="salary-date">Fecha de Primer Pago</Label>
                          <DatePicker
                            value={salaryFormData.income_date}
                            onChange={(date) => setSalaryFormData({ ...salaryFormData, income_date: date })}
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
