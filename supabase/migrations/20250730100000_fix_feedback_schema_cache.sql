/*
# [Fix] Add suggestion_author column and reload schema cache
This migration ensures the 'suggestion_author' column exists in the 'feedback' table and forces the API schema cache to reload. This is intended to fix persistent "column not found" errors even after a successful migration.

## Query Description:
- This operation is safe and non-destructive.
- It first checks if the `suggestion_author` column exists before attempting to add it, preventing errors on re-runs.
- It then sends a notification to the PostgREST service to reload its schema, which should resolve caching issues.

## Metadata:
- Schema-Category: ["Safe", "Structural"]
- Impact-Level: ["Low"]
- Requires-Backup: false
- Reversible: true

## Structure Details:
- Table: `public.feedback`
- Column Added: `suggestion_author` (type: text)

## Security Implications:
- RLS Status: Unchanged
- Policy Changes: No
- Auth Requirements: None

## Performance Impact:
- Indexes: None
- Triggers: None
- Estimated Impact: Negligible. A one-time schema cache reload.
*/

-- Safely add the column if it does not exist
ALTER TABLE IF EXISTS public.feedback
ADD COLUMN IF NOT EXISTS suggestion_author text;

-- Notify PostgREST to reload the schema cache to fix "column not found" errors
NOTIFY pgrst, 'reload schema';
