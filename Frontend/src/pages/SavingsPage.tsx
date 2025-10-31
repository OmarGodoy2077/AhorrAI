import { useState, useEffect } from 'react'
import { savingsGoalService, savingsDepositService, getErrorMessage } from '@/services'
import type { SavingsGoal, SavingsDeposit } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import { Progress } from '@/components/ui/progress'
import { DataTable } from '@/components/ui/DataTable'
import { DatePicker } from '@/components/ui/DatePicker'
import { Trash2, Plus } from 'lucide-react'
import { useFormatCurrency } from '@/hooks/useFormatCurrency'
import { parseISODate } from '@/lib/utils'

export const SavingsPage = () => {
  const { formatCurrency, defaultCurrency } = useFormatCurrency()
  const [goals, setGoals] = useState<SavingsGoal[]>([])
  const [deposits, setDeposits] = useState<SavingsDeposit[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showGoalForm, setShowGoalForm] = useState(false)
  const [showDepositForm, setShowDepositForm] = useState(false)
  const [selectedGoal] = useState<string>('')
  
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

  const [depositFormData, setDepositFormData] = useState({
    goal_id: '',
    amount: 0,
    deposit_date: new Date().toISOString().split('T')[0],
    description: '',
  })

  const fetchGoals = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await savingsGoalService.getAll({ limit: 100 })
      setGoals(response.data)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const fetchDeposits = async () => {
    try {
      const response = await savingsDepositService.getAll({ limit: 100 })
      setDeposits(response.data)
    } catch (err) {
      console.error(getErrorMessage(err))
    }
  }

  useEffect(() => {
    fetchGoals()
    fetchDeposits()
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
      fetchGoals()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  const handleCreateDeposit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setError('')
      await savingsDepositService.create(depositFormData)
      setDepositFormData({
        goal_id: '',
        amount: 0,
        deposit_date: new Date().toISOString().split('T')[0],
        description: '',
      })
      setShowDepositForm(false)
      fetchGoals()
      fetchDeposits()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  const handleDeleteGoal = async (id: string) => {
    if (!window.confirm('¿Estás seguro?')) return
    try {
      await savingsGoalService.delete(id)
      fetchGoals()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  const handleDeleteDeposit = async (id: string) => {
    if (!window.confirm('¿Estás seguro?')) return
    try {
      await savingsDepositService.delete(id)
      fetchDeposits()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  const goalDeposits = selectedGoal ? deposits.filter(d => d.goal_id === selectedGoal) : []

  const totalGoals = goals.length
  const totalSaved = goals.reduce((sum, g) => sum + g.current_amount, 0)
  const totalTarget = goals.reduce((sum, g) => sum + g.target_amount, 0)
  const progressPercent = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0

  const goalColumns = [
    {
      header: 'Meta',
      render: (item: SavingsGoal) => <span className="font-medium">{item.name}</span>,
    },
    {
      header: 'Tipo',
      render: (item: SavingsGoal) => (
        <span className="text-xs bg-muted px-2 py-1 rounded capitalize">{item.goal_type}</span>
      ),
    },
    {
      header: 'Progreso',
      render: (item: SavingsGoal) => (
        <div className="space-y-1">
          <div className="text-sm font-semibold">{item.currency} {item.current_amount.toFixed(2)} / {item.target_amount.toFixed(2)}</div>
          <Progress value={Math.min(100, (item.current_amount / item.target_amount) * 100)} className="w-32" />
        </div>
      ),
    },
    {
      header: 'Estado',
      render: (item: SavingsGoal) => (
        <span className={`text-xs px-2 py-1 rounded capitalize ${item.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900' : 'bg-blue-100 text-blue-800 dark:bg-blue-900'}`}>
          {item.status}
        </span>
      ),
    },
    {
      header: 'Acciones',
      render: (item: SavingsGoal) => (
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => handleDeleteGoal(item.id)}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ]

  const depositColumns = [
    {
      header: 'Monto',
      render: (item: SavingsDeposit) => <span className="font-semibold">{formatCurrency(item.amount, item.goal?.currency)}</span>,
    },
    {
      header: 'Descripción',
      render: (item: SavingsDeposit) => <span className="text-muted-foreground">{item.description || '-'}</span>,
    },
    {
      header: 'Fecha',
      render: (item: SavingsDeposit) => {
        if (!item.deposit_date) return <span className="text-sm">N/A</span>;
        
        const date = parseISODate(item.deposit_date);
        
        return <span className="text-sm">{date.toLocaleDateString()}</span>;
      },
    },
    {
      header: 'Acciones',
      render: (item: SavingsDeposit) => (
        <Button variant="ghost" size="sm" onClick={() => handleDeleteDeposit(item.id)}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Ahorros</h1>
        <p className="text-muted-foreground mt-1">Gestiona tus metas de ahorro</p>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Metas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalGoals}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Ahorrado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalSaved)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Meta Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalTarget)}</div>
            <div className="text-sm text-muted-foreground mt-2">
              Progreso: {progressPercent.toFixed(0)}%
            </div>
            <Progress value={progressPercent} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-2">
        <Button onClick={() => setShowGoalForm(!showGoalForm)} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Nueva Meta
        </Button>
        <Button onClick={() => setShowDepositForm(!showDepositForm)} variant="outline" className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Depósito
        </Button>
      </div>

      {showGoalForm && (
        <Card>
          <CardHeader>
            <CardTitle>Nueva Meta de Ahorro</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateGoal} className="space-y-4">
              <div>
                <Label htmlFor="name">Nombre</Label>
                <Input
                  id="name"
                  placeholder="Ej: Vacaciones"
                  value={goalFormData.name}
                  onChange={(e) => setGoalFormData({ ...goalFormData, name: e.target.value })}
                  required
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="target_amount">Monto Meta</Label>
                  <Input
                    id="target_amount"
                    type="number"
                    step="0.01"
                    value={goalFormData.target_amount}
                    onChange={(e) => setGoalFormData({ ...goalFormData, target_amount: parseFloat(e.target.value) })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="goal_type">Tipo</Label>
                  <Select value={goalFormData.goal_type} onValueChange={(value) => setGoalFormData({ ...goalFormData, goal_type: value as 'monthly' | 'global' | 'custom' })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Mensual</SelectItem>
                      <SelectItem value="global">Global</SelectItem>
                      <SelectItem value="custom">Personalizada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="target_date">Fecha Meta (Opcional)</Label>
                <DatePicker
                  value={goalFormData.target_date}
                  onChange={(date) => setGoalFormData({ ...goalFormData, target_date: date })}
                />
              </div>

              <div>
                <Label htmlFor="description">Descripción</Label>
                <Input
                  id="description"
                  placeholder="Detalles"
                  value={goalFormData.description}
                  onChange={(e) => setGoalFormData({ ...goalFormData, description: e.target.value })}
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setShowGoalForm(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Crear Meta</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {showDepositForm && (
        <Card>
          <CardHeader>
            <CardTitle>Nuevo Depósito de Ahorro</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateDeposit} className="space-y-4">
              <div>
                <Label htmlFor="goal_id">Meta</Label>
                <Select value={depositFormData.goal_id} onValueChange={(value) => setDepositFormData({ ...depositFormData, goal_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar meta" />
                  </SelectTrigger>
                  <SelectContent>
                    {goals.map((goal) => (
                      <SelectItem key={goal.id} value={goal.id}>
                        {goal.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="amount">Monto</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={depositFormData.amount}
                    onChange={(e) => setDepositFormData({ ...depositFormData, amount: parseFloat(e.target.value) })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="deposit_date">Fecha</Label>
                  <DatePicker
                    value={depositFormData.deposit_date}
                    onChange={(date) => setDepositFormData({ ...depositFormData, deposit_date: date })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Descripción</Label>
                <Input
                  id="description"
                  placeholder="Notas del depósito"
                  value={depositFormData.description}
                  onChange={(e) => setDepositFormData({ ...depositFormData, description: e.target.value })}
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setShowDepositForm(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Crear Depósito</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Metas de Ahorro</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable data={goals} columns={goalColumns} loading={loading} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Depósitos Recientes</CardTitle>
        </CardHeader>
        <CardContent>
          {selectedGoal ? (
            <DataTable data={goalDeposits} columns={depositColumns} loading={loading} />
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Selecciona una meta para ver sus depósitos
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
