const { Income, Expense, Account, SavingsDeposit } = require('../models');
const { 
    getCurrentMonthGuatemala, 
    getCurrentYearGuatemala,
    parseGuatemalaDate,
    getTodayGuatemalaString
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

            // Obtener depósitos de ahorro (savings_deposits con source_account_id)
            const savingsDepositsResult = await SavingsDeposit.findByUserId(userId, { limit: 10000, offset: 0 });
            const allSavingsDeposits = Array.isArray(savingsDepositsResult) ? savingsDepositsResult : (savingsDepositsResult.data || []);

            // Filtrar transacciones por fecha
            const filteredIncomes = allIncomes.filter(income => {
                if (!income.is_confirmed) return false; // Solo ingresos confirmados
                
                // Asegurar que tenemos la fecha correcta
                if (!income.income_date) return false;
                
                // Usar la función correcta que respeta la zona horaria de Guatemala
                const incomeDate = parseGuatemalaDate(income.income_date);
                const incomeYear = incomeDate.getFullYear();
                const incomeMonth = incomeDate.getMonth() + 1;
                
                if (year && incomeYear !== parseInt(year)) return false;
                if (month && incomeMonth !== parseInt(month)) return false;
                if (account_id && income.account_id !== account_id) return false;
                
                return true;
            });

            const filteredExpenses = allExpenses.filter(expense => {
                const dateField = expense.expense_date || expense.date;
                if (!dateField) return false;
                
                // Usar la función correcta que respeta la zona horaria de Guatemala
                const expenseDate = parseGuatemalaDate(dateField);
                const expenseYear = expenseDate.getFullYear();
                const expenseMonth = expenseDate.getMonth() + 1;
                
                if (year && expenseYear !== parseInt(year)) return false;
                if (month && expenseMonth !== parseInt(month)) return false;
                if (account_id && expense.account_id !== account_id) return false;
                
                return true;
            });

            // Filtrar depósitos de ahorro por fecha
            const filteredSavingsDeposits = allSavingsDeposits.filter(deposit => {
                // Solo incluir depósitos que tienen cuenta de origen (transferencias reales)
                if (!deposit.source_account_id || !deposit.deposit_date) return false;
                
                // Usar la función correcta que respeta la zona horaria de Guatemala
                const depositDate = parseGuatemalaDate(deposit.deposit_date);
                const depositYear = depositDate.getFullYear();
                const depositMonth = depositDate.getMonth() + 1;
                
                if (year && depositYear !== parseInt(year)) return false;
                if (month && depositMonth !== parseInt(month)) return false;
                if (account_id && deposit.source_account_id !== account_id) return false;
                
                return true;
            });

            // Combinar y formatear transacciones
            const transactions = [];

            // 1. Agregar balance inicial de cada cuenta como primera transacción
            // SOLO si NO estamos filtrando por mes específico
            if (accounts.length > 0 && !month) {
                // Encontrar la transacción más antigua para determinar el balance inicial
                let earliestDate = null;
                
                [...filteredIncomes, ...filteredExpenses, ...filteredSavingsDeposits].forEach(item => {
                    const itemDate = item.income_date || item.expense_date || item.date || item.deposit_date;
                    if (itemDate) {
                        const date = new Date(itemDate);
                        if (!earliestDate || date < earliestDate) {
                            earliestDate = date;
                        }
                    }
                });

                // Si no hay transacciones, usar la fecha de creación de la cuenta más antigua
                if (!earliestDate && accounts.length > 0) {
                    accounts.forEach(account => {
                        if (account.created_at) {
                            const accountDate = new Date(account.created_at);
                            if (!earliestDate || accountDate < earliestDate) {
                                earliestDate = accountDate;
                            }
                        }
                    });
                }

                // Si aún no hay fecha, usar hoy
                if (!earliestDate) {
                    earliestDate = new Date();
                }

                // Agregar entrada de balance inicial para cada cuenta
                accounts.forEach(account => {
                    // Fecha del balance inicial: un día antes de la primera transacción
                    const initialDate = new Date(earliestDate);
                    initialDate.setDate(initialDate.getDate() - 1);
                    
                    transactions.push({
                        id: `initial-${account.id}`,
                        date: initialDate.toISOString().split('T')[0],
                        description: `Balance Inicial - ${account.name}`,
                        account: account.name,
                        account_id: account.id,
                        type: 'initial_balance',
                        income: 0,
                        expense: 0,
                        currency_code: account.currency?.code || 'USD',
                        currency_symbol: account.currency?.symbol || '$',
                        is_initial_balance: true
                    });
                });
            }

            // 2. Agregar ingresos
            filteredIncomes.forEach(income => {
                const account = realAccounts.find(acc => acc.id === income.account_id);
                transactions.push({
                    id: income.id,
                    date: income.income_date,
                    description: income.name || income.description || 'Ingreso',
                    account: account ? account.name : 'Sin cuenta',
                    account_id: income.account_id,
                    type: 'income',
                    income: parseFloat(income.amount),
                    expense: 0,
                    currency_code: income.currencies?.code || account?.currency?.code || 'USD',
                    currency_symbol: income.currencies?.symbol || account?.currency?.symbol || '$',
                });
            });

            // 3. Agregar gastos
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

            // 4. Agregar depósitos de ahorro como egresos
            filteredSavingsDeposits.forEach(deposit => {
                const sourceAccount = realAccounts.find(acc => acc.id === deposit.source_account_id);
                transactions.push({
                    id: `savings-${deposit.id}`,
                    date: deposit.deposit_date,
                    description: deposit.description || 'Depósito a Meta de Ahorro',
                    account: sourceAccount ? sourceAccount.name : 'Sin cuenta',
                    account_id: deposit.source_account_id,
                    type: 'savings_deposit',
                    income: 0,
                    expense: parseFloat(deposit.amount),
                    currency_code: sourceAccount?.currency?.code || 'USD',
                    currency_symbol: sourceAccount?.currency?.symbol || '$',
                });
            });

            // Ordenar por fecha (más antiguo primero para calcular balance correctamente)
            transactions.sort((a, b) => {
                const dateA = new Date(a.date);
                const dateB = new Date(b.date);
                return dateA - dateB;
            });

            // Calcular balances acumulados desde el inicio
            const transactionsWithBalance = [];
            
            // Calcular balance inicial correctamente
            let runningBalance = 0;
            
            // Si estamos viendo una cuenta específica
            if (account_id) {
                const specificAccount = realAccounts.find(acc => acc.id === account_id);
                if (specificAccount) {
                    // El balance inicial es el balance actual menos todas las transacciones futuras
                    const currentBalance = parseFloat(specificAccount.balance);
                    const allAccountTransactions = transactions.filter(t => t.account_id === account_id);
                    const totalIncome = allAccountTransactions.reduce((sum, t) => sum + t.income, 0);
                    const totalExpense = allAccountTransactions.reduce((sum, t) => sum + t.expense, 0);
                    runningBalance = currentBalance - totalIncome + totalExpense;
                }
            } else {
                // Si estamos viendo todas las cuentas, sumar los balances iniciales
                const currentTotalBalance = realAccounts.reduce((sum, acc) => sum + parseFloat(acc.balance), 0);
                const totalIncome = transactions.reduce((sum, t) => sum + t.income, 0);
                const totalExpense = transactions.reduce((sum, t) => sum + t.expense, 0);
                runningBalance = currentTotalBalance - totalIncome + totalExpense;
            }
            
            // Procesar cada transacción
            transactions.forEach((transaction, index) => {
                if (transaction.is_initial_balance) {
                    // Para balance inicial, usar el balance calculado
                    transaction.balance = runningBalance;
                } else {
                    // Para transacciones normales, aplicar el cambio
                    runningBalance = runningBalance + transaction.income - transaction.expense;
                    transaction.balance = runningBalance;
                }
                transactionsWithBalance.push(transaction);
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
