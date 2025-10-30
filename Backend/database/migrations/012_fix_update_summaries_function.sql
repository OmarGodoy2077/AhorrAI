-- Fix update_summaries function to handle DELETE operations

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
    -- Determine the year and month based on the operation and table
    IF TG_OP = 'DELETE' THEN
        -- For DELETE operations, use OLD values
        IF TG_TABLE_NAME = 'income_sources' THEN
            target_year := EXTRACT(YEAR FROM OLD.created_at);
            target_month := EXTRACT(MONTH FROM OLD.created_at);
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

    -- Note: Automatic savings to goals has been removed.
    -- Savings are now tracked manually via savings_deposits table.

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;