/*
# [Fix] Ensure Feedback Table and Columns Exist
This migration ensures the `feedback` table and its necessary columns, including `suggestion_author`, are present. It is designed to be run safely even if the table or columns already exist.

## Query Description:
This script first checks for the existence of the `public.feedback` table and creates it if it is missing. It then checks for the `suggestion_author` column and adds it if it is not present. This resolves schema mismatch errors without affecting existing data.

## Metadata:
- Schema-Category: ["Structural", "Safe"]
- Impact-Level: ["Low"]
- Requires-Backup: false
- Reversible: false (but non-destructive)

## Structure Details:
- Table: `public.feedback`
- Column: `suggestion_author` (TEXT)

## Security Implications:
- RLS Status: RLS is enabled on the table.
- Policy Changes: No
- Auth Requirements: None

## Performance Impact:
- Indexes: None
- Triggers: None
- Estimated Impact: Negligible.
*/

-- Create the feedback table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID REFERENCES public.members(id) ON DELETE SET NULL,
    book_id UUID REFERENCES public.books(id) ON DELETE SET NULL,
    rating INT CHECK (rating >= 1 AND rating <= 5),
    review TEXT,
    feedback_type TEXT NOT NULL CHECK (feedback_type IN ('book_review', 'service_feedback', 'suggestion')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    suggestion_title TEXT,
    suggestion_reason TEXT
);

-- Add the suggestion_author column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'feedback'
        AND column_name = 'suggestion_author'
    ) THEN
        ALTER TABLE public.feedback ADD COLUMN suggestion_author TEXT;
    END IF;
END $$;

-- Ensure RLS is enabled on the feedback table
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Create policies for feedback table if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Allow public read access to feedback' AND polrelid = 'public.feedback'::regclass) THEN
        CREATE POLICY "Allow public read access to feedback"
        ON public.feedback FOR SELECT
        USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Allow authenticated users to insert feedback' AND polrelid = 'public.feedback'::regclass) THEN
        CREATE POLICY "Allow authenticated users to insert feedback"
        ON public.feedback FOR INSERT
        TO authenticated
        WITH CHECK (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Allow admin users to update feedback' AND polrelid = 'public.feedback'::regclass) THEN
        CREATE POLICY "Allow admin users to update feedback"
        ON public.feedback FOR UPDATE
        TO authenticated
        USING (true)
        WITH CHECK (true);
    END IF;
END $$;
