const { Income, Expense, Account, SavingsGoal, MonthlySummary } = require('../models');

/**
 * Función para generar contexto financiero completo
 * Maneja correctamente la estructura de datos que retornan los modelos
 */
async function generateFinancialContext(userId) {
    try {
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth() + 1;
        const currentYear = currentDate.getFullYear();

        // 1. Obtener ingresos del mes actual (confirmados)
        const incomesResult = await Income.findByUserId(userId);
        const incomes = incomesResult.data || [];
        const currentMonthIncomes = incomes.filter(income => {
            const incomeDate = new Date(income.income_date);
            return (
                incomeDate.getMonth() + 1 === currentMonth &&
                incomeDate.getFullYear() === currentYear &&
                income.is_confirmed === true
            );
        });
        const totalMonthlyIncome = currentMonthIncomes.reduce(
            (sum, income) => sum + parseFloat(income.amount || 0),
            0
        );

        // 2. Obtener gastos del mes actual
        const expenses = await Expense.findByUserId(userId);
        const expensesArray = Array.isArray(expenses) ? expenses : (expenses.data || []);
        const currentMonthExpenses = expensesArray.filter(expense => {
            const expenseDate = new Date(expense.expense_date || expense.date);
            return (
                expenseDate.getMonth() + 1 === currentMonth &&
                expenseDate.getFullYear() === currentYear
            );
        });
        const totalMonthlyExpenses = currentMonthExpenses.reduce(
            (sum, expense) => sum + parseFloat(expense.amount || 0),
            0
        );

        // Separar gastos necesarios vs innecesarios
        const necessaryExpenses = currentMonthExpenses.filter(
            expense => {
                // Obtener el tipo de categoría desde el objeto anidado si existe
                const categoryType = expense.categories?.type || expense.category_type;
                return categoryType === 'necessary';
            }
        );
        const unnecessaryExpenses = currentMonthExpenses.filter(
            expense => {
                const categoryType = expense.categories?.type || expense.category_type;
                return categoryType === 'unnecessary';
            }
        );
        
        const totalNecessaryExpenses = necessaryExpenses.reduce(
            (sum, expense) => sum + parseFloat(expense.amount || 0),
            0
        );
        const totalUnnecessaryExpenses = unnecessaryExpenses.reduce(
            (sum, expense) => sum + parseFloat(expense.amount || 0),
            0
        );

        // 3. Obtener balance total de cuentas (excluyendo cuentas virtuales)
        const accountsResult = await Account.findByUserId(userId);
        const accounts = accountsResult.data || accountsResult || [];
        const realAccounts = accounts.filter(account => !account.is_virtual_account);
        const totalBalance = realAccounts.reduce(
            (sum, account) => sum + parseFloat(account.current_balance || 0),
            0
        );

        // 4. Obtener información de metas de ahorro
        const savingsGoalsResult = await SavingsGoal.findByUserId(userId);
        const savingsGoals = savingsGoalsResult.data || savingsGoalsResult || [];
        
        // Meta mensual
        const monthlyGoal = savingsGoals.find(goal => goal.goal_type === 'monthly');
        const monthlySavingsTarget = monthlyGoal ? parseFloat(monthlyGoal.target_amount || 0) : 0;
        const monthlySavingsActual = totalMonthlyIncome - totalMonthlyExpenses;
        const monthlySavingsProgress = monthlySavingsTarget > 0 
            ? (monthlySavingsActual / monthlySavingsTarget * 100).toFixed(1)
            : 0;

        // Meta global
        const globalGoal = savingsGoals.find(goal => goal.goal_type === 'global');
        const globalSavingsTarget = globalGoal ? parseFloat(globalGoal.target_amount || 0) : 0;
        const globalSavingsActual = globalGoal ? parseFloat(globalGoal.current_amount || 0) : 0;
        const globalSavingsProgress = globalSavingsTarget > 0
            ? (globalSavingsActual / globalSavingsTarget * 100).toFixed(1)
            : 0;

        // Metas personalizadas
        const customGoals = savingsGoals.filter(goal => goal.goal_type === 'custom');
        const customGoalsData = customGoals.map(goal => ({
            name: goal.goal_name,
            target: parseFloat(goal.target_amount || 0),
            current: parseFloat(goal.current_amount || 0),
            progress: goal.target_amount > 0
                ? ((parseFloat(goal.current_amount || 0) / parseFloat(goal.target_amount)) * 100).toFixed(1)
                : 0
        }));

        // 5. Obtener resumen histórico (últimos 3 meses para tendencias)
        const summaries = [];
        for (let i = 0; i < 3; i++) {
            const targetMonth = currentMonth - i;
            const targetYear = targetMonth <= 0 ? currentYear - 1 : currentYear;
            const adjustedMonth = targetMonth <= 0 ? 12 + targetMonth : targetMonth;
            
            try {
                const summaryResult = await MonthlySummary.findByUserIdYearMonth(
                    userId,
                    targetYear,
                    adjustedMonth
                );
                const summary = summaryResult.data || summaryResult;
                if (summary) {
                    summaries.push({
                        month: adjustedMonth,
                        year: targetYear,
                        income: parseFloat(summary.total_income || 0),
                        expenses: parseFloat(summary.total_expenses || 0),
                        savings: parseFloat(summary.net_change || 0)
                    });
                }
            } catch (err) {
                console.warn(`No summary found for ${targetYear}-${adjustedMonth}`);
            }
        }

        // 6. Calcular promedios históricos
        const avgMonthlyIncome = summaries.length > 0
            ? summaries.reduce((sum, s) => sum + s.income, 0) / summaries.length
            : totalMonthlyIncome;
        const avgMonthlyExpenses = summaries.length > 0
            ? summaries.reduce((sum, s) => sum + s.expenses, 0) / summaries.length
            : totalMonthlyExpenses;

        // 7. Construir respuesta con contexto completo
        const context = {
            // Información del mes actual
            current_month: {
                month: currentMonth,
                year: currentYear,
                income: totalMonthlyIncome,
                expenses: totalMonthlyExpenses,
                necessary_expenses: totalNecessaryExpenses,
                unnecessary_expenses: totalUnnecessaryExpenses,
                net_savings: monthlySavingsActual,
                savings_rate: totalMonthlyIncome > 0 
                    ? ((monthlySavingsActual / totalMonthlyIncome) * 100).toFixed(1)
                    : 0
            },
            
            // Balance total disponible
            total_balance: totalBalance,
            
            // Metas de ahorro
            savings_goals: {
                monthly: {
                    target: monthlySavingsTarget,
                    current: monthlySavingsActual,
                    progress: monthlySavingsProgress,
                    is_achieving: monthlySavingsActual >= monthlySavingsTarget
                },
                global: {
                    target: globalSavingsTarget,
                    current: globalSavingsActual,
                    progress: globalSavingsProgress
                },
                custom_goals: customGoalsData
            },
            
            // Promedios históricos
            historical_average: {
                monthly_income: avgMonthlyIncome,
                monthly_expenses: avgMonthlyExpenses,
                monthly_savings: avgMonthlyIncome - avgMonthlyExpenses,
                months_analyzed: summaries.length
            },
            
            // Análisis financiero
            financial_health: {
                expense_to_income_ratio: totalMonthlyIncome > 0
                    ? ((totalMonthlyExpenses / totalMonthlyIncome) * 100).toFixed(1)
                    : 0,
                unnecessary_expense_percentage: totalMonthlyExpenses > 0
                    ? ((totalUnnecessaryExpenses / totalMonthlyExpenses) * 100).toFixed(1)
                    : 0,
                emergency_fund_months: avgMonthlyExpenses > 0
                    ? (totalBalance / avgMonthlyExpenses).toFixed(1)
                    : 0
            }
        };

        // 8. Generar resumen en texto natural para el chat
        const textSummary = `
CONTEXTO FINANCIERO DEL USUARIO:

SITUACION ACTUAL (${currentMonth}/${currentYear}):
- Ingresos del mes: $${totalMonthlyIncome.toFixed(2)}
- Gastos del mes: $${totalMonthlyExpenses.toFixed(2)}
  * Necesarios: $${totalNecessaryExpenses.toFixed(2)}
  * Innecesarios: $${totalUnnecessaryExpenses.toFixed(2)}
- Ahorro neto del mes: $${monthlySavingsActual.toFixed(2)}
- Balance total disponible: $${totalBalance.toFixed(2)}

CAPACIDAD DE AHORRO:
- Tasa de ahorro mensual: ${context.current_month.savings_rate}%
- Meta de ahorro mensual: $${monthlySavingsTarget.toFixed(2)} (${monthlySavingsProgress}% completado)
- Fondo de emergencia: ${context.financial_health.emergency_fund_months} meses de gastos

HISTORIAL (ultimos ${summaries.length} meses):
- Ingreso promedio: $${avgMonthlyIncome.toFixed(2)}
- Gasto promedio: $${avgMonthlyExpenses.toFixed(2)}
- Ahorro promedio: $${(avgMonthlyIncome - avgMonthlyExpenses).toFixed(2)}

METAS DE AHORRO:
${monthlyGoal ? `- Meta Mensual: ${monthlySavingsProgress}% (${monthlySavingsActual >= monthlySavingsTarget ? 'Lograda' : 'En progreso'})` : '- Meta Mensual: No configurada'}
${globalGoal ? `- Meta Global: ${globalSavingsProgress}% de $${globalSavingsTarget.toFixed(2)}` : ''}
${customGoalsData.length > 0 ? customGoalsData.map(g => `- ${g.name}: ${g.progress}% de $${g.target.toFixed(2)}`).join('\n') : ''}

SALUD FINANCIERA:
- Ratio gastos/ingresos: ${context.financial_health.expense_to_income_ratio}%
- Gastos innecesarios: ${context.financial_health.unnecessary_expense_percentage}% del total
        `.trim();

        return {
            success: true,
            context: context,
            text_summary: textSummary
        };

    } catch (error) {
        console.error('Error in generateFinancialContext:', error);
        throw error;
    }
}

// Controlador exportado
const ChatContextController = {
    /**
     * GET /api/chat-context/user-summary?userId=1
     * Obtiene contexto financiero usando userId como query parameter
     * Sin autenticacion JWT para desarrollo/pruebas
     */
    async getUserFinancialSummary(req, res) {
        try {
            const userId = req.query.userId || req.query.user_id;
            
            if (!userId) {
                return res.status(400).json({
                    success: false,
                    error: 'userId es requerido como query parameter',
                    example: '/api/chat-context/user-summary?userId=1'
                });
            }

            console.log(`Chat Context: Getting financial summary for user ${userId}`);

            // Generar contexto financiero
            const result = await generateFinancialContext(userId);

            res.json({
                success: true,
                user_id: userId,
                generated_at: new Date().toISOString(),
                context: result.context,
                text_summary: result.text_summary
            });

        } catch (error) {
            console.error('Error generating chat context:', error);
            res.status(500).json({ 
                success: false,
                error: 'Error al generar contexto financiero',
                details: error.message 
            });
        }
    }
};

module.exports = ChatContextController;
