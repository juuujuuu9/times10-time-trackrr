-- Fix manual duration entries that have incorrect startTime and endTime values
-- These entries should have startTime: null and endTime: null

-- First, let's see what problematic entries exist
SELECT 
    id,
    "userId",
    "projectId",
    "startTime",
    "endTime",
    "durationManual",
    "notes",
    "createdAt"
FROM time_entries 
WHERE "durationManual" IS NOT NULL 
  AND "startTime" IS NOT NULL 
  AND "endTime" IS NOT NULL;

-- Update the problematic entries to have null startTime and endTime
UPDATE time_entries 
SET 
    "startTime" = NULL,
    "endTime" = NULL,
    "updatedAt" = NOW()
WHERE "durationManual" IS NOT NULL 
  AND "startTime" IS NOT NULL 
  AND "endTime" IS NOT NULL;

-- Verify the fix
SELECT 
    COUNT(*) as remaining_problematic_entries
FROM time_entries 
WHERE "durationManual" IS NOT NULL 
  AND "startTime" IS NOT NULL 
  AND "endTime" IS NOT NULL;
