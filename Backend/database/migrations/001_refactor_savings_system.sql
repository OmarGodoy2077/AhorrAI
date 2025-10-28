-- Migration: 001_refactor_savings_system.sql
-- Description: Refactor savings system to support manual deposits instead of automatic savings
-- Date: 2025-10-27

-- ==========================================
-- 1. ADD NEW COLUMNS TO savings_goals TABLE
-- ==========================================
ALTER TABLE savings_goals
ADD COLUMN goal_type TEXT DEFAULT 'custom' CHECK (goal_type IN ('monthly', 'global', 'custom')),
ADD COLUMN target_date DATE,
ADD COLUMN is_monthly_target BOOLEAN DEFAULT FALSE;

-- Migrate existing data: old primary goals become 'global'
UPDATE savings_goals
SET goal_type = 'global'
WHERE is_primary = TRUE;

-- Migrate remaining as 'custom'
UPDATE savings_goals
SET goal_type = 'custom'
WHERE goal_type = 'custom' AND is_primary = FALSE;

-- Create unique index for monthly target (only one per user)
CREATE UNIQUE INDEX idx_savings_goals_monthly_target
ON savings_goals(user_id)
WHERE is_monthly_target = TRUE;

-- ==========================================
-- 2. UPDATE financial_settings TABLE
-- ==========================================
ALTER TABLE financial_settings
ADD COLUMN monthly_savings_target DECIMAL(10,2) CHECK (monthly_savings_target >= 0);

-- ==========================================
-- 3. CREATE savings_deposits TABLE
-- ==========================================
CREATE TABLE savings_deposits (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    goal_id UUID NOT NULL REFERENCES savings_goals(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    deposit_date DATE DEFAULT CURRENT_DATE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on savings_deposits
ALTER TABLE savings_deposits ENABLE ROW LEVEL SECURITY;

-- RLS Policies for savings_deposits
CREATE POLICY "Users can view own savings deposits" ON savings_deposits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own savings deposits" ON savings_deposits FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own savings deposits" ON savings_deposits FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own savings deposits" ON savings_deposits FOR DELETE USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_savings_deposits_goal_id ON savings_deposits(goal_id);
CREATE INDEX idx_savings_deposits_user_id ON savings_deposits(user_id);
CREATE INDEX idx_savings_deposits_deposit_date ON savings_deposits(deposit_date);

-- Trigger to update updated_at on savings_deposits
CREATE TRIGGER update_savings_deposits_updated_at BEFORE UPDATE ON savings_deposits FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- 4. CREATE FUNCTION TO UPDATE SAVINGS GOALS
-- ==========================================
CREATE OR REPLACE FUNCTION update_savings_from_deposits()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_id_val UUID;
    global_goal_id UUID;
    global_amount DECIMAL(10,2);
BEGIN
    user_id_val := NEW.user_id;
    
    -- Update the specific goal's current_amount
    UPDATE savings_goals
    SET current_amount = (
        SELECT COALESCE(SUM(amount), 0)
        FROM savings_deposits
        WHERE goal_id = NEW.goal_id
    ),
    updated_at = NOW()
    WHERE id = NEW.goal_id;
    
    -- Update the global goal's current_amount (sum of all deposits from all goals)
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
        ),
        updated_at = NOW()
        WHERE id = global_goal_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- 5. CREATE TRIGGERS FOR DEPOSITS
-- ==========================================
CREATE TRIGGER trigger_update_savings_on_deposit_insert
    AFTER INSERT ON savings_deposits
    FOR EACH ROW EXECUTE FUNCTION update_savings_from_deposits();

CREATE TRIGGER trigger_update_savings_on_deposit_update
    AFTER UPDATE ON savings_deposits
    FOR EACH ROW EXECUTE FUNCTION update_savings_from_deposits();

-- For delete operations, we need a similar function
CREATE OR REPLACE FUNCTION update_savings_from_deposits_delete()
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
    
    -- Update the global goal's current_amount
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
        ),
        updated_at = NOW()
        WHERE id = global_goal_id;
    END IF;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_savings_on_deposit_delete
    AFTER DELETE ON savings_deposits
    FOR EACH ROW EXECUTE FUNCTION update_savings_from_deposits_delete();

-- ==========================================
-- 6. MODIFY update_summaries() FUNCTION
-- ==========================================
-- Remove automatic savings logic from the summaries trigger
-- The function now only updates summaries, not savings goals
CREATE OR REPLACE FUNCTION update_summaries()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    target_year INTEGER;
    target_month INTEGER;
    user_id_val UUID;
    total_inc DECIMAL(10,2);
    total_exp DECIMAL(10,2);
    net_change_val DECIMAL(10,2);
BEGIN
    -- Determine the year and month based on the table
    IF TG_TABLE_NAME = 'income_sources' THEN
        target_year := EXTRACT(YEAR FROM NEW.created_at);
        target_month := EXTRACT(MONTH FROM NEW.created_at);
        user_id_val := NEW.user_id;
    ELSIF TG_TABLE_NAME = 'expenses' THEN
        target_year := EXTRACT(YEAR FROM NEW.date);
        target_month := EXTRACT(MONTH FROM NEW.date);
        user_id_val := NEW.user_id;
    ELSE
        RETURN NULL;
    END IF;

    -- Calculate totals for the month
    SELECT COALESCE(SUM(amount), 0) INTO total_inc
    FROM income_sources
    WHERE user_id = user_id_val AND EXTRACT(YEAR FROM created_at) = target_year AND EXTRACT(MONTH FROM created_at) = target_month;

    SELECT COALESCE(SUM(amount), 0) INTO total_exp
    FROM expenses
    WHERE user_id = user_id_val AND EXTRACT(YEAR FROM date) = target_year AND EXTRACT(MONTH FROM date) = target_month;

    net_change_val := total_inc - total_exp;

    -- Upsert monthly summary
    INSERT INTO monthly_summaries (user_id, year, month, total_income, total_expenses, net_change)
    VALUES (user_id_val, target_year, target_month, total_inc, total_exp, net_change_val)
    ON CONFLICT (user_id, year, month) DO UPDATE SET
        total_income = EXCLUDED.total_income,
        total_expenses = EXCLUDED.total_expenses,
        net_change = EXCLUDED.net_change;

    -- Recalculate yearly summary based on monthly summaries
    SELECT COALESCE(SUM(total_income), 0), COALESCE(SUM(total_expenses), 0)
    INTO total_inc, total_exp
    FROM monthly_summaries
    WHERE user_id = user_id_val AND year = target_year;

    net_change_val := total_inc - total_exp;

    -- Upsert yearly summary
    INSERT INTO yearly_summaries (user_id, year, total_income, total_expenses, net_change)
    VALUES (user_id_val, target_year, total_inc, total_exp, net_change_val)
    ON CONFLICT (user_id, year) DO UPDATE SET
        total_income = EXCLUDED.total_income,
        total_expenses = EXCLUDED.total_expenses,
        net_change = EXCLUDED.net_change;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- 7. ROLLBACK NOTES
-- ==========================================
-- To rollback this migration:
-- DROP TRIGGER IF EXISTS trigger_update_savings_on_deposit_delete ON savings_deposits;
-- DROP TRIGGER IF EXISTS trigger_update_savings_on_deposit_update ON savings_deposits;
-- DROP TRIGGER IF EXISTS trigger_update_savings_on_deposit_insert ON savings_deposits;
-- DROP FUNCTION IF EXISTS update_savings_from_deposits_delete();
-- DROP FUNCTION IF EXISTS update_savings_from_deposits();
-- DROP TABLE IF EXISTS savings_deposits;
-- ALTER TABLE financial_settings DROP COLUMN IF EXISTS monthly_savings_target;
-- DROP INDEX IF EXISTS idx_savings_goals_monthly_target;
-- ALTER TABLE savings_goals DROP COLUMN IF EXISTS target_date;
-- ALTER TABLE savings_goals DROP COLUMN IF EXISTS is_monthly_target;
-- ALTER TABLE savings_goals DROP COLUMN IF EXISTS goal_type;
