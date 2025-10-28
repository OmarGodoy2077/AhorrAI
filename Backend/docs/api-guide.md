# AhorraAI Backend API Guide

This document provides detailed information about the API endpoints for the AhorraAI backend.

## Base URL

`http://localhost:3000/api`

## Authentication

Most endpoints require authentication via JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## Endpoints

### Auth

#### POST /auth/register
Register a new user. **Note:** As of v2.1+, registration is simplified to authentication only. Salary and savings goal configuration happens after signup.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "fullName": "John Doe"
}
```

**Response:**
```json
{
  "message": "User registered successfully. Please check your email to verify your account.",
  "token": "jwt_token_here",
  "profile": {
    "id": "uuid",
    "email": "user@example.com",
    "full_name": "John Doe",
    "avatar_url": null,
    "created_at": "2025-10-28T12:00:00Z",
    "updated_at": "2025-10-28T12:00:00Z"
  },
  "requiresEmailVerification": true
}
```

**Important:** After successful registration, users should configure their financial settings:
1. POST to `/financial-settings` to set salary and monthly savings target
2. POST to `/savings-goals` to create savings goals
3. POST to `/income-sources` to add income sources if needed

#### POST /auth/login
Login user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "token": "jwt_token_here",
  "profile": {...}
}
```

### Profile

#### GET /profile
Get user profile.

**Response:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "full_name": "John Doe",
  "avatar_url": null,
  "created_at": "2023-01-01T00:00:00Z",
  "updated_at": "2023-01-01T00:00:00Z"
}
```

**Note:** Salary and savings goal information are no longer stored in the profile table. Use `/financial-settings` and `/savings-goals` endpoints instead.

#### PUT /profile
Update user profile.

**Request Body:**
```json
{
  "full_name": "John Updated",
  "avatar_url": "https://example.com/avatar.jpg"
}
```

**Response:**
Updated profile object.

#### DELETE /profile
Delete user profile.

### Incomes

#### POST /incomes
Create new income.

**Request Body:**
```json
{
  "name": "Salary",
  "type": "fixed",
  "amount": 5000,
  "frequency": "monthly"
}
```

**Response:**
Created income object.

#### GET /incomes
Get all user incomes.

**Response:**
Array of income objects.

#### GET /incomes/:id
Get specific income.

**Response:**
Income object.

#### PUT /incomes/:id
Update income.

**Request Body:**
```json
{
  "amount": 5500
}
```

**Response:**
Updated income object.

#### DELETE /incomes/:id
Delete income.

#### POST /incomes/:id/confirm
Confirm income (mark as received).

### Expenses

#### POST /expenses
Create new expense.

**Request Body:**
```json
{
  "description": "Groceries",
  "amount": 200,
  "date": "2023-01-01",
  "type": "variable",
  "category_id": "category_uuid"
}
```

**Response:**
Created expense object.

#### GET /expenses
Get all user expenses.

**Response:**
Array of expense objects with category info.

#### GET /expenses/:id
Get specific expense.

**Response:**
Expense object.

#### PUT /expenses/:id
Update expense.

**Response:**
Updated expense object.

#### DELETE /expenses/:id
Delete expense.

### Accounts

#### POST /accounts
Create new account.

**Request Body:**
```json
{
  "name": "Bank Account",
  "type": "bank",
  "balance": 1000,
  "currency": "GTQ"
}
```

**Response:**
Created account object.

#### GET /accounts
Get all user accounts.

**Response:**
Array of account objects.

#### GET /accounts/:id
Get specific account.

**Response:**
Account object.

#### PUT /accounts/:id
Update account.

**Response:**
Updated account object.

#### DELETE /accounts/:id
Delete account.

### Categories

#### POST /categories
Create new category.

**Request Body:**
```json
{
  "name": "Food",
  "type": "necessary",
  "color": "#FF0000"
}
```

**Response:**
Created category object.

#### GET /categories
Get all user categories.

**Response:**
Array of category objects.

#### GET /categories/:id
Get specific category.

**Response:**
Category object.

#### PUT /categories/:id
Update category.

**Response:**
Updated category object.

#### DELETE /categories/:id
Delete category.

### Financial Settings

#### POST /financial-settings
Create financial setting.

**Request Body:**
```json
{
  "salary": 5000,
  "savings_goal": 1000,
  "start_date": "2023-01-01",
  "end_date": null
}
```

**Response:**
Created setting object.

#### GET /financial-settings
Get all user financial settings.

**Response:**
Array of settings.

#### GET /financial-settings/current
Get current financial setting.

**Response:**
Current setting object.

#### PUT /financial-settings/:id
Update financial setting.

**Response:**
Updated setting.

#### DELETE /financial-settings/:id
Delete financial setting.

### Summaries

#### GET /summaries/monthly/:year/:month
Get monthly summary.

**Response:**
```json
{
  "id": "uuid",
  "user_id": "user_uuid",
  "year": 2023,
  "month": 1,
  "total_income": 5000,
  "total_expenses": 2000,
  "net_change": 3000
}
```

#### GET /summaries/yearly/:year
Get yearly summary.

**Response:**
Yearly summary object.

#### POST /summaries/monthly/generate
Generate monthly summary.

**Request Body:**
```json
{
  "year": 2023,
  "month": 1
}
```

**Response:**
Generated summary object.

### Loans

#### POST /loans
Create loan.

**Request Body:**
```json
{
  "name": "Personal Loan",
  "amount": 10000,
  "interest_rate": 5.0,
  "start_date": "2023-01-01",
  "end_date": "2025-01-01",
  "remaining_balance": 8000,
  "status": "active"
}
```

**Response:**
Created loan object.

#### GET /loans
Get all user loans.

**Response:**
Array of loans.

#### GET /loans/:id
Get specific loan.

**Response:**
Loan object.

#### PUT /loans/:id
Update loan.

**Response:**
Updated loan.

#### DELETE /loans/:id
Delete loan.

### Currencies

#### GET /currencies
Get all currencies.

**Response:**
Array of currency objects.

### Savings Goals

#### POST /savings-goals
Create savings goal. Supports different goal types: 'monthly' (monthly savings target), 'global' (overall accumulation goal), and 'custom' (custom goals like "Car", "Vacation", etc).

**Request Body:**
```json
{
  "name": "Monthly Savings Target",
  "target_amount": 1500,
  "goal_type": "monthly",
  "is_monthly_target": true,
  "status": "active"
}
```

OR for a custom goal:
```json
{
  "name": "Car Fund",
  "target_amount": 100000,
  "goal_type": "custom",
  "target_date": "2026-12-31",
  "status": "active"
}
```

OR for a global accumulation goal:
```json
{
  "name": "Total Savings",
  "target_amount": 150000,
  "goal_type": "global",
  "status": "active"
}
```

**Response:**
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "name": "Monthly Savings Target",
  "target_amount": 1500,
  "current_amount": 0,
  "goal_type": "monthly",
  "target_date": null,
  "is_monthly_target": true,
  "status": "active",
  "is_primary": false,
  "created_at": "2025-10-27T00:00:00Z",
  "updated_at": "2025-10-27T00:00:00Z"
}
```

#### GET /savings-goals
Get all user savings goals (paginated).

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 10)
- `sortBy` (default: 'created_at')
- `sortOrder` (default: 'desc')

**Response:**
```json
{
  "data": [...],
  "page": 1,
  "limit": 10
}
```

#### GET /savings-goals/:id
Get specific goal.

#### PUT /savings-goals/:id
Update goal.

**Request Body (partial):**
```json
{
  "name": "Updated Goal Name",
  "target_amount": 2000
}
```

#### DELETE /savings-goals/:id
Delete goal.

#### POST /savings-goals/:id/set-monthly-target ⭐ NEW
Set a goal as the monthly savings target. Only one goal per user can be the monthly target.

**Response:**
Updated goal object with `is_monthly_target: true`.

### Savings Deposits ⭐ NEW

Manual savings tracking system. Users now deposit money manually to savings goals.

#### POST /savings-deposits
Create a manual deposit to a savings goal.

**Request Body:**
```json
{
  "goal_id": "uuid-of-goal",
  "amount": 1500,
  "deposit_date": "2025-10-27",
  "description": "Monthly salary deposit"
}
```

**Response:**
```json
{
  "id": "uuid",
  "goal_id": "uuid",
  "user_id": "uuid",
  "amount": 1500,
  "deposit_date": "2025-10-27",
  "description": "Monthly salary deposit",
  "created_at": "2025-10-27T12:00:00Z",
  "updated_at": "2025-10-27T12:00:00Z"
}
```

**Behavior:**
- When a deposit is created, the `current_amount` of the goal is automatically updated.
- If the goal is of type 'monthly', the monthly goal's amount increases.
- If the goal is of type 'custom', only that custom goal's amount increases.
- If the goal is of type 'global', the global goal receives the sum of all deposits from all goals.

#### GET /savings-deposits
Get all user's deposits (paginated).

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 20)
- `sortBy` (default: 'deposit_date')
- `sortOrder` (default: 'desc')

#### GET /savings-deposits/goal/:goalId
Get deposits for a specific goal.

#### GET /savings-deposits/:id
Get specific deposit.

#### PUT /savings-deposits/:id
Update a deposit.

**Request Body:**
```json
{
  "amount": 1600,
  "description": "Updated deposit"
}
```

#### DELETE /savings-deposits/:id
Delete a deposit. The goal's `current_amount` will be automatically recalculated.

#### GET /savings-deposits/monthly-status/:year/:month ⭐ NEW
Get monthly savings status comparing the target against actual deposits.

**URL Example:**
`GET /savings-deposits/monthly-status/2025/10`

**Response:**
```json
{
  "year": 2025,
  "month": 10,
  "target": 1500,
  "actual": 1400,
  "achieved": false,
  "difference": -100,
  "percentage": 93
}
```

**Explanation:**
- `target`: Monthly savings target from `financial_settings.monthly_savings_target`
- `actual`: Sum of deposits made to the monthly target goal during that month
- `achieved`: Boolean indicating if actual >= target
- `difference`: Target - Actual (negative means exceeded, positive means shortfall)
- `percentage`: Percentage of target achieved

### Spending Limits

#### POST /spending-limits
Create spending limit.

**Request Body:**
```json
{
  "monthly_limit": 1000,
  "year": 2023,
  "month": 10
}
```

**Response:**
Created spending limit object.

#### GET /spending-limits
Get all user spending limits.

**Response:**
Array of spending limits.

#### GET /spending-limits/:id
Get specific spending limit.

**Response:**
Spending limit object.

#### PUT /spending-limits/:id
Update spending limit.

**Response:**
Updated spending limit.

#### DELETE /spending-limits/:id
Delete spending limit.

## Error Handling

All endpoints return standard HTTP status codes and error messages in JSON format.

Example error response:
```json
{
  "error": "Validation failed",
  "details": [...]
}
```

## Timezone

All timestamps are in America/Guatemala timezone (UTC-6).