
-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  company TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Auto-create profile trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Documents
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  mime_type TEXT,
  size_bytes BIGINT,
  category TEXT,
  summary TEXT,
  key_points JSONB DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'processing',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own docs select" ON public.documents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own docs insert" ON public.documents FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own docs update" ON public.documents FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own docs delete" ON public.documents FOR DELETE USING (auth.uid() = user_id);

-- Requirements
CREATE TABLE public.requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ref_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  subsystem TEXT,
  owner TEXT,
  gate_stage TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.requirements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own req select" ON public.requirements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own req insert" ON public.requirements FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own req update" ON public.requirements FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own req delete" ON public.requirements FOR DELETE USING (auth.uid() = user_id);

-- Trace links
CREATE TABLE public.trace_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  from_req UUID NOT NULL REFERENCES public.requirements(id) ON DELETE CASCADE,
  to_req UUID NOT NULL REFERENCES public.requirements(id) ON DELETE CASCADE,
  link_type TEXT NOT NULL DEFAULT 'derives',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.trace_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own link select" ON public.trace_links FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own link insert" ON public.trace_links FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own link delete" ON public.trace_links FOR DELETE USING (auth.uid() = user_id);

-- Chat messages
CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own msg select" ON public.chat_messages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own msg insert" ON public.chat_messages FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own msg delete" ON public.chat_messages FOR DELETE USING (auth.uid() = user_id);

-- Gate reviews
CREATE TABLE public.gate_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  gate_type TEXT NOT NULL,
  checklist JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'in_progress',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.gate_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own gate select" ON public.gate_reviews FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own gate insert" ON public.gate_reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own gate update" ON public.gate_reviews FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own gate delete" ON public.gate_reviews FOR DELETE USING (auth.uid() = user_id);

-- Storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false);
CREATE POLICY "users read own files" ON storage.objects FOR SELECT
  USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "users upload own files" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "users delete own files" ON storage.objects FOR DELETE
  USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);
