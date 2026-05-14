ALTER TABLE public.boms ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS boms_project_idx ON public.boms(project_id);

ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS suppliers_project_idx ON public.suppliers(project_id);

ALTER TABLE public.lead_time_entries ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE;

ALTER TABLE public.purchase_requisitions ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE;

ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS documents_project_idx ON public.documents(project_id);

ALTER TABLE public.requirements ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS requirements_project_idx ON public.requirements(project_id);