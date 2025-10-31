-- Add type field to salary_schedules table
-- This allows distinguishing between fixed and average salary types

ALTER TABLE salary_schedules
ADD COLUMN type TEXT CHECK (type IN ('fixed', 'average')) DEFAULT 'fixed';

-- Update existing records to have type 'fixed' (backwards compatibility)
UPDATE salary_schedules SET type = 'fixed' WHERE type IS NULL;