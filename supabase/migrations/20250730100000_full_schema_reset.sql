/*
# [CRITICAL] Full Database Reset
This script will completely reset the library's database schema. It is designed to fix inconsistencies from previous failed migrations.

## Query Description:
- **THIS IS A DESTRUCTIVE OPERATION.** It will permanently delete the 'circulation', 'feedback', 'books', 'members', and 'categories' tables and all data they contain.
- This is necessary to ensure a clean and correct database structure that matches the application code.
- **Backup any essential data before running this script.**

## Metadata:
- Schema-Category: "Dangerous"
- Impact-Level: "High"
- Requires-Backup: true
- Reversible: false

## Structure Details:
- Tables to be DROPPED: circulation, feedback, books, members, categories
- Tables to be CREATED: categories, members, books, feedback, circulation
- All related functions and RLS policies will also be recreated.

## Security Implications:
- RLS Status: Will be re-enabled on all tables.
- Policy Changes: Yes, policies will be reset to the correct state.

## Performance Impact:
- Indexes: All indexes will be recreated.
- Triggers: All triggers will be recreated.
- Estimated Impact: A full reset will resolve performance issues related to a corrupted schema.
*/

-- Drop existing objects in reverse order of dependency, using CASCADE to handle relationships
DROP TABLE IF EXISTS public.circulation CASCADE;
DROP TABLE IF EXISTS public.feedback CASCADE;
DROP TABLE IF EXISTS public.books CASCADE;
DROP TABLE IF EXISTS public.members CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;

-- Drop functions if they exist to ensure they are recreated correctly
DROP FUNCTION IF EXISTS public.issue_book(uuid, uuid, date);
DROP FUNCTION IF EXISTS public.return_book(uuid);
DROP FUNCTION IF EXISTS public.add_category(text);
DROP FUNCTION IF EXISTS public.delete_category(uuid);


-- Create Categories Table
CREATE TABLE public.categories (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    name text NOT NULL UNIQUE,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Allow admin full access" ON public.categories FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Create Members Table
CREATE TABLE public.members (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    name text NOT NULL,
    email text NOT NULL UNIQUE,
    phone text,
    address text,
    membership_date timestamp with time zone DEFAULT now() NOT NULL,
    membership_type text DEFAULT 'regular'::text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    place text,
    register_number text,
    class text
);
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access" ON public.members FOR SELECT USING (true);
CREATE POLICY "Allow admin full access" ON public.members FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Create Books Table
CREATE TABLE public.books (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    title text NOT NULL,
    author text NOT NULL,
    isbn text UNIQUE,
    ddc_number text,
    publication_year integer,
    publisher text,
    total_copies integer DEFAULT 1 NOT NULL,
    available_copies integer DEFAULT 1 NOT NULL,
    status text DEFAULT 'available'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
    language text,
    price numeric(10,2)
);
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access" ON public.books FOR SELECT USING (true);
CREATE POLICY "Allow admin full access" ON public.books FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
CREATE INDEX idx_books_title ON public.books USING gin (to_tsvector('english', title));
CREATE INDEX idx_books_author ON public.books USING gin (to_tsvector('english', author));

-- Create Feedback Table
CREATE TABLE public.feedback (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    member_id uuid NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
    book_id uuid REFERENCES public.books(id) ON DELETE SET NULL,
    rating integer,
    review text,
    feedback_type text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    suggestion_title text,
    suggestion_author text,
    suggestion_reason text
);
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow users to submit feedback" ON public.feedback FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow admin full access" ON public.feedback FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Create Circulation Table
CREATE TABLE public.circulation (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    book_id uuid NOT NULL REFERENCES public.books(id) ON DELETE RESTRICT,
    member_id uuid NOT NULL REFERENCES public.members(id) ON DELETE RESTRICT,
    issue_date timestamp with time zone DEFAULT now() NOT NULL,
    due_date date NOT NULL,
    return_date timestamp with time zone,
    status text DEFAULT 'issued'::text NOT NULL,
    fine_amount numeric(10,2) DEFAULT 0,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.circulation ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow admin full access" ON public.circulation FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Functions
CREATE OR REPLACE FUNCTION public.issue_book(p_book_id uuid, p_member_id uuid, p_due_date date)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.books
  SET available_copies = available_copies - 1
  WHERE id = p_book_id AND available_copies > 0;

  IF FOUND THEN
    INSERT INTO public.circulation (book_id, member_id, due_date, status)
    VALUES (p_book_id, p_member_id, p_due_date, 'issued');
  ELSE
    RAISE EXCEPTION 'Book not available';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.return_book(p_circulation_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_book_id uuid;
BEGIN
  UPDATE public.circulation
  SET status = 'returned', return_date = now()
  WHERE id = p_circulation_id AND status = 'issued'
  RETURNING book_id INTO v_book_id;

  IF FOUND THEN
    UPDATE public.books
    SET available_copies = available_copies + 1
    WHERE id = v_book_id;
  ELSE
    RAISE EXCEPTION 'Circulation record not found or already returned';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.add_category(p_name text)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.categories(name) VALUES (p_name);
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_category(p_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM public.categories WHERE id = p_id;
END;
$$;

-- Grant permissions on functions to authenticated users
GRANT EXECUTE ON FUNCTION public.issue_book(uuid, uuid, date) TO service_role;
GRANT EXECUTE ON FUNCTION public.return_book(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.add_category(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.delete_category(uuid) TO service_role;

-- Enable Realtime
alter publication supabase_realtime add table books, categories, members, circulation, feedback;
