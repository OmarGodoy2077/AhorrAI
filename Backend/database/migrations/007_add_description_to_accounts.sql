-- Migration 007: Add description column to accounts table
-- Date: 2025-10-28

ALTER TABLE accounts ADD COLUMN description TEXT;