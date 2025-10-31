-- Fix update_account_balance function to properly handle income confirmation changes
-- This prevents double-counting when updating confirmed incomes

CREATE OR REPLACE FUNCTION update_account_balance()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
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
                    -- Just unconfirmed: subtract amount
                    UPDATE accounts
                    SET balance = balance - OLD.amount,
                        updated_at = NOW()
                    WHERE id = OLD.account_id;
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
                    -- Subtract from old account
                    UPDATE accounts
                    SET balance = balance - OLD.amount,
                        updated_at = NOW()
                    WHERE id = OLD.account_id;
                END IF;
                IF NEW.is_confirmed THEN
                    -- Add to new account
                    UPDATE accounts
                    SET balance = balance + NEW.amount,
                        updated_at = NOW()
                    WHERE id = NEW.account_id;
                END IF;
            ELSIF OLD.account_id IS NOT NULL AND NEW.account_id IS NULL AND OLD.is_confirmed THEN
                -- Account removed: subtract from old account
                UPDATE accounts
                SET balance = balance - OLD.amount,
                    updated_at = NOW()
                WHERE id = OLD.account_id;
            END IF;
        ELSIF TG_OP = 'DELETE' THEN
            -- Subtract from balance if was confirmed
            IF OLD.account_id IS NOT NULL AND OLD.is_confirmed THEN
                UPDATE accounts
                SET balance = balance - OLD.amount,
                    updated_at = NOW()
                WHERE id = OLD.account_id;
            END IF;
        END IF;
    -- For expenses, subtract from balance
    ELSIF TG_TABLE_NAME = 'expenses' THEN
        IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
            IF NEW.account_id IS NOT NULL THEN
                UPDATE accounts
                SET balance = balance - NEW.amount,
                    updated_at = NOW()
                WHERE id = NEW.account_id;
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