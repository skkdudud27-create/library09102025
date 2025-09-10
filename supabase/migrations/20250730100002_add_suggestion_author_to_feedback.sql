/*
          # [Operation Name]
          Add suggestion_author column to feedback table

          ## Query Description: [This operation adds a 'suggestion_author' text column to the 'feedback' table. This is required to fix an error when users submit book suggestions, as the application is trying to save the author's name but the column does not exist in the database. This is a safe, non-destructive change.]
          
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
          - Auth Requirements: [None for this migration]
          
          ## Performance Impact:
          - Indexes: [None]
          - Triggers: [None]
          - Estimated Impact: [Negligible. Adding a nullable column is a metadata-only change.]
          */
ALTER TABLE public.feedback
ADD COLUMN IF NOT EXISTS suggestion_author TEXT;
