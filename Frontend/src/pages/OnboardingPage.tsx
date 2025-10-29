import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { accountService, savingsGoalService, financialSettingService, getErrorMessage } from '@/services'
import type { Account, SavingsGoal } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import { Progress } from '@/components/ui/progress'

export const OnboardingPage = () => {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Step 1: Financial Settings
  const [financialForm, setFinancialForm] = useState({
    salary: 0,
    monthly_savings_target: 0,
  })

  // Step 2: Create Accounts
  const [accounts, setAccounts] = useState<Array<{
    name: string
    type: 'cash' | 'bank' | 'platform'
    balance: number
    currency: string
    description: string
  }>>([
    { name: '', type: 'bank', balance: 0, currency: 'GTQ', description: '' },
  ])

  // Step 3: Create Savings Goals
  const [savingsGoals, setSavingsGoals] = useState<Array<{
    name: string
    target_amount: number
    currency: string
    goal_type: 'monthly' | 'global' | 'custom'
    description: string
  }>>([
    { name: '', target_amount: 0, currency: 'GTQ', goal_type: 'monthly', description: '' },
  ])

  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setError('')
      setLoading(true)
      await financialSettingService.create({
        ...financialForm,
        effective_date: new Date().toISOString().split('T')[0],
      })
      setStep(2)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setError('')
      setLoading(true)
      for (const account of accounts) {
        if (account.name) {
          await accountService.create(account as Account)
        }
      }
      setStep(3)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const handleStep3Submit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setError('')
      setLoading(true)
      for (const goal of savingsGoals) {
        if (goal.name) {
          await savingsGoalService.create(goal as SavingsGoal)
        }
      }
      navigate('/dashboard')
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const handleSkip = () => {
    if (step === 1) {
      setStep(2)
    } else if (step === 2) {
      setStep(3)
    } else {
      navigate('/dashboard')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="mb-4">
            <h1 className="text-3xl font-bold">¡Bienvenido a AhorraAI!</h1>
            <p className="text-muted-foreground mt-2">
              Vamos a configurar tu cuenta en {3 - step + 1} pasos
            </p>
          </div>
          <Progress value={(step / 3) * 100} className="mt-4" />
        </CardHeader>

        <CardContent>
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          {/* Step 1: Financial Settings */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-2">Paso 1: Configuración Financiera</h2>
                <p className="text-muted-foreground">
                  Cuéntanos sobre tus ingresos y metas de ahorro
                </p>
              </div>

              <form onSubmit={handleStep1Submit} className="space-y-4">
                <div>
                  <Label htmlFor="salary">Salario Mensual</Label>
                  <Input
                    id="salary"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={financialForm.salary}
                    onChange={(e) =>
                      setFinancialForm({
                        ...financialForm,
                        salary: parseFloat(e.target.value),
                      })
                    }
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="monthly_savings_target">
                    Meta de Ahorro Mensual (Opcional)
                  </Label>
                  <Input
                    id="monthly_savings_target"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={financialForm.monthly_savings_target}
                    onChange={(e) =>
                      setFinancialForm({
                        ...financialForm,
                        monthly_savings_target: parseFloat(e.target.value),
                      })
                    }
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleSkip}
                    disabled={loading}
                  >
                    Saltar
                  </Button>
                  <Button type="submit" className="flex-1" disabled={loading}>
                    {loading ? 'Guardando...' : 'Siguiente'}
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Step 2: Create Accounts */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-2">Paso 2: Tus Cuentas</h2>
                <p className="text-muted-foreground">
                  Crea tus cuentas bancarias y de efectivo
                </p>
              </div>

              <form onSubmit={handleStep2Submit} className="space-y-4">
                {accounts.map((account, index) => (
                  <Card key={index} className="p-4">
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor={`name-${index}`}>Nombre</Label>
                        <Input
                          id={`name-${index}`}
                          placeholder="Ej: Mi Cuenta Principal"
                          value={account.name}
                          onChange={(e) => {
                            const newAccounts = [...accounts]
                            newAccounts[index].name = e.target.value
                            setAccounts(newAccounts)
                          }}
                        />
                      </div>

                      <div className="grid gap-3 md:grid-cols-2">
                        <div>
                          <Label htmlFor={`type-${index}`}>Tipo</Label>
                          <Select
                            value={account.type}
                            onValueChange={(value) => {
                              const newAccounts = [...accounts]
                              newAccounts[index].type = value as 'cash' | 'bank' | 'platform'
                              setAccounts(newAccounts)
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="cash">Efectivo</SelectItem>
                              <SelectItem value="bank">Banco</SelectItem>
                              <SelectItem value="platform">Plataforma</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor={`balance-${index}`}>Balance</Label>
                          <Input
                            id={`balance-${index}`}
                            type="number"
                            step="0.01"
                            value={account.balance}
                            onChange={(e) => {
                              const newAccounts = [...accounts]
                              newAccounts[index].balance = parseFloat(e.target.value)
                              setAccounts(newAccounts)
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    setAccounts([
                      ...accounts,
                      {
                        name: '',
                        type: 'bank',
                        balance: 0,
                        currency: 'GTQ',
                        description: '',
                      },
                    ])
                  }
                >
                  + Agregar Otra Cuenta
                </Button>

                <div className="flex gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(1)}
                    disabled={loading}
                  >
                    Atrás
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleSkip}
                    disabled={loading}
                  >
                    Saltar
                  </Button>
                  <Button type="submit" className="flex-1" disabled={loading}>
                    {loading ? 'Guardando...' : 'Siguiente'}
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Step 3: Create Savings Goals */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-2">Paso 3: Metas de Ahorro</h2>
                <p className="text-muted-foreground">
                  Define tus metas de ahorro
                </p>
              </div>

              <form onSubmit={handleStep3Submit} className="space-y-4">
                {savingsGoals.map((goal, index) => (
                  <Card key={index} className="p-4">
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor={`goal-name-${index}`}>Nombre</Label>
                        <Input
                          id={`goal-name-${index}`}
                          placeholder="Ej: Vacaciones"
                          value={goal.name}
                          onChange={(e) => {
                            const newGoals = [...savingsGoals]
                            newGoals[index].name = e.target.value
                            setSavingsGoals(newGoals)
                          }}
                        />
                      </div>

                      <div className="grid gap-3 md:grid-cols-2">
                        <div>
                          <Label htmlFor={`goal-amount-${index}`}>Monto Meta</Label>
                          <Input
                            id={`goal-amount-${index}`}
                            type="number"
                            step="0.01"
                            value={goal.target_amount}
                            onChange={(e) => {
                              const newGoals = [...savingsGoals]
                              newGoals[index].target_amount = parseFloat(e.target.value)
                              setSavingsGoals(newGoals)
                            }}
                          />
                        </div>

                        <div>
                          <Label htmlFor={`goal-type-${index}`}>Tipo</Label>
                          <Select
                            value={goal.goal_type}
                            onValueChange={(value) => {
                              const newGoals = [...savingsGoals]
                              newGoals[index].goal_type = value as 'monthly' | 'global' | 'custom'
                              setSavingsGoals(newGoals)
                            }}
                          >
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
                    </div>
                  </Card>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    setSavingsGoals([
                      ...savingsGoals,
                      {
                        name: '',
                        target_amount: 0,
                        currency: 'GTQ',
                        goal_type: 'custom',
                        description: '',
                      },
                    ])
                  }
                >
                  + Agregar Otra Meta
                </Button>

                <div className="flex gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(2)}
                    disabled={loading}
                  >
                    Atrás
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleSkip}
                    disabled={loading}
                  >
                    Saltar
                  </Button>
                  <Button type="submit" className="flex-1" disabled={loading}>
                    {loading ? 'Completar Onboarding' : '¡Completar!'}
                  </Button>
                </div>
              </form>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
