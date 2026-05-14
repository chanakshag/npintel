
-- =========================
-- PART A: schema additions + backfill
-- =========================

-- DOCUMENTS
UPDATE public.documents d SET project_id = (
  SELECT id FROM public.projects p WHERE p.user_id = d.user_id ORDER BY created_at LIMIT 1
) WHERE d.project_id IS NULL;
DELETE FROM public.documents WHERE project_id IS NULL;
ALTER TABLE public.documents ALTER COLUMN project_id SET NOT NULL;

-- REQUIREMENTS
UPDATE public.requirements r SET project_id = (
  SELECT id FROM public.projects p WHERE p.user_id = r.user_id ORDER BY created_at LIMIT 1
) WHERE r.project_id IS NULL;
DELETE FROM public.requirements WHERE project_id IS NULL;
ALTER TABLE public.requirements ALTER COLUMN project_id SET NOT NULL;

-- TRACE_LINKS (note: columns are from_req / to_req)
ALTER TABLE public.trace_links ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE;
UPDATE public.trace_links tl SET project_id = (
  SELECT r.project_id FROM public.requirements r WHERE r.id = tl.from_req LIMIT 1
) WHERE tl.project_id IS NULL;
DELETE FROM public.trace_links WHERE project_id IS NULL;
ALTER TABLE public.trace_links ALTER COLUMN project_id SET NOT NULL;

-- GATE_REVIEWS
ALTER TABLE public.gate_reviews ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE;
UPDATE public.gate_reviews g SET project_id = (
  SELECT id FROM public.projects p WHERE p.user_id = g.user_id ORDER BY created_at LIMIT 1
) WHERE g.project_id IS NULL;
DELETE FROM public.gate_reviews WHERE project_id IS NULL;
ALTER TABLE public.gate_reviews ALTER COLUMN project_id SET NOT NULL;

-- SUPPLIERS
UPDATE public.suppliers s SET project_id = (
  SELECT id FROM public.projects p WHERE p.user_id = s.user_id ORDER BY created_at LIMIT 1
) WHERE s.project_id IS NULL;
DELETE FROM public.suppliers WHERE project_id IS NULL;
ALTER TABLE public.suppliers ALTER COLUMN project_id SET NOT NULL;

-- LEAD_TIME_ENTRIES
UPDATE public.lead_time_entries lte SET project_id = (
  SELECT s.project_id FROM public.suppliers s WHERE s.id = lte.supplier_id LIMIT 1
) WHERE lte.project_id IS NULL;
DELETE FROM public.lead_time_entries WHERE project_id IS NULL;
ALTER TABLE public.lead_time_entries ALTER COLUMN project_id SET NOT NULL;

-- SUPPLY_RISKS
ALTER TABLE public.supply_risks ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE;
UPDATE public.supply_risks sr SET project_id = (
  SELECT s.project_id FROM public.suppliers s WHERE s.id = sr.supplier_id LIMIT 1
) WHERE sr.project_id IS NULL;
DELETE FROM public.supply_risks WHERE project_id IS NULL;
ALTER TABLE public.supply_risks ALTER COLUMN project_id SET NOT NULL;

-- SUPPLIER_QUALIFICATIONS
ALTER TABLE public.supplier_qualifications ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE;
UPDATE public.supplier_qualifications sq SET project_id = (
  SELECT s.project_id FROM public.suppliers s WHERE s.id = sq.supplier_id LIMIT 1
) WHERE sq.project_id IS NULL;
DELETE FROM public.supplier_qualifications WHERE project_id IS NULL;
ALTER TABLE public.supplier_qualifications ALTER COLUMN project_id SET NOT NULL;

-- RFQS
ALTER TABLE public.rfqs ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE;
UPDATE public.rfqs rq SET project_id = (
  SELECT pr.project_id FROM public.purchase_requisitions pr WHERE pr.id = rq.pr_id LIMIT 1
) WHERE rq.project_id IS NULL;
UPDATE public.rfqs rq SET project_id = (
  SELECT s.project_id FROM public.suppliers s WHERE s.id = rq.supplier_id LIMIT 1
) WHERE rq.project_id IS NULL;
DELETE FROM public.rfqs WHERE project_id IS NULL;
ALTER TABLE public.rfqs ALTER COLUMN project_id SET NOT NULL;

-- PURCHASE_ORDERS
ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE;
UPDATE public.purchase_orders po SET project_id = (
  SELECT pr.project_id FROM public.purchase_requisitions pr WHERE pr.id = po.pr_id LIMIT 1
) WHERE po.project_id IS NULL;
UPDATE public.purchase_orders po SET project_id = (
  SELECT s.project_id FROM public.suppliers s WHERE s.id = po.supplier_id LIMIT 1
) WHERE po.project_id IS NULL;
DELETE FROM public.purchase_orders WHERE project_id IS NULL;
ALTER TABLE public.purchase_orders ALTER COLUMN project_id SET NOT NULL;

-- BOM_CHANGES
ALTER TABLE public.bom_changes ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE;
UPDATE public.bom_changes bc SET project_id = (
  SELECT b.project_id FROM public.boms b WHERE b.id = bc.bom_id LIMIT 1
) WHERE bc.project_id IS NULL;
DELETE FROM public.bom_changes WHERE project_id IS NULL;
ALTER TABLE public.bom_changes ALTER COLUMN project_id SET NOT NULL;

-- INDEXES
CREATE INDEX IF NOT EXISTS gate_reviews_project_idx ON public.gate_reviews(project_id);
CREATE INDEX IF NOT EXISTS trace_links_project_idx ON public.trace_links(project_id);
CREATE INDEX IF NOT EXISTS supply_risks_project_idx ON public.supply_risks(project_id);
CREATE INDEX IF NOT EXISTS supplier_qualifications_project_idx ON public.supplier_qualifications(project_id);
CREATE INDEX IF NOT EXISTS rfqs_project_idx ON public.rfqs(project_id);
CREATE INDEX IF NOT EXISTS purchase_orders_project_idx ON public.purchase_orders(project_id);
CREATE INDEX IF NOT EXISTS bom_changes_project_idx ON public.bom_changes(project_id);
CREATE INDEX IF NOT EXISTS lead_time_entries_project_idx ON public.lead_time_entries(project_id);

-- =========================
-- PART B: project-scoped RLS policies
-- =========================

-- Helper macro pattern applied per-table:
--   SELECT: user owns row AND project belongs to user
--   INSERT: user owns row AND project belongs to user
--   UPDATE/DELETE: user owns row

-- DOCUMENTS
DROP POLICY IF EXISTS "own docs select" ON public.documents;
DROP POLICY IF EXISTS "own docs insert" ON public.documents;
CREATE POLICY "project docs select" ON public.documents FOR SELECT
  USING (auth.uid() = user_id AND project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid()));
CREATE POLICY "project docs insert" ON public.documents FOR INSERT
  WITH CHECK (auth.uid() = user_id AND project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid()));

-- REQUIREMENTS
DROP POLICY IF EXISTS "own req select" ON public.requirements;
DROP POLICY IF EXISTS "own req insert" ON public.requirements;
CREATE POLICY "project req select" ON public.requirements FOR SELECT
  USING (auth.uid() = user_id AND project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid()));
CREATE POLICY "project req insert" ON public.requirements FOR INSERT
  WITH CHECK (auth.uid() = user_id AND project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid()));

-- TRACE_LINKS
DROP POLICY IF EXISTS "own link select" ON public.trace_links;
DROP POLICY IF EXISTS "own link insert" ON public.trace_links;
CREATE POLICY "project link select" ON public.trace_links FOR SELECT
  USING (auth.uid() = user_id AND project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid()));
CREATE POLICY "project link insert" ON public.trace_links FOR INSERT
  WITH CHECK (auth.uid() = user_id AND project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid()));

-- GATE_REVIEWS
DROP POLICY IF EXISTS "own gate select" ON public.gate_reviews;
DROP POLICY IF EXISTS "own gate insert" ON public.gate_reviews;
CREATE POLICY "project gate select" ON public.gate_reviews FOR SELECT
  USING (auth.uid() = user_id AND project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid()));
CREATE POLICY "project gate insert" ON public.gate_reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id AND project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid()));

-- BOMS
DROP POLICY IF EXISTS "own bom select" ON public.boms;
DROP POLICY IF EXISTS "own bom insert" ON public.boms;
CREATE POLICY "project bom select" ON public.boms FOR SELECT
  USING (auth.uid() = user_id AND project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid()));
CREATE POLICY "project bom insert" ON public.boms FOR INSERT
  WITH CHECK (auth.uid() = user_id AND project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid()));

-- BOM_CHANGES
DROP POLICY IF EXISTS "own bom_changes select" ON public.bom_changes;
DROP POLICY IF EXISTS "own bom_changes insert" ON public.bom_changes;
CREATE POLICY "project bom_changes select" ON public.bom_changes FOR SELECT
  USING (auth.uid() = user_id AND project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid()));
CREATE POLICY "project bom_changes insert" ON public.bom_changes FOR INSERT
  WITH CHECK (auth.uid() = user_id AND project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid()));

-- SUPPLIERS
DROP POLICY IF EXISTS "own suppliers select" ON public.suppliers;
DROP POLICY IF EXISTS "own suppliers insert" ON public.suppliers;
CREATE POLICY "project suppliers select" ON public.suppliers FOR SELECT
  USING (auth.uid() = user_id AND project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid()));
CREATE POLICY "project suppliers insert" ON public.suppliers FOR INSERT
  WITH CHECK (auth.uid() = user_id AND project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid()));

-- SUPPLIER_QUALIFICATIONS
DROP POLICY IF EXISTS "own sup_qual select" ON public.supplier_qualifications;
DROP POLICY IF EXISTS "own sup_qual insert" ON public.supplier_qualifications;
CREATE POLICY "project sup_qual select" ON public.supplier_qualifications FOR SELECT
  USING (auth.uid() = user_id AND project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid()));
CREATE POLICY "project sup_qual insert" ON public.supplier_qualifications FOR INSERT
  WITH CHECK (auth.uid() = user_id AND project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid()));

-- SUPPLY_RISKS
DROP POLICY IF EXISTS "own supply_risks select" ON public.supply_risks;
DROP POLICY IF EXISTS "own supply_risks insert" ON public.supply_risks;
CREATE POLICY "project supply_risks select" ON public.supply_risks FOR SELECT
  USING (auth.uid() = user_id AND project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid()));
CREATE POLICY "project supply_risks insert" ON public.supply_risks FOR INSERT
  WITH CHECK (auth.uid() = user_id AND project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid()));

-- LEAD_TIME_ENTRIES
DROP POLICY IF EXISTS "own lte select" ON public.lead_time_entries;
DROP POLICY IF EXISTS "own lte insert" ON public.lead_time_entries;
CREATE POLICY "project lte select" ON public.lead_time_entries FOR SELECT
  USING (auth.uid() = user_id AND project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid()));
CREATE POLICY "project lte insert" ON public.lead_time_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id AND project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid()));

-- PURCHASE_REQUISITIONS
DROP POLICY IF EXISTS "own pr select" ON public.purchase_requisitions;
DROP POLICY IF EXISTS "own pr insert" ON public.purchase_requisitions;
CREATE POLICY "project pr select" ON public.purchase_requisitions FOR SELECT
  USING (auth.uid() = user_id AND project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid()));
CREATE POLICY "project pr insert" ON public.purchase_requisitions FOR INSERT
  WITH CHECK (auth.uid() = user_id AND project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid()));

-- RFQS
DROP POLICY IF EXISTS "own rfqs select" ON public.rfqs;
DROP POLICY IF EXISTS "own rfqs insert" ON public.rfqs;
CREATE POLICY "project rfqs select" ON public.rfqs FOR SELECT
  USING (auth.uid() = user_id AND project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid()));
CREATE POLICY "project rfqs insert" ON public.rfqs FOR INSERT
  WITH CHECK (auth.uid() = user_id AND project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid()));

-- PURCHASE_ORDERS
DROP POLICY IF EXISTS "own po select" ON public.purchase_orders;
DROP POLICY IF EXISTS "own po insert" ON public.purchase_orders;
CREATE POLICY "project po select" ON public.purchase_orders FOR SELECT
  USING (auth.uid() = user_id AND project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid()));
CREATE POLICY "project po insert" ON public.purchase_orders FOR INSERT
  WITH CHECK (auth.uid() = user_id AND project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid()));
