import { useState, useEffect } from 'react'
import { savingsGoalService, accountService, savingsDepositService, getErrorMessage } from '@/services'
import type { SavingsGoal, Account } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import { Progress } from '@/components/ui/progress'
import { DataTable } from '@/components/ui/DataTable'
import { DatePicker } from '@/components/ui/DatePicker'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Trash2, Plus, Send } from 'lucide-react'
import { useFormatCurrency } from '@/hooks/useFormatCurrency'
import { parseISODate, getTodayGuatemalaDate } from '@/lib/utils'

export const SavingsPage = () => {
  const { formatCurrency, defaultCurrency } = useFormatCurrency()
  const [customGoals, setCustomGoals] = useState<SavingsGoal[]>([])
  const [monthlyGoal, setMonthlyGoal] = useState<SavingsGoal | null>(null)
  const [globalGoal, setGlobalGoal] = useState<SavingsGoal | null>(null)
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showGoalForm, setShowGoalForm] = useState(false)
  const [selectedGoal, setSelectedGoal] = useState<SavingsGoal | null>(null)
  const [showTransferForm, setShowTransferForm] = useState(false)
  const [showDepositForm, setShowDepositForm] = useState(false)
  const [showMonthlyForm, setShowMonthlyForm] = useState(false)
  const [showGlobalForm, setShowGlobalForm] = useState(false)

  const [goalFormData, setGoalFormData] = useState<{
    name: string
    target_amount: number
    currency: string
    goal_type: 'monthly' | 'global' | 'custom'
    target_date: string
    description: string
  }>({
    name: '',
    target_amount: 0,
    currency: defaultCurrency?.code || 'USD',
    goal_type: 'custom',
    target_date: '',
    description: '',
  })

  const [transferFormData, setTransferFormData] = useState({
    amount: 0,
    target_account_id: '',
  })

  const [depositFormData, setDepositFormData] = useState({
    amount: 0,
    description: '',
    source_account_id: '',
  })

  const [monthlyFormData, setMonthlyFormData] = useState({
    target_amount: 0,
  })

  const [globalFormData, setGlobalFormData] = useState({
    target_amount: 0,
  })

  const fetchData = async () => {
    try {
      setLoading(true)
      setError('')

      // First, update calculated goals (monthly/global) from summaries
      try {
        await savingsGoalService.updateCalculated()
      } catch (err) {
        console.warn('Failed to update calculated goals:', err)
      }

      const [goalsRes, accountsRes] = await Promise.all([
        savingsGoalService.getAll({ limit: 100 }),
        accountService.getAll({ limit: 100 })
      ])

      const allGoals = goalsRes.data

      // Separar metas por tipo
      const custom = allGoals.filter(g => g.goal_type === 'custom')
      const monthly = allGoals.find(g => g.goal_type === 'monthly')
      const global = allGoals.find(g => g.goal_type === 'global')

      setCustomGoals(custom)
      setMonthlyGoal(monthly || null)
      setGlobalGoal(global || null)

      // Filtrar cuentas reales (excluir virtuales)
      const realAccounts = accountsRes.data.filter(a => !a.is_virtual_account)
      setAccounts(realAccounts)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setError('')
      await savingsGoalService.create(goalFormData)
      setGoalFormData({
        name: '',
        target_amount: 0,
        currency: defaultCurrency?.code || 'USD',
        goal_type: 'custom',
        target_date: '',
        description: '',
      })
      setShowGoalForm(false)
      fetchData()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  const handleSaveMonthlyGoal = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setError('')
      if (monthlyGoal) {
        // Actualizar meta existente
        await savingsGoalService.update(monthlyGoal.id, {
          target_amount: monthlyFormData.target_amount,
        })
      } else {
        // Crear nueva meta mensual
        await savingsGoalService.create({
          name: 'Meta de Ahorro Mensual',
          target_amount: monthlyFormData.target_amount,
          currency: defaultCurrency?.code || 'USD',
          goal_type: 'monthly',
          target_date: '',
          description: 'Meta de ahorro calculada automáticamente cada mes',
        })
      }
      setShowMonthlyForm(false)
      fetchData()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  const handleSaveGlobalGoal = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setError('')
      if (globalGoal) {
        // Actualizar meta existente
        await savingsGoalService.update(globalGoal.id, {
          target_amount: globalFormData.target_amount,
        })
      } else {
        // Crear nueva meta global
        await savingsGoalService.create({
          name: 'Meta de Ahorro Global',
          target_amount: globalFormData.target_amount,
          currency: defaultCurrency?.code || 'USD',
          goal_type: 'global',
          target_date: '',
          description: 'Meta acumulativa de ahorro a largo plazo',
        })
      }
      setShowGlobalForm(false)
      fetchData()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  const handleDeleteGoal = async (id: string) => {
    if (!window.confirm('¿Estás seguro? Esta acción no se puede deshacer.')) return
    try {
      await savingsGoalService.delete(id)
      fetchData()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  const handleTransferFromVirtual = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedGoal) return

    try {
      setError('')
      await savingsGoalService.transferFromVirtualAccount(
        selectedGoal.id,
        transferFormData.amount,
        transferFormData.target_account_id,
        `Transfer from goal: ${selectedGoal.name}`
      )
      setTransferFormData({ amount: 0, target_account_id: '' })
      setShowTransferForm(false)
      setSelectedGoal(null)
      fetchData()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  const handleDepositToVirtual = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validar datos requeridos
    if (!selectedGoal) {
      setError('Por favor selecciona una meta')
      return
    }
    
    if (!selectedGoal.virtual_account_id) {
      setError('La meta no tiene cuenta virtual asociada')
      return
    }
    
    if (!depositFormData.source_account_id) {
      setError('Por favor selecciona una cuenta origen')
      return
    }
    
    if (!depositFormData.amount || depositFormData.amount <= 0) {
      setError('El monto debe ser mayor a 0')
      return
    }

    try {
      setError('')
      await savingsDepositService.create({
        virtual_account_id: selectedGoal.virtual_account_id,
        source_account_id: depositFormData.source_account_id,
        amount: depositFormData.amount,
        deposit_date: getTodayGuatemalaDate(),
        description: depositFormData.description || `Deposit to: ${selectedGoal.name}`,
      })
      setDepositFormData({ amount: 0, description: '', source_account_id: '' })
      setShowDepositForm(false)
      setSelectedGoal(null)
      fetchData()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  // Calcular progreso para metas de ahorro normal
  const getGoalProgress = (goal: SavingsGoal) => {
    return goal.target_amount > 0 ? (goal.current_amount / goal.target_amount) * 100 : 0
  }

  // Tabla de metas personalizadas (custom)
  const customGoalColumns = [
    {
      header: 'Meta',
      render: (item: SavingsGoal) => (
        <div className="flex flex-col">
          <span className="font-semibold">{item.name}</span>
          {item.description && <span className="text-xs text-muted-foreground">{item.description}</span>}
        </div>
      ),
    },
    {
      header: 'Objetivo',
      render: (item: SavingsGoal) => <span>{formatCurrency(item.target_amount, item.currency)}</span>,
    },
    {
      header: 'Ahorrado',
      render: (item: SavingsGoal) => <span className="font-semibold">{formatCurrency(item.current_amount, item.currency)}</span>,
    },
    {
      header: 'Progreso',
      render: (item: SavingsGoal) => (
        <div className="flex items-center gap-2 min-w-xs">
          <Progress value={Math.min(100, getGoalProgress(item))} className="w-24" />
          <span className="text-sm font-medium">{Math.round(getGoalProgress(item))}%</span>
        </div>
      ),
    },
    {
      header: 'Fecha Límite',
      render: (item: SavingsGoal) => {
        if (!item.target_date) return <span className="text-muted-foreground">-</span>
        const date = parseISODate(item.target_date)
        return <span className="text-sm">{date.toLocaleDateString()}</span>
      },
    },
    {
      header: 'Estado',
      render: (item: SavingsGoal) => (
        <span className={`text-xs px-2 py-1 rounded capitalize font-medium ${
          item.status === 'completed' 
            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' 
            : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100'
        }`}>
          {item.status}
        </span>
      ),
    },
    {
      header: 'Acciones',
      render: (item: SavingsGoal) => (
        <div className="flex gap-1 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedGoal(item)
              setShowDepositForm(true)
            }}
            title="Depositar dinero a esta meta"
          >
            <Plus className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedGoal(item)
              setShowTransferForm(true)
            }}
            title="Transferir desde cuenta virtual"
          >
            <Send className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDeleteGoal(item.id)}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-3xl font-bold">Ahorros</h1>
        <p className="text-muted-foreground mt-1">
          Gestiona tus metas de ahorro. Las metas mensuales y globales se calculan automáticamente desde tus ingresos y gastos.
        </p>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-sm transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Meta Mensual</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold truncate">
              {monthlyGoal ? formatCurrency(monthlyGoal.current_amount, monthlyGoal.currency) : 'N/A'}
            </div>
            {monthlyGoal && (
              <div className="text-xs text-muted-foreground mt-1 truncate">
                Meta: {formatCurrency(monthlyGoal.target_amount, monthlyGoal.currency)}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="hover:shadow-sm transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Meta Global</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold truncate">
              {globalGoal ? formatCurrency(globalGoal.current_amount, globalGoal.currency) : 'N/A'}
            </div>
            {globalGoal && (
              <div className="text-xs text-muted-foreground mt-1 truncate">
                Meta: {formatCurrency(globalGoal.target_amount, globalGoal.currency)}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="hover:shadow-sm transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Metas Personalizadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{customGoals.length}</div>
            <div className="text-xs text-muted-foreground mt-1 truncate">
              Total: {formatCurrency(
                customGoals.reduce((sum, g) => sum + g.current_amount, 0)
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-sm transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Progreso Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">
              {customGoals.length > 0
                ? Math.round(
                    (customGoals.reduce((sum, g) => sum + g.current_amount, 0) /
                      customGoals.reduce((sum, g) => sum + g.target_amount, 0)) *
                      100
                  )
                : 0}%
            </div>
            <Progress
              value={
                customGoals.length > 0
                  ? (customGoals.reduce((sum, g) => sum + g.current_amount, 0) /
                      customGoals.reduce((sum, g) => sum + g.target_amount, 0)) *
                    100
                  : 0
              }
              className="mt-2"
            />
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="custom" className="w-full">
        <TabsList className="grid w-full max-w-full sm:max-w-md grid-cols-3 bg-secondary/80 h-auto">
          <TabsTrigger value="custom" className="text-xs sm:text-sm py-2">Personalizadas</TabsTrigger>
          <TabsTrigger value="monthly" className="text-xs sm:text-sm py-2">Mensual</TabsTrigger>
          <TabsTrigger value="global" className="text-xs sm:text-sm py-2">Global</TabsTrigger>
        </TabsList>

        {/* Metas Personalizadas */}
        <TabsContent value="custom" className="space-y-4">
          <Button
            onClick={() => {
              setGoalFormData({
                name: '',
                target_amount: 0,
                currency: defaultCurrency?.code || 'USD',
                goal_type: 'custom',
                target_date: '',
                description: '',
              })
              setShowGoalForm(!showGoalForm)
            }}
            className="w-full sm:w-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nueva Meta Personalizada
          </Button>

          {showGoalForm && (
            <Card className="bg-muted/50 border-primary/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-base sm:text-lg">Nueva Meta Personalizada</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateGoal} className="space-y-4">
                  <div className="w-full">
                    <Label htmlFor="name" className="text-sm">Nombre de la Meta</Label>
                    <Input
                      id="name"
                      placeholder="Ej: Auto, Vacaciones, Laptop"
                      value={goalFormData.name}
                      onChange={(e) => setGoalFormData({ ...goalFormData, name: e.target.value })}
                      className="w-full mt-1"
                      required
                    />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 w-full">
                    <div className="w-full">
                      <Label htmlFor="target_amount" className="text-sm">Monto Objetivo</Label>
                      <Input
                        id="target_amount"
                        type="number"
                        step="0.01"
                        value={goalFormData.target_amount}
                        onChange={(e) => setGoalFormData({ ...goalFormData, target_amount: parseFloat(e.target.value) })}
                        className="w-full mt-1"
                        required
                      />
                    </div>
                    <div className="w-full">
                      <Label htmlFor="currency" className="text-sm">Moneda</Label>
                      <Input
                        id="currency"
                        value={goalFormData.currency}
                        disabled
                        className="w-full mt-1"
                      />
                    </div>
                  </div>

                  <div className="w-full">
                    <Label htmlFor="target_date" className="text-sm">Fecha Límite (Opcional)</Label>
                    <div className="w-full mt-1">
                      <DatePicker
                        value={goalFormData.target_date}
                        onChange={(date) => setGoalFormData({ ...goalFormData, target_date: date })}
                      />
                    </div>
                  </div>

                  <div className="w-full">
                    <Label htmlFor="description" className="text-sm">Descripción</Label>
                    <Input
                      id="description"
                      placeholder="Detalles sobre tu meta"
                      value={goalFormData.description}
                      onChange={(e) => setGoalFormData({ ...goalFormData, description: e.target.value })}
                      className="w-full mt-1"
                    />
                  </div>

                  <div className="flex flex-col-reverse sm:flex-row gap-2 justify-end pt-2 border-t">
                    <Button type="button" variant="outline" onClick={() => setShowGoalForm(false)} className="w-full sm:w-auto">
                      Cancelar
                    </Button>
                    <Button type="submit" className="w-full sm:w-auto">Crear Meta</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base sm:text-lg">Metas Personalizadas</CardTitle>
              <p className="text-xs sm:text-sm text-muted-foreground mt-2">
                Estas metas tienen cuentas fantasma asociadas. Transfiere dinero cuando lo necesites.
              </p>
            </CardHeader>
            <CardContent>
              {customGoals.length > 0 ? (
                <div className="w-full overflow-x-auto">
                  <div className="min-w-full">
                    <DataTable data={customGoals} columns={customGoalColumns} loading={loading} />
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 sm:py-12 text-muted-foreground">
                  <p className="text-sm sm:text-base">No tienes metas personalizadas aún</p>
                  <p className="text-xs sm:text-sm mt-1">Crea una para comenzar a ahorrar para objetivos específicos</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Transfer Form */}
          {showTransferForm && selectedGoal && (
            <Card className="border-primary/50 bg-primary/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-base sm:text-lg">
                  Transferir desde: {selectedGoal.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <form onSubmit={handleTransferFromVirtual} className="space-y-4">
                  <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded p-3">
                    <p className="text-xs sm:text-sm text-blue-900 dark:text-blue-100 break-words">
                      <strong>Disponible:</strong> {formatCurrency(selectedGoal.current_amount, selectedGoal.currency)}
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 w-full">
                    <div className="w-full">
                      <Label htmlFor="transfer_amount" className="text-sm">Monto a Transferir</Label>
                      <Input
                        id="transfer_amount"
                        type="number"
                        step="0.01"
                        max={selectedGoal.current_amount}
                        value={transferFormData.amount}
                        onChange={(e) => setTransferFormData({ ...transferFormData, amount: parseFloat(e.target.value) })}
                        className="w-full mt-1"
                        required
                      />
                    </div>
                    <div className="w-full">
                      <Label htmlFor="target_account" className="text-sm">Cuenta Destino</Label>
                      <Select
                        value={transferFormData.target_account_id}
                        onValueChange={(value) => setTransferFormData({ ...transferFormData, target_account_id: value })}
                      >
                        <SelectTrigger className="w-full mt-1">
                          <SelectValue placeholder="Seleccionar cuenta" />
                        </SelectTrigger>
                        <SelectContent>
                          {accounts.map((account) => (
                            <SelectItem key={account.id} value={account.id}>
                              {account.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex flex-col-reverse sm:flex-row gap-2 justify-end pt-2 border-t">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowTransferForm(false)
                        setSelectedGoal(null)
                        setTransferFormData({ amount: 0, target_account_id: '' })
                      }}
                      className="w-full sm:w-auto"
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" className="w-full sm:w-auto">Transferir</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Deposit Form */}
          {showDepositForm && selectedGoal && (
            <Card className="border-green-500/50 bg-green-50/30 dark:bg-green-950/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-base sm:text-lg">
                  Depositar a: {selectedGoal.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <form onSubmit={handleDepositToVirtual} className="space-y-4">
                  <div className="bg-green-100/30 dark:bg-green-900/30 border border-green-200/50 dark:border-green-800/50 rounded p-3">
                    <p className="text-xs sm:text-sm text-green-900 dark:text-green-100 break-words">
                      <strong>Objetivo:</strong> {formatCurrency(selectedGoal.target_amount, selectedGoal.currency)}
                    </p>
                    <p className="text-xs sm:text-sm text-green-900 dark:text-green-100 break-words mt-1">
                      <strong>Ya ahorrado:</strong> {formatCurrency(selectedGoal.current_amount, selectedGoal.currency)}
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 w-full">
                    <div className="w-full">
                      <Label htmlFor="deposit_source" className="text-sm">De Cuenta (Origen)</Label>
                      <Select
                        value={depositFormData.source_account_id}
                        onValueChange={(value) => setDepositFormData({ ...depositFormData, source_account_id: value })}
                      >
                        <SelectTrigger className="w-full mt-1">
                          <SelectValue placeholder="Seleccionar cuenta" />
                        </SelectTrigger>
                        <SelectContent>
                          {accounts.map((account) => (
                            <SelectItem key={account.id} value={account.id}>
                              {account.name} ({formatCurrency(account.balance, (typeof account.currency === 'string' ? account.currency : account.currency?.code) || defaultCurrency?.code)})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="w-full">
                      <Label htmlFor="deposit_amount" className="text-sm">Monto a Depositar</Label>
                      <Input
                        id="deposit_amount"
                        type="number"
                        step="0.01"
                        value={depositFormData.amount || ''}
                        onChange={(e) => {
                          const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                          setDepositFormData({ ...depositFormData, amount: isNaN(value) ? 0 : value })
                        }}
                        className="w-full mt-1"
                        required
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div className="w-full">
                    <Label htmlFor="deposit_description" className="text-sm">Descripción (Opcional)</Label>
                    <Input
                      id="deposit_description"
                      placeholder="Ej: Ahorro del mes"
                      value={depositFormData.description}
                      onChange={(e) => setDepositFormData({ ...depositFormData, description: e.target.value })}
                      className="w-full mt-1"
                    />
                  </div>

                  <div className="flex flex-col-reverse sm:flex-row gap-2 justify-end pt-2 border-t">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowDepositForm(false)
                        setSelectedGoal(null)
                        setDepositFormData({ amount: 0, description: '', source_account_id: '' })
                      }}
                      className="w-full sm:w-auto"
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" className="w-full sm:w-auto">Depositar Dinero</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Meta Mensual */}
        <TabsContent value="monthly" className="space-y-4">
          {monthlyGoal ? (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base sm:text-lg">Meta de Ahorro Mensual</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                    <span className="text-sm font-medium">Progreso</span>
                    <span className="text-lg sm:text-2xl font-bold text-right">
                      {formatCurrency(monthlyGoal.current_amount, monthlyGoal.currency)}
                    </span>
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground mb-2 break-words">
                    Objetivo: {formatCurrency(monthlyGoal.target_amount, monthlyGoal.currency)}
                  </div>
                  <Progress
                    value={Math.min(100, getGoalProgress(monthlyGoal))}
                    className="h-3"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground">Porcentaje Completado</p>
                    <p className="text-xl sm:text-2xl font-bold mt-1">{Math.round(getGoalProgress(monthlyGoal))}%</p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground">Falta por ahorrar</p>
                    <p className="text-xl sm:text-2xl font-bold mt-1 break-words">
                      {formatCurrency(
                        Math.max(0, monthlyGoal.target_amount - monthlyGoal.current_amount),
                        monthlyGoal.currency
                      )}
                    </p>
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded p-3 sm:p-4">
                  <p className="text-xs sm:text-sm text-blue-900 dark:text-blue-100 break-words">
                    💡 Esta meta se calcula automáticamente: <strong>Ingresos - Gastos = Ahorro Mensual</strong>
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              <Button
                onClick={() => {
                  setMonthlyFormData({ target_amount: 0 })
                  setShowMonthlyForm(true)
                }}
                className="w-full sm:w-auto"
              >
                <Plus className="h-4 w-4 mr-2" />
                Crear Meta Mensual
              </Button>

              {showMonthlyForm && (
                <Card className="bg-muted/50 border-primary/30">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base sm:text-lg">Configurar Meta Mensual</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSaveMonthlyGoal} className="space-y-4">
                      <div className="w-full">
                        <Label htmlFor="monthly_target" className="text-sm">Monto Objetivo Mensual</Label>
                        <Input
                          id="monthly_target"
                          type="number"
                          step="0.01"
                          value={monthlyFormData.target_amount}
                          onChange={(e) => setMonthlyFormData({ target_amount: parseFloat(e.target.value) })}
                          className="w-full mt-1"
                          required
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Este es tu objetivo de ahorro cada mes
                        </p>
                      </div>

                      <div className="flex flex-col-reverse sm:flex-row gap-2 justify-end pt-2 border-t">
                        <Button type="button" variant="outline" onClick={() => setShowMonthlyForm(false)} className="w-full sm:w-auto">
                          Cancelar
                        </Button>
                        <Button type="submit" className="w-full sm:w-auto">Guardar Meta Mensual</Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardContent className="py-8 sm:py-12 text-center text-muted-foreground">
                  <p className="text-sm sm:text-base">No tienes una meta mensual configurada</p>
                  <p className="text-xs sm:text-sm mt-1">
                    Crea una para comenzar a seguir tu ahorro mensual
                  </p>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Meta Global */}
        <TabsContent value="global" className="space-y-4">
          {globalGoal ? (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base sm:text-lg">Meta de Ahorro Global</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                    <span className="text-sm font-medium">Progreso</span>
                    <span className="text-lg sm:text-2xl font-bold text-right">
                      {formatCurrency(globalGoal.current_amount, globalGoal.currency)}
                    </span>
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground mb-2 break-words">
                    Objetivo: {formatCurrency(globalGoal.target_amount, globalGoal.currency)}
                  </div>
                  <Progress
                    value={Math.min(100, getGoalProgress(globalGoal))}
                    className="h-3"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground">Porcentaje Completado</p>
                    <p className="text-xl sm:text-2xl font-bold mt-1">{Math.round(getGoalProgress(globalGoal))}%</p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground">Falta por ahorrar</p>
                    <p className="text-xl sm:text-2xl font-bold mt-1 break-words">
                      {formatCurrency(
                        Math.max(0, globalGoal.target_amount - globalGoal.current_amount),
                        globalGoal.currency
                      )}
                    </p>
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded p-3 sm:p-4">
                  <p className="text-xs sm:text-sm text-blue-900 dark:text-blue-100 break-words">
                    💡 Esta meta se calcula automáticamente: <strong>Es el acumulado total de todos tus ahorros</strong>
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              <Button
                onClick={() => {
                  setGlobalFormData({ target_amount: 0 })
                  setShowGlobalForm(true)
                }}
                className="w-full sm:w-auto"
              >
                <Plus className="h-4 w-4 mr-2" />
                Crear Meta Global
              </Button>

              {showGlobalForm && (
                <Card className="bg-muted/50 border-primary/30">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base sm:text-lg">Configurar Meta Global</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSaveGlobalGoal} className="space-y-4">
                      <div className="w-full">
                        <Label htmlFor="global_target" className="text-sm">Monto Objetivo Total</Label>
                        <Input
                          id="global_target"
                          type="number"
                          step="0.01"
                          value={globalFormData.target_amount}
                          onChange={(e) => setGlobalFormData({ target_amount: parseFloat(e.target.value) })}
                          className="w-full mt-1"
                          required
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Este es tu objetivo de ahorro a largo plazo (acumulativo)
                        </p>
                      </div>

                      <div className="flex flex-col-reverse sm:flex-row gap-2 justify-end pt-2 border-t">
                        <Button type="button" variant="outline" onClick={() => setShowGlobalForm(false)} className="w-full sm:w-auto">
                          Cancelar
                        </Button>
                        <Button type="submit" className="w-full sm:w-auto">Guardar Meta Global</Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardContent className="py-8 sm:py-12 text-center text-muted-foreground">
                  <p className="text-sm sm:text-base">No tienes una meta global configurada</p>
                  <p className="text-xs sm:text-sm mt-1">
                    Crea una para comenzar a seguir tu ahorro acumulativo
                  </p>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
