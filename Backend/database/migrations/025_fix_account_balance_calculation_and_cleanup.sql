-- Migration 025: Fix account balance calculation and cleanup incorrect data
-- This migration fixes the account balance calculation to properly handle confirmed vs unconfirmed incomes

-- First, let's manually recalculate all account balances correctly
-- This will give each account a fresh start based on actual confirmed transactions

DO $$
DECLARE
    account_rec RECORD;
    total_confirmed_income DECIMAL(10,2);
    total_expenses DECIMAL(10,2);
    calculated_balance DECIMAL(10,2);
BEGIN
    -- For each non-virtual account
    FOR account_rec IN SELECT id, name, balance FROM accounts WHERE is_virtual_account = false
    LOOP
        -- Calculate total CONFIRMED income for this account
        SELECT COALESCE(SUM(amount), 0) INTO total_confirmed_income
        FROM income_sources
        WHERE account_id = account_rec.id
        AND is_confirmed = true;

        -- Calculate total expenses for this account
        SELECT COALESCE(SUM(amount), 0) INTO total_expenses
        FROM expenses
        WHERE account_id = account_rec.id;

        -- Calculate the balance: confirmed income - expenses
        calculated_balance := total_confirmed_income - total_expenses;

        -- Ensure balance is not negative (minimum 0)
        IF calculated_balance < 0 THEN
            calculated_balance := 0;
        END IF;

        -- Update the account with the correct balance
        UPDATE accounts
        SET balance = calculated_balance,
            updated_at = NOW()
        WHERE id = account_rec.id;

        RAISE NOTICE 'Account: % | Confirmed Income: % | Expenses: % | New Balance: %', 
            account_rec.name, total_confirmed_income, total_expenses, calculated_balance;
    END LOOP;
END $$;

-- Now update the function to handle balance correctly
-- The function should ONLY add/subtract balance when income is CONFIRMED
DROP FUNCTION IF EXISTS update_account_balance() CASCADE;

CREATE OR REPLACE FUNCTION update_account_balance()
RETURNS TRIGGER AS $$
DECLARE
    current_balance DECIMAL(10,2);
BEGIN
    IF TG_TABLE_NAME = 'income_sources' THEN
        IF TG_OP = 'INSERT' THEN
            -- Only update balance if the income is confirmed AND has an account
            IF NEW.account_id IS NOT NULL AND NEW.is_confirmed THEN
                UPDATE accounts
                SET balance = balance + NEW.amount,
                    updated_at = NOW()
                WHERE id = NEW.account_id;
            END IF;
            
        ELSIF TG_OP = 'UPDATE' THEN
            -- Handle account change or confirmation status change
            IF NEW.account_id IS NOT NULL AND OLD.account_id IS NOT NULL AND NEW.account_id = OLD.account_id THEN
                -- Same account - check if confirmation status changed
                IF (OLD.is_confirmed = false AND NEW.is_confirmed = true) THEN
                    -- Income was just confirmed - ADD to balance
                    UPDATE accounts
                    SET balance = balance + NEW.amount,
                        updated_at = NOW()
                    WHERE id = NEW.account_id;
                    
                ELSIF (OLD.is_confirmed = true AND NEW.is_confirmed = false) THEN
                    -- Income was un-confirmed - SUBTRACT from balance
                    SELECT balance INTO current_balance FROM accounts WHERE id = OLD.account_id;
                    IF current_balance >= OLD.amount THEN
                        UPDATE accounts
                        SET balance = balance - OLD.amount,
                            updated_at = NOW()
                        WHERE id = OLD.account_id;
                    ELSE
                        UPDATE accounts
                        SET balance = 0,
                            updated_at = NOW()
                        WHERE id = OLD.account_id;
                    END IF;
                    
                ELSIF (OLD.is_confirmed = true AND NEW.is_confirmed = true AND OLD.amount != NEW.amount) THEN
                    -- Amount changed but both are confirmed - adjust difference
                    UPDATE accounts
                    SET balance = balance + (NEW.amount - OLD.amount),
                        updated_at = NOW()
                    WHERE id = NEW.account_id;
                END IF;
                
            ELSIF NEW.account_id IS NOT NULL AND (OLD.account_id IS NULL OR NEW.account_id != OLD.account_id) THEN
                -- Account changed
                -- Remove from old account if it was confirmed
                IF OLD.account_id IS NOT NULL AND OLD.is_confirmed THEN
                    SELECT balance INTO current_balance FROM accounts WHERE id = OLD.account_id;
                    IF current_balance >= OLD.amount THEN
                        UPDATE accounts
                        SET balance = balance - OLD.amount,
                            updated_at = NOW()
                        WHERE id = OLD.account_id;
                    ELSE
                        UPDATE accounts
                        SET balance = 0,
                            updated_at = NOW()
                        WHERE id = OLD.account_id;
                    END IF;
                END IF;
                
                -- Add to new account if confirmed
                IF NEW.is_confirmed THEN
                    UPDATE accounts
                    SET balance = balance + NEW.amount,
                        updated_at = NOW()
                    WHERE id = NEW.account_id;
                END IF;
                
            ELSIF OLD.account_id IS NOT NULL AND NEW.account_id IS NULL AND OLD.is_confirmed THEN
                -- Account removed - subtract from old account if it was confirmed
                SELECT balance INTO current_balance FROM accounts WHERE id = OLD.account_id;
                IF current_balance >= OLD.amount THEN
                    UPDATE accounts
                    SET balance = balance - OLD.amount,
                        updated_at = NOW()
                    WHERE id = OLD.account_id;
                ELSE
                    UPDATE accounts
                    SET balance = 0,
                        updated_at = NOW()
                    WHERE id = OLD.account_id;
                END IF;
            END IF;
            
        ELSIF TG_OP = 'DELETE' THEN
            -- Remove income - subtract from account if it was confirmed
            IF OLD.account_id IS NOT NULL AND OLD.is_confirmed THEN
                SELECT balance INTO current_balance FROM accounts WHERE id = OLD.account_id;
                IF current_balance >= OLD.amount THEN
                    UPDATE accounts
                    SET balance = balance - OLD.amount,
                        updated_at = NOW()
                    WHERE id = OLD.account_id;
                ELSE
                    UPDATE accounts
                    SET balance = 0,
                        updated_at = NOW()
                    WHERE id = OLD.account_id;
                    
                    RAISE WARNING 'Account % balance was insufficient to subtract income amount %. Balance set to 0.', OLD.account_id, OLD.amount;
                END IF;
            END IF;
        END IF;
        
    ELSIF TG_TABLE_NAME = 'expenses' THEN
        IF TG_OP = 'INSERT' THEN
            IF NEW.account_id IS NOT NULL THEN
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
            -- Handle account change or amount change
            IF OLD.account_id IS NOT NULL AND NEW.account_id IS NOT NULL THEN
                IF OLD.account_id = NEW.account_id THEN
                    -- Same account - just adjust the difference
                    IF OLD.amount != NEW.amount THEN
                        UPDATE accounts
                        SET balance = balance + (OLD.amount - NEW.amount),
                            updated_at = NOW()
                        WHERE id = NEW.account_id;
                    END IF;
                ELSE
                    -- Different account - return to old account and subtract from new
                    UPDATE accounts
                    SET balance = balance + OLD.amount,
                        updated_at = NOW()
                    WHERE id = OLD.account_id;
                    
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
            ELSIF OLD.account_id IS NULL AND NEW.account_id IS NOT NULL THEN
                -- Account added
                SELECT balance INTO current_balance FROM accounts WHERE id = NEW.account_id;
                IF current_balance >= NEW.amount THEN
                    UPDATE accounts
                    SET balance = balance - NEW.amount,
                        updated_at = NOW()
                    WHERE id = NEW.account_id;
                ELSE
                    RAISE EXCEPTION 'Saldo insuficiente en la cuenta';
                END IF;
            ELSIF OLD.account_id IS NOT NULL AND NEW.account_id IS NULL THEN
                -- Account removed
                UPDATE accounts
                SET balance = balance + OLD.amount,
                    updated_at = NOW()
                WHERE id = OLD.account_id;
            END IF;
            
        ELSIF TG_OP = 'DELETE' THEN
            -- Return the expense amount back to the account
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

-- Recreate the triggers
DROP TRIGGER IF EXISTS trigger_update_balance_on_income_insert ON income_sources;
DROP TRIGGER IF EXISTS trigger_update_balance_on_income_update ON income_sources;
DROP TRIGGER IF EXISTS trigger_update_balance_on_income_delete ON income_sources;
DROP TRIGGER IF EXISTS trigger_update_balance_on_expense_insert ON expenses;
DROP TRIGGER IF EXISTS trigger_update_balance_on_expense_update ON expenses;
DROP TRIGGER IF EXISTS trigger_update_balance_on_expense_delete ON expenses;

CREATE TRIGGER trigger_update_balance_on_income_insert
    AFTER INSERT ON income_sources
    FOR EACH ROW EXECUTE FUNCTION update_account_balance();

CREATE TRIGGER trigger_update_balance_on_income_update
    AFTER UPDATE ON income_sources
    FOR EACH ROW EXECUTE FUNCTION update_account_balance();

CREATE TRIGGER trigger_update_balance_on_income_delete
    AFTER DELETE ON income_sources
    FOR EACH ROW EXECUTE FUNCTION update_account_balance();

CREATE TRIGGER trigger_update_balance_on_expense_insert
    AFTER INSERT ON expenses
    FOR EACH ROW EXECUTE FUNCTION update_account_balance();

CREATE TRIGGER trigger_update_balance_on_expense_update
    AFTER UPDATE ON expenses
    FOR EACH ROW EXECUTE FUNCTION update_account_balance();

CREATE TRIGGER trigger_update_balance_on_expense_delete
    AFTER DELETE ON expenses
    FOR EACH ROW EXECUTE FUNCTION update_account_balance();
