-- Migration: Make description column nullable in expenses table
-- Date: 2025-10-28

ALTER TABLE expenses ALTER COLUMN description DROP NOT NULL;