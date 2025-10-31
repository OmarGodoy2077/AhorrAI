import React, { createContext, useContext, useState, useCallback } from 'react'
import { expenseService, incomeService, accountService, summaryService } from '@/services'
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

      // Obtener resumen mensual desde la base de datos (ya incluye ingresos confirmados)
      let monthlySummary
      try {
        monthlySummary = await summaryService.getMonthlySummary(currentYear, currentMonth)
      } catch (summaryError) {
        console.warn('Error fetching monthly summary, falling back to manual calculation:', summaryError)
        // Fallback: calcular manualmente si no hay resumen
        const [incomesResponse, expensesResponse] = await Promise.all([
          incomeService.getAll({ limit: 1000 }),
          expenseService.getAll({ limit: 1000 })
        ])

        const incomes = incomesResponse.data
        const expenses = expensesResponse.data

        // Filtrar por mes actual - incluir ingresos reales (no salarios fuente) y salarios generados confirmados
        const currentMonthIncomes = incomes.filter((income: Income) => {
          const date = new Date(income.income_date)
          const isCurrentMonth = date.getFullYear() === currentYear && date.getMonth() + 1 === currentMonth
          const isConfirmed = income.is_confirmed
          const isSalarySource = income.description?.includes('[FIJO]') || income.description?.includes('[PROMEDIO]')
          const isSalaryGenerated = income.description?.includes('Generado desde:')

          // Incluir: ingresos regulares + salarios generados confirmados, excluir salarios fuente
          return isCurrentMonth && isConfirmed && (!isSalarySource || isSalaryGenerated)
        })

        const currentMonthExpenses = expenses.filter((expense: Expense) => {
          const date = new Date(expense.expense_date)
          return date.getFullYear() === currentYear && date.getMonth() + 1 === currentMonth
        })

        monthlySummary = {
          total_income: currentMonthIncomes.reduce((sum: number, income: Income) => sum + income.amount, 0),
          total_expenses: currentMonthExpenses.reduce((sum: number, expense: Expense) => sum + expense.amount, 0),
          net_change: 0
        }
      }

      // Obtener balance de cuentas
      const accountsResponse = await accountService.getAll({ limit: 100 })
      const accounts = accountsResponse.data
      const totalBalance = accounts.reduce((sum: number, account) => sum + account.balance, 0)

      setStats({
        totalIncome: monthlySummary.total_income || 0,
        totalExpenses: monthlySummary.total_expenses || 0,
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