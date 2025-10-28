                -- Schema for AhorraAI Backend
-- Using Supabase PostgreSQL
-- Last Updated: 2025-10-28
-- Migration 004: Fixed profile creation with database trigger

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table for additional user info (linked to Supabase Auth)
CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (id)
);

-- ==========================================
-- PROFILE AUTO-CREATION TRIGGER
-- ==========================================
-- This trigger automatically creates a profile when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NULL),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Financial settings table for dynamic salary
CREATE TABLE financial_settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    salary DECIMAL(10,2) CHECK (salary >= 0),
    monthly_savings_target DECIMAL(10,2) CHECK (monthly_savings_target >= 0),
    start_date DATE DEFAULT CURRENT_DATE,
    end_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Income sources table
CREATE TABLE income_sources (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT CHECK (type IN ('fixed', 'variable', 'extra')),
    amount DECIMAL(10,2) CHECK (amount >= 0),
    frequency TEXT CHECK (frequency IN ('monthly', 'weekly', 'one-time')),
    currency_id UUID REFERENCES currencies(id) DEFAULT NULL,
    is_confirmed BOOLEAN DEFAULT FALSE,
    confirmed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Currencies table
CREATE TABLE currencies (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    symbol TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Accounts/Banks table for available money
CREATE TABLE accounts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT CHECK (type IN ('cash', 'bank', 'platform')),
    balance DECIMAL(10,2) DEFAULT 0 CHECK (balance >= 0),
    currency_id UUID REFERENCES currencies(id) DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Spending limits table for monthly budgets
CREATE TABLE spending_limits (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    monthly_limit DECIMAL(10,2) CHECK (monthly_limit > 0),
    year INTEGER NOT NULL,
    month INTEGER CHECK (month BETWEEN 1 AND 12),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (user_id, year, month)
);

-- Categories for expenses
CREATE TABLE categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT CHECK (type IN ('necessary', 'unnecessary')),
    parent_category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    custom_label TEXT,
    color TEXT, -- For UI
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Expenses table
CREATE TABLE expenses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    amount DECIMAL(10,2) CHECK (amount > 0),
    date DATE DEFAULT CURRENT_DATE,
    type TEXT CHECK (type IN ('fixed', 'variable')),
    account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
    currency_id UUID REFERENCES currencies(id) DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Monthly summaries table for quick access
CREATE TABLE monthly_summaries (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    month INTEGER CHECK (month BETWEEN 1 AND 12),
    total_income DECIMAL(10,2) DEFAULT 0,
    total_expenses DECIMAL(10,2) DEFAULT 0,
    net_change DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (user_id, year, month)
);

-- Yearly summaries table
CREATE TABLE yearly_summaries (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    total_income DECIMAL(10,2) DEFAULT 0,
    total_expenses DECIMAL(10,2) DEFAULT 0,
    net_change DECIMAL(10,2) DEFAULT 0,
    start_balance DECIMAL(10,2) DEFAULT 0,
    end_balance DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (user_id, year)
);

-- Loans table for user loans
CREATE TABLE loans (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    amount DECIMAL(10,2) CHECK (amount > 0),
    interest_rate DECIMAL(5,2) CHECK (interest_rate >= 0),
    start_date DATE DEFAULT CURRENT_DATE,
    end_date DATE,
    remaining_balance DECIMAL(10,2) DEFAULT 0,
    status TEXT CHECK (status IN ('active', 'paid', 'overdue')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Savings goals table
CREATE TABLE savings_goals (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    target_amount DECIMAL(10,2) CHECK (target_amount > 0),
    current_amount DECIMAL(10,2) DEFAULT 0,
    start_date DATE DEFAULT CURRENT_DATE,
    end_date DATE,
    goal_type TEXT DEFAULT 'custom' CHECK (goal_type IN ('monthly', 'global', 'custom')),
    target_date DATE,
    is_monthly_target BOOLEAN DEFAULT FALSE,
    is_custom_excluded_from_global BOOLEAN DEFAULT FALSE,
    status TEXT CHECK (status IN ('active', 'completed', 'paused')),
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Savings deposits table for tracking manual deposits
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

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to handle new user creation (auto-create profile)
-- Updated: 2025-10-28 - Removed salary and savings_goal fields
-- These are now managed separately in financial_settings and savings_goals tables
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE 
  SET 
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    updated_at = NOW();
    
  RETURN NEW;
END;
$$;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger to automatically create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_financial_settings_updated_at BEFORE UPDATE ON financial_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_income_sources_updated_at BEFORE UPDATE ON income_sources FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON expenses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_spending_limits_updated_at BEFORE UPDATE ON spending_limits FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_loans_updated_at BEFORE UPDATE ON loans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_savings_goals_updated_at BEFORE UPDATE ON savings_goals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_savings_deposits_updated_at BEFORE UPDATE ON savings_deposits FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE income_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE spending_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE yearly_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE savings_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE savings_deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE currencies ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles with better service_role handling
CREATE POLICY "Enable read for users"
    ON profiles FOR SELECT
    USING (
        auth.role() = 'authenticated' AND 
        auth.uid() = id
    );

CREATE POLICY "Enable update for users"
    ON profiles FOR UPDATE
    USING (
        auth.role() = 'authenticated' AND 
        auth.uid() = id
    )
    WITH CHECK (
        auth.role() = 'authenticated' AND 
        auth.uid() = id
    );

CREATE POLICY "Enable insert for signup"
    ON profiles FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Admin access"
    ON profiles FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY "Users can view own financial settings" ON financial_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own financial settings" ON financial_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own financial settings" ON financial_settings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own financial settings" ON financial_settings FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own income sources" ON income_sources FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own income sources" ON income_sources FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own income sources" ON income_sources FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own income sources" ON income_sources FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own accounts" ON accounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own accounts" ON accounts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own accounts" ON accounts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own accounts" ON accounts FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own categories" ON categories FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own categories" ON categories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own categories" ON categories FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own categories" ON categories FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own spending limits" ON spending_limits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own spending limits" ON spending_limits FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own spending limits" ON spending_limits FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own spending limits" ON spending_limits FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own expenses" ON expenses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own expenses" ON expenses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own expenses" ON expenses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own expenses" ON expenses FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own monthly summaries" ON monthly_summaries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own monthly summaries" ON monthly_summaries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own monthly summaries" ON monthly_summaries FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own yearly summaries" ON yearly_summaries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own yearly summaries" ON yearly_summaries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own yearly summaries" ON yearly_summaries FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own loans" ON loans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own loans" ON loans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own loans" ON loans FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own loans" ON loans FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own savings goals" ON savings_goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own savings goals" ON savings_goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own savings goals" ON savings_goals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own savings goals" ON savings_goals FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own savings deposits" ON savings_deposits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own savings deposits" ON savings_deposits FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own savings deposits" ON savings_deposits FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own savings deposits" ON savings_deposits FOR DELETE USING (auth.uid() = user_id);

-- Currencies are public
CREATE POLICY "Anyone can view currencies" ON currencies FOR SELECT TO PUBLIC USING (true);

-- Function to update account balance on income/expense insert/update/delete
CREATE OR REPLACE FUNCTION update_account_balance()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- For incomes, add to balance if confirmed and account_id is set
    IF TG_TABLE_NAME = 'income_sources' THEN
        IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
            IF NEW.account_id IS NOT NULL AND NEW.is_confirmed THEN
                UPDATE accounts
                SET balance = balance + NEW.amount,
                    updated_at = NOW()
                WHERE id = NEW.account_id;
            END IF;
        ELSIF TG_OP = 'DELETE' THEN
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

-- Triggers for account balance
CREATE TRIGGER trigger_update_balance_on_expense_insert
    AFTER INSERT ON expenses
    FOR EACH ROW EXECUTE FUNCTION update_account_balance();

CREATE TRIGGER trigger_update_balance_on_expense_update
    AFTER UPDATE ON expenses
    FOR EACH ROW EXECUTE FUNCTION update_account_balance();

CREATE TRIGGER trigger_update_balance_on_expense_delete
    AFTER DELETE ON expenses
    FOR EACH ROW EXECUTE FUNCTION update_account_balance();

-- Function to update monthly and yearly summaries
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
    summary_id UUID;
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

    -- Note: Automatic savings to goals has been removed. 
    -- Savings are now tracked manually via savings_deposits table.

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for income_sources
CREATE TRIGGER trigger_update_summaries_on_income_insert
    AFTER INSERT ON income_sources
    FOR EACH ROW EXECUTE FUNCTION update_summaries();

CREATE TRIGGER trigger_update_summaries_on_income_update
    AFTER UPDATE ON income_sources
    FOR EACH ROW EXECUTE FUNCTION update_summaries();

CREATE TRIGGER trigger_update_summaries_on_income_delete
    AFTER DELETE ON income_sources
    FOR EACH ROW EXECUTE FUNCTION update_summaries();

CREATE TRIGGER trigger_update_balance_on_income_insert
    AFTER INSERT ON income_sources
    FOR EACH ROW EXECUTE FUNCTION update_account_balance();

CREATE TRIGGER trigger_update_balance_on_income_update
    AFTER UPDATE ON income_sources
    FOR EACH ROW EXECUTE FUNCTION update_account_balance();

CREATE TRIGGER trigger_update_balance_on_income_delete
    AFTER DELETE ON income_sources
    FOR EACH ROW EXECUTE FUNCTION update_account_balance();

-- Triggers for expenses
CREATE TRIGGER trigger_update_summaries_on_expense_insert
    AFTER INSERT ON expenses
    FOR EACH ROW EXECUTE FUNCTION update_summaries();

CREATE TRIGGER trigger_update_summaries_on_expense_update
    AFTER UPDATE ON expenses
    FOR EACH ROW EXECUTE FUNCTION update_summaries();

CREATE TRIGGER trigger_update_summaries_on_expense_delete
    AFTER DELETE ON expenses
    FOR EACH ROW EXECUTE FUNCTION update_summaries();

CREATE TRIGGER trigger_update_balance_on_expense_insert
    AFTER INSERT ON expenses
    FOR EACH ROW EXECUTE FUNCTION update_account_balance();

CREATE TRIGGER trigger_update_balance_on_expense_update
    AFTER UPDATE ON expenses
    FOR EACH ROW EXECUTE FUNCTION update_account_balance();

CREATE TRIGGER trigger_update_balance_on_expense_delete
    AFTER DELETE ON expenses
    FOR EACH ROW EXECUTE FUNCTION update_account_balance();

-- Indexes for performance
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_financial_settings_user_id ON financial_settings(user_id);
CREATE INDEX idx_income_sources_user_id ON income_sources(user_id);
CREATE INDEX idx_accounts_user_id ON accounts(user_id);
CREATE INDEX idx_categories_user_id ON categories(user_id);
CREATE INDEX idx_expenses_user_id ON expenses(user_id);
CREATE INDEX idx_expenses_date ON expenses(date);
CREATE INDEX idx_spending_limits_user_id ON spending_limits(user_id);
CREATE INDEX idx_monthly_summaries_user_id ON monthly_summaries(user_id);
CREATE INDEX idx_yearly_summaries_user_id ON yearly_summaries(user_id);
CREATE INDEX idx_loans_user_id ON loans(user_id);
CREATE INDEX idx_savings_goals_user_id ON savings_goals(user_id);
CREATE INDEX idx_savings_goals_monthly_target ON savings_goals(user_id) WHERE is_monthly_target = TRUE;
CREATE INDEX idx_savings_goals_excluded_from_global ON savings_goals(user_id, is_custom_excluded_from_global);
CREATE INDEX idx_savings_deposits_goal_id ON savings_deposits(goal_id);
CREATE INDEX idx_savings_deposits_user_id ON savings_deposits(user_id);
CREATE INDEX idx_savings_deposits_deposit_date ON savings_deposits(deposit_date);

-- ==========================================
-- SAVINGS DEPOSITS FUNCTIONS AND TRIGGERS
-- ==========================================

-- Function to update savings goals from deposits
-- EXCLUDES custom goals from global accumulation
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

-- Function to handle delete operations on deposits
-- EXCLUDES custom goals from global accumulation
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

-- Triggers for deposits
CREATE TRIGGER trigger_update_savings_on_deposit_insert
    AFTER INSERT ON savings_deposits
    FOR EACH ROW EXECUTE FUNCTION update_savings_from_deposits();

CREATE TRIGGER trigger_update_savings_on_deposit_update
    AFTER UPDATE ON savings_deposits
    FOR EACH ROW EXECUTE FUNCTION update_savings_from_deposits();

CREATE TRIGGER trigger_update_savings_on_deposit_delete
    AFTER DELETE ON savings_deposits
    FOR EACH ROW EXECUTE FUNCTION update_savings_from_deposits_delete();

-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

-- PROFILES TABLE
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
ON profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Service role has full access"
ON profiles
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Enable insert for authenticated users during signup"
ON profiles
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- FINANCIAL_SETTINGS TABLE
ALTER TABLE financial_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own financial settings"
ON financial_settings
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- INCOME_SOURCES TABLE
ALTER TABLE income_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own income sources"
ON income_sources
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- ACCOUNTS TABLE
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own accounts"
ON accounts
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- SPENDING_LIMITS TABLE
ALTER TABLE spending_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own spending limits"
ON spending_limits
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- CATEGORIES TABLE
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own categories"
ON categories
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- EXPENSES TABLE
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own expenses"
ON expenses
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- SAVINGS_GOALS TABLE
ALTER TABLE savings_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own savings goals"
ON savings_goals
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- SAVINGS_DEPOSITS TABLE
ALTER TABLE savings_deposits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own savings deposits"
ON savings_deposits
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- LOANS TABLE
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own loans"
ON loans
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- MONTHLY_SUMMARIES TABLE
ALTER TABLE monthly_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own monthly summaries"
ON monthly_summaries
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- YEARLY_SUMMARIES TABLE
ALTER TABLE yearly_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own yearly summaries"
ON yearly_summaries
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- CURRENCIES TABLE (public read access, no user_id column)
ALTER TABLE currencies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view currencies"
ON currencies
FOR SELECT
TO authenticated, anon
USING (true);

CREATE POLICY "Service role can manage currencies"
ON currencies
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);