/*
          # [Schema Fix] Add Missing 'suggestion_author' Column
          [This operation safely adds the 'suggestion_author' column to the 'feedback' table if it does not already exist. This is intended to resolve a persistent schema mismatch error.]

          ## Query Description: [This is a non-destructive operation that will only add a column. It will not modify or delete any existing data. It directly addresses the "column not found" error related to book suggestions.]
          
          ## Metadata:
          - Schema-Category: ["Structural"]
          - Impact-Level: ["Low"]
          - Requires-Backup: [false]
          - Reversible: [true]
          
          ## Structure Details:
          - Table: public.feedback
          - Column Added: suggestion_author (type: text)
          
          ## Security Implications:
          - RLS Status: [No Change]
          - Policy Changes: [No]
          - Auth Requirements: [None]
          
          ## Performance Impact:
          - Indexes: [None]
          - Triggers: [None]
          - Estimated Impact: [Negligible. Adding a nullable column is a fast metadata-only change.]
          */
ALTER TABLE public.feedback
ADD COLUMN IF NOT EXISTS suggestion_author text;
