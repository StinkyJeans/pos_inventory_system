-- Profiles: link auth users to roles (admin | pos)
-- Run in Supabase SQL Editor after enabling Email auth in Authentication → Providers.

-- Table: one row per app user, role controls access (admin = full admin, pos = POS only)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'pos' CHECK (role IN ('admin', 'pos')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile (needed to check role in the app)
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

-- Only service role or trigger can insert/update (no policy = anon cannot)
-- So we use a trigger to create profile on signup:
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, role)
  VALUES (NEW.id, 'pos')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- To promote a user to admin, run in SQL Editor (use the UUID from Authentication → Users):
-- UPDATE public.profiles SET role = 'admin' WHERE user_id = 'paste-user-uuid-here';
