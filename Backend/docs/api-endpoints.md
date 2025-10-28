# AhorraAI Backend - API Endpoints Reference

## Authentication
- `POST /api/auth/register` - Register new user (email, password, fullName only - salary/savings data removed v2.1+)
- `POST /api/auth/login` - Login user

## Profile
- `GET /api/profile` - Get user profile
- `PUT /api/profile` - Update user profile
- `DELETE /api/profile` - Delete user profile

## Financial Settings
- `POST /api/financial-settings` - Create financial setting
- `GET /api/financial-settings` - Get all financial settings (paginated)
- `GET /api/financial-settings/current` - Get current active setting
- `GET /api/financial-settings/:id` - Get specific financial setting
- `PUT /api/financial-settings/:id` - Update financial setting
- `DELETE /api/financial-settings/:id` - Delete financial setting

## Income
- `POST /api/incomes` - Create income
- `GET /api/incomes` - Get all incomes (paginated: page, limit, sortBy, sortOrder)
- `GET /api/incomes/:id` - Get specific income
- `PUT /api/incomes/:id` - Update income
- `DELETE /api/incomes/:id` - Delete income
- `POST /api/incomes/:id/confirm` - Confirm income receipt

## Expenses
- `POST /api/expenses` - Create expense
- `GET /api/expenses` - Get all expenses (paginated: page, limit, sortBy, sortOrder)
- `GET /api/expenses/:id` - Get specific expense
- `PUT /api/expenses/:id` - Update expense
- `DELETE /api/expenses/:id` - Delete expense

## Accounts
- `POST /api/accounts` - Create account
- `GET /api/accounts` - Get all accounts (paginated: page, limit, sortBy, sortOrder)
- `GET /api/accounts/:id` - Get specific account
- `PUT /api/accounts/:id` - Update account
- `DELETE /api/accounts/:id` - Delete account

## Categories
- `POST /api/categories` - Create category
- `GET /api/categories` - Get all categories (paginated: page, limit, sortBy, sortOrder)
- `GET /api/categories/:id` - Get specific category
- `PUT /api/categories/:id` - Update category
- `DELETE /api/categories/:id` - Delete category

## Loans
- `POST /api/loans` - Create loan
- `GET /api/loans` - Get all loans (paginated: page, limit, sortBy, sortOrder)
- `GET /api/loans/:id` - Get specific loan
- `PUT /api/loans/:id` - Update loan
- `DELETE /api/loans/:id` - Delete loan

## Savings Goals
- `POST /api/savings-goals` - Create savings goal (supports goal_type: 'monthly', 'global', 'custom')
- `GET /api/savings-goals` - Get all savings goals (paginated: page, limit, sortBy, sortOrder)
- `GET /api/savings-goals/:id` - Get specific savings goal
- `PUT /api/savings-goals/:id` - Update savings goal
- `DELETE /api/savings-goals/:id` - Delete savings goal
- `POST /api/savings-goals/:id/set-monthly-target` - Set goal as monthly savings target
- `POST /api/savings-goals/:id/exclude-from-global` - Mark goal as custom (excluded from global) ⭐ NEW
- `POST /api/savings-goals/:id/include-in-global` - Mark goal to contribute to global accumulation ⭐ NEW
- `GET /api/savings-goals/goals/custom` - Get all custom goals (excluded from global) ⭐ NEW
- `GET /api/savings-goals/goals/global-contributors` - Get all goals that contribute to global ⭐ NEW
- `POST /api/savings-goals/:id/deposit` - **DEPRECATED** - Use /api/savings-deposits instead

## Savings Deposits ⭐ NEW
- `POST /api/savings-deposits` - Create a manual deposit to a goal
- `GET /api/savings-deposits` - Get all user's deposits (paginated)
- `GET /api/savings-deposits/:id` - Get specific deposit
- `GET /api/savings-deposits/goal/:goalId` - Get deposits for a specific goal
- `PUT /api/savings-deposits/:id` - Update a deposit
- `DELETE /api/savings-deposits/:id` - Delete a deposit
- `GET /api/savings-deposits/monthly-status/:year/:month` - Get monthly savings status (compare target vs actual) ⭐ NEW

## Spending Limits
- `POST /api/spending-limits` - Create spending limit
- `GET /api/spending-limits` - Get all spending limits (paginated: page, limit, sortBy, sortOrder)
- `GET /api/spending-limits/:id` - Get specific spending limit
- `GET /api/spending-limits/:year/:month` - Get limit for specific month
- `GET /api/spending-limits/:year/:month/status` - Check spending status for month
- `PUT /api/spending-limits/:id` - Update spending limit
- `DELETE /api/spending-limits/:id` - Delete spending limit

## Summaries
- `GET /api/summaries/monthly/:year/:month` - Get monthly summary
- `GET /api/summaries/yearly/:year` - Get yearly summary
- `POST /api/summaries/monthly/generate` - Generate monthly summary

## Currencies
- `GET /api/currencies` - Get all currencies

## Health Check
- `GET /health` - API health check

## Pagination Query Parameters
All list endpoints support:
- `page` (default: 1)
- `limit` (default: 10)
- `sortBy` (default varies by resource)
- `sortOrder` (default: 'desc', options: 'asc', 'desc')

## Authentication
All endpoints except `/auth/register`, `/auth/login`, `/health`, and `/api/currencies` require:
- Header: `Authorization: Bearer <JWT_TOKEN>`

## Response Format
### Success Response
```json
{
  "data": [],
  "page": 1,
  "limit": 10
}
```
OR for single resources:
```json
{
  "id": "uuid",
  "field": "value"
}
```

### Error Response
```json
{
  "error": "Error message"
}
```

### Validation Error Response
```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "email",
      "message": "Invalid email"
    }
  ]
}
```
