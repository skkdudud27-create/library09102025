-- Create custom enum types if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'feedback_type_enum') THEN
        CREATE TYPE public.feedback_type_enum AS ENUM ('book_review', 'service_feedback', 'suggestion');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'feedback_status_enum') THEN
        CREATE TYPE public.feedback_status_enum AS ENUM ('pending', 'approved', 'rejected');
    END IF;
END$$;

/*
# Create Feedback Table
This migration creates the `feedback` table, which is essential for storing user suggestions and book reviews. The table was missing, causing application errors.

## Query Description: This operation is structural and safe. It creates a new table `public.feedback` to store user-submitted reviews and suggestions. It includes columns for linking to members and books, storing ratings, review text, and suggestion details. It also sets up foreign key constraints to maintain data integrity with the `members` and `books` tables. No existing data is affected.

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: true (can be dropped)

## Structure Details:
- Table Created: `public.feedback`
- Columns: `id`, `created_at`, `member_id`, `book_id`, `rating`, `review`, `feedback_type`, `status`, `suggestion_title`, `suggestion_author`, `suggestion_reason`
- Foreign Keys:
  - `feedback_member_id_fkey` -> `public.members(id)`
  - `feedback_book_id_fkey` -> `public.books(id)`

## Security Implications:
- RLS Status: Enabled
- Policy Changes: Yes. New policies are created to allow public inserts and authenticated reads/updates.
- Auth Requirements: `anon` and `authenticated` roles for inserts, `authenticated` role for all other operations.

## Performance Impact:
- Indexes: A primary key index is created on `id`. Indexes are also created for the foreign key columns `member_id` and `book_id`.
- Triggers: None
- Estimated Impact: Low. This is a new table and will not impact performance until it is populated with data.
*/

-- Create the feedback table
CREATE TABLE IF NOT EXISTS public.feedback (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    member_id uuid NOT NULL,
    book_id uuid,
    rating integer,
    review text,
    feedback_type public.feedback_type_enum NOT NULL,
    status public.feedback_status_enum NOT NULL DEFAULT 'pending'::public.feedback_status_enum,
    suggestion_title text,
    suggestion_author text,
    suggestion_reason text,
    CONSTRAINT feedback_pkey PRIMARY KEY (id),
    CONSTRAINT feedback_rating_check CHECK (((rating >= 1) AND (rating <= 5))),
    CONSTRAINT feedback_book_id_fkey FOREIGN KEY (book_id) REFERENCES public.books(id) ON DELETE SET NULL,
    CONSTRAINT feedback_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.members(id) ON DELETE CASCADE
);

-- Add comments to the table and columns
COMMENT ON TABLE public.feedback IS 'Stores user feedback, including book reviews and suggestions.';
COMMENT ON COLUMN public.feedback.rating IS 'Star rating from 1 to 5 for book reviews.';
COMMENT ON COLUMN public.feedback.feedback_type IS 'Distinguishes between different types of feedback.';
COMMENT ON COLUMN public.feedback.status IS 'The moderation status of the feedback entry.';


-- Enable Row Level Security
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
-- 1. Allow anyone to insert feedback (for suggestion/review modals on home page)
CREATE POLICY "Allow public insert access"
ON public.feedback
FOR INSERT
WITH CHECK (true);

-- 2. Allow authenticated users (admins) to view all feedback
CREATE POLICY "Allow admin read access"
ON public.feedback
FOR SELECT
USING (auth.role() = 'authenticated');

-- 3. Allow authenticated users (admins) to update feedback (e.g., change status)
CREATE POLICY "Allow admin update access"
ON public.feedback
FOR UPDATE
USING (auth.role() = 'authenticated');

-- 4. Allow authenticated users (admins) to delete feedback
CREATE POLICY "Allow admin delete access"
ON public.feedback
FOR DELETE
USING (auth.role() = 'authenticated');
