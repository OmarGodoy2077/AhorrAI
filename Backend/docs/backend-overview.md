# AhorraAI Backend Overview

This document provides an overview of the architecture, data models, business logic, and best practices for the AhorraAI backend.

## Architecture

The backend is built using Node.js and Express.js, following a modular structure for scalability and maintainability.

### Key Components

- **Controllers:** Handle HTTP requests and responses, business logic.
- **Models:** Interact with the database (Supabase PostgreSQL).
- **Routes:** Define API endpoints.
- **Middleware:** Handle authentication, validation, logging, error handling.
- **Utils:** Utility functions, e.g., file uploads.
- **Config:** Environment configurations.

### Database

- **Supabase PostgreSQL:** Primary database.
- **Row Level Security (RLS):** Ensures users can only access their own data.
- **Tables:**
  - `profiles`: User profiles (email, full name, avatar - salary removed in v2.1+).
  - `financial_settings`: Dynamic salary and monthly savings target with history.
  - `income_sources`: User incomes (fixed, variable, extra) with multi-currency.
  - `expenses`: User expenses with categories and multi-currency.
  - `accounts`: User accounts (cash, banks, platforms) with multi-currency and automatic balance updates.
  - `categories`: Hierarchical expense categories (necessary/unnecessary, subcategories).
  - `monthly_summaries`: Monthly financial summaries, updated automatically.
  - `yearly_summaries`: Yearly financial summaries, updated automatically.
  - `loans`: User loans with interest and status tracking.
  - `currencies`: Supported currencies.
  - `savings_goals`: User savings goals with progress tracking. Supports three types: 'monthly' (monthly target), 'global' (total accumulation), and 'custom' (specific goals).
  - `savings_deposits`: ⭐ NEW - Manual deposits to savings goals, automatically updating goal progress.
  - `spending_limits`: Monthly spending limits for budget control.

### Authentication

- **Supabase Auth:** Handles user registration and login.
- **JWT:** Issued after Supabase auth for API access.
- **Password Hashing:** Using bcryptjs.

### Security

- **Input Validation:** Using express-validator.
- **Rate Limiting:** Not implemented yet, can be added.
- **CORS:** Configured for cross-origin requests.
- **Helmet:** Security headers.

## Business Logic Flows

### User Registration (v2.1+ - Simplified)
1. User submits email, password, and full name only.
2. Supabase Auth creates user.
3. Profile is auto-created with basic info (no salary/savings_goal).
4. JWT issued.
5. **Post-Registration Onboarding** (separate step):
   - User creates financial settings (salary, monthly_savings_target)
   - User creates income sources if needed
   - User creates savings goals
   
**Note:** Salary and savings goal are no longer requested during registration. They are configured after signup as part of the financial setup flow.

### Financial Settings
1. User sets salary for a period (creates entry in financial_settings table).
2. User sets optional monthly savings target (amount they plan to save each month).
3. Historical settings maintained for tracking changes.

### Savings Goals - NEW MANUAL SYSTEM ⭐
The savings system has been refactored to support **manual deposits** instead of automatic savings:

1. **Types of Savings Goals:**
   - **Monthly Goal** (`goal_type='monthly'`): User defines a monthly savings target (e.g., "Save 1500/month"). Only one per user. **Contributes to global** by default.
   - **Global Goal** (`goal_type='global'`): User defines a total accumulation target (e.g., "Reach 150,000 total"). Automatically includes all deposits from non-custom goals.
   - **Custom Goals** (`goal_type='custom'`): User creates specific goals (e.g., "Car = 100,000", "Vacation = 5,000"). **Excluded from global** by default - they are independent savings buckets.

2. **Custom vs Global Accumulation:**
   - Each goal has a flag `is_custom_excluded_from_global` (BOOLEAN):
     - `TRUE`: Goal is custom/personal - deposits DO NOT count toward global accumulation
     - `FALSE`: Goal contributes to global - deposits DO count toward global accumulation
   - Monthly goals automatically have `is_custom_excluded_from_global = FALSE` (they contribute to global)
   - Custom goals automatically have `is_custom_excluded_from_global = TRUE` (they do NOT contribute to global)
   - You can change this per goal using endpoints:
     - `POST /api/savings-goals/:id/exclude-from-global` - Mark as custom
     - `POST /api/savings-goals/:id/include-in-global` - Include in global

3. **Manual Deposits:**
   - User makes manual deposits to specific goals via `POST /api/savings-deposits`.
   - Each deposit is recorded with amount, date, and optional description.
   - Goal's `current_amount` is automatically updated when deposits are created/updated/deleted.
   - Global goal's `current_amount` is the sum of all deposits EXCEPT custom goals (those marked with `is_custom_excluded_from_global = TRUE`).

4. **Monthly Savings Tracking:**
   - `GET /api/savings-deposits/monthly-status/:year/:month` compares the user's monthly target (from `financial_settings.monthly_savings_target`) against actual deposits made to their monthly goal that month.
   - Returns status: achieved (yes/no), percentage completed, difference from target.

5. **Goal Life Cycles:**
   - Goals can have optional `target_date` for deadline tracking (e.g., "Complete by June 2026").
   - Goals have status: 'active', 'completed', 'paused'.

6. **Example Scenario:**
   ```
   User has:
   - Monthly goal: 1,500/month (is_custom_excluded_from_global = FALSE)
   - Global goal: 150,000 total (accumulates all deposits)
   - Car goal: 50,000 (is_custom_excluded_from_global = TRUE - custom, not counted in global)
   
   User deposits:
   - 1,400 to monthly goal in October
   - 500 to car goal
   
   Results:
   - Monthly goal current_amount: 1,400
   - Car goal current_amount: 500 (independent)
   - Global goal current_amount: 1,400 (only monthly goal deposits counted, car goal excluded)
   - Monthly status: 1,400/1,500 = 93% (100 short)
   - Global needs: 150,000 - 1,400 = 148,600 remaining
   ```

### Spending Limits
1. User sets monthly spending limits per year/month.
2. Monitor against expenses to alert if exceeded.

### Income Tracking
1. User creates income source with currency.
2. User confirms receipt (updates is_confirmed).
3. Automatically adds to account balance if confirmed and account_id is set.
4. Updates monthly/yearly summaries.

### Expense Tracking
1. User logs expense with hierarchical category, account, and currency.
2. Automatically subtracts from account balance.
3. Updates monthly/yearly summaries.

### Loan Management
1. User creates loan with details.
2. Track remaining balance and status.

### Financial Summaries
1. Monthly summaries calculated from incomes, expenses, loans.
2. Yearly summaries aggregate monthly data.

## Best Practices

- **Error Handling:** Centralized in middleware.
- **Validation:** All inputs validated.
- **Logging:** HTTP requests logged with morgan.
- **Timezone:** All dates in America/Guatemala.
- **Environment Variables:** Sensitive data in .env.
- **Modular Code:** Each feature in separate files.
- **Security:** RLS, hashed passwords, JWT.

## AI Integration

- Prepared for RAG and vector DB integration.
- Financial data can be used for context in AI recommendations.

## Performance Considerations

- Database indexes on frequently queried fields.
- Efficient queries using Supabase client.
- Pagination not implemented yet, add as needed.

## Deployment

- Use process manager like PM2.
- Set NODE_ENV to production.
- Ensure .env is secure.

## Future Improvements

- Add rate limiting.
- Implement caching (Redis).
- More detailed logging.
- Unit tests.
- API versioning.