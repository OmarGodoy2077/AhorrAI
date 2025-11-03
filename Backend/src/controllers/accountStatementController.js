const { Income, Expense, Account } = require('../models');
const { 
    getCurrentMonthGuatemala, 
    getCurrentYearGuatemala 
} = require('../utils/dateUtils');

/**
 * Controlador para manejar estados de cuenta y historial de transacciones
 */
const AccountStatementController = {
    async getAccountStatement(req, res) {
        try {
            const userId = req.user?.userId;
            console.log(`[Account Statement] req.user:`, req.user);
            console.log(`[Account Statement] userId:`, userId);
            
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    error: 'Usuario no autenticado',
                });
            }

            const { 
                year, 
                month, 
                account_id 
            } = req.query;

            console.log(`[Account Statement] Getting statement for user ${userId}, year: ${year}, month: ${month}, account: ${account_id}`);
            const accountsResult = await Account.findByUserId(userId, { limit: 1000, offset: 0 });
            const allAccounts = accountsResult.data || accountsResult || [];
            const realAccounts = allAccounts.filter(account => !account.is_virtual_account);

            // Filtrar por cuenta específica si se proporciona
            let accounts = realAccounts;
            if (account_id) {
                accounts = realAccounts.filter(acc => acc.id === account_id);
            }

            // Obtener todos los ingresos confirmados
            const incomesResult = await Income.findByUserId(userId, { limit: 10000, offset: 0 });
            const allIncomes = incomesResult.data || [];
            
            // Obtener todos los gastos
            const expensesResult = await Expense.findByUserId(userId, { limit: 10000, offset: 0 });
            const allExpenses = Array.isArray(expensesResult) ? expensesResult : (expensesResult.data || []);

            // Filtrar transacciones por fecha
            const filteredIncomes = allIncomes.filter(income => {
                if (!income.is_confirmed) return false; // Solo ingresos confirmados
                
                const [incomeYear, incomeMonth] = income.income_date.split('-').map(Number);
                
                if (year && incomeYear !== parseInt(year)) return false;
                if (month && incomeMonth !== parseInt(month)) return false;
                if (account_id && income.account_id !== account_id) return false;
                
                return true;
            });

            const filteredExpenses = allExpenses.filter(expense => {
                const dateField = expense.expense_date || expense.date;
                const [expenseYear, expenseMonth] = dateField.split('-').map(Number);
                
                if (year && expenseYear !== parseInt(year)) return false;
                if (month && expenseMonth !== parseInt(month)) return false;
                if (account_id && expense.account_id !== account_id) return false;
                
                return true;
            });

            // Combinar y formatear transacciones
            const transactions = [];

            // Agregar ingresos
            filteredIncomes.forEach(income => {
                const account = realAccounts.find(acc => acc.id === income.account_id);
                transactions.push({
                    id: income.id,
                    date: income.income_date,
                    description: income.name,
                    account: account ? account.name : 'Sin cuenta',
                    account_id: income.account_id,
                    type: 'income',
                    income: parseFloat(income.amount),
                    expense: 0,
                    currency_code: income.currencies?.code || account?.currency?.code || 'USD',
                    currency_symbol: income.currencies?.symbol || account?.currency?.symbol || '$',
                });
            });

            // Agregar gastos
            filteredExpenses.forEach(expense => {
                const account = realAccounts.find(acc => acc.id === expense.account_id);
                const dateField = expense.expense_date || expense.date;
                transactions.push({
                    id: expense.id,
                    date: dateField,
                    description: expense.description || 'Gasto sin descripción',
                    account: account ? account.name : 'Sin cuenta',
                    account_id: expense.account_id,
                    type: 'expense',
                    income: 0,
                    expense: parseFloat(expense.amount),
                    currency_code: expense.currencies?.code || account?.currency?.code || 'USD',
                    currency_symbol: expense.currencies?.symbol || account?.currency?.symbol || '$',
                });
            });

            // Ordenar por fecha (más reciente primero)
            transactions.sort((a, b) => {
                const dateA = new Date(a.date);
                const dateB = new Date(b.date);
                return dateB - dateA;
            });

            // Calcular balances acumulados
            let runningBalance = 0;
            
            // Si hay una cuenta específica, usar su balance actual como punto de partida
            if (account_id) {
                const specificAccount = realAccounts.find(acc => acc.id === account_id);
                if (specificAccount) {
                    runningBalance = parseFloat(specificAccount.balance);
                }
            } else {
                // Si no hay cuenta específica, sumar todos los balances
                runningBalance = realAccounts.reduce((sum, acc) => sum + parseFloat(acc.balance), 0);
            }

            // Calcular balance hacia atrás (del presente al pasado)
            const transactionsWithBalance = transactions.map((transaction, index) => {
                if (index === 0) {
                    transaction.balance = runningBalance;
                } else {
                    // Restar el efecto de la transacción actual
                    runningBalance = runningBalance - transaction.income + transaction.expense;
                    transaction.balance = runningBalance;
                }
                return transaction;
            });

            // Invertir para mostrar del más antiguo al más reciente y recalcular balances correctamente
            transactionsWithBalance.reverse();
            
            // Recalcular balance desde el inicio
            let initialBalance = transactionsWithBalance.length > 0 ? transactionsWithBalance[0].balance : 0;
            initialBalance = initialBalance - transactionsWithBalance[0].income + transactionsWithBalance[0].expense;
            
            transactionsWithBalance.forEach((transaction, index) => {
                if (index === 0) {
                    transaction.balance = initialBalance + transaction.income - transaction.expense;
                } else {
                    const previousBalance = transactionsWithBalance[index - 1].balance;
                    transaction.balance = previousBalance + transaction.income - transaction.expense;
                }
            });

            // Calcular totales
            const totalIncome = transactions.reduce((sum, t) => sum + t.income, 0);
            const totalExpense = transactions.reduce((sum, t) => sum + t.expense, 0);
            const netChange = totalIncome - totalExpense;

            // Obtener balance final
            const finalBalance = account_id
                ? realAccounts.find(acc => acc.id === account_id)?.balance || 0
                : realAccounts.reduce((sum, acc) => sum + parseFloat(acc.balance), 0);

            res.json({
                success: true,
                filters: {
                    year: year ? parseInt(year) : null,
                    month: month ? parseInt(month) : null,
                    account_id: account_id || null,
                    account_name: account_id 
                        ? realAccounts.find(acc => acc.id === account_id)?.name 
                        : 'Todas las cuentas'
                },
                summary: {
                    total_income: totalIncome,
                    total_expense: totalExpense,
                    net_change: netChange,
                    final_balance: parseFloat(finalBalance),
                    transactions_count: transactions.length
                },
                transactions: transactionsWithBalance,
                accounts: realAccounts.map(acc => ({
                    id: acc.id,
                    name: acc.name,
                    balance: acc.balance,
                    currency_code: acc.currency?.code,
                    currency_symbol: acc.currency?.symbol
                }))
            });

        } catch (error) {
            console.error('Error generating account statement:', error);
            res.status(500).json({ 
                success: false,
                error: 'Error al generar estado de cuenta',
                details: error.message 
            });
        }
    }
};

module.exports = AccountStatementController;
