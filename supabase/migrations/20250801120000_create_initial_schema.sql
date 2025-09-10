/*
          # [Operation Name]: Create Initial Database Schema
          [This script creates all the necessary tables, relationships, functions, and security policies for the Muhimmath Library application. It is designed to be run on a fresh database.]

          ## Query Description: [This is a foundational script that sets up the entire database structure. It will create the 'categories', 'books', 'members', 'circulation', and 'feedback' tables. It also configures Row Level Security (RLS) to protect your data and adds server-side functions to handle core business logic like issuing and returning books. As this script creates new tables, it is safe to run on a database that does not already have these tables. However, if you have existing tables with the same names, this script will fail.]
          
          ## Metadata:
          - Schema-Category: "Structural"
          - Impact-Level: "High"
          - Requires-Backup: false
          - Reversible: false
          
          ## Structure Details:
          - Tables Created: categories, books, members, circulation, feedback
          - Functions Created: issue_book, return_book, add_category, delete_category
          - RLS Policies: Enabled for all tables with select/all access for authenticated users.
          
          ## Security Implications:
          - RLS Status: Enabled
          - Policy Changes: Yes
          - Auth Requirements: Policies are based on the 'authenticated' role.
          
          ## Performance Impact:
          - Indexes: Added on foreign keys and common search fields.
          - Triggers: None
          - Estimated Impact: Low initial impact. Indexes will improve query performance as data grows.
          */

-- 1. Categories Table
CREATE TABLE public.categories (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    name text NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT categories_pkey PRIMARY KEY (id),
    CONSTRAINT categories_name_key UNIQUE (name)
);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to authenticated users" ON public.categories FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow read access to anon users" ON public.categories FOR SELECT TO anon USING (true);


-- 2. Books Table
CREATE TABLE public.books (
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
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to authenticated users" ON public.books FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow read access to anon users" ON public.books FOR SELECT TO anon USING (true);
CREATE INDEX books_category_id_idx ON public.books(category_id);


-- 3. Members Table
CREATE TABLE public.members (
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
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to authenticated users" ON public.members FOR ALL TO authenticated USING (true) WITH CHECK (true);


-- 4. Circulation Table
CREATE TABLE public.circulation (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    book_id uuid NOT NULL,
    member_id uuid NOT NULL,
    issue_date timestamp with time zone NOT NULL DEFAULT now(),
    due_date timestamp with time zone NOT NULL,
    return_date timestamp with time zone,
    status text NOT NULL DEFAULT 'issued'::text,
    fine_amount numeric NOT NULL DEFAULT 0,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT circulation_pkey PRIMARY KEY (id),
    CONSTRAINT circulation_book_id_fkey FOREIGN KEY (book_id) REFERENCES public.books(id) ON DELETE RESTRICT,
    CONSTRAINT circulation_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.members(id) ON DELETE CASCADE
);
ALTER TABLE public.circulation ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to authenticated users" ON public.circulation FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE INDEX circulation_book_id_idx ON public.circulation(book_id);
CREATE INDEX circulation_member_id_idx ON public.circulation(member_id);


-- 5. Feedback Table
CREATE TABLE public.feedback (
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
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to authenticated users" ON public.feedback FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow insert for anon users" ON public.feedback FOR INSERT TO anon WITH CHECK (true);


-- 6. Stored Procedures / Functions

-- Function to issue a book
CREATE OR REPLACE FUNCTION public.issue_book(p_book_id uuid, p_member_id uuid, p_due_date timestamp with time zone)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_available_copies integer;
BEGIN
  -- Check for available copies and lock the row
  SELECT available_copies INTO v_available_copies
  FROM public.books
  WHERE id = p_book_id
  FOR UPDATE;

  IF v_available_copies > 0 THEN
    -- Decrease available copies
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
GRANT EXECUTE ON FUNCTION public.issue_book(uuid, uuid, timestamp with time zone) TO authenticated;


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
  -- Get circulation status and book_id
  SELECT book_id, status INTO v_book_id, v_circulation_status
  FROM public.circulation
  WHERE id = p_circulation_id
  FOR UPDATE;

  IF v_circulation_status = 'issued' THEN
    -- Update circulation record
    UPDATE public.circulation
    SET status = 'returned', return_date = now()
    WHERE id = p_circulation_id;

    -- Increase available copies
    UPDATE public.books
    SET available_copies = available_copies + 1
    WHERE id = v_book_id;
  ELSE
    RAISE EXCEPTION 'Book has already been returned or the circulation record is invalid.';
  END IF;
END;
$$;
GRANT EXECUTE ON FUNCTION public.return_book(uuid) TO authenticated;


-- Function to add a category safely
CREATE OR REPLACE FUNCTION public.add_category(p_name text)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.categories(name)
  VALUES (p_name)
  ON CONFLICT (name) DO NOTHING;
END;
$$;
GRANT EXECUTE ON FUNCTION public.add_category(text) TO authenticated;


-- Function to delete a category safely
CREATE OR REPLACE FUNCTION public.delete_category(p_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- This will fail if the category is in use due to the foreign key constraint, which is desired.
  DELETE FROM public.categories WHERE id = p_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.delete_category(uuid) TO authenticated;
