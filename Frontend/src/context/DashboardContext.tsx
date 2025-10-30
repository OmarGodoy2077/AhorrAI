import React, { createContext, useContext, useState, useCallback } from 'react'
import { expenseService, incomeService, accountService } from '@/services'
import type { Expense, Income } from '@/types'

interface DashboardStats {
  totalIncome: number
  totalExpenses: number
  totalSavings: number
  accountBalance: number
}

interface DashboardContextType {
  stats: DashboardStats
  setStats: (stats: DashboardStats) => void
  refreshDashboard: () => Promise<void>
  isLoading: boolean
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined)

export const useDashboard = () => {
  const context = useContext(DashboardContext)
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider')
  }
  return context
}

interface DashboardProviderProps {
  children: React.ReactNode
}

export const DashboardProvider: React.FC<DashboardProviderProps> = ({ children }) => {
  const [stats, setStats] = useState<DashboardStats>({
    totalIncome: 0,
    totalExpenses: 0,
    totalSavings: 0,
    accountBalance: 0,
  })
  const [isLoading, setIsLoading] = useState(false)

  const refreshDashboard = useCallback(async () => {
    setIsLoading(true)
    try {
      // Primero generar salarios automáticos si es necesario
      try {
        await incomeService.generateSalaryIncomes()
      } catch (genError) {
        console.warn('Error generating salary incomes:', genError)
        // No fallar si no se pueden generar salarios
      }

      // Obtener datos del mes actual
      const currentMonth = new Date().getMonth() + 1
      const currentYear = new Date().getFullYear()

      // Obtener todos los ingresos y gastos (con límite alto para el mes)
      const [incomesResponse, expensesResponse, accountsResponse] = await Promise.all([
        incomeService.getAll({ limit: 1000 }),
        expenseService.getAll({ limit: 1000 }),
        accountService.getAll({ limit: 100 })
      ])

      const incomes = incomesResponse.data
      const expenses = expensesResponse.data
      const accounts = accountsResponse.data

      // Filtrar por mes actual - incluir ingresos reales (no salarios fuente) y salarios generados confirmados
      const currentMonthIncomes = incomes.filter((income: Income) => {
        // Usar income_date para determinar el mes del ingreso
        const date = new Date(income.income_date)
        const isCurrentMonth = date.getFullYear() === currentYear && date.getMonth() + 1 === currentMonth
        const isConfirmed = income.is_confirmed
        const isSalarySource = income.description?.includes('[FIJO]') || income.description?.includes('[PROMEDIO]')
        const isSalaryGenerated = income.description?.includes('Generado desde:')

        // Incluir: ingresos regulares + salarios generados confirmados, excluir salarios fuente
        const shouldInclude = isCurrentMonth && isConfirmed && (!isSalarySource || isSalaryGenerated)
        
        if (shouldInclude) {
          console.log('Including income in dashboard:', {
            id: income.id,
            name: income.name,
            amount: income.amount,
            description: income.description,
            income_date: income.income_date,
            is_confirmed: income.is_confirmed,
            isSalarySource,
            isSalaryGenerated
          })
        }
        
        return shouldInclude
      })

      const currentMonthExpenses = expenses.filter((expense: Expense) => {
        const date = new Date(expense.expense_date)
        return date.getFullYear() === currentYear && date.getMonth() + 1 === currentMonth
      })

      const totalIncome = currentMonthIncomes.reduce((sum: number, income: Income) => sum + income.amount, 0)
      const totalExpenses = currentMonthExpenses.reduce((sum: number, expense: Expense) => sum + expense.amount, 0)

      // Definir el tipo para accounts
      const typedAccounts = accounts as Array<{ balance: number }>
      const totalBalance = typedAccounts.reduce((sum: number, account) => sum + account.balance, 0)

      setStats({
        totalIncome,
        totalExpenses,
        totalSavings: 0, // TODO: calcular ahorros
        accountBalance: totalBalance,
      })
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  return (
    <DashboardContext.Provider value={{
      stats,
      setStats,
      refreshDashboard,
      isLoading
    }}>
      {children}
    </DashboardContext.Provider>
  )
}