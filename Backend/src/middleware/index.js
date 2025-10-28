module.exports = {
    authenticate: require('./auth').authenticate,
    validateRegister: require('./validation').validateRegister,
    validateLogin: require('./validation').validateLogin,
    validateProfile: require('./validation').validateProfile,
    validateIncome: require('./validation').validateIncome,
    validateExpense: require('./validation').validateExpense,
    validateSavingsGoal: require('./validation').validateSavingsGoal,
    validateAccount: require('./validation').validateAccount,
    validateCategory: require('./validation').validateCategory,
    validateFinancialSetting: require('./validation').validateFinancialSetting,
    validateLoan: require('./validation').validateLoan,
    validateSpendingLimit: require('./validation').validateSpendingLimit,
    logger: require('./logging'),
    errorHandler: require('./error')
};