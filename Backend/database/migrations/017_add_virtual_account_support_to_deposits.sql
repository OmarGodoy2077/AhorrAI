-- Migration 017: Add virtual_account_id column to savings_deposits table
-- This allows deposits to be made directly to virtual accounts for custom savings goals
-- Date: 2025-10-31

ALTER TABLE savings_deposits
ADD COLUMN virtual_account_id UUID REFERENCES accounts(id) ON DELETE SET NULL;

-- Update trigger to handle deposits to virtual accounts
-- The update_savings_from_deposits() function will automatically update account balances

-- Add comment to explain the column
COMMENT ON COLUMN savings_deposits.virtual_account_id IS 'When set, the deposit amount is transferred to this virtual account instead of updating goal_amount directly';

-- Ensure goal_id remains optional (allowing null for virtual account deposits)
ALTER TABLE savings_deposits
ALTER COLUMN goal_id DROP NOT NULL;
