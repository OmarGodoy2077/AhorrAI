-- Migration 024: Fix update_summaries function to use income_date and only count confirmed incomes
-- This fixes the issue where incomes were being counted in the wrong month and unconfirmed incomes were being included

-- Drop the old function
DROP FUNCTION IF EXISTS update_summaries() CASCADE;

-- Recreate the function with correct logic
CREATE OR REPLACE FUNCTION update_summaries()
RETURNS TRIGGER AS $$
DECLARE
    target_year INTEGER;
    target_month INTEGER;
    user_id_val UUID;
    total_inc DECIMAL(10,2);
    total_exp DECIMAL(10,2);
    net_change_val DECIMAL(10,2);
BEGIN
    -- Determine the year and month based on the operation and table
    IF TG_OP = 'DELETE' THEN
        -- For DELETE operations, use OLD values
        IF TG_TABLE_NAME = 'income_sources' THEN
            -- Use income_date for determining the month/year
            target_year := EXTRACT(YEAR FROM OLD.income_date);
            target_month := EXTRACT(MONTH FROM OLD.income_date);
            user_id_val := OLD.user_id;
        ELSIF TG_TABLE_NAME = 'expenses' THEN
            target_year := EXTRACT(YEAR FROM OLD.date);
            target_month := EXTRACT(MONTH FROM OLD.date);
            user_id_val := OLD.user_id;
        ELSE
            RETURN NULL;
        END IF;
    ELSE
        -- For INSERT and UPDATE operations, use NEW values
        IF TG_TABLE_NAME = 'income_sources' THEN
            -- Use income_date for determining the month/year
            target_year := EXTRACT(YEAR FROM NEW.income_date);
            target_month := EXTRACT(MONTH FROM NEW.income_date);
            user_id_val := NEW.user_id;
        ELSIF TG_TABLE_NAME = 'expenses' THEN
            target_year := EXTRACT(YEAR FROM NEW.date);
            target_month := EXTRACT(MONTH FROM NEW.date);
            user_id_val := NEW.user_id;
        ELSE
            RETURN NULL;
        END IF;
    END IF;

    -- Calculate totals for the month
    -- ONLY COUNT CONFIRMED INCOMES (is_confirmed = true)
    SELECT COALESCE(SUM(amount), 0) INTO total_inc
    FROM income_sources
    WHERE user_id = user_id_val 
        AND EXTRACT(YEAR FROM income_date) = target_year 
        AND EXTRACT(MONTH FROM income_date) = target_month
        AND is_confirmed = true;

    SELECT COALESCE(SUM(amount), 0) INTO total_exp
    FROM expenses
    WHERE user_id = user_id_val 
        AND EXTRACT(YEAR FROM date) = target_year 
        AND EXTRACT(MONTH FROM date) = target_month;

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

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

-- Recreate the triggers
DROP TRIGGER IF EXISTS trigger_update_summaries_on_income_insert ON income_sources;
DROP TRIGGER IF EXISTS trigger_update_summaries_on_income_update ON income_sources;
DROP TRIGGER IF EXISTS trigger_update_summaries_on_income_delete ON income_sources;
DROP TRIGGER IF EXISTS trigger_update_summaries_on_expense_insert ON expenses;
DROP TRIGGER IF EXISTS trigger_update_summaries_on_expense_update ON expenses;
DROP TRIGGER IF EXISTS trigger_update_summaries_on_expense_delete ON expenses;

CREATE TRIGGER trigger_update_summaries_on_income_insert
    AFTER INSERT ON income_sources
    FOR EACH ROW EXECUTE FUNCTION update_summaries();

CREATE TRIGGER trigger_update_summaries_on_income_update
    AFTER UPDATE ON income_sources
    FOR EACH ROW EXECUTE FUNCTION update_summaries();

CREATE TRIGGER trigger_update_summaries_on_income_delete
    AFTER DELETE ON income_sources
    FOR EACH ROW EXECUTE FUNCTION update_summaries();

CREATE TRIGGER trigger_update_summaries_on_expense_insert
    AFTER INSERT ON expenses
    FOR EACH ROW EXECUTE FUNCTION update_summaries();

CREATE TRIGGER trigger_update_summaries_on_expense_update
    AFTER UPDATE ON expenses
    FOR EACH ROW EXECUTE FUNCTION update_summaries();

CREATE TRIGGER trigger_update_summaries_on_expense_delete
    AFTER DELETE ON expenses
    FOR EACH ROW EXECUTE FUNCTION update_summaries();

-- Now recalculate all existing monthly_summaries correctly
-- This will fix the current incorrect data
DO $$
DECLARE
    user_rec RECORD;
    month_year_rec RECORD;
    total_inc DECIMAL(10,2);
    total_exp DECIMAL(10,2);
BEGIN
    -- For each user
    FOR user_rec IN SELECT DISTINCT user_id FROM income_sources
    LOOP
        -- Get all unique month/year combinations from their income_sources and expenses
        FOR month_year_rec IN 
            SELECT DISTINCT 
                EXTRACT(YEAR FROM income_date)::INTEGER as year,
                EXTRACT(MONTH FROM income_date)::INTEGER as month
            FROM income_sources
            WHERE user_id = user_rec.user_id
            UNION
            SELECT DISTINCT 
                EXTRACT(YEAR FROM date)::INTEGER as year,
                EXTRACT(MONTH FROM date)::INTEGER as month
            FROM expenses
            WHERE user_id = user_rec.user_id
        LOOP
            -- Calculate correct totals for this month
            SELECT COALESCE(SUM(amount), 0) INTO total_inc
            FROM income_sources
            WHERE user_id = user_rec.user_id 
                AND EXTRACT(YEAR FROM income_date) = month_year_rec.year
                AND EXTRACT(MONTH FROM income_date) = month_year_rec.month
                AND is_confirmed = true;

            SELECT COALESCE(SUM(amount), 0) INTO total_exp
            FROM expenses
            WHERE user_id = user_rec.user_id 
                AND EXTRACT(YEAR FROM date) = month_year_rec.year
                AND EXTRACT(MONTH FROM date) = month_year_rec.month;

            -- Update or insert the monthly summary
            INSERT INTO monthly_summaries (user_id, year, month, total_income, total_expenses, net_change)
            VALUES (user_rec.user_id, month_year_rec.year, month_year_rec.month, total_inc, total_exp, total_inc - total_exp)
            ON CONFLICT (user_id, year, month) DO UPDATE SET
                total_income = EXCLUDED.total_income,
                total_expenses = EXCLUDED.total_expenses,
                net_change = EXCLUDED.net_change;
        END LOOP;
    END LOOP;
END $$;
