# AhorraAI Backend

Backend for AhorraAI, a financial platform for young people to improve their financial control.

## Technologies Used

- Node.js (Latest)
- JavaScript (ES6+)
- Express.js
- Supabase (PostgreSQL + Auth + MCP)
- Cloudinary (File Uploads)
- JWT (Authentication)
- bcryptjs (Password Hashing)
- Other: cors, helmet, morgan, express-validator, moment-timezone, multer

## Project Structure

```
Backend/
├── src/
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── profileController.js
│   │   ├── incomeController.js
│   │   ├── expenseController.js
│   │   ├── accountController.js
│   │   ├── categoryController.js
│   │   ├── currencyController.js
│   │   ├── financialSettingController.js
│   │   ├── loanController.js
│   │   ├── savingsGoalController.js
│   │   ├── savingsDepositController.js (NEW - Manual deposits)
│   │   ├── spendingLimitController.js
│   │   ├── summaryController.js
│   │   └── index.js
│   ├── models/
│   │   ├── profile.js
│   │   ├── income.js
│   │   ├── expense.js
│   │   ├── account.js
│   │   ├── category.js
│   │   ├── currency.js
│   │   ├── financialSetting.js
│   │   ├── loan.js
│   │   ├── monthlySummary.js
│   │   ├── yearlySummary.js
│   │   ├── savingsGoal.js
│   │   ├── savingsDeposit.js (NEW - Manual deposits)
│   │   ├── spendingLimit.js
│   │   └── index.js
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── validation.js
│   │   ├── logging.js
│   │   ├── error.js
│   │   └── index.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── profile.js
│   │   ├── income.js
│   │   ├── expense.js
│   │   ├── account.js
│   │   ├── category.js
│   │   ├── currency.js
│   │   ├── financialSetting.js
│   │   ├── loan.js
│   │   ├── savingsGoal.js
│   │   ├── savingsDeposit.js (NEW - Manual deposits)
│   │   ├── spendingLimit.js
│   │   ├── summary.js
│   │   └── index.js
│   ├── utils/
│   │   ├── cloudinary.js
│   │   └── index.js
│   ├── config/
│   │   ├── database.js
│   │   ├── auth.js
│   │   ├── cloudinary.js
│   │   └── index.js
│   └── index.js
├── database/
│   ├── schema.sql
│   └── migrations/
│       ├── 001_refactor_savings_system.sql
│       ├── 002_separate_custom_goals_from_global.sql
│       └── 003_remove_salary_savings_from_profiles.sql (v2.1+ - Cleans up registration)
├── docs/
│   ├── api-guide.md
│   ├── api-endpoints.md
│   ├── backend-overview.md
│   ├── auth-fixes.md
│   ├── postman-testing-guide.md
│   ├── backend-status.md
│   ├── savings-refactor-migration.md
│   └── IMPLEMENTATION_STATUS.md
├── .env.example
├── package.json
└── README.md
```

## Getting Started

1. **Clone the repository and navigate to Backend directory.**

2. **Install dependencies:**
   ```
   npm install
   ```

3. **Set up environment variables:**
   - Copy `.env.example` to `.env`
   - Fill in the required values:
     - SUPABASE_URL: Your Supabase project URL
     - SUPABASE_ANON_KEY: Your Supabase anonymous key
     - JWT_SECRET: A strong secret for JWT signing
     - CLOUDINARY_CLOUD_NAME: Your Cloudinary cloud name
     - CLOUDINARY_API_KEY: Your Cloudinary API key
     - CLOUDINARY_API_SECRET: Your Cloudinary API secret
     - PORT: Port number (default 3000)
     - NODE_ENV: Environment (development/production)
     - TZ: Timezone (America/Guatemala)

4. **Set up Supabase:**
   - Create a Supabase project
   - Run the SQL script in `database/schema.sql` in your Supabase SQL editor to create tables and policies.
   - **Migrations** are located in `database/migrations/` for version tracking

5. **Start the server:**
   ```
   npm start
   ```
   For development:
   ```
   npm run dev
   ```

## Registration & Onboarding Flow

### Simplified Registration (v2.1+)
The registration process has been streamlined to focus on authentication only:

```
POST /api/auth/register
{
  "email": "user@example.com",
  "password": "securepassword",
  "fullName": "John Doe"
}
```

**Note:** Salary and savings goal data are **NO LONGER** requested during registration. These are now configured after signup as part of the financial setup flow.

### Post-Registration Onboarding
After successful registration, users should complete their financial setup:

1. **Set up Financial Settings** (salary, monthly savings target)
   ```
   POST /api/financial-settings
   {
     "salary": 5000,
     "monthly_savings_target": 1500
   }
   ```

2. **Create Income Sources** (if multiple or specific types needed)
   ```
   POST /api/income-sources
   {
     "name": "Salary",
     "type": "fixed",
     "amount": 5000,
     "frequency": "monthly"
   }
   ```

3. **Create Savings Goals** (monthly target and custom goals)
   ```
   POST /api/savings-goals
   {
     "name": "Monthly Savings",
     "target_amount": 1500,
     "goal_type": "monthly",
     "is_monthly_target": true
   }
   ```

See `docs/api-guide.md` for complete examples and additional configuration steps.

## API Endpoints

See `docs/api-guide.md` for detailed API documentation.

## Features

- **User Registration & Authentication** with Supabase Auth and JWT (simplified registration with just email, password, and name)
- **Profile Management** basic user information
- **Dynamic Financial Settings** (salary history, monthly savings target)
- **Income Tracking** (Fixed, Variable, Extra) with multi-currency support and automatic balance updates
- **Expense Tracking** with hierarchical categories and automatic balance updates
- **Account Management** (Cash, Banks, Platforms) with multi-currency support
- **Loan Management** (track loans, interest, status)
- **Savings Goals** - Three types with manual deposits:
  - **Monthly Target**: User's monthly savings goal (unique per user, tracked separately, **contributes to global**)
  - **Global Accumulation**: Total goal receiving deposits from all non-custom goals
  - **Custom Goals**: Independent savings goals (car, vacation, emergency fund, etc.) - **excluded from global**
- **Manual Deposits System**: Make deposits to specific goals with automatic progress tracking
- **Monthly Status Tracking**: Compare actual vs target savings for the month
- **Custom vs Global Control**: Choose which goals contribute to global accumulation
- **Financial Summaries** (Monthly and Yearly, updated automatically)
- **Spending Limits** (Monthly budgets with monitoring)
- **File Uploads** via Cloudinary
- Security: Password hashing, input validation, RLS in DB

## Savings System Architecture (Manual Deposits - v2.1)

### Overview
The savings system has been refactored from automatic deposits to **manual deposits** with automatic progress tracking. **Custom goals are now properly separated from global accumulation**.

### How It Works

1. **User sets a monthly savings target** via `/api/savings-goals/set-monthly-target/:goalId`
2. **User creates custom goals** for specific purposes (car, vacation, emergency fund) - automatically marked as excluded from global
3. **User manually deposits money** via `/api/savings-deposits`
   - Deposits can be made to monthly target, custom goals, or global accumulation goal
4. **System automatically updates**:
   - Goal's `current_amount` (specific goal progress)
   - Global goal's `current_amount` (deposits ONLY from non-custom goals)
   - Monthly summaries
   - Custom goals stay independent - their deposits do NOT count toward global

### Goal Types & Accumulation

| Type | Quantity | Contributes to Global | Use Case |
|------|----------|----------------------|----------|
| `monthly` | 1 per user | ✅ YES (default) | Monthly savings target |
| `global` | 1 per user | N/A (it receives aggregation) | Total accumulation goal |
| `custom` | Unlimited | ❌ NO (default - excluded) | Independent savings (car, vacation, etc) |

### Custom vs Global Control

Each goal has `is_custom_excluded_from_global` flag:
- **`TRUE`**: Goal is custom/personal - deposits DO NOT count toward global
- **`FALSE`**: Goal contributes to global - deposits DO count toward global

Control via endpoints:
- `POST /api/savings-goals/:id/exclude-from-global` - Mark as custom (excluded from global)
- `POST /api/savings-goals/:id/include-in-global` - Mark as contributing to global
- `GET /api/savings-goals/goals/custom` - Get all custom goals
- `GET /api/savings-goals/goals/global-contributors` - Get all contributing goals

### Endpoints

**Savings Goals:**
- `POST /api/savings-goals` - Create goal (auto-marked based on goal_type)
- `PUT /api/savings-goals/:id` - Update goal
- `GET /api/savings-goals` - List user's goals
- `POST /api/savings-goals/:id/set-monthly-target` - Set monthly target
- `POST /api/savings-goals/:id/exclude-from-global` - Mark as custom
- `POST /api/savings-goals/:id/include-in-global` - Mark as contributor
- `GET /api/savings-goals/goals/custom` - Get custom goals
- `GET /api/savings-goals/goals/global-contributors` - Get contributor goals

**Savings Deposits:**
- `POST /api/savings-deposits` - Create deposit
- `GET /api/savings-deposits` - List user's deposits (paginated)
- `GET /api/savings-deposits/:id` - Get specific deposit
- `GET /api/savings-deposits/goal/:goalId` - Get deposits for a goal
- `PUT /api/savings-deposits/:id` - Update deposit
- `DELETE /api/savings-deposits/:id` - Delete deposit
- `GET /api/savings-deposits/monthly-status/:year/:month` - Compare target vs actual

### Example Scenario

**Setup:**
- Monthly goal: 1,500/month
- Global goal: 150,000
- Car goal (custom): 50,000
- Vacation goal (custom): 10,000

**October deposits:**
- 1,400 to monthly goal
- 500 to car goal
- 0 to vacation goal

**Results:**
```
Monthly goal: 1,400/1,500 = 93% (100 short this month)
Car goal: 500/50,000 = 1% (independent, 49,500 remaining)
Vacation goal: 0/10,000 = 0% (independent)
Global goal: 1,400/150,000 = 0.93% (148,600 remaining)
  ↳ Only counts monthly deposit (1,400), NOT car/vacation (they're custom-excluded)
```

### Database Schema Changes

**New Table: `savings_deposits`**
- `id`, `user_id`, `goal_id`, `amount`, `deposit_date`, `description`, `created_at`, `updated_at`

**Modified Tables:**
- `savings_goals`: Added `goal_type`, `target_date`, `is_monthly_target`, `is_custom_excluded_from_global`
- `financial_settings`: Added `monthly_savings_target`

**Triggers & Functions:**
- `update_savings_from_deposits()` - Updates goal and global on INSERT/UPDATE (excludes custom goals from global)
- `update_savings_from_deposits_delete()` - Updates goal and global on DELETE (excludes custom goals from global)
- Automatic updates on deposit operations
- Maintains data consistency between tables

**Indexes:**
- `idx_savings_goals_excluded_from_global` - For efficient querying of custom vs global goals

### Documentation

See the following docs for detailed information:
- **`docs/api-guide.md`** - Complete API documentation with examples
- **`docs/api-endpoints.md`** - All endpoints reference
- **`docs/backend-overview.md`** - System architecture and business logic
- **`docs/savings-refactor-migration.md`** - Migration guide and breaking changes
- **`docs/IMPLEMENTATION_STATUS.md`** - Complete verification and implementation details

## Security

- Passwords are hashed using bcryptjs
- JWT for session management
- Input validation with express-validator
- Row Level Security (RLS) in Supabase for user data isolation
- CORS, Helmet for additional security

## Timezone

All dates and times are handled in America/Guatemala timezone.

## AI Integration

Prepared for integration with AI assistants using RAG and vector databases for financial analysis and recommendations.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes
4. Submit a pull request

## License

ISC
