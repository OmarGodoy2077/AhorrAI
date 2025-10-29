-- Migration 005: Add income_date column to income_sources table
-- Date: 2025-10-28

ALTER TABLE income_sources ADD COLUMN income_date DATE DEFAULT CURRENT_DATE;