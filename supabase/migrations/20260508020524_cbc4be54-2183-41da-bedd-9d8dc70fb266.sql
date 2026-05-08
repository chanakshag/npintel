
-- Knowledge sources: academic papers, books, references uploaded by the user
CREATE TABLE public.knowledge_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'paper', -- 'paper' | 'book' | 'standard' | 'article'
  authors TEXT[] DEFAULT '{}',
  year INT,
  venue TEXT,
  doi TEXT,
  abstract TEXT,
  key_findings JSONB NOT NULL DEFAULT '[]'::jsonb,
  tags TEXT[] DEFAULT '{}',
  citation TEXT,
  file_path TEXT,
  mime_type TEXT,
  size_bytes BIGINT,
  status TEXT NOT NULL DEFAULT 'processing', -- 'processing' | 'ready' | 'failed'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.knowledge_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own knowledge select" ON public.knowledge_sources FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own knowledge insert" ON public.knowledge_sources FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own knowledge update" ON public.knowledge_sources FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own knowledge delete" ON public.knowledge_sources FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_knowledge_user_created ON public.knowledge_sources(user_id, created_at DESC);

-- Generated artifacts (PRDs, design docs, spec drafts) synthesized from knowledge sources
CREATE TABLE public.knowledge_artifacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  artifact_type TEXT NOT NULL DEFAULT 'PRD', -- 'PRD' | 'Design Doc' | 'Spec' | 'Literature Review' | 'Test Plan'
  prompt TEXT,
  content TEXT NOT NULL DEFAULT '',
  source_ids UUID[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'generating',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.knowledge_artifacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own artifact select" ON public.knowledge_artifacts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own artifact insert" ON public.knowledge_artifacts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own artifact update" ON public.knowledge_artifacts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own artifact delete" ON public.knowledge_artifacts FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_artifact_user_created ON public.knowledge_artifacts(user_id, created_at DESC);

-- Storage bucket for knowledge uploads (private)
INSERT INTO storage.buckets (id, name, public) VALUES ('knowledge', 'knowledge', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "own knowledge file select" ON storage.objects FOR SELECT
  USING (bucket_id = 'knowledge' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "own knowledge file insert" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'knowledge' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "own knowledge file delete" ON storage.objects FOR DELETE
  USING (bucket_id = 'knowledge' AND auth.uid()::text = (storage.foldername(name))[1]);
