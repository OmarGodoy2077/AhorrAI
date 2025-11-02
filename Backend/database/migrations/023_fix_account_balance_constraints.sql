-- Migration 023: Fix account balance constraints and income deletion
-- Date: 2025-10-31
-- Purpose: 
-- 1. Fix the accounts_balance_check constraint violations when deleting incomes
-- 2. Improve update_account_balance function to handle edge cases
-- 3. Add validation to prevent negative balances

-- Improve the update_account_balance function to be more robust
CREATE OR REPLACE FUNCTION update_account_balance()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_balance DECIMAL(10,2);
BEGIN
    -- For incomes, handle balance changes based on confirmation status
    IF TG_TABLE_NAME = 'income_sources' THEN
        IF TG_OP = 'INSERT' THEN
            -- Add to balance if confirmed and account_id is set
            IF NEW.account_id IS NOT NULL AND NEW.is_confirmed THEN
                UPDATE accounts
                SET balance = balance + NEW.amount,
                    updated_at = NOW()
                WHERE id = NEW.account_id;
            END IF;
        ELSIF TG_OP = 'UPDATE' THEN
            -- Handle confirmation status changes and account/amount changes
            IF NEW.account_id IS NOT NULL AND OLD.account_id IS NOT NULL AND NEW.account_id = OLD.account_id THEN
                -- Same account, check confirmation and amount changes
                IF (OLD.is_confirmed = false AND NEW.is_confirmed = true) THEN
                    -- Just confirmed: add amount
                    UPDATE accounts
                    SET balance = balance + NEW.amount,
                        updated_at = NOW()
                    WHERE id = NEW.account_id;
                ELSIF (OLD.is_confirmed = true AND NEW.is_confirmed = false) THEN
                    -- Just unconfirmed: subtract amount (with safety check)
                    SELECT balance INTO current_balance FROM accounts WHERE id = OLD.account_id;
                    IF current_balance >= OLD.amount THEN
                        UPDATE accounts
                        SET balance = balance - OLD.amount,
                            updated_at = NOW()
                        WHERE id = OLD.account_id;
                    ELSE
                        -- Allow it to go to zero but not negative
                        UPDATE accounts
                        SET balance = 0,
                            updated_at = NOW()
                        WHERE id = OLD.account_id;
                    END IF;
                ELSIF (OLD.is_confirmed = true AND NEW.is_confirmed = true AND OLD.amount != NEW.amount) THEN
                    -- Amount changed on confirmed income: adjust difference
                    UPDATE accounts
                    SET balance = balance + (NEW.amount - OLD.amount),
                        updated_at = NOW()
                    WHERE id = NEW.account_id;
                END IF;
            ELSIF NEW.account_id IS NOT NULL AND (OLD.account_id IS NULL OR NEW.account_id != OLD.account_id) THEN
                -- Account changed or was null
                IF OLD.account_id IS NOT NULL AND OLD.is_confirmed THEN
                    -- Subtract from old account (with safety check)
                    SELECT balance INTO current_balance FROM accounts WHERE id = OLD.account_id;
                    IF current_balance >= OLD.amount THEN
                        UPDATE accounts
                        SET balance = balance - OLD.amount,
                            updated_at = NOW()
                        WHERE id = OLD.account_id;
                    ELSE
                        -- Allow it to go to zero but not negative
                        UPDATE accounts
                        SET balance = 0,
                            updated_at = NOW()
                        WHERE id = OLD.account_id;
                    END IF;
                END IF;
                IF NEW.is_confirmed THEN
                    -- Add to new account
                    UPDATE accounts
                    SET balance = balance + NEW.amount,
                        updated_at = NOW()
                    WHERE id = NEW.account_id;
                END IF;
            ELSIF OLD.account_id IS NOT NULL AND NEW.account_id IS NULL AND OLD.is_confirmed THEN
                -- Account removed: subtract from old account (with safety check)
                SELECT balance INTO current_balance FROM accounts WHERE id = OLD.account_id;
                IF current_balance >= OLD.amount THEN
                    UPDATE accounts
                    SET balance = balance - OLD.amount,
                        updated_at = NOW()
                    WHERE id = OLD.account_id;
                ELSE
                    -- Allow it to go to zero but not negative
                    UPDATE accounts
                    SET balance = 0,
                        updated_at = NOW()
                    WHERE id = OLD.account_id;
                END IF;
            END IF;
        ELSIF TG_OP = 'DELETE' THEN
            -- Subtract from balance if was confirmed (with safety check)
            IF OLD.account_id IS NOT NULL AND OLD.is_confirmed THEN
                SELECT balance INTO current_balance FROM accounts WHERE id = OLD.account_id;
                IF current_balance >= OLD.amount THEN
                    UPDATE accounts
                    SET balance = balance - OLD.amount,
                        updated_at = NOW()
                    WHERE id = OLD.account_id;
                ELSE
                    -- Allow it to go to zero but not negative
                    UPDATE accounts
                    SET balance = 0,
                        updated_at = NOW()
                    WHERE id = OLD.account_id;
                    
                    -- Log a warning
                    RAISE WARNING 'Account % balance was insufficient to subtract income amount %. Balance set to 0.', OLD.account_id, OLD.amount;
                END IF;
            END IF;
        END IF;
    -- For expenses, subtract from balance
    ELSIF TG_TABLE_NAME = 'expenses' THEN
        IF TG_OP = 'INSERT' THEN
            IF NEW.account_id IS NOT NULL THEN
                -- Check if account has sufficient balance
                SELECT balance INTO current_balance FROM accounts WHERE id = NEW.account_id;
                IF current_balance >= NEW.amount THEN
                    UPDATE accounts
                    SET balance = balance - NEW.amount,
                        updated_at = NOW()
                    WHERE id = NEW.account_id;
                ELSE
                    RAISE EXCEPTION 'Saldo insuficiente en la cuenta';
                END IF;
            END IF;
        ELSIF TG_OP = 'UPDATE' THEN
            IF NEW.account_id IS NOT NULL THEN
                -- First restore the old amount
                IF OLD.account_id IS NOT NULL THEN
                    UPDATE accounts
                    SET balance = balance + OLD.amount,
                        updated_at = NOW()
                    WHERE id = OLD.account_id;
                END IF;
                
                -- Then subtract the new amount
                SELECT balance INTO current_balance FROM accounts WHERE id = NEW.account_id;
                IF current_balance >= NEW.amount THEN
                    UPDATE accounts
                    SET balance = balance - NEW.amount,
                        updated_at = NOW()
                    WHERE id = NEW.account_id;
                ELSE
                    RAISE EXCEPTION 'Saldo insuficiente en la cuenta';
                END IF;
            END IF;
        ELSIF TG_OP = 'DELETE' THEN
            IF OLD.account_id IS NOT NULL THEN
                UPDATE accounts
                SET balance = balance + OLD.amount,
                    updated_at = NOW()
                WHERE id = OLD.account_id;
            END IF;
        END IF;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Add a function to check and fix account balances
CREATE OR REPLACE FUNCTION fix_negative_account_balances()
RETURNS TABLE(account_id UUID, old_balance DECIMAL(10,2), new_balance DECIMAL(10,2))
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    UPDATE accounts
    SET balance = 0
    WHERE balance < 0
    RETURNING id, (balance)::DECIMAL(10,2) AS old_balance, (0)::DECIMAL(10,2) AS new_balance;
END;
$$;

-- Fix any existing negative balances
SELECT * FROM fix_negative_account_balances();

-- Comments
COMMENT ON FUNCTION update_account_balance() IS 'Updated to handle edge cases and prevent negative balances';
COMMENT ON FUNCTION fix_negative_account_balances() IS 'Utility function to fix any negative account balances';
