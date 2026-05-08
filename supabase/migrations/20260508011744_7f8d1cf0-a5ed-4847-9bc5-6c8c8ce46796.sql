CREATE TABLE public.changes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  change_type TEXT NOT NULL DEFAULT 'component_swap',
  component_ref TEXT,
  description TEXT,
  impact JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.changes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own change select" ON public.changes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own change insert" ON public.changes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own change update" ON public.changes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own change delete" ON public.changes FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_changes_user ON public.changes(user_id, created_at DESC);