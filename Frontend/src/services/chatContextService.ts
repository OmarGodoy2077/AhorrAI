import api from './api';

export interface CurrentMonthData {
  month: number;
  year: number;
  income: number;
  expenses: number;
  necessary_expenses: number;
  unnecessary_expenses: number;
  net_savings: number;
  savings_rate: string;
}

export interface SavingsGoalData {
  target: number;
  current: number;
  progress: string;
  is_achieving?: boolean;
}

export interface CustomGoalData {
  name: string;
  target: number;
  current: number;
  progress: string;
}

export interface HistoricalAverage {
  monthly_income: number;
  monthly_expenses: number;
  monthly_savings: number;
  months_analyzed: number;
}

export interface FinancialHealth {
  expense_to_income_ratio: string;
  unnecessary_expense_percentage: string;
  emergency_fund_months: string;
}

export interface FinancialContext {
  current_month: CurrentMonthData;
  total_balance: number;
  savings_goals: {
    monthly: SavingsGoalData;
    global: SavingsGoalData;
    custom_goals: CustomGoalData[];
  };
  historical_average: HistoricalAverage;
  financial_health: FinancialHealth;
}

export interface ChatContextResponse {
  success: boolean;
  user_id: number;
  generated_at: string;
  context: FinancialContext;
  text_summary: string;
}

const chatContextService = {
  /**
   * Obtiene el contexto financiero del usuario actual
   * Este contexto se usa para enriquecer las respuestas del chat de n8n
   */
  async getFinancialContext(): Promise<ChatContextResponse> {
    const response = await api.get<ChatContextResponse>('/chat-context/financial-context');
    return response.data;
  },

  /**
   * Obtiene solo el resumen en texto del contexto financiero
   */
  async getTextSummary(): Promise<string> {
    const response = await this.getFinancialContext();
    return response.text_summary;
  },

  /**
   * Obtiene solo los datos estructurados del contexto
   */
  async getContextData(): Promise<FinancialContext> {
    const response = await this.getFinancialContext();
    return response.context;
  }
};

export default chatContextService;
