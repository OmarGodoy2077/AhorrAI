const { body, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }
    next();
};

// Validation rules for user registration
const validateRegister = [
    body('email').isEmail().withMessage('Invalid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('fullName').optional().isString().withMessage('Full name must be a string'),
    handleValidationErrors
];

const validateLogin = [
    body('email').isEmail().withMessage('Invalid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    handleValidationErrors
];

const validateProfile = [
    body('salary').optional().isFloat({ gte: 0 }).withMessage('Salary must be a non-negative number'),
    body('savingsGoal').optional().isFloat({ gte: 0 }).withMessage('Savings goal must be a non-negative number'),
    body('full_name').optional().isString().isLength({ max: 255 }).withMessage('Full name must be a string ≤255 chars'),
    body('avatar_url').optional().isURL().withMessage('Avatar URL must be a valid URL'),
    handleValidationErrors
];

const validateIncome = [
    body('name').isString().isLength({ min: 1, max: 100 }).withMessage('Name must be 1-100 characters'),
    body('type').isIn(['fixed', 'variable', 'extra']).withMessage('Invalid type'),
    body('amount').isFloat({ gt: 0 }).withMessage('Amount must be greater than 0'),
    body('frequency').isIn(['monthly', 'weekly', 'one-time']).withMessage('Invalid frequency'),
    body('currency_id').optional({ nullable: true, checkFalsy: true }).isUUID().withMessage('Invalid currency ID'),
    body('account_id').optional({ nullable: true, checkFalsy: true }).isUUID().withMessage('Invalid account ID'),
    handleValidationErrors
];

const validateExpense = [
    body('description').optional().isString().isLength({ max: 200 }).withMessage('Description must be ≤200 characters'),
    body('amount').isFloat({ gt: 0 }).withMessage('Amount must be greater than 0'),
    body('expense_date').isISO8601().withMessage('Invalid date'),
    body('type').isIn(['fixed', 'variable']).withMessage('Invalid type'),
    body('account_id').optional({ nullable: true, checkFalsy: true }).isUUID().withMessage('Invalid account ID'),
    body('category_id').optional({ nullable: true, checkFalsy: true }).isUUID().withMessage('Invalid category ID'),
    body('currency_id').optional({ nullable: true, checkFalsy: true }).isUUID().withMessage('Invalid currency ID'),
    handleValidationErrors
];

const validateSavingsGoal = [
    body('name').isString().isLength({ min: 1, max: 100 }).withMessage('Name must be 1-100 characters'),
    body('target_amount').isFloat({ gt: 0 }).withMessage('Target amount must be greater than 0'),
    body('current_amount').optional().isFloat({ gte: 0 }).withMessage('Current amount must be non-negative'),
    body('start_date').optional().isISO8601().withMessage('Invalid start date'),
    body('end_date').optional().isISO8601().withMessage('Invalid end date'),
    body('status').optional().isIn(['active', 'completed', 'paused']).withMessage('Invalid status'),
    body('is_primary').optional().isBoolean().withMessage('Is primary must be boolean'),
    handleValidationErrors
];

const validateAccount = [
    body('name').isString().isLength({ min: 1, max: 100 }).withMessage('Name must be 1-100 characters'),
    body('type').isIn(['cash', 'bank', 'platform']).withMessage('Invalid type'),
    body('balance').optional().isFloat({ gte: 0 }).withMessage('Balance must be non-negative'),
    body('currency_id').optional({ nullable: true, checkFalsy: true }).isUUID().withMessage('Invalid currency ID'),
    handleValidationErrors
];

const validateCategory = [
    body('name').isString().isLength({ min: 1, max: 100 }).withMessage('Name must be 1-100 characters'),
    body('type').isIn(['necessary', 'unnecessary']).withMessage('Invalid type'),
    body('parent_category_id').optional().isUUID().withMessage('Invalid parent category ID'),
    body('custom_label').optional().isString().isLength({ max: 50 }).withMessage('Custom label must be ≤50 characters'),
    body('color').optional().isString().isLength({ max: 7 }).withMessage('Color must be a valid hex code'),
    handleValidationErrors
];

const validateFinancialSetting = [
    body('salary').isFloat({ gt: 0 }).withMessage('Salary must be greater than 0'),
    body('start_date').optional().isISO8601().withMessage('Invalid start date'),
    body('end_date').optional().isISO8601().withMessage('Invalid end date'),
    handleValidationErrors
];

const validateLoan = [
    body('name').isString().isLength({ min: 1, max: 100 }).withMessage('Name must be 1-100 characters'),
    body('amount').isFloat({ gt: 0 }).withMessage('Amount must be greater than 0'),
    body('interest_rate').isFloat({ gte: 0 }).withMessage('Interest rate must be non-negative'),
    body('start_date').optional().isISO8601().withMessage('Invalid start date'),
    body('due_date').optional().isISO8601().withMessage('Invalid due date'),
    body('status').optional().isIn(['active', 'paid', 'defaulted']).withMessage('Invalid status'),
    body('remaining_balance').optional().isFloat({ gte: 0 }).withMessage('Remaining balance must be non-negative'),
    handleValidationErrors
];

const validateSpendingLimit = [
    body('monthly_limit').isFloat({ gt: 0 }).withMessage('Monthly limit must be greater than 0'),
    body('year').isInt({ gte: 2000, lte: 2100 }).withMessage('Year must be between 2000 and 2100'),
    body('month').isInt({ min: 1, max: 12 }).withMessage('Month must be between 1 and 12'),
    handleValidationErrors
];

module.exports = {
    validateRegister,
    validateLogin,
    validateProfile,
    validateIncome,
    validateExpense,
    validateSavingsGoal,
    validateAccount,
    validateCategory,
    validateFinancialSetting,
    validateLoan,
    validateSpendingLimit
};