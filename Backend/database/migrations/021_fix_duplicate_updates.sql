-- Migration 021: Fix duplicate current_amount updates
-- The new transfer_funds_on_deposit trigger already updates current_amount
-- The old update_savings_from_deposits triggers would duplicate this
-- This migration removes the old triggers and simplifies the logic
-- Date: 2025-10-31

-- Drop old triggers that were duplicating the update
DROP TRIGGER IF EXISTS trigger_update_savings_on_deposit_insert ON savings_deposits;
DROP TRIGGER IF EXISTS trigger_update_savings_on_deposit_update ON savings_deposits;
DROP TRIGGER IF EXISTS trigger_update_savings_on_deposit_delete ON savings_deposits;

-- Note: The new trigger_transfer_funds_on_deposit handles everything:
-- 1. Deducts from source account
-- 2. Adds to virtual account
-- 3. Updates current_amount in savings_goal
-- So update_savings_from_deposits is no longer needed for basic deposits

-- For DELETE operations on deposits, we still need to handle the reverse:
CREATE OR REPLACE FUNCTION revert_deposit_transfer()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Step 1: Reverse source account deduction
    IF OLD.source_account_id IS NOT NULL THEN
        UPDATE accounts
        SET balance = balance + OLD.amount,
            updated_at = NOW()
        WHERE id = OLD.source_account_id;
    END IF;
    
    -- Step 2: Reverse virtual account addition
    IF OLD.virtual_account_id IS NOT NULL THEN
        UPDATE accounts
        SET balance = balance - OLD.amount,
            updated_at = NOW()
        WHERE id = OLD.virtual_account_id;
    END IF;
    
    -- Step 3: Reverse savings_goal current_amount update
    IF OLD.goal_id IS NOT NULL THEN
        UPDATE savings_goals
        SET current_amount = GREATEST(0, current_amount - OLD.amount),
            updated_at = NOW()
        WHERE id = OLD.goal_id;
    END IF;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Trigger to revert deposit transfer on DELETE
CREATE TRIGGER trigger_revert_deposit_transfer
    BEFORE DELETE ON savings_deposits
    FOR EACH ROW EXECUTE FUNCTION revert_deposit_transfer();

COMMENT ON FUNCTION revert_deposit_transfer() IS 
'Handles reverse of deposit transfer on deletion: restores source account, reduces virtual account, and updates savings goal';
