-- Migration 018: Add trigger to update virtual account balance on deposits
-- Date: 2025-10-31

-- Function to update account balance when a deposit is made to a virtual account
CREATE OR REPLACE FUNCTION update_virtual_account_on_deposit()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- If depositing to a virtual account, update its balance
    IF NEW.virtual_account_id IS NOT NULL THEN
        UPDATE accounts
        SET balance = balance + NEW.amount,
            updated_at = NOW()
        WHERE id = NEW.virtual_account_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to handle deletion of virtual account deposits
CREATE OR REPLACE FUNCTION update_virtual_account_on_deposit_delete()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- If deleting a virtual account deposit, reverse the balance update
    IF OLD.virtual_account_id IS NOT NULL THEN
        UPDATE accounts
        SET balance = balance - OLD.amount,
            updated_at = NOW()
        WHERE id = OLD.virtual_account_id;
    END IF;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for virtual account balance updates
CREATE TRIGGER trigger_update_virtual_account_on_deposit_insert
    AFTER INSERT ON savings_deposits
    FOR EACH ROW EXECUTE FUNCTION update_virtual_account_on_deposit();

CREATE TRIGGER trigger_update_virtual_account_on_deposit_delete
    AFTER DELETE ON savings_deposits
    FOR EACH ROW EXECUTE FUNCTION update_virtual_account_on_deposit_delete();
