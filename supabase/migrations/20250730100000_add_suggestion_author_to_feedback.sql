/*
          # [Operation Name]
          Add suggestion_author to feedback table

          ## Query Description: [This operation adds a new 'suggestion_author' text column to the 'feedback' table. This is a non-destructive change required to fix an error when users submit book suggestions, as the frontend application was trying to save author information that the database could not store. This change is safe to apply and will not affect existing data.]
          
          ## Metadata:
          - Schema-Category: ["Structural"]
          - Impact-Level: ["Low"]
          - Requires-Backup: [false]
          - Reversible: [true]
          
          ## Structure Details:
          - Table: feedback
          - Column Added: suggestion_author (TEXT)
          
          ## Security Implications:
          - RLS Status: [Enabled]
          - Policy Changes: [No]
          - Auth Requirements: [None]
          
          ## Performance Impact:
          - Indexes: [None]
          - Triggers: [None]
          - Estimated Impact: [Negligible performance impact. The column is added without a default value, so the operation should be fast on most table sizes.]
          */

ALTER TABLE public.feedback
ADD COLUMN suggestion_author TEXT;
