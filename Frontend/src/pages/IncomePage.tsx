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
import { useToast } from '@/components/ui/toast'
import { Trash2, Edit, Plus, TrendingUp, CheckCircle } from 'lucide-react'
import { parseISODate, getTodayGuatemalaDate, parseDecimalAmount } from '@/lib/utils'

type SalaryType = 'fixed' | 'average'

export const IncomePage = () => {
  const { formatCurrency, defaultCurrency } = useFormatCurrency()
  const { success, error: showError } = useToast()
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

  // Filter states
  const [filterMonth, setFilterMonth] = useState<number>(new Date().getMonth() + 1)
  const [filterYear, setFilterYear] = useState<number>(new Date().getFullYear())
  const [filterStartDate, setFilterStartDate] = useState<string>('')
  const [filterEndDate, setFilterEndDate] = useState<string>('')
  const [useCustomDateRange, setUseCustomDateRange] = useState(false)

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
    start_date: getTodayGuatemalaDate(),
    salary_day: parseInt(getTodayGuatemalaDate().split('-')[2]),
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
    income_date: getTodayGuatemalaDate(), // Default but optional
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
      // Filter out virtual accounts - they are only for savings goals
      const realAccounts = response.data.filter(account => !account.is_virtual_account)
      setAccounts(realAccounts)
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
        success('Salario actualizado', 'El salario se actualizó correctamente')
      } else {
        await salaryScheduleService.create(dataToSubmit)
        success('Salario creado', 'El nuevo salario se agregó correctamente')
      }
      resetSalaryForm()
      fetchSalarySchedules()
    } catch (err) {
      const errorMsg = getErrorMessage(err)
      setError(errorMsg)
      showError('Error', errorMsg)
    }
  }

  const handleSalaryEdit = (schedule: SalarySchedule) => {
    setSalaryFormData({
      name: schedule.name,
      type: schedule.type || 'fixed',
      amount: schedule.amount,
      currency_id: schedule.currency_id || '',
      frequency: schedule.frequency || 'monthly',
      start_date: schedule.start_date || getTodayGuatemalaDate(),
      salary_day: schedule.salary_day || parseInt(getTodayGuatemalaDate().split('-')[2]),
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
      success('Salario eliminado', 'El salario se eliminó correctamente')
      fetchSalarySchedules()
    } catch (err) {
      const errorMsg = getErrorMessage(err)
      setError(errorMsg)
      showError('Error al eliminar', errorMsg)
    }
  }

  const resetSalaryForm = () => {
    setSalaryFormData({
      name: '',
      type: 'fixed',
      amount: 0,
      currency_id: defaultCurrency?.id || '',
      frequency: 'monthly',
      start_date: getTodayGuatemalaDate(),
      salary_day: parseInt(getTodayGuatemalaDate().split('-')[2]),
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
        success('Ingreso actualizado', 'El ingreso se actualizó correctamente')
      } else {
        await incomeService.create(dataToSubmit)
        success('Ingreso creado', 'El nuevo ingreso se agregó correctamente')
      }
      resetForm()
      fetchIncomes(1)
    } catch (err) {
      const errorMsg = getErrorMessage(err)
      setError(errorMsg)
      showError('Error', errorMsg)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Estás seguro?')) return
    try {
      setError('')
      await incomeService.delete(id)
      success('Ingreso eliminado', 'El ingreso se eliminó correctamente')
      fetchIncomes(1)
    } catch (err) {
      const errorMsg = getErrorMessage(err)
      setError(errorMsg)
      showError('Error al eliminar', errorMsg)
    }
  }

  const handleGenerateSalaryIncomes = async () => {
    try {
      setError('')
      setLoading(true)
      const result = await incomeService.generateSalaryIncomes()
      if (result.generated.length > 0) {
        success('Ingresos generados', `Se generaron ${result.generated.length} ingresos desde los salarios`)
        setError(`Se generaron ${result.generated.length} ingresos pendientes de salarios.`)
      } else {
        showError('Sin ingresos', 'No hay nuevos ingresos para generar.')
        setError('No hay nuevos ingresos para generar.')
      }
      fetchIncomes(page)
    } catch (err) {
      const errorMsg = getErrorMessage(err)
      setError(errorMsg)
      showError('Error al generar', errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const handleConfirm = async (id: string) => {
    try {
      setError('')
      await incomeService.confirm(id)
      success('Ingreso confirmado', 'El ingreso se confirmó correctamente')
      fetchIncomes(page)
    } catch (err) {
      const errorMsg = getErrorMessage(err)
      setError(errorMsg)
      showError('Error al confirmar', errorMsg)
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
  const allRegularIncomes = allIncomes.filter(i =>
    !i.description?.includes('Generado desde:')
  )
  const allGeneratedSalaryIncomes = allIncomes.filter(i =>
    i.description?.includes('Generado desde:')
  )

  // Filter incomes by date range (only confirmed incomes)
  const getFilteredIncomes = () => {
    let filtered = allIncomes.filter(i => i.is_confirmed === true)

    if (useCustomDateRange && filterStartDate && filterEndDate) {
      filtered = filtered.filter(i => {
        const incomeDate = parseISODate(i.income_date)
        const start = parseISODate(filterStartDate)
        const end = parseISODate(filterEndDate)
        return incomeDate >= start && incomeDate <= end
      })
    } else {
      // Filter by month/year
      filtered = filtered.filter(i => {
        if (!i.income_date) return false
        const incomeDate = parseISODate(i.income_date)
        return incomeDate.getMonth() + 1 === filterMonth && incomeDate.getFullYear() === filterYear
      })
    }

    return filtered
  }

  const filteredIncomes = getFilteredIncomes()

  // Calculate statistics
  const salaryTotal = salaries.reduce((sum, s) => sum + s.amount, 0)
  const activeSalaries = salaries.filter(s => s.is_active).length

  const regularIncomesTotal = filteredIncomes.reduce((sum, i) => sum + i.amount, 0)
  const confirmedRegularIncomes = [...allRegularIncomes, ...allGeneratedSalaryIncomes].filter(i => i.is_confirmed).length

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
    <div className="space-y-4 sm:space-y-6 px-3 sm:px-4 lg:px-6 animate-fade-in">
      <div className="animate-slide-in-down">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">Ingresos</h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">
          Gestiona tus fuentes de ingresos
        </p>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-3 rounded-lg animate-slide-in-down">
          {error}
        </div>
      )}

      {/* Tab navigation */}
      <div className="flex gap-2 sm:gap-3 border-b overflow-x-auto scrollbar-hide -mx-3 px-3 sm:mx-0 sm:px-0">
        <button
          onClick={() => setCurrentTab('incomes')}
          className={`px-3 sm:px-4 py-2 sm:py-2.5 font-medium border-b-2 -mb-0.5 transition-all duration-300 whitespace-nowrap text-sm sm:text-base ${
            currentTab === 'incomes'
              ? 'border-primary text-primary scale-105'
              : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted'
          }`}
        >
          Ingresos ({allRegularIncomes.length})
        </button>
        <button
          onClick={() => setCurrentTab('salaries')}
          className={`px-3 sm:px-4 py-2 sm:py-2.5 font-medium border-b-2 -mb-0.5 transition-all duration-300 whitespace-nowrap text-sm sm:text-base ${
            currentTab === 'salaries'
              ? 'border-primary text-primary scale-105'
              : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted'
          }`}
        >
          Salarios ({salaries.length})
        </button>
      </div>

      {/* INCOMES TAB */}
      {currentTab === 'incomes' && (
        <div className="space-y-6">
          {/* Filter Section */}
          <Card>
            <CardContent className="p-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Filtrar Ingresos</h3>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useCustomDateRange}
                      onChange={(e) => setUseCustomDateRange(e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    Rango personalizado
                  </label>
                </div>

                {!useCustomDateRange ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Select value={String(filterMonth)} onValueChange={(val) => setFilterMonth(parseInt(val))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Mes" />
                      </SelectTrigger>
                      <SelectContent>
                        {['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'].map((month, idx) => (
                          <SelectItem key={idx} value={String(idx + 1)}>
                            {month}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={String(filterYear)} onValueChange={(val) => setFilterYear(parseInt(val))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Año" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map((year) => (
                          <SelectItem key={year} value={String(year)}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="start-date">Desde</Label>
                      <DatePicker
                        value={filterStartDate}
                        onChange={(date) => setFilterStartDate(date)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="end-date">Hasta</Label>
                      <DatePicker
                        value={filterEndDate}
                        onChange={(date) => setFilterEndDate(date)}
                      />
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
            <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-scale-in">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium">Total de Ingresos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold">{allRegularIncomes.length}</div>
              </CardContent>
            </Card>
            <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-scale-in" style={{ animationDelay: '0.1s' }}>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium">Confirmados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold">{confirmedRegularIncomes}</div>
              </CardContent>
            </Card>
            <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-scale-in" style={{ animationDelay: '0.2s' }}>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium">Monto Total</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg sm:text-2xl font-bold truncate">{formatCurrency(regularIncomesTotal)}</div>
              </CardContent>
            </Card>
            <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-scale-in" style={{ animationDelay: '0.3s' }}>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium">Promedio</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg sm:text-2xl font-bold truncate">
                  {formatCurrency(allRegularIncomes.length > 0 ? regularIncomesTotal / allRegularIncomes.length : 0)}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <Button 
              onClick={() => setShowForm(!showForm)} 
              className="w-full sm:flex-1 transition-all duration-300 hover:scale-105"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Ingreso
            </Button>
            <Button 
              onClick={handleGenerateSalaryIncomes} 
              variant="outline" 
              className="w-full sm:flex-1 transition-all duration-300 hover:scale-105"
              disabled={loading}
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Generar de Salarios
            </Button>
          </div>

          {showForm && (
            <Card className="animate-slide-in-up border-2 border-primary/20">
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl">{editingId ? 'Editar' : 'Nuevo'} Ingreso</CardTitle>
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

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="amount" className="text-sm">Monto *</Label>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: parseDecimalAmount(e.target.value) })}
                        required
                        className="transition-all duration-300 focus:scale-105"
                      />
                    </div>
                    <div>
                      <Label htmlFor="currency_id" className="text-sm">Moneda *</Label>
                      <Select value={formData.currency_id} onValueChange={(value) => setFormData({ ...formData, currency_id: value })}>
                        <SelectTrigger className="transition-all duration-300 focus:scale-105">
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

                  <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
                    <Button type="button" variant="outline" onClick={resetForm} className="w-full sm:w-auto transition-all duration-300 hover:scale-105">
                      Cancelar
                    </Button>
                    <Button type="submit" className="w-full sm:w-auto transition-all duration-300 hover:scale-105">
                      {editingId ? 'Actualizar' : 'Crear'} Ingreso
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Show pending incomes (generated but not confirmed) */}
          {allGeneratedSalaryIncomes.filter(i => !i.is_confirmed).length > 0 && (
            <Card className="border-yellow-200 dark:border-yellow-900">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <span className="text-yellow-600 dark:text-yellow-400">⚠️</span>
                  Ingresos Pendientes de Confirmación
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Estos ingresos fueron generados automáticamente desde tu horario de salario. Confírmalos para agregarlos a tu balance.
                </p>
              </CardHeader>
              <CardContent>
                <DataTable
                  data={allGeneratedSalaryIncomes.filter(i => !i.is_confirmed)}
                  columns={incomeColumns}
                  loading={loading}
                />
              </CardContent>
            </Card>
          )}

          {/* Show confirmed incomes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Ingresos Confirmados</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                data={[...allRegularIncomes, ...allGeneratedSalaryIncomes].filter(i => i.is_confirmed)}
                columns={incomeColumns}
                loading={loading}
                pagination={{
                  page,
                  limit: 10,
                  total: [...allRegularIncomes, ...allGeneratedSalaryIncomes].filter(i => i.is_confirmed).length,
                  onPageChange: fetchIncomes,
                }}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* SALARIES TAB */}
      {currentTab === 'salaries' && (
        <div className="space-y-4 sm:space-y-6 animate-fade-in">
          <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
            <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-scale-in">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium">Total de Salarios</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold">{salaries.length}</div>
              </CardContent>
            </Card>
            <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-scale-in" style={{ animationDelay: '0.1s' }}>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium">Salarios Activos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold">{activeSalaries}</div>
              </CardContent>
            </Card>
            <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-scale-in" style={{ animationDelay: '0.2s' }}>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium">Monto Total</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg sm:text-2xl font-bold truncate">{formatCurrency(salaryTotal)}</div>
              </CardContent>
            </Card>
            <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-scale-in" style={{ animationDelay: '0.3s' }}>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium">Próximos Pagos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold">
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
                      const incomeDate = parseISODate(income.income_date);
                      const now = parseISODate(getTodayGuatemalaDate());
                      return incomeDate.getMonth() + 1 === now.getMonth() + 1 && incomeDate.getFullYear() === now.getFullYear();
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

          <Button onClick={() => setShowSalaryForm(!showSalaryForm)} className="w-full sm:w-auto transition-all duration-300 hover:scale-105">
            <Plus className="h-4 w-4 mr-2" />
            Nueva Fuente de Salario
          </Button>

          {showSalaryForm && (
            <Card className="animate-slide-in-up border-2 border-primary/20">
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl">{editingSalaryId ? 'Editar' : 'Nueva'} Fuente de Salario</CardTitle>
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

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="salary-amount" className="text-sm">Monto</Label>
                      <Input
                        id="salary-amount"
                        type="number"
                        step="0.01"
                        value={salaryFormData.amount}
                        onChange={(e) => setSalaryFormData({ ...salaryFormData, amount: parseDecimalAmount(e.target.value) })}
                        required
                        className="transition-all duration-300 focus:scale-105"
                      />
                    </div>
                    <div>
                      <Label htmlFor="salary-currency" className="text-sm">Moneda</Label>
                      <Select value={salaryFormData.currency_id} onValueChange={(value) => setSalaryFormData({ ...salaryFormData, currency_id: value })}>
                        <SelectTrigger className="transition-all duration-300 focus:scale-105">
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
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <div>
                          <Label htmlFor="salary-frequency" className="text-sm">Frecuencia</Label>
                          <Select value={salaryFormData.frequency} onValueChange={(value) => setSalaryFormData({ ...salaryFormData, frequency: value as SalaryFrequency })}>
                            <SelectTrigger className="transition-all duration-300 focus:scale-105">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="weekly">Semanal</SelectItem>
                              <SelectItem value="monthly">Mensual</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="salary-day" className="text-sm">Día de Pago</Label>
                          <Input
                            id="salary-day"
                            type="number"
                            min={salaryFormData.frequency === 'monthly' ? 1 : 0}
                            max={salaryFormData.frequency === 'monthly' ? 31 : 6}
                            value={salaryFormData.salary_day}
                            onChange={(e) => setSalaryFormData({ ...salaryFormData, salary_day: parseInt(e.target.value) || 1 })}
                            placeholder={salaryFormData.frequency === 'monthly' ? 'Ej: 15' : 'Ej: 1 (Lunes)'}
                            className="transition-all duration-300 focus:scale-105"
                          />
                        </div>
                        <div>
                          <Label htmlFor="salary-date" className="text-sm">Fecha de Inicio</Label>
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

                  <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
                    <Button type="button" variant="outline" onClick={resetSalaryForm} className="w-full sm:w-auto transition-all duration-300 hover:scale-105">
                      Cancelar
                    </Button>
                    <Button type="submit" className="w-full sm:w-auto transition-all duration-300 hover:scale-105">
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
