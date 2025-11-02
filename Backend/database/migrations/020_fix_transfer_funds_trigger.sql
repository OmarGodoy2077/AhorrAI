-- Migration 020: Fix transfer_funds_on_deposit trigger to include virtual account balance update
-- This ensures that when a deposit is created:
-- 1. Money is deducted from the source account
-- 2. Money is added to the virtual account
-- 3. The current_amount in the savings_goal is updated
-- Date: 2025-10-31

-- Drop the old trigger that only deducted from source
DROP TRIGGER IF EXISTS trigger_transfer_funds_on_deposit ON savings_deposits;
DROP FUNCTION IF EXISTS transfer_funds_on_deposit();

-- Create improved function that handles full transfer cycle
CREATE OR REPLACE FUNCTION transfer_funds_on_deposit()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Step 1: Deduct from source account if provided
    IF NEW.source_account_id IS NOT NULL THEN
        UPDATE accounts
        SET balance = balance - NEW.amount,
            updated_at = NOW()
        WHERE id = NEW.source_account_id;
    END IF;
    
    -- Step 2: Add to virtual account if provided
    IF NEW.virtual_account_id IS NOT NULL THEN
        UPDATE accounts
        SET balance = balance + NEW.amount,
            updated_at = NOW()
        WHERE id = NEW.virtual_account_id;
    END IF;
    
    -- Step 3: Update current_amount in savings_goal if goal_id is provided
    IF NEW.goal_id IS NOT NULL THEN
        UPDATE savings_goals
        SET current_amount = current_amount + NEW.amount,
            updated_at = NOW()
        WHERE id = NEW.goal_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate trigger with updated function
CREATE TRIGGER trigger_transfer_funds_on_deposit
    AFTER INSERT ON savings_deposits
    FOR EACH ROW EXECUTE FUNCTION transfer_funds_on_deposit();

-- Add index on virtual_account_id for better query performance
CREATE INDEX IF NOT EXISTS idx_savings_deposits_virtual_account_id 
    ON savings_deposits(virtual_account_id);

COMMENT ON FUNCTION transfer_funds_on_deposit() IS 
'Handles full deposit transfer: deducts from source, adds to virtual account, and updates savings goal current_amount';
