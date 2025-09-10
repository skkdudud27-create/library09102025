/*
  # [Operation Name]
  Add 'suggestion_author' column to the 'feedback' table

  ## Query Description: [This operation adds a new text column named 'suggestion_author' to the 'feedback' table. This change is necessary to store the author's name for book suggestions submitted by users. It is a non-destructive operation and will not affect existing data; the new column will be populated with NULL for existing rows.]

  ## Metadata:
  - Schema-Category: ["Structural"]
  - Impact-Level: ["Low"]
  - Requires-Backup: [false]
  - Reversible: [true]

  ## Structure Details:
  - Table: public.feedback
  - Column Added: suggestion_author (TEXT)

  ## Security Implications:
  - RLS Status: [Enabled]
  - Policy Changes: [No]
  - Auth Requirements: [None for this migration]

  ## Performance Impact:
  - Indexes: [None]
  - Triggers: [None]
  - Estimated Impact: [Negligible performance impact. The table will be slightly larger, but queries will not be significantly affected.]
*/

-- Add the suggestion_author column to the feedback table to fix submission errors.
ALTER TABLE public.feedback
ADD COLUMN IF NOT EXISTS suggestion_author TEXT;
