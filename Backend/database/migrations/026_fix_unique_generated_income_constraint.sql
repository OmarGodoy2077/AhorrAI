-- Migration 026: Fix unique constraint for generated incomes to support multiple salary schedules
-- The previous constraint used (user_id, name, income_date, type) but the 'name' was always 
-- "Salario <month> <year>" regardless of which schedule generated it, causing conflicts
-- when users had multiple salary schedules.

-- Drop the old constraint
DROP INDEX IF EXISTS idx_unique_generated_income;

-- Create a better constraint that uses description (which includes the schedule name)
-- This allows multiple schedules to generate incomes for the same date
-- The description format is: "Generado desde: <schedule_name> - <frequency>"
CREATE UNIQUE INDEX idx_unique_generated_income 
ON income_sources (user_id, description, income_date, type) 
WHERE (description LIKE 'Generado desde:%');

-- Note: The controller code has been updated to include the schedule name in the income name
-- Example: "Social Media octubre 2025" instead of just "Salario octubre 2025"
-- This makes it clearer to users which schedule generated each income
