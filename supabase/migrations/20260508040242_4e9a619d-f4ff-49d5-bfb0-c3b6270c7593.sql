
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TABLE public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  product_description text NOT NULL,
  industry text NOT NULL,
  gate_standard text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  active_phase_index integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own project select" ON public.projects FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own project insert" ON public.projects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own project update" ON public.projects FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own project delete" ON public.projects FOR DELETE USING (auth.uid() = user_id);

CREATE TABLE public.project_phases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  phase_index integer NOT NULL,
  title text NOT NULL,
  subtitle text,
  badge_color text NOT NULL DEFAULT 'teal',
  tasks jsonb NOT NULL DEFAULT '[]'::jsonb,
  outputs jsonb NOT NULL DEFAULT '[]'::jsonb,
  gate_criteria jsonb NOT NULL DEFAULT '[]'::jsonb,
  gate_checked jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'not_started',
  locked boolean NOT NULL DEFAULT false,
  custom boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.project_phases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own phase select" ON public.project_phases FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own phase insert" ON public.project_phases FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own phase update" ON public.project_phases FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own phase delete" ON public.project_phases FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX idx_project_phases_project ON public.project_phases(project_id, phase_index);

CREATE TABLE public.project_phase_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phase_id uuid NOT NULL REFERENCES public.project_phases(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  output_key text NOT NULL,
  document_id uuid,
  artifact_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.project_phase_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own ppd select" ON public.project_phase_documents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own ppd insert" ON public.project_phase_documents FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own ppd update" ON public.project_phase_documents FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own ppd delete" ON public.project_phase_documents FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER trg_projects_updated BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_project_phases_updated BEFORE UPDATE ON public.project_phases FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
