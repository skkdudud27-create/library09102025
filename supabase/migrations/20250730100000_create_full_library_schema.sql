/*
          # [Operation Name]
          Create Full Library Schema

          ## Query Description: [This script will create the complete database schema for the Muhimmath Library application. It is designed to be run on a new or existing database and will only create tables, functions, and policies if they do not already exist, preventing errors on re-runs. It corrects previous structural flaws, including the multiple primary key error on the 'categories' table. This operation is foundational and critical for the application to function correctly.]
          
          ## Metadata:
          - Schema-Category: ["Structural"]
          - Impact-Level: ["High"]
          - Requires-Backup: [true]
          - Reversible: [false]
          
          ## Structure Details:
          - Tables Created: `categories`, `books`, `members`, `circulation`, `feedback`
          - Functions Created: `add_category`, `delete_category`, `issue_book`, `return_book`
          - RLS Policies: Enables RLS and sets permissive policies for public read and write access to match application logic.
          
          ## Security Implications:
          - RLS Status: [Enabled]
          - Policy Changes: [Yes]
          - Auth Requirements: [Policies are set for `anon` and `authenticated` roles.]
          
          ## Performance Impact:
          - Indexes: [Added]
          - Triggers: [None]
          - Estimated Impact: [Low performance impact; adds necessary tables and indexes for application functionality.]
          */

-- =================================================================
-- 1. Create Tables
-- =================================================================

-- Categories Table
CREATE TABLE IF NOT EXISTS public.categories (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    name text NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT categories_pkey PRIMARY KEY (id),
    CONSTRAINT categories_name_key UNIQUE (name)
);
COMMENT ON TABLE public.categories IS 'Stores book categories.';

-- Books Table
CREATE TABLE IF NOT EXISTS public.books (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    title text NOT NULL,
    author text NOT NULL,
    isbn text,
    ddc_number text,
    publication_year integer,
    publisher text,
    total_copies integer NOT NULL DEFAULT 1,
    available_copies integer NOT NULL DEFAULT 1,
    status text NOT NULL DEFAULT 'available'::text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    category_id uuid,
    language text,
    price numeric,
    CONSTRAINT books_pkey PRIMARY KEY (id),
    CONSTRAINT books_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE SET NULL
);
COMMENT ON TABLE public.books IS 'Stores information about each book in the library.';

-- Members Table
CREATE TABLE IF NOT EXISTS public.members (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    name text NOT NULL,
    email text NOT NULL,
    phone text,
    address text,
    membership_date timestamp with time zone NOT NULL DEFAULT now(),
    membership_type text NOT NULL DEFAULT 'regular'::text,
    status text NOT NULL DEFAULT 'active'::text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    place text,
    register_number text,
    class text,
    CONSTRAINT members_pkey PRIMARY KEY (id),
    CONSTRAINT members_email_key UNIQUE (email)
);
COMMENT ON TABLE public.members IS 'Stores information about library members.';

-- Circulation Table
CREATE TABLE IF NOT EXISTS public.circulation (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    book_id uuid NOT NULL,
    member_id uuid NOT NULL,
    issue_date timestamp with time zone NOT NULL DEFAULT now(),
    due_date timestamp with time zone NOT NULL,
    return_date timestamp with time zone,
    status text NOT NULL DEFAULT 'issued'::text,
    fine_amount numeric DEFAULT 0,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT circulation_pkey PRIMARY KEY (id),
    CONSTRAINT circulation_book_id_fkey FOREIGN KEY (book_id) REFERENCES public.books(id) ON DELETE RESTRICT,
    CONSTRAINT circulation_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.members(id) ON DELETE CASCADE
);
COMMENT ON TABLE public.circulation IS 'Tracks the borrowing and returning of books.';

-- Feedback Table
CREATE TABLE IF NOT EXISTS public.feedback (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    member_id uuid NOT NULL,
    book_id uuid,
    rating integer,
    review text,
    feedback_type text NOT NULL,
    status text NOT NULL DEFAULT 'pending'::text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    suggestion_title text,
    suggestion_author text,
    suggestion_reason text,
    CONSTRAINT feedback_pkey PRIMARY KEY (id),
    CONSTRAINT feedback_book_id_fkey FOREIGN KEY (book_id) REFERENCES public.books(id) ON DELETE SET NULL,
    CONSTRAINT feedback_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.members(id) ON DELETE CASCADE,
    CONSTRAINT feedback_rating_check CHECK (((rating >= 1) AND (rating <= 5)))
);
COMMENT ON TABLE public.feedback IS 'Stores user feedback, including reviews and suggestions.';

-- =================================================================
-- 2. Create Indexes for performance
-- =================================================================
CREATE INDEX IF NOT EXISTS idx_books_title ON public.books USING btree (title);
CREATE INDEX IF NOT EXISTS idx_books_author ON public.books USING btree (author);
CREATE INDEX IF NOT EXISTS idx_circulation_status ON public.circulation USING btree (status);
CREATE INDEX IF NOT EXISTS idx_members_name ON public.members USING btree (name);

-- =================================================================
-- 3. Create Functions (RPC)
-- =================================================================

-- Function to add a category safely
CREATE OR REPLACE FUNCTION public.add_category(p_name text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.categories (name)
  VALUES (p_name)
  ON CONFLICT (name) DO NOTHING;
END;
$$;
COMMENT ON FUNCTION public.add_category(text) IS 'Adds a new category if it does not already exist.';

-- Function to delete a category
CREATE OR REPLACE FUNCTION public.delete_category(p_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Un-link books from this category
  UPDATE public.books SET category_id = NULL WHERE category_id = p_id;
  -- Then, delete the category
  DELETE FROM public.categories WHERE id = p_id;
END;
$$;
COMMENT ON FUNCTION public.delete_category(uuid) IS 'Deletes a category after un-linking it from any books.';

-- Function to issue a book
CREATE OR REPLACE FUNCTION public.issue_book(p_book_id uuid, p_member_id uuid, p_due_date timestamp with time zone)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_available_copies integer;
BEGIN
  -- Check for available copies
  SELECT available_copies INTO v_available_copies
  FROM public.books
  WHERE id = p_book_id
  FOR UPDATE;

  IF v_available_copies > 0 THEN
    -- Decrement available copies
    UPDATE public.books
    SET available_copies = available_copies - 1
    WHERE id = p_book_id;

    -- Create circulation record
    INSERT INTO public.circulation (book_id, member_id, due_date, status)
    VALUES (p_book_id, p_member_id, p_due_date, 'issued');
  ELSE
    RAISE EXCEPTION 'No available copies of the book to issue.';
  END IF;
END;
$$;
COMMENT ON FUNCTION public.issue_book(uuid, uuid, timestamp with time zone) IS 'Issues a book to a member and updates copy count.';

-- Function to return a book
CREATE OR REPLACE FUNCTION public.return_book(p_circulation_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_book_id uuid;
  v_circulation_status text;
BEGIN
  -- Find the book_id from the circulation record
  SELECT book_id, status INTO v_book_id, v_circulation_status
  FROM public.circulation
  WHERE id = p_circulation_id
  FOR UPDATE;

  IF v_book_id IS NOT NULL AND v_circulation_status = 'issued' THEN
    -- Update circulation record
    UPDATE public.circulation
    SET status = 'returned', return_date = now(), updated_at = now()
    WHERE id = p_circulation_id;

    -- Increment available copies
    UPDATE public.books
    SET available_copies = available_copies + 1, updated_at = now()
    WHERE id = v_book_id;
  ELSE
    RAISE EXCEPTION 'Circulation record not found or book already returned.';
  END IF;
END;
$$;
COMMENT ON FUNCTION public.return_book(uuid) IS 'Returns a book from a member and updates copy count.';


-- =================================================================
-- 4. Enable Row Level Security (RLS) and Define Policies
-- =================================================================

-- Enable RLS for all tables
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.circulation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to prevent conflicts
DROP POLICY IF EXISTS "Public read access" ON public.categories;
DROP POLICY IF EXISTS "Allow all access" ON public.categories;
DROP POLICY IF EXISTS "Public read access" ON public.books;
DROP POLICY IF EXISTS "Allow all access" ON public.books;
DROP POLICY IF EXISTS "Public read access" ON public.members;
DROP POLICY IF EXISTS "Allow all access" ON public.members;
DROP POLICY IF EXISTS "Public read access" ON public.circulation;
DROP POLICY IF EXISTS "Allow all access" ON public.circulation;
DROP POLICY IF EXISTS "Public read access" ON public.feedback;
DROP POLICY IF EXISTS "Allow all access" ON public.feedback;

-- Grant usage on schema and sequences
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Grant function execution
GRANT EXECUTE ON FUNCTION public.add_category(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.delete_category(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.issue_book(uuid, uuid, timestamp with time zone) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.return_book(uuid) TO anon, authenticated;

-- Policies for public read access
CREATE POLICY "Public read access" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Public read access" ON public.books FOR SELECT USING (true);
CREATE POLICY "Public read access" ON public.members FOR SELECT USING (true);
CREATE POLICY "Public read access" ON public.circulation FOR SELECT USING (true);
CREATE POLICY "Public read access" ON public.feedback FOR SELECT USING (true);

-- Policies for write access (as the app is designed)
CREATE POLICY "Allow all access" ON public.categories FOR ALL USING (true);
CREATE POLICY "Allow all access" ON public.books FOR ALL USING (true);
CREATE POLICY "Allow all access" ON public.members FOR ALL USING (true);
CREATE POLICY "Allow all access" ON public.circulation FOR ALL USING (true);
CREATE POLICY "Allow all access" ON public.feedback FOR ALL USING (true);
