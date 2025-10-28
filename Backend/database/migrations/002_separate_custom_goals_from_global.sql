-- ==========================================
-- MIGRATION: 002_separate_custom_goals_from_global
-- PURPOSE: Separate custom goals from global accumulation
-- DATE: 2025-10-27
-- ==========================================

-- Add column to identify custom goals that should not be included in global
ALTER TABLE savings_goals
ADD COLUMN is_custom_excluded_from_global BOOLEAN DEFAULT FALSE;

-- Update existing goals
-- Goals with goal_type='custom' should be excluded from global by default
UPDATE savings_goals
SET is_custom_excluded_from_global = TRUE
WHERE goal_type = 'custom';

-- Create index for performance
CREATE INDEX idx_savings_goals_excluded_from_global 
ON savings_goals(user_id, is_custom_excluded_from_global);

-- ==========================================
-- UPDATE FUNCTIONS: Modify to exclude custom goals
-- ==========================================

-- Function to update savings goals from deposits (MODIFIED)
-- Now excludes custom goals from global accumulation
CREATE OR REPLACE FUNCTION update_savings_from_deposits()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_id_val UUID;
    global_goal_id UUID;
    depositing_goal_is_custom BOOLEAN;
BEGIN
    user_id_val := NEW.user_id;
    
    -- Check if the goal being deposited to is excluded from global
    SELECT is_custom_excluded_from_global INTO depositing_goal_is_custom
    FROM savings_goals
    WHERE id = NEW.goal_id;
    
    -- Update the specific goal's current_amount
    UPDATE savings_goals
    SET current_amount = (
        SELECT COALESCE(SUM(amount), 0)
        FROM savings_deposits
        WHERE goal_id = NEW.goal_id
    ),
    updated_at = NOW()
    WHERE id = NEW.goal_id;
    
    -- Update the global goal's current_amount (sum of ALL deposits EXCEPT custom goals)
    SELECT id INTO global_goal_id
    FROM savings_goals
    WHERE user_id = user_id_val AND goal_type = 'global';
    
    IF global_goal_id IS NOT NULL THEN
        UPDATE savings_goals
        SET current_amount = (
            SELECT COALESCE(SUM(sd.amount), 0)
            FROM savings_deposits sd
            JOIN savings_goals sg ON sd.goal_id = sg.id
            WHERE sg.user_id = user_id_val 
            AND sg.is_custom_excluded_from_global = FALSE
        ),
        updated_at = NOW()
        WHERE id = global_goal_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to handle delete operations on deposits (MODIFIED)
-- Now excludes custom goals from global accumulation
CREATE OR REPLACE FUNCTION updat    e_savings_from_deposits_delete()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_id_val UUID;
    global_goal_id UUID;
BEGIN
    user_id_val := OLD.user_id;
    
    -- Update the specific goal's current_amount
    UPDATE savings_goals
    SET current_amount = (
        SELECT COALESCE(SUM(amount), 0)
        FROM savings_deposits
        WHERE goal_id = OLD.goal_id
    ),
    updated_at = NOW()
    WHERE id = OLD.goal_id;
    
    -- Update the global goal's current_amount (excluding custom goals)
    SELECT id INTO global_goal_id
    FROM savings_goals
    WHERE user_id = user_id_val AND goal_type = 'global';
    
    IF global_goal_id IS NOT NULL THEN
        UPDATE savings_goals
        SET current_amount = (
            SELECT COALESCE(SUM(sd.amount), 0)
            FROM savings_deposits sd
            JOIN savings_goals sg ON sd.goal_id = sg.id
            WHERE sg.user_id = user_id_val 
            AND sg.is_custom_excluded_from_global = FALSE
        ),
        updated_at = NOW()
        WHERE id = global_goal_id;
    END IF;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- COMMENTS FOR REFERENCE
-- ==========================================

-- is_custom_excluded_from_global: 
--   - TRUE: This goal is a custom/personal goal (car, vacation, etc) - NOT included in global
--   - FALSE: This goal contributes to global accumulation (monthly target, other tracked goals)
--   - Default: FALSE (goals included in global unless explicitly marked as custom)

-- target_date (existing column): Optional deadline for achieving the goal
--   - Can be set for any goal type (monthly, custom, global)
--   - When goal is achieved before target_date -> early success
--   - When goal is not achieved by target_date -> overdue

-- Example usage:
-- Monthly goal: target_amount=1500/month, target_date=2025-12-31, is_custom_excluded_from_global=FALSE
-- Global goal: target_amount=150000, target_date=2026-12-31, is_custom_excluded_from_global=FALSE
-- Custom goal (car): target_amount=50000, target_date=2026-06-30, is_custom_excluded_from_global=TRUE
