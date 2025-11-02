-- Migration 027: Fix virtual account initialization and synchronization
-- Date: 2025-11-01
-- Purpose:
-- 1. Ensure virtual accounts always start with balance = 0
-- 2. Synchronize virtual account balance with savings_deposits
-- 3. Delete orphaned virtual accounts when goal is deleted

-- Function to ensure virtual accounts start with zero balance
CREATE OR REPLACE FUNCTION ensure_virtual_account_zero_balance()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- If creating a virtual account, force balance to 0
    IF NEW.is_virtual_account = TRUE THEN
        NEW.balance := 0;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Trigger to enforce zero balance on virtual account creation
DROP TRIGGER IF EXISTS trigger_ensure_virtual_account_zero_balance ON accounts;
CREATE TRIGGER trigger_ensure_virtual_account_zero_balance
    BEFORE INSERT ON accounts
    FOR EACH ROW
    WHEN (NEW.is_virtual_account = TRUE)
    EXECUTE FUNCTION ensure_virtual_account_zero_balance();

-- Function to synchronize current_amount with virtual account balance
CREATE OR REPLACE FUNCTION sync_goal_current_amount_with_virtual_balance()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- When virtual account balance changes, update the goal's current_amount
    IF NEW.is_virtual_account = TRUE THEN
        UPDATE savings_goals
        SET current_amount = NEW.balance,
            updated_at = NOW()
        WHERE virtual_account_id = NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Trigger to sync goal amount when virtual account balance changes
DROP TRIGGER IF EXISTS trigger_sync_goal_amount ON accounts;
CREATE TRIGGER trigger_sync_goal_amount
    AFTER UPDATE OF balance ON accounts
    FOR EACH ROW
    WHEN (NEW.is_virtual_account = TRUE)
    EXECUTE FUNCTION sync_goal_current_amount_with_virtual_balance();

-- Clean up any existing orphaned virtual accounts
DELETE FROM accounts
WHERE is_virtual_account = TRUE
  AND id NOT IN (
    SELECT virtual_account_id 
    FROM savings_goals 
    WHERE virtual_account_id IS NOT NULL
  );

-- Synchronize existing virtual accounts with their goals
UPDATE savings_goals sg
SET current_amount = a.balance,
    updated_at = NOW()
FROM accounts a
WHERE sg.virtual_account_id = a.id
  AND a.is_virtual_account = TRUE
  AND sg.goal_type = 'custom';

COMMENT ON FUNCTION ensure_virtual_account_zero_balance() IS 
'Ensures that virtual accounts always start with a balance of 0. Balance should only increase through deposits.';

COMMENT ON FUNCTION sync_goal_current_amount_with_virtual_balance() IS 
'Keeps savings_goals.current_amount synchronized with the balance of its virtual account.';
