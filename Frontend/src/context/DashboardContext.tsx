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
  refreshDashboard: (month?: number, year?: number) => Promise<void>
  isLoading: boolean
  selectedMonth: number
  selectedYear: number
  setSelectedMonth: (month: number) => void
  setSelectedYear: (year: number) => void
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
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())

  const refreshDashboard = useCallback(async () => {
    setIsLoading(true)
    try {
      // Usar mes/año seleccionados
      const targetMonth = selectedMonth
      const targetYear = selectedYear

      // Primero generar salarios automáticos si es necesario
      try {
        await incomeService.generateSalaryIncomes()
      } catch (genError) {
        console.warn('Error generating salary incomes:', genError)
        // No fallar si no se pueden generar salarios
      }

      // Obtener resumen mensual desde la base de datos (ya incluye ingresos confirmados)
      let monthlySummary
      try {
        monthlySummary = await summaryService.getMonthlySummary(targetYear, targetMonth)
      } catch (summaryError) {
        console.warn('Error fetching monthly summary, falling back to manual calculation:', summaryError)
        // Fallback: calcular manualmente si no hay resumen
        const [incomesResponse, expensesResponse] = await Promise.all([
          incomeService.getAll({ limit: 1000 }),
          expenseService.getAll({ limit: 1000 })
        ])

        const incomes = incomesResponse.data
        const expenses = expensesResponse.data

        // Filtrar por mes/año seleccionado - SOLO ingresos confirmados del mes especificado
        const filteredIncomes = incomes.filter((income: Income) => {
          if (!income.income_date) return false
          const date = new Date(income.income_date)
          const isSelectedMonth = date.getFullYear() === targetYear && date.getMonth() + 1 === targetMonth
          const isConfirmed = income.is_confirmed === true
          
          // Incluir solo: ingresos confirmados del mes seleccionado
          // Los salary_schedules no están en income_sources, solo los ingresos generados y confirmados
          return isSelectedMonth && isConfirmed
        })

        const filteredExpenses = expenses.filter((expense: Expense) => {
          const date = new Date(expense.expense_date)
          return date.getFullYear() === targetYear && date.getMonth() + 1 === targetMonth
        })

        monthlySummary = {
          total_income: filteredIncomes.reduce((sum: number, income: Income) => sum + income.amount, 0),
          total_expenses: filteredExpenses.reduce((sum: number, expense: Expense) => sum + expense.amount, 0),
          net_change: 0
        }
      }

      // Obtener balance de cuentas (excluyendo cuentas virtuales)
      const accountsResponse = await accountService.getAll({ limit: 100 })
      const accounts = accountsResponse.data
      const totalBalance = accounts
        .filter(account => !account.is_virtual_account)
        .reduce((sum: number, account) => sum + account.balance, 0)

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
  }, [selectedMonth, selectedYear])

  return (
    <DashboardContext.Provider value={{
      stats,
      setStats,
      refreshDashboard,
      isLoading,
      selectedMonth,
      selectedYear,
      setSelectedMonth,
      setSelectedYear,
    }}>
      {children}
    </DashboardContext.Provider>
  )
}