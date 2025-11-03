import { useState, useEffect } from 'react'
import { accountStatementService, getErrorMessage } from '@/services'
import type { AccountStatementTransaction, AccountStatementAccount, AccountStatementSummary } from '@/services/accountStatementService'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import { Label } from '@/components/ui/label'
import { useFormatCurrency } from '@/hooks/useFormatCurrency'
import { TrendingUp, TrendingDown, DollarSign, FileText } from 'lucide-react'

export const AccountStatementPage = () => {
  const { formatCurrency } = useFormatCurrency()
  const [transactions, setTransactions] = useState<AccountStatementTransaction[]>([])
  const [accounts, setAccounts] = useState<AccountStatementAccount[]>([])
  const [summary, setSummary] = useState<AccountStatementSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  // Filtros
  const currentDate = new Date()
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear())
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null)
  const [selectedAccount, setSelectedAccount] = useState<string>('all')
  const [filterName, setFilterName] = useState<string>('Todas las cuentas')

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ]

  const fetchStatement = async () => {
    try {
      setLoading(true)
      setError('')

      const filters: { year: number; month?: number; account_id?: string } = {
        year: selectedYear,
      }

      if (selectedMonth !== null) {
        filters.month = selectedMonth
      }

      if (selectedAccount !== 'all') {
        filters.account_id = selectedAccount
      }

      const response = await accountStatementService.getStatement(filters)
      
      setTransactions(response.transactions)
      setAccounts(response.accounts)
      setSummary(response.summary)
      setFilterName(response.filters.account_name)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStatement()
  }, [selectedYear, selectedMonth, selectedAccount])

  // Generar opciones de año (últimos 5 años)
  const yearOptions = Array.from({ length: 5 }, (_, i) => currentDate.getFullYear() - i)

  // Formatear fecha a formato legible
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-GT', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-0 animate-fade-in">
      {/* Header */}
      <div className="animate-slide-in-down">
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
          <FileText className="h-6 w-6 sm:h-8 sm:w-8" />
          Estado de Cuenta
        </h1>
        <p className="text-xs sm:text-base text-muted-foreground mt-1">
          Historial completo de tus transacciones financieras
        </p>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-3 rounded-lg animate-slide-in-down">
          {error}
        </div>
      )}

      {/* Filtros */}
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <Label htmlFor="year" className="text-xs sm:text-sm">Año</Label>
              <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="month" className="text-xs sm:text-sm">Mes</Label>
              <Select 
                value={selectedMonth === null ? 'all' : selectedMonth.toString()} 
                onValueChange={(value) => setSelectedMonth(value === 'all' ? null : parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos los meses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los meses</SelectItem>
                  {monthNames.map((month, index) => (
                    <SelectItem key={index + 1} value={(index + 1).toString()}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="account" className="text-xs sm:text-sm">Cuenta</Label>
              <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las cuentas</SelectItem>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button 
                onClick={fetchStatement} 
                disabled={loading}
                className="w-full transition-all duration-300 hover:scale-105"
              >
                Aplicar Filtros
              </Button>
            </div>
          </div>

          <div className="mt-4 text-xs sm:text-sm text-muted-foreground">
            Mostrando: <span className="font-semibold">{filterName}</span>
            {selectedMonth !== null && (
              <> - <span className="font-semibold">{monthNames[selectedMonth - 1]} {selectedYear}</span></>
            )}
            {selectedMonth === null && (
              <> - <span className="font-semibold">Todo {selectedYear}</span></>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Resumen */}
      {summary && (
        <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
          <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                Ingresos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold text-green-600 truncate">
                {formatCurrency(summary.total_income)}
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-red-500" />
                Egresos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold text-red-600 truncate">
                {formatCurrency(summary.total_expense)}
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-blue-500" />
                Cambio Neto
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-lg sm:text-2xl font-bold truncate ${
                summary.net_change >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatCurrency(summary.net_change)}
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Balance Final</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold text-primary truncate">
                {formatCurrency(summary.final_balance)}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabla de Transacciones */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">
            Transacciones ({transactions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Cargando transacciones...
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay transacciones para mostrar con los filtros seleccionados
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs sm:text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-2 sm:px-4 font-semibold">Fecha</th>
                    <th className="text-left py-2 px-2 sm:px-4 font-semibold">Descripción</th>
                    <th className="text-left py-2 px-2 sm:px-4 font-semibold hidden sm:table-cell">Cuenta</th>
                    <th className="text-right py-2 px-2 sm:px-4 font-semibold text-green-600">Ingreso</th>
                    <th className="text-right py-2 px-2 sm:px-4 font-semibold text-red-600">Egreso</th>
                    <th className="text-right py-2 px-2 sm:px-4 font-semibold">Saldo</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction, index) => (
                    <tr 
                      key={`${transaction.id}-${index}`} 
                      className="border-b hover:bg-muted/50 transition-colors"
                    >
                      <td className="py-2 px-2 sm:px-4 whitespace-nowrap">
                        {formatDate(transaction.date)}
                      </td>
                      <td className="py-2 px-2 sm:px-4">
                        <div className="max-w-[150px] sm:max-w-none truncate">
                          {transaction.description}
                        </div>
                        <div className="text-xs text-muted-foreground sm:hidden">
                          {transaction.account}
                        </div>
                      </td>
                      <td className="py-2 px-2 sm:px-4 text-muted-foreground hidden sm:table-cell">
                        {transaction.account}
                      </td>
                      <td className="py-2 px-2 sm:px-4 text-right font-semibold text-green-600">
                        {transaction.income > 0 ? formatCurrency(transaction.income, transaction.currency_code) : '-'}
                      </td>
                      <td className="py-2 px-2 sm:px-4 text-right font-semibold text-red-600">
                        {transaction.expense > 0 ? formatCurrency(transaction.expense, transaction.currency_code) : '-'}
                      </td>
                      <td className="py-2 px-2 sm:px-4 text-right font-bold">
                        {formatCurrency(transaction.balance, transaction.currency_code)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
