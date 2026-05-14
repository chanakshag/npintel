-- BOM Intel
CREATE TABLE public.boms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  project_id uuid,
  version text NOT NULL DEFAULT 'v1.0',
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.boms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own bom select" ON public.boms FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own bom insert" ON public.boms FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own bom update" ON public.boms FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own bom delete" ON public.boms FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER boms_updated_at BEFORE UPDATE ON public.boms FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.bom_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bom_id uuid NOT NULL REFERENCES public.boms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  part_number text NOT NULL,
  description text,
  manufacturer text,
  supplier text,
  quantity numeric NOT NULL DEFAULT 1,
  unit text NOT NULL DEFAULT 'ea',
  unit_cost numeric,
  lead_time_days integer,
  status text NOT NULL DEFAULT 'active',
  spec_requirement text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.bom_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own bom_items select" ON public.bom_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own bom_items insert" ON public.bom_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own bom_items update" ON public.bom_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own bom_items delete" ON public.bom_items FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX bom_items_bom_id_idx ON public.bom_items(bom_id);

CREATE TABLE public.bom_changes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bom_id uuid NOT NULL REFERENCES public.boms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  bom_item_id uuid REFERENCES public.bom_items(id) ON DELETE SET NULL,
  change_type text NOT NULL,
  field_changed text,
  old_value text,
  new_value text,
  impact_summary text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.bom_changes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own bom_changes select" ON public.bom_changes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own bom_changes insert" ON public.bom_changes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own bom_changes delete" ON public.bom_changes FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX bom_changes_bom_id_idx ON public.bom_changes(bom_id);

-- Supply Intel
CREATE TABLE public.suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  category text,
  country text,
  website text,
  primary_contact text,
  contact_email text,
  risk_score integer NOT NULL DEFAULT 50,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own suppliers select" ON public.suppliers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own suppliers insert" ON public.suppliers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own suppliers update" ON public.suppliers FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own suppliers delete" ON public.suppliers FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER suppliers_updated_at BEFORE UPDATE ON public.suppliers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.supplier_qualifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  document_name text NOT NULL,
  document_type text,
  file_url text,
  extracted_specs jsonb NOT NULL DEFAULT '{}'::jsonb,
  qualification_status text NOT NULL DEFAULT 'pending',
  valid_until date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.supplier_qualifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own sup_qual select" ON public.supplier_qualifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own sup_qual insert" ON public.supplier_qualifications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own sup_qual update" ON public.supplier_qualifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own sup_qual delete" ON public.supplier_qualifications FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX sup_qual_supplier_idx ON public.supplier_qualifications(supplier_id);

CREATE TABLE public.supply_risks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  risk_type text NOT NULL,
  severity text NOT NULL DEFAULT 'medium',
  description text,
  source text,
  flagged_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  status text NOT NULL DEFAULT 'open'
);
ALTER TABLE public.supply_risks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own supply_risks select" ON public.supply_risks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own supply_risks insert" ON public.supply_risks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own supply_risks update" ON public.supply_risks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own supply_risks delete" ON public.supply_risks FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX supply_risks_supplier_idx ON public.supply_risks(supplier_id);

CREATE TABLE public.lead_time_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  bom_item_id uuid REFERENCES public.bom_items(id) ON DELETE SET NULL,
  user_id uuid NOT NULL,
  part_number text,
  quoted_lead_days integer,
  actual_lead_days integer,
  npi_gate text,
  needed_by date,
  status text NOT NULL DEFAULT 'on_track',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.lead_time_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own lte select" ON public.lead_time_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own lte insert" ON public.lead_time_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own lte update" ON public.lead_time_entries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own lte delete" ON public.lead_time_entries FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX lte_supplier_idx ON public.lead_time_entries(supplier_id);

-- Procure Intel
CREATE TABLE public.purchase_requisitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  pr_number text UNIQUE,
  title text NOT NULL,
  project_id uuid,
  bom_id uuid REFERENCES public.boms(id) ON DELETE SET NULL,
  npi_gate text,
  needed_by date,
  total_estimated_cost numeric,
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.purchase_requisitions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own pr select" ON public.purchase_requisitions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own pr insert" ON public.purchase_requisitions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own pr update" ON public.purchase_requisitions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own pr delete" ON public.purchase_requisitions FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER pr_updated_at BEFORE UPDATE ON public.purchase_requisitions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.pr_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pr_id uuid NOT NULL REFERENCES public.purchase_requisitions(id) ON DELETE CASCADE,
  bom_item_id uuid REFERENCES public.bom_items(id) ON DELETE SET NULL,
  user_id uuid NOT NULL,
  part_number text NOT NULL,
  description text,
  supplier_id uuid REFERENCES public.suppliers(id) ON DELETE SET NULL,
  quantity numeric NOT NULL,
  unit_cost numeric,
  total_cost numeric GENERATED ALWAYS AS (quantity * unit_cost) STORED,
  needed_by date,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.pr_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own pr_items select" ON public.pr_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own pr_items insert" ON public.pr_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own pr_items update" ON public.pr_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own pr_items delete" ON public.pr_items FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX pr_items_pr_idx ON public.pr_items(pr_id);

CREATE TABLE public.rfqs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pr_id uuid REFERENCES public.purchase_requisitions(id) ON DELETE CASCADE,
  supplier_id uuid NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  rfq_number text UNIQUE,
  subject text,
  body text,
  sent_at timestamptz,
  response_received_at timestamptz,
  quoted_price numeric,
  quoted_lead_days integer,
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.rfqs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own rfqs select" ON public.rfqs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own rfqs insert" ON public.rfqs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own rfqs update" ON public.rfqs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own rfqs delete" ON public.rfqs FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX rfqs_pr_idx ON public.rfqs(pr_id);

CREATE TABLE public.purchase_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pr_id uuid REFERENCES public.purchase_requisitions(id) ON DELETE SET NULL,
  rfq_id uuid REFERENCES public.rfqs(id) ON DELETE SET NULL,
  supplier_id uuid NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  po_number text UNIQUE,
  total_amount numeric,
  delivery_date date,
  npi_gate text,
  status text NOT NULL DEFAULT 'raised',
  confirmation_received_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own po select" ON public.purchase_orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own po insert" ON public.purchase_orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own po update" ON public.purchase_orders FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own po delete" ON public.purchase_orders FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX po_pr_idx ON public.purchase_orders(pr_id);