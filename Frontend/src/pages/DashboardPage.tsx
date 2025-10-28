import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/AuthContext'
import { Wallet, TrendingDown, PiggyBank, TrendingUp } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { Link } from 'react-router-dom'
import api from '@/services/api'
import type { MonthlySummary } from '@/types'

export const DashboardPage = () => {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    totalSavings: 0,
    accountBalance: 0,
  })

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Obtener datos del mes actual
        const currentMonth = new Date().getMonth() + 1
        const currentYear = new Date().getFullYear()
        
        // Obtener resumen mensual
        const response = await api.get<MonthlySummary>(`/summaries/monthly/${currentYear}/${currentMonth}`)
        const summary = response.data

        // Obtener cuentas para el balance total
        const accountsResponse = await api.get('/accounts')
        const accounts = accountsResponse.data.data || []
        // Definir el tipo para accounts
        const typedAccounts = accounts as Array<{ balance: number }>;
        const totalBalance = typedAccounts.reduce((sum: number, account) => sum + account.balance, 0)

        setStats({
          totalIncome: summary?.total_income || 0,
          totalExpenses: summary?.total_expenses || 0,
          totalSavings: summary?.savings || 0,
          accountBalance: totalBalance,
        })
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
        // En caso de error, mantener valores por defecto o mostrar mensaje de error
      }
    }

    fetchDashboardData()
  }, [])

 const statsCards = [
    {
      title: 'Balance Total',
      value: stats.accountBalance,
      description: 'En todas tus cuentas',
      icon: Wallet,
      color: 'text-blue-500',
    },
    {
      title: 'Ingresos del Mes',
      value: stats.totalIncome,
      description: 'Total recibido',
      icon: TrendingUp,
      color: 'text-green-500',
    },
    {
      title: 'Gastos del Mes',
      value: stats.totalExpenses,
      description: 'Total gastado',
      icon: TrendingDown,
      color: 'text-red-500',
    },
    {
      title: 'Ahorros',
      value: stats.totalSavings,
      description: 'Progreso de metas',
      icon: PiggyBank,
      color: 'text-primary',
    },
  ]

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">
          ¡Bienvenido, {user?.full_name?.split(' ')[0]}! 👋
        </h1>
        <p className="text-muted-foreground mt-1">
          Aquí está un resumen de tus finanzas
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <Icon className={`h-5 w-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(stat.value)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
            <CardDescription>
              Registra transacciones o revisa tus datos
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Link to="/income">
              <Button variant="outline">
                <TrendingUp className="mr-2 h-4 w-4" />
                Agregar Ingreso
              </Button>
            </Link>
            <Link to="/expenses">
              <Button variant="outline">
                <TrendingDown className="mr-2 h-4 w-4" />
                Registrar Gasto
              </Button>
            </Link>
            <Link to="/savings">
              <Button variant="outline">
                <PiggyBank className="mr-2 h-4 w-4" />
                Depositar Ahorro
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resumen Mensual</CardTitle>
            <CardDescription>
              Comparativa de ingresos vs gastos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Ingresos</span>
                  <span className="text-sm font-bold text-green-500">
                    {formatCurrency(stats.totalIncome)}
                  </span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Gastos</span>
                  <span className="text-sm font-bold text-red-500">
                    {formatCurrency(stats.totalExpenses)}
                  </span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-500"
                    style={{
                      width: `${(stats.totalExpenses / stats.totalIncome) * 100}%`,
                    }}
                  />
                </div>
              </div>
              <div className="pt-2 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Balance</span>
                  <span className="text-lg font-bold text-primary">
                    {formatCurrency(stats.totalIncome - stats.totalExpenses)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Onboarding notice if needed */}
      <Card className="bg-muted">
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground">
            💡 <strong>Consejo:</strong> Completa tu perfil financiero en la sección de{' '}
            <Link to="/settings" className="text-primary hover:underline">
              Configuración
            </Link>{' '}
            para obtener análisis más precisos.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
