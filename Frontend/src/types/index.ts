// ========================================
// User & Auth Types
// ========================================

export interface User {
  id: string
  email: string
  full_name: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

export interface AuthResponse {
  user: User
  token: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
  fullName: string
}

// ========================================
// Financial Settings
// ========================================

export interface FinancialSetting {
  id: string
  user_id: string
  default_currency_id?: string
  effective_date: string
  is_current: boolean
  created_at: string
  updated_at: string
}

// ========================================
// Income Types
// ========================================

export type IncomeType = 'fixed' | 'variable' | 'extra'
export type IncomeFrequency = 'weekly' | 'monthly' | 'one-time'

export interface Income {
  id: string
  user_id: string
  account_id?: string
  name: string
  type: IncomeType
  amount: number
  currency_id: string
  currencies?: {
    code: string
    name: string
    symbol: string
  }
  frequency: IncomeFrequency
  is_confirmed: boolean
  income_date: string
  description?: string
  is_salary?: boolean // true si es un ingreso de salario fijo, false si es extra
  created_at: string
  updated_at: string
}

// ========================================
// Salary Schedule Types
// ========================================

export type SalaryFrequency = 'monthly' | 'weekly'

export interface SalarySchedule {
  id: string
  user_id: string
  name: string
  type: 'fixed' | 'average'
  amount: number
  frequency?: SalaryFrequency
  start_date?: string
  salary_day?: number // Day of month (1-31) for monthly, day of week for weekly
  currency_id?: string
  currencies?: {
    code: string
    name: string
    symbol: string
  }
  account_id?: string
  accounts?: {
    id: string
    name: string
    type: string
  }
  last_generated_date?: string
  next_generation_date?: string
  is_active: boolean
  description?: string
  created_at: string
  updated_at: string
}

// ========================================
// Expense Types
// ========================================

export interface Expense {
  id: string
  user_id: string
  account_id?: string
  category_id?: string
  amount: number
  currency_id: string
  currencies?: {
    code: string
    name: string
    symbol: string
  }
  expense_date: string
  description?: string
  type?: 'fixed' | 'variable'
  created_at: string
  updated_at: string
  category?: Category
}

// ========================================
// Category Types
// ========================================

export type CategoryType = 'necessary' | 'unnecessary'

export interface Category {
  id: string
  user_id: string
  name: string
  type: CategoryType
  parent_category_id?: string
  description?: string
  created_at: string
  updated_at: string
}

// ========================================
// Currency Types
// ========================================

export interface Currency {
  id: string
  code: string
  name: string
  symbol: string
  created_at: string
}

// ========================================
// Account Types
// ========================================

export type AccountType = 'cash' | 'bank' | 'platform'

export interface Account {
  id: string
  user_id: string
  name: string
  type: AccountType
  balance: number
  currency_id: string
  currency?: {
    code: string
    name: string
    symbol: string
  }
  description?: string
  is_virtual_account?: boolean
  created_at: string
  updated_at: string
}

export interface Currency {
  id: string
  code: string
  name: string
  symbol: string
  created_at: string
}

// ========================================
// Savings Goal Types
// ========================================

export type GoalType = 'monthly' | 'global' | 'custom'
export type GoalStatus = 'active' | 'completed' | 'paused'

export interface SavingsGoal {
  id: string
  user_id: string
  name: string
  target_amount: number
  current_amount: number
  currency: string
  goal_type: GoalType
  status: GoalStatus
  is_monthly_target: boolean
  is_custom_excluded_from_global: boolean
  virtual_account_id?: string  // For custom goals: reference to phantom account
  target_date?: string
  description?: string
  created_at: string
  updated_at: string
}

// ========================================
// Savings Deposit Types
// ========================================

export interface SavingsDeposit {
  id: string
  user_id: string
  goal_id?: string
  virtual_account_id?: string
  source_account_id?: string
  amount: number
  deposit_date: string
  description?: string
  created_at: string
  updated_at: string
  goal?: SavingsGoal
}

export interface MonthlyStatus {
  year: number
  month: number
  target_amount: number
  actual_amount: number
  difference: number
  achieved: boolean
  percentage: number
}

// ========================================
// Loan Types
// ========================================

export type LoanStatus = 'active' | 'paid' | 'overdue'

export interface Loan {
  id: string
  user_id: string
  name: string
  total_amount: number
  remaining_balance: number
  interest_rate?: number
  currency: string
  start_date: string
  due_date?: string
  status: LoanStatus
  description?: string
  created_at: string
  updated_at: string
}

// ========================================
// Spending Limit Types
// ========================================

export interface SpendingLimit {
  id: string
  user_id: string
  year: number
  month: number
  limit_amount: number
  currency: string
  current_spending: number
  created_at: string
  updated_at: string
}

export interface SpendingStatus {
  limit: SpendingLimit
  percentage: number
  remaining: number
  exceeded: boolean
}

// ========================================
// Summary Types
// ========================================

export interface MonthlySummary {
  id: string
  user_id: string
  year: number
  month: number
  total_income: number
  total_expenses: number
  net_change: number
  created_at: string
}

export interface YearlySummary {
  id: string
  user_id: string
  year: number
  total_income: number
  total_expenses: number
  savings: number
  balance: number
  currency: string
  created_at: string
  updated_at: string
}

// ========================================
// Currency Type
// ========================================

export interface Currency {
  id: string
  code: string
  name: string
  symbol: string
}

// ========================================
// API Response Types
// ========================================

export interface ApiResponse<T> {
  data?: T
  error?: string
  details?: Array<{
    field: string
    message: string
  }>
}

export interface PaginatedResponse<T> {
  data: T[]
  page: number
  limit: number
  total?: number
}

// ========================================
// Form Types
// ========================================

export interface IncomeFormData {
  name: string
  type: IncomeType
  amount: number
  currency: string
  frequency?: IncomeFrequency  // Opcional para tipo 'variable'
  income_date?: string        // Opcional para tipo 'variable'
  account_id?: string
  description?: string
}

export interface ExpenseFormData {
  amount: number
  currency: string
  expense_date: string
  account_id?: string
  category_id?: string
  description?: string
}

export interface AccountFormData {
  name: string
  type: AccountType
  balance: number
  currency_id: string
  description?: string
}

export interface SavingsGoalFormData {
  name: string
  target_amount: number
  currency: string
  goal_type: GoalType
  target_date?: string
  description?: string
}

export interface SavingsDepositFormData {
  goal_id: string
  amount: number
  deposit_date: string
  description?: string
}

export interface FinancialSettingFormData {
  salary: number
  monthly_savings_target?: number
  default_currency_id?: string
  effective_date: string
}
