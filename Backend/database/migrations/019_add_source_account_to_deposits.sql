-- Migration 019: Add source_account_id to savings_deposits
-- This tracks which account the money comes from when depositing to a goal
-- Date: 2025-10-31

ALTER TABLE savings_deposits
ADD COLUMN source_account_id UUID REFERENCES accounts(id) ON DELETE SET NULL;

COMMENT ON COLUMN savings_deposits.source_account_id IS 'The account from which the deposit money is transferred from';

-- Update trigger to handle transfers from source account to virtual account
CREATE OR REPLACE FUNCTION transfer_funds_on_deposit()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- If there's a source account, deduct the amount
    IF NEW.source_account_id IS NOT NULL THEN
        UPDATE accounts
        SET balance = balance - NEW.amount,
            updated_at = NOW()
        WHERE id = NEW.source_account_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to transfer funds from source account
CREATE TRIGGER trigger_transfer_funds_on_deposit
    AFTER INSERT ON savings_deposits
    FOR EACH ROW EXECUTE FUNCTION transfer_funds_on_deposit();
