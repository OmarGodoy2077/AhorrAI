
-- Salary schedules table for managing recurring salary generation
CREATE TABLE salary_schedules (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    amount DECIMAL(10,2) CHECK (amount > 0),
    frequency TEXT CHECK (frequency IN ('monthly', 'weekly')),
    start_date DATE DEFAULT CURRENT_DATE,
    salary_day INTEGER CHECK (salary_day BETWEEN 1 AND 31), -- Day of month for monthly, day of week for weekly
    currency_id UUID REFERENCES currencies(id) DEFAULT NULL,
    account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
    last_generated_date DATE,
    next_generation_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);