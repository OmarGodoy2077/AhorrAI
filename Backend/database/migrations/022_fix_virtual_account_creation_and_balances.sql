-- Migration 022: Fix virtual account creation and balance constraints
-- Date: 2025-10-31
-- Purpose: 
-- 1. Ensure all custom goals have virtual accounts
-- 2. Fix balance constraints to handle reversions properly
-- 3. Add utility function to create missing virtual accounts

-- Function to create virtual accounts for existing custom goals that don't have one
CREATE OR REPLACE FUNCTION create_missing_virtual_accounts()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    goal_record RECORD;
    v_account_id UUID;
    created_count INTEGER := 0;
BEGIN
    -- Find all custom goals without virtual accounts
    FOR goal_record IN 
        SELECT id, user_id, name
        FROM savings_goals
        WHERE goal_type = 'custom' 
        AND virtual_account_id IS NULL
    LOOP
        -- Get the user's default currency
        DECLARE
            v_currency_id UUID;
        BEGIN
            SELECT default_currency_id INTO v_currency_id
            FROM financial_settings
            WHERE user_id = goal_record.user_id
            AND end_date IS NULL
            ORDER BY created_at DESC
            LIMIT 1;
            
            -- Fallback to USD if no default currency found
            IF v_currency_id IS NULL THEN
                SELECT id INTO v_currency_id FROM currencies WHERE code = 'USD' LIMIT 1;
            END IF;
            
            -- Create virtual account
            INSERT INTO accounts (user_id, name, type, balance, currency_id, is_virtual_account, description)
            VALUES (
                goal_record.user_id,
                'Virtual: ' || goal_record.name,
                'platform',
                0,
                v_currency_id,
                TRUE,
                'Virtual account for savings goal: ' || goal_record.name
            )
            RETURNING id INTO v_account_id;
            
            -- Update the goal with the virtual account reference
            UPDATE savings_goals
            SET virtual_account_id = v_account_id,
                updated_at = NOW()
            WHERE id = goal_record.id;
            
            created_count := created_count + 1;
        END;
    END LOOP;
    
    RETURN created_count;
END;
$$;

-- Execute the function to fix existing goals
SELECT create_missing_virtual_accounts();

-- Improve the create_virtual_account_for_goal function to be more robust
CREATE OR REPLACE FUNCTION create_virtual_account_for_goal(
    p_goal_id UUID,
    p_user_id UUID,
    p_goal_name TEXT,
    p_currency_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_account_id UUID;
    v_existing_account_id UUID;
BEGIN
    -- Check if the goal already has a virtual account
    SELECT virtual_account_id INTO v_existing_account_id
    FROM savings_goals
    WHERE id = p_goal_id;
    
    IF v_existing_account_id IS NOT NULL THEN
        -- Account already exists, return it
        RETURN v_existing_account_id;
    END IF;
    
    -- Create a virtual account for the goal
    -- Get default currency if not provided
    IF p_currency_id IS NULL THEN
        SELECT id INTO p_currency_id FROM currencies WHERE code = 'USD' LIMIT 1;
    END IF;
    
    INSERT INTO accounts (user_id, name, type, balance, currency_id, is_virtual_account, description)
    VALUES (
        p_user_id,
        'Virtual: ' || p_goal_name,
        'platform',
        0,
        p_currency_id,
        TRUE,
        'Virtual account for savings goal: ' || p_goal_name
    )
    RETURNING id INTO v_account_id;
    
    -- Update the savings goal with the virtual account reference
    UPDATE savings_goals
    SET virtual_account_id = v_account_id,
        updated_at = NOW()
    WHERE id = p_goal_id;
    
    RETURN v_account_id;
END;
$$;

-- Add trigger to automatically create virtual account when custom goal is created
CREATE OR REPLACE FUNCTION auto_create_virtual_account_for_custom_goal()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_account_id UUID;
    v_currency_id UUID;
BEGIN
    -- Only create virtual account for custom goals
    IF NEW.goal_type = 'custom' AND NEW.virtual_account_id IS NULL THEN
        -- Get the user's default currency
        SELECT default_currency_id INTO v_currency_id
        FROM financial_settings
        WHERE user_id = NEW.user_id
        AND end_date IS NULL
        ORDER BY created_at DESC
        LIMIT 1;
        
        -- Fallback to USD if no default currency found
        IF v_currency_id IS NULL THEN
            SELECT id INTO v_currency_id FROM currencies WHERE code = 'USD' LIMIT 1;
        END IF;
        
        -- Create virtual account
        INSERT INTO accounts (user_id, name, type, balance, currency_id, is_virtual_account, description)
        VALUES (
            NEW.user_id,
            'Virtual: ' || NEW.name,
            'platform',
            0,
            v_currency_id,
            TRUE,
            'Virtual account for savings goal: ' || NEW.name
        )
        RETURNING id INTO v_account_id;
        
        -- Update the NEW record with virtual_account_id
        NEW.virtual_account_id := v_account_id;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create trigger for automatic virtual account creation
DROP TRIGGER IF EXISTS trigger_auto_create_virtual_account ON savings_goals;
CREATE TRIGGER trigger_auto_create_virtual_account
    BEFORE INSERT ON savings_goals
    FOR EACH ROW
    EXECUTE FUNCTION auto_create_virtual_account_for_custom_goal();

-- Add a function to validate deposits to goals
CREATE OR REPLACE FUNCTION validate_deposit_has_virtual_account()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    goal_virtual_account UUID;
BEGIN
    -- If depositing to a goal, ensure it has a virtual account
    IF NEW.goal_id IS NOT NULL THEN
        SELECT virtual_account_id INTO goal_virtual_account
        FROM savings_goals
        WHERE id = NEW.goal_id;
        
        IF goal_virtual_account IS NULL THEN
            RAISE EXCEPTION 'La meta no tiene cuenta virtual asociada. Por favor contacte al administrador.';
        END IF;
        
        -- Automatically set the virtual_account_id if not provided
        IF NEW.virtual_account_id IS NULL THEN
            NEW.virtual_account_id := goal_virtual_account;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create trigger to validate deposits
DROP TRIGGER IF EXISTS trigger_validate_deposit_virtual_account ON savings_deposits;
CREATE TRIGGER trigger_validate_deposit_virtual_account
    BEFORE INSERT ON savings_deposits
    FOR EACH ROW
    EXECUTE FUNCTION validate_deposit_has_virtual_account();

-- Improve the transfer_funds_on_deposit function to handle edge cases
CREATE OR REPLACE FUNCTION transfer_funds_on_deposit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    source_balance DECIMAL(10,2);
BEGIN
    -- Step 1: Deduct from source account if provided
    IF NEW.source_account_id IS NOT NULL THEN
        -- Check source account has sufficient balance
        SELECT balance INTO source_balance
        FROM accounts
        WHERE id = NEW.source_account_id;
        
        IF source_balance < NEW.amount THEN
            RAISE EXCEPTION 'Saldo insuficiente en la cuenta de origen';
        END IF;
        
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
$$;

-- Improve the revert_deposit_transfer function to prevent negative balances
CREATE OR REPLACE FUNCTION revert_deposit_transfer()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Step 1: Return funds to source account
    IF OLD.source_account_id IS NOT NULL THEN
        UPDATE accounts
        SET balance = balance + OLD.amount,
            updated_at = NOW()
        WHERE id = OLD.source_account_id;
    END IF;
    
    -- Step 2: Deduct from virtual account
    IF OLD.virtual_account_id IS NOT NULL THEN
        UPDATE accounts
        SET balance = GREATEST(0, balance - OLD.amount),
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
$$;

-- Comments
COMMENT ON FUNCTION create_missing_virtual_accounts() IS 'Creates virtual accounts for all custom goals that are missing one';
COMMENT ON FUNCTION auto_create_virtual_account_for_custom_goal() IS 'Trigger function to automatically create virtual accounts for new custom goals';
COMMENT ON FUNCTION validate_deposit_has_virtual_account() IS 'Validates that deposits to goals have associated virtual accounts';
