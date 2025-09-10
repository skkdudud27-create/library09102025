/*
          # [Operation Name]
          Create Full Library Schema

          ## Query Description: [This script creates the complete database schema required for the Muhimmath Library application. It defines all necessary tables, columns, relationships, and security policies. It is designed to be run on a new or incomplete database to establish the correct structure without affecting existing data if tables already exist. This is a foundational setup operation.]
          
          ## Metadata:
          - Schema-Category: ["Structural"]
          - Impact-Level: ["High"]
          - Requires-Backup: [false]
          - Reversible: [false]
          
          ## Structure Details:
          - Creates tables: categories, books, members, circulation, feedback
          - Defines columns, primary keys, and foreign keys for all tables.
          - Enables Row Level Security (RLS) on all tables.
          - Creates policies to allow public read access (SELECT) on all tables.
          - Creates policies to allow authenticated users to perform all actions (INSERT, UPDATE, DELETE).
          - Creates server-side SQL functions: issue_book, return_book, add_category, delete_category.
          
          ## Security Implications:
          - RLS Status: [Enabled]
          - Policy Changes: [Yes]
          - Auth Requirements: [Authenticated users for write operations]
          
          ## Performance Impact:
          - Indexes: [Primary keys and foreign keys are indexed by default]
          - Triggers: [None]
          - Estimated Impact: [Low impact on a new database. Establishes the baseline schema.]
          */

-- 1. Categories Table
CREATE TABLE IF NOT EXISTS public.categories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE ONLY public.categories ADD CONSTRAINT categories_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.categories ADD CONSTRAINT categories_name_key UNIQUE (name);

CREATE POLICY "Allow public read access" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Allow all access for authenticated users" ON public.categories FOR ALL USING (auth.role() = 'authenticated');

-- 2. Books Table
CREATE TABLE IF NOT EXISTS public.books (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    author text NOT NULL,
    isbn text,
    ddc_number text,
    publication_year integer,
    publisher text,
    total_copies integer DEFAULT 1 NOT NULL,
    available_copies integer DEFAULT 1 NOT NULL,
    status public.book_status DEFAULT 'available'::public.book_status NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    category_id uuid,
    language public.book_language,
    price numeric(10,2)
);

ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE ONLY public.books ADD CONSTRAINT books_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.books ADD CONSTRAINT books_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE SET NULL;
CREATE POLICY "Allow public read access" ON public.books FOR SELECT USING (true);
CREATE POLICY "Allow all access for authenticated users" ON public.books FOR ALL USING (auth.role() = 'authenticated');

-- 3. Members Table
CREATE TABLE IF NOT EXISTS public.members (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    phone text,
    address text,
    membership_date timestamp with time zone DEFAULT now() NOT NULL,
    membership_type public.membership_type DEFAULT 'regular'::public.membership_type NOT NULL,
    status public.member_status DEFAULT 'active'::public.member_status NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    place text,
    register_number text,
    class text
);

ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE ONLY public.members ADD CONSTRAINT members_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.members ADD CONSTRAINT members_email_key UNIQUE (email);
CREATE POLICY "Allow public read access" ON public.members FOR SELECT USING (true);
CREATE POLICY "Allow all access for authenticated users" ON public.members FOR ALL USING (auth.role() = 'authenticated');

-- 4. Circulation Table
CREATE TABLE IF NOT EXISTS public.circulation (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    book_id uuid NOT NULL,
    member_id uuid NOT NULL,
    issue_date timestamp with time zone DEFAULT now() NOT NULL,
    due_date timestamp with time zone NOT NULL,
    return_date timestamp with time zone,
    status public.circulation_status DEFAULT 'issued'::public.circulation_status NOT NULL,
    fine_amount numeric(10,2) DEFAULT 0.00,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.circulation ENABLE ROW LEVEL SECURITY;
ALTER TABLE ONLY public.circulation ADD CONSTRAINT circulation_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.circulation ADD CONSTRAINT circulation_book_id_fkey FOREIGN KEY (book_id) REFERENCES public.books(id);
ALTER TABLE ONLY public.circulation ADD CONSTRAINT circulation_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.members(id) ON DELETE CASCADE;
CREATE POLICY "Allow public read access" ON public.circulation FOR SELECT USING (true);
CREATE POLICY "Allow all access for authenticated users" ON public.circulation FOR ALL USING (auth.role() = 'authenticated');

-- 5. Feedback Table
CREATE TABLE IF NOT EXISTS public.feedback (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    member_id uuid NOT NULL,
    book_id uuid,
    rating integer,
    review text,
    feedback_type public.feedback_type NOT NULL,
    status public.feedback_status DEFAULT 'pending'::public.feedback_status NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    suggestion_title text,
    suggestion_author text,
    suggestion_reason text
);

ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE ONLY public.feedback ADD CONSTRAINT feedback_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.feedback ADD CONSTRAINT feedback_book_id_fkey FOREIGN KEY (book_id) REFERENCES public.books(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.feedback ADD CONSTRAINT feedback_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.members(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.feedback ADD CONSTRAINT feedback_rating_check CHECK (((rating >= 1) AND (rating <= 5)));
CREATE POLICY "Allow public read access" ON public.feedback FOR SELECT USING (true);
CREATE POLICY "Allow all access for authenticated users" ON public.feedback FOR ALL USING (auth.role() = 'authenticated');

-- 6. Functions
CREATE OR REPLACE FUNCTION public.issue_book(p_book_id uuid, p_member_id uuid, p_due_date timestamp with time zone)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.books
  SET available_copies = available_copies - 1
  WHERE id = p_book_id AND available_copies > 0;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Book not available';
  END IF;

  INSERT INTO public.circulation (book_id, member_id, due_date, status)
  VALUES (p_book_id, p_member_id, p_due_date, 'issued');
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
  END IF;
END;
$$;

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

CREATE OR REPLACE FUNCTION public.delete_category(p_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.categories WHERE id = p_id;
END;
$$;

-- Grant permissions on functions to authenticated users
GRANT EXECUTE ON FUNCTION public.issue_book(uuid, uuid, timestamp with time zone) TO authenticated;
GRANT EXECUTE ON FUNCTION public.return_book(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_category(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_category(uuid) TO authenticated;
