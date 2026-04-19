-- ============================================================
--  CLEANUP REDUNDANT TABLES AFTER SCHEMA CONSOLIDATION
-- ============================================================
-- This script drops the old redundant tables that were consolidated
-- into the new schema. Run AFTER verifying all data is migrated.

-- Step 1: Drop old asset_status_history table
DROP TABLE IF EXISTS asset_status_history CASCADE;

-- Step 2: Drop old asset_movements table
DROP TABLE IF EXISTS asset_movements CASCADE;

-- Step 3: Drop old monitors table
DROP TABLE IF EXISTS monitors CASCADE;

-- ============================================================
--  VERIFICATION QUERIES
-- ============================================================
-- Run these to verify the cleanup:

-- Show remaining tables
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check activity_logs to ensure data is intact
SELECT COUNT(*) as total_logs FROM activity_logs;

-- Check assets table (should have units and monitors)
SELECT type, COUNT(*) as count FROM assets GROUP BY type;
