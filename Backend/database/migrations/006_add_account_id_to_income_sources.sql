-- Migration 006: Add account_id column to income_sources table
-- Date: 2025-10-28

ALTER TABLE income_sources ADD COLUMN account_id UUID REFERENCES accounts(id) ON DELETE SET NULL;