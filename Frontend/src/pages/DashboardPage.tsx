import { useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import { useAuth } from '@/context/AuthContext'
import { useDashboard } from '@/context/DashboardContext'
import { Wallet, TrendingDown, PiggyBank, TrendingUp } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { Link } from 'react-router-dom'

export const DashboardPage = () => {
  const { user } = useAuth()
  const { stats, refreshDashboard, isLoading, selectedMonth, selectedYear, setSelectedMonth, setSelectedYear } = useDashboard()

  useEffect(() => {
    refreshDashboard(selectedMonth, selectedYear)
  }, [selectedMonth, selectedYear, refreshDashboard])

  // Get month names in Spanish
  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ]

  const currentDate = new Date()
  const currentMonth = currentDate.getMonth() + 1
  const currentYear = currentDate.getFullYear()

  // Handle month navigation
  const handlePreviousMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12)
      setSelectedYear(selectedYear - 1)
    } else {
      setSelectedMonth(selectedMonth - 1)
    }
  }

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1)
      setSelectedYear(selectedYear + 1)
    } else {
      setSelectedMonth(selectedMonth + 1)
    }
  }

  const handleToday = () => {
    setSelectedMonth(currentMonth)
    setSelectedYear(currentYear)
  }

  // Generate year options (current year ± 2 years)
  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i)

 const statsCards = [
    {
      title: 'Balance Disponible',
      value: stats.accountBalance,
      description: 'Dinero disponible para gastar',
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
    <div className="space-y-4 sm:space-y-8 animate-fade-in px-2 sm:px-0">
      {/* Header with Month Selector */}
      <div className="flex flex-col gap-4 sm:gap-0 sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold truncate">
            ¡Bienvenido, {user?.full_name?.split(' ')[0]}! 👋
          </h1>
          <p className="text-xs sm:text-base text-muted-foreground mt-1 truncate">
            Resumen de tus finanzas
          </p>
        </div>

        {/* Month/Year Selector */}
        <Card className="w-full md:w-auto overflow-hidden">
          <CardContent className="p-2 sm:p-4">
            <div className="flex items-center gap-1 sm:gap-2 flex-wrap justify-center sm:justify-start">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreviousMonth}
                className="text-xs sm:text-sm"
              >
                ← Ant
              </Button>
              
              <Select value={String(selectedMonth)} onValueChange={(val) => setSelectedMonth(parseInt(val))}>
                <SelectTrigger className="w-32 sm:w-40 text-xs sm:text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {monthNames.map((month, idx) => (
                    <SelectItem key={idx} value={String(idx + 1)}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={String(selectedYear)} onValueChange={(val) => setSelectedYear(parseInt(val))}>
                <SelectTrigger className="w-20 sm:w-24 text-xs sm:text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map((year) => (
                    <SelectItem key={year} value={String(year)}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="sm"
                onClick={handleNextMonth}
                className="text-xs sm:text-sm"
              >
                Sig →
              </Button>

              {(selectedMonth !== currentMonth || selectedYear !== currentYear) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleToday}
                  className="text-blue-500 text-xs sm:text-sm"
                >
                  Hoy
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
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
                  {isLoading ? (
                    <div className="animate-pulse bg-muted h-8 w-24 rounded"></div>
                  ) : (
                    formatCurrency(stat.value)
                  )}
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
                      width: stats.totalIncome > 0 ? `${(stats.totalExpenses / stats.totalIncome) * 100}%` : '0%',
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
