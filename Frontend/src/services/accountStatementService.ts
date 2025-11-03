import api from './api'

export interface AccountStatementFilters {
  year?: number
  month?: number
  account_id?: string
}

export interface AccountStatementTransaction {
  id: string
  date: string
  description: string
  account: string
  account_id: string | null
  type: 'income' | 'expense'
  income: number
  expense: number
  balance: number
  currency_code: string
  currency_symbol: string
}

export interface AccountStatementSummary {
  total_income: number
  total_expense: number
  net_change: number
  final_balance: number
  transactions_count: number
}

export interface AccountStatementAccount {
  id: string
  name: string
  balance: number
  currency_code: string
  currency_symbol: string
}

export interface AccountStatementResponse {
  success: boolean
  filters: {
    year: number | null
    month: number | null
    account_id: string | null
    account_name: string
  }
  summary: AccountStatementSummary
  transactions: AccountStatementTransaction[]
  accounts: AccountStatementAccount[]
}

export const accountStatementService = {
  async getStatement(filters: AccountStatementFilters = {}): Promise<AccountStatementResponse> {
    const params = new URLSearchParams()
    
    if (filters.year) params.append('year', filters.year.toString())
    if (filters.month) params.append('month', filters.month.toString())
    if (filters.account_id) params.append('account_id', filters.account_id)
    
    const response = await api.get<AccountStatementResponse>(
      `/account-statements?${params.toString()}`
    )
    return response.data
  },
}
