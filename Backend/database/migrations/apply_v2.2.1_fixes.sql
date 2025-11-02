-- Master Migration Script: Apply all v2.2.1 fixes
-- Date: 2025-10-31
-- Purpose: Apply all fixes for the reported issues

-- Execute migrations in order
\i 022_fix_virtual_account_creation_and_balances.sql
\i 023_fix_account_balance_constraints.sql

-- Verification queries
SELECT 'Checking for custom goals without virtual accounts...' AS status;
SELECT COUNT(*) as goals_without_virtual_accounts
FROM savings_goals
WHERE goal_type = 'custom' AND virtual_account_id IS NULL;

SELECT 'Checking for negative account balances...' AS status;
SELECT COUNT(*) as accounts_with_negative_balance
FROM accounts
WHERE balance < 0;

SELECT 'Checking active salary schedules...' AS status;
SELECT 
    id,
    name,
    type,
    frequency,
    is_active,
    last_generated_date,
    next_generation_date
FROM salary_schedules
WHERE is_active = true;

-- Summary
SELECT 'Migration completed successfully!' AS status;
