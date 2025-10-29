-- Migration: Add description column to income_sources table
-- Date: 2025-10-28

ALTER TABLE income_sources ADD COLUMN description TEXT;