import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Sparkles, Plus, Mail, FileDown, Send, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { callIntelAi, statusBadge } from "@/lib/intel";
import { downloadPdf } from "@/lib/exportArtifact";

export default function PrDetail() {
  const { prId } = useParams<{ prId: string }>();
  const isNew = !prId || prId === "new";
  return isNew ? <NewPrWizard /> : <ExistingPr prId={prId!} />;
}

// =============== NEW PR WIZARD ===============

function NewPrWizard() {
  const nav = useNavigate();
  const [step, setStep] = useState(1);
  const [details, setDetails] = useState<any>({ title: "", npi_gate: "EVT", needed_by: "" });
  const [boms, setBoms] = useState<any[]>([]);
  const [bomItems, setBomItems] = useState<any[]>([]);
  const [selectedBom, setSelectedBom] = useState<string>("");
  const [pickedItems, setPickedItems] = useState<Record<string, boolean>>({});
  const [items, setItems] = useState<any[]>([]); // working list for PR
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [aiReview, setAiReview] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    supabase.from("boms").select("id,name,version").then(({ data }) => setBoms(data ?? []));
    supabase.from("suppliers").select("id,name").then(({ data }) => setSuppliers(data ?? []));
  }, []);

  useEffect(() => {
    if (selectedBom) supabase.from("bom_items").select("*").eq("bom_id", selectedBom).then(({ data }) => setBomItems(data ?? []));
    else setBomItems([]);
  }, [selectedBom]);

  const importFromBom = () => {
    const picked = bomItems.filter(i => pickedItems[i.id]);
    setItems([...items, ...picked.map(i => ({
      part_number: i.part_number, description: i.description, supplier_id: null, supplier_name: i.supplier,
      quantity: i.quantity, unit_cost: i.unit_cost ?? 0, needed_by: details.needed_by ?? null, bom_item_id: i.id,
    }))]);
    setPickedItems({});
    toast.success(`${picked.length} items imported`);
  };

  const addManual = () => setItems([...items, { part_number: "", description: "", supplier_id: null, quantity: 1, unit_cost: 0, needed_by: details.needed_by ?? null }]);
  const updateItem = (idx: number, patch: any) => setItems(items.map((it, i) => i === idx ? { ...it, ...patch } : it));
  const removeItem = (idx: number) => setItems(items.filter((_, i) => i !== idx));

  const total = useMemo(() => items.reduce((s, i) => s + Number(i.quantity ?? 0) * Number(i.unit_cost ?? 0), 0), [items]);

  const runReview = async () => {
    if (!items.length) return toast.error("Add items first");
    setAiLoading(true);
    try {
      const enriched = items.map(i => ({ ...i, supplier_name: i.supplier_name ?? suppliers.find(s => s.id === i.supplier_id)?.name }));
      const content = await callIntelAi("pr_review", { gate: details.npi_gate, neededBy: details.needed_by, items: enriched });
      setAiReview(content);
    } catch (e: any) { toast.error(e.message); } finally { setAiLoading(false); }
  };

  const submit = async () => {
    if (!details.title || !items.length) return toast.error("Title and items required");
    setSubmitting(true);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const pr_number = `PR-${Date.now().toString(36).toUpperCase()}`;
    const { data: pr, error } = await supabase.from("purchase_requisitions").insert({
      title: details.title, npi_gate: details.npi_gate, needed_by: details.needed_by || null,
      bom_id: selectedBom || null, total_estimated_cost: total, status: "submitted", pr_number, user_id: u.user.id,
    }).select().single();
    if (error) { setSubmitting(false); return toast.error(error.message); }
    const rows = items.map(i => ({
      pr_id: pr.id, user_id: u.user!.id, part_number: i.part_number, description: i.description,
      supplier_id: i.supplier_id || null, quantity: i.quantity, unit_cost: i.unit_cost,
      needed_by: i.needed_by || null, bom_item_id: i.bom_item_id || null,
    }));
    await supabase.from("pr_items").insert(rows);
    toast.success("PR submitted"); nav(`/procurement/pr/${pr.id}`);
  };

  return (
    <AppLayout title="New Purchase Requisition" description={`Step ${step} of 4`} actions={<Link to="/procurement"><Button size="sm" variant="ghost"><ArrowLeft className="mr-1 h-3.5 w-3.5" /> Cancel</Button></Link>}>
      <div className="mx-auto max-w-4xl space-y-4">
        <div className="flex gap-1">{[1,2,3,4].map(n => <div key={n} className={`h-1 flex-1 rounded-full ${n <= step ? "bg-primary" : "bg-muted"}`} />)}</div>

        {step === 1 && (
          <Card className="border-border/60 p-6 space-y-4">
            <h2 className="text-base font-semibold text-navy">Details</h2>
            <div><Label>Title</Label><Input value={details.title} onChange={e => setDetails({ ...details, title: e.target.value })} placeholder="e.g. EVT build #2 components" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>NPI gate</Label>
                <Select value={details.npi_gate} onValueChange={(v) => setDetails({ ...details, npi_gate: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["EVT","DVT","PVT"].map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Needed by</Label><Input type="date" value={details.needed_by} onChange={e => setDetails({ ...details, needed_by: e.target.value })} /></div>
            </div>
            <div className="flex justify-end"><Button onClick={() => setStep(2)} disabled={!details.title} className="bg-primary text-primary-foreground hover:bg-primary/90">Next <ArrowRight className="ml-1 h-3.5 w-3.5" /></Button></div>
          </Card>
        )}

        {step === 2 && (
          <Card className="border-border/60 p-6 space-y-4">
            <h2 className="text-base font-semibold text-navy">Items</h2>
            <Tabs defaultValue="bom">
              <TabsList><TabsTrigger value="bom">Import from BOM</TabsTrigger><TabsTrigger value="manual">Add manually</TabsTrigger></TabsList>
              <TabsContent value="bom" className="space-y-3">
                <Select value={selectedBom} onValueChange={setSelectedBom}>
                  <SelectTrigger><SelectValue placeholder="Select a BOM…" /></SelectTrigger>
                  <SelectContent>{boms.map(b => <SelectItem key={b.id} value={b.id}>{b.name} · {b.version}</SelectItem>)}</SelectContent>
                </Select>
                {bomItems.length > 0 && (
                  <div className="max-h-64 space-y-1 overflow-y-auto rounded-md border border-border p-2">
                    {bomItems.map(i => (
                      <label key={i.id} className="flex items-center gap-2 rounded p-1 text-sm hover:bg-muted/40">
                        <Checkbox checked={!!pickedItems[i.id]} onCheckedChange={(v) => setPickedItems({ ...pickedItems, [i.id]: !!v })} />
                        <span className="font-mono text-xs">{i.part_number}</span>
                        <span className="text-muted-foreground">{i.description}</span>
                        <span className="ml-auto font-mono text-xs">qty {i.quantity}</span>
                      </label>
                    ))}
                    <Button size="sm" className="mt-2 bg-primary text-primary-foreground hover:bg-primary/90" onClick={importFromBom} disabled={Object.values(pickedItems).every(v => !v)}>Import selected</Button>
                  </div>
                )}
              </TabsContent>
              <TabsContent value="manual"><Button size="sm" variant="outline" onClick={addManual}><Plus className="mr-1 h-3.5 w-3.5" /> Add row</Button></TabsContent>
            </Tabs>

            {items.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Items in this PR ({items.length})</p>
                {items.map((it, i) => (
                  <div key={i} className="grid grid-cols-12 gap-2 rounded border border-border p-2">
                    <Input className="col-span-3" placeholder="Part #" value={it.part_number} onChange={e => updateItem(i, { part_number: e.target.value })} />
                    <Input className="col-span-3" placeholder="Description" value={it.description ?? ""} onChange={e => updateItem(i, { description: e.target.value })} />
                    <Select value={it.supplier_id ?? ""} onValueChange={(v) => updateItem(i, { supplier_id: v })}>
                      <SelectTrigger className="col-span-2"><SelectValue placeholder="Supplier" /></SelectTrigger>
                      <SelectContent>{suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                    </Select>
                    <Input className="col-span-1" type="number" placeholder="Qty" value={it.quantity} onChange={e => updateItem(i, { quantity: Number(e.target.value) })} />
                    <Input className="col-span-2" type="number" step="0.01" placeholder="Unit $" value={it.unit_cost} onChange={e => updateItem(i, { unit_cost: Number(e.target.value) })} />
                    <Button className="col-span-1" size="icon" variant="ghost" onClick={() => removeItem(i)}>×</Button>
                  </div>
                ))}
                <p className="text-right text-sm font-medium">Subtotal: <span className="font-mono">${total.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span></p>
              </div>
            )}

            <div className="flex justify-between"><Button variant="ghost" onClick={() => setStep(1)}><ArrowLeft className="mr-1 h-3.5 w-3.5" /> Back</Button><Button onClick={() => setStep(3)} disabled={!items.length} className="bg-primary text-primary-foreground hover:bg-primary/90">Next <ArrowRight className="ml-1 h-3.5 w-3.5" /></Button></div>
          </Card>
        )}

        {step === 3 && (
          <Card className="border-border/60 p-6 space-y-4">
            <div className="flex items-center justify-between"><h2 className="text-base font-semibold text-navy">AI Review</h2>
              <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={runReview} disabled={aiLoading}><Sparkles className="mr-1 h-3.5 w-3.5" /> {aiLoading ? "Reviewing…" : aiReview ? "Re-run" : "Run review"}</Button>
            </div>
            {aiReview ? (
              <div className="prose prose-sm max-w-none prose-headings:text-navy prose-h2:text-base prose-h3:text-sm">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{aiReview.replace(/^#{4,}\s+/gm, "### ").replace(/^#\s+/gm, "## ")}</ReactMarkdown>
              </div>
            ) : <p className="text-sm text-muted-foreground">Click Run review to have AI analyze this PR for cost, lead time, and single-source risks.</p>}
            <div className="flex justify-between"><Button variant="ghost" onClick={() => setStep(2)}><ArrowLeft className="mr-1 h-3.5 w-3.5" /> Back</Button><Button onClick={() => setStep(4)} className="bg-primary text-primary-foreground hover:bg-primary/90">Next <ArrowRight className="ml-1 h-3.5 w-3.5" /></Button></div>
          </Card>
        )}

        {step === 4 && (
          <Card className="border-border/60 p-6 space-y-4">
            <h2 className="text-base font-semibold text-navy">Confirm & Submit</h2>
            <div className="space-y-1 text-sm"><p><span className="text-muted-foreground">Title:</span> {details.title}</p><p><span className="text-muted-foreground">Gate:</span> {details.npi_gate} · <span className="text-muted-foreground">Needed by:</span> {details.needed_by || "—"}</p><p><span className="text-muted-foreground">Items:</span> {items.length} · <span className="text-muted-foreground">Total:</span> <span className="font-mono">${total.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span></p></div>
            <div className="flex justify-between"><Button variant="ghost" onClick={() => setStep(3)}><ArrowLeft className="mr-1 h-3.5 w-3.5" /> Back</Button><Button onClick={submit} disabled={submitting} className="bg-primary text-primary-foreground hover:bg-primary/90">{submitting ? "Submitting…" : "Submit PR"}</Button></div>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}

// =============== EXISTING PR DETAIL ===============

function ExistingPr({ prId }: { prId: string }) {
  const [pr, setPr] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [rfqs, setRfqs] = useState<any[]>([]);
  const [pos, setPos] = useState<any[]>([]);
  const [rfqOpen, setRfqOpen] = useState(false);
  const [rfqDraft, setRfqDraft] = useState<any>({ supplier_id: "", subject: "", body: "" });
  const [rfqLoading, setRfqLoading] = useState(false);
  const [poOpen, setPoOpen] = useState(false);
  const [poDraft, setPoDraft] = useState<any>({ rfq_id: "", delivery_date: "", notes: "" });

  const load = async () => {
    const [{ data: p }, { data: it }, { data: sup }, { data: r }, { data: o }] = await Promise.all([
      supabase.from("purchase_requisitions").select("*").eq("id", prId).maybeSingle(),
      supabase.from("pr_items").select("*, suppliers(name)").eq("pr_id", prId),
      supabase.from("suppliers").select("id,name"),
      supabase.from("rfqs").select("*, suppliers(name)").eq("pr_id", prId).order("created_at", { ascending: false }),
      supabase.from("purchase_orders").select("*, suppliers(name, country)").eq("pr_id", prId).order("created_at", { ascending: false }),
    ]);
    setPr(p); setItems(it ?? []); setSuppliers(sup ?? []); setRfqs(r ?? []); setPos(o ?? []);
  };
  useEffect(() => { load(); }, [prId]);

  const advanceStatus = async (status: string) => {
    await supabase.from("purchase_requisitions").update({ status }).eq("id", prId);
    load();
  };

  const draftRfq = async () => {
    if (!rfqDraft.supplier_id) return toast.error("Select supplier");
    setRfqLoading(true);
    const supplier = suppliers.find(s => s.id === rfqDraft.supplier_id);
    try {
      const body = await callIntelAi("rfq_draft", { supplierName: supplier?.name, gate: pr?.npi_gate, neededBy: pr?.needed_by, items });
      setRfqDraft({ ...rfqDraft, subject: `RFQ — ${pr?.title}`, body });
    } catch (e: any) { toast.error(e.message); } finally { setRfqLoading(false); }
  };

  const saveRfq = async (status: "draft" | "sent") => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const rfq_number = `RFQ-${Date.now().toString(36).toUpperCase()}`;
    if (!pr?.project_id) return toast.error("PR has no project");
    await supabase.from("rfqs").insert({
      pr_id: prId, user_id: u.user.id, supplier_id: rfqDraft.supplier_id,
      project_id: pr.project_id,
      subject: rfqDraft.subject, body: rfqDraft.body, status, rfq_number,
      sent_at: status === "sent" ? new Date().toISOString() : null,
    });
    toast.success(status === "sent" ? "RFQ marked sent" : "RFQ saved");
    setRfqOpen(false); setRfqDraft({ supplier_id: "", subject: "", body: "" }); load();
  };

  const recordResponse = async (rfq: any, quoted_price: number, quoted_lead_days: number) => {
    await supabase.from("rfqs").update({ quoted_price, quoted_lead_days, status: "responded", response_received_at: new Date().toISOString() }).eq("id", rfq.id);
    load();
  };

  const raisePo = async () => {
    if (!poDraft.rfq_id) return toast.error("Select an RFQ");
    const rfq = rfqs.find(r => r.id === poDraft.rfq_id);
    if (!rfq) return;
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const po_number = `PO-${Date.now().toString(36).toUpperCase()}`;
    if (!pr?.project_id) return toast.error("PR has no project");
    await supabase.from("purchase_orders").insert({
      pr_id: prId, rfq_id: rfq.id, supplier_id: rfq.supplier_id, user_id: u.user.id,
      project_id: pr.project_id,
      po_number, total_amount: rfq.quoted_price, delivery_date: poDraft.delivery_date || null,
      npi_gate: pr?.npi_gate, notes: poDraft.notes,
    });
    await supabase.from("rfqs").update({ status: "accepted" }).eq("id", rfq.id);
    if (pr?.status !== "po_raised") await advanceStatus("po_raised");
    toast.success("PO raised"); setPoOpen(false); setPoDraft({ rfq_id: "", delivery_date: "", notes: "" }); load();
  };

  const updatePoStatus = async (id: string, status: string) => {
    await supabase.from("purchase_orders").update({ status, confirmation_received_at: status === "confirmed" ? new Date().toISOString() : undefined }).eq("id", id);
    if (status === "delivered") await advanceStatus("fulfilled");
    load();
  };

  const generatePoDoc = async (po: any) => {
    try {
      const content = await callIntelAi("po_doc", { ...po, supplier: po.suppliers, items: items.filter(i => i.supplier_id === po.supplier_id) });
      downloadPdf(po.po_number, "Purchase Order", content);
      toast.success("PO document exported");
    } catch (e: any) { toast.error(e.message); }
  };

  if (!pr) return <AppLayout title="PR"><div className="p-8 text-sm text-muted-foreground">Loading…</div></AppLayout>;

  const sb = statusBadge(pr.status);
  const respondedRfqs = rfqs.filter(r => r.status === "responded" || r.status === "accepted");

  return (
    <AppLayout title={pr.title} description={`${pr.pr_number} · ${pr.npi_gate ?? "—"} · needed ${pr.needed_by ?? "TBD"}`}
      actions={<div className="flex gap-2"><span className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase ${sb.className}`}>{sb.label}</span><Link to="/procurement"><Button size="sm" variant="ghost"><ArrowLeft className="mr-1 h-3.5 w-3.5" /> Back</Button></Link></div>}>
      <div className="mx-auto max-w-7xl">
        <Tabs defaultValue="items">
          <TabsList><TabsTrigger value="items">Items</TabsTrigger><TabsTrigger value="rfqs">RFQs</TabsTrigger><TabsTrigger value="pos">Purchase Orders</TabsTrigger></TabsList>

          <TabsContent value="items" className="space-y-3">
            <div className="flex justify-end"><Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => setRfqOpen(true)}><Mail className="mr-1 h-3.5 w-3.5" /> Draft RFQ</Button></div>
            <Card className="border-border/60 overflow-x-auto">
              <table className="w-full text-sm"><thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground"><tr><th className="px-3 py-2 text-left">Part</th><th className="px-3 py-2 text-left">Description</th><th className="px-3 py-2 text-left">Supplier</th><th className="px-3 py-2 text-right">Qty</th><th className="px-3 py-2 text-right">Unit $</th><th className="px-3 py-2 text-right">Total</th><th className="px-3 py-2 text-left">Status</th></tr></thead>
                <tbody className="divide-y divide-border">
                  {items.map(i => { const isb = statusBadge(i.status); return (
                    <tr key={i.id}><td className="px-3 py-2 font-mono text-xs">{i.part_number}</td><td className="px-3 py-2">{i.description ?? "—"}</td><td className="px-3 py-2 text-xs">{i.suppliers?.name ?? "—"}</td><td className="px-3 py-2 text-right font-mono">{i.quantity}</td><td className="px-3 py-2 text-right font-mono">${Number(i.unit_cost ?? 0).toFixed(2)}</td><td className="px-3 py-2 text-right font-mono">${Number(i.total_cost ?? 0).toFixed(2)}</td><td className="px-3 py-2"><span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${isb.className}`}>{isb.label}</span></td></tr>
                  );})}
                </tbody>
              </table>
            </Card>
          </TabsContent>

          <TabsContent value="rfqs" className="space-y-3">
            <div className="flex justify-end"><Dialog open={rfqOpen} onOpenChange={setRfqOpen}>
              <DialogTrigger asChild><Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90"><Mail className="mr-1 h-3.5 w-3.5" /> Draft RFQ</Button></DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader><DialogTitle>Draft RFQ</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div><Label>Supplier</Label>
                    <Select value={rfqDraft.supplier_id} onValueChange={(v) => setRfqDraft({ ...rfqDraft, supplier_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Select supplier" /></SelectTrigger>
                      <SelectContent>{suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <Button size="sm" variant="outline" onClick={draftRfq} disabled={rfqLoading || !rfqDraft.supplier_id}><Sparkles className="mr-1 h-3.5 w-3.5" /> {rfqLoading ? "Drafting…" : "Generate email"}</Button>
                  <div><Label>Subject</Label><Input value={rfqDraft.subject} onChange={e => setRfqDraft({ ...rfqDraft, subject: e.target.value })} /></div>
                  <div><Label>Body</Label><Textarea rows={10} value={rfqDraft.body} onChange={e => setRfqDraft({ ...rfqDraft, body: e.target.value })} /></div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => navigator.clipboard.writeText(rfqDraft.body) && toast.success("Copied")}>Copy email</Button>
                    <Button variant="outline" onClick={() => saveRfq("draft")}>Save draft</Button>
                    <Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => saveRfq("sent")}><Send className="mr-1 h-3.5 w-3.5" /> Mark sent</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog></div>

            {rfqs.length === 0 ? <Card className="border-border/60 p-8 text-center text-sm text-muted-foreground">No RFQs yet.</Card> : (
              <div className="space-y-2">{rfqs.map(r => { const rsb = statusBadge(r.status); return (
                <Card key={r.id} className="border-border/60 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2"><span className="text-sm font-medium text-navy">{r.suppliers?.name}</span><span className="text-xs text-muted-foreground">{r.rfq_number}</span><span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${rsb.className}`}>{rsb.label}</span></div>
                      <p className="mt-1 text-xs text-muted-foreground">{r.subject}</p>
                      {r.quoted_price != null && <p className="mt-1 text-xs">Quoted: <span className="font-mono">${r.quoted_price}</span> · Lead {r.quoted_lead_days}d</p>}
                    </div>
                    {r.status === "sent" && (
                      <div className="flex gap-2">
                        <Input className="w-24" placeholder="$" type="number" id={`p-${r.id}`} />
                        <Input className="w-20" placeholder="days" type="number" id={`l-${r.id}`} />
                        <Button size="sm" variant="outline" onClick={() => {
                          const p = Number((document.getElementById(`p-${r.id}`) as HTMLInputElement)?.value);
                          const l = Number((document.getElementById(`l-${r.id}`) as HTMLInputElement)?.value);
                          if (p && l) recordResponse(r, p, l);
                        }}>Log</Button>
                      </div>
                    )}
                  </div>
                </Card>);})}
              </div>
            )}

            {respondedRfqs.length >= 2 && (
              <Card className="border-border/60 p-4">
                <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Quote comparison</p>
                <table className="w-full text-sm"><thead className="text-xs text-muted-foreground"><tr><th className="text-left">Supplier</th><th className="text-right">Price</th><th className="text-right">Lead (d)</th></tr></thead>
                  <tbody>{respondedRfqs.map(r => <tr key={r.id}><td>{r.suppliers?.name}</td><td className="text-right font-mono">${r.quoted_price}</td><td className="text-right font-mono">{r.quoted_lead_days}</td></tr>)}</tbody></table>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="pos" className="space-y-3">
            <div className="flex justify-end"><Dialog open={poOpen} onOpenChange={setPoOpen}>
              <DialogTrigger asChild><Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90" disabled={!respondedRfqs.length}><Plus className="mr-1 h-3.5 w-3.5" /> Raise PO</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Raise Purchase Order</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div><Label>From responded RFQ</Label>
                    <Select value={poDraft.rfq_id} onValueChange={(v) => setPoDraft({ ...poDraft, rfq_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Select RFQ" /></SelectTrigger>
                      <SelectContent>{respondedRfqs.map(r => <SelectItem key={r.id} value={r.id}>{r.suppliers?.name} · ${r.quoted_price}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>Delivery date</Label><Input type="date" value={poDraft.delivery_date} onChange={e => setPoDraft({ ...poDraft, delivery_date: e.target.value })} /></div>
                  <div><Label>Notes</Label><Textarea rows={3} value={poDraft.notes} onChange={e => setPoDraft({ ...poDraft, notes: e.target.value })} /></div>
                  <Button onClick={raisePo} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">Raise PO</Button>
                </div>
              </DialogContent>
            </Dialog></div>
            {pos.length === 0 ? <Card className="border-border/60 p-8 text-center text-sm text-muted-foreground">No purchase orders yet.</Card> : (
              <div className="space-y-2">{pos.map(p => { const psb = statusBadge(p.status); return (
                <Card key={p.id} className="border-border/60 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2"><span className="font-mono text-sm font-medium">{p.po_number}</span><span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${psb.className}`}>{psb.label}</span></div>
                      <p className="mt-1 text-xs text-muted-foreground">{p.suppliers?.name} · ${p.total_amount} · delivery {p.delivery_date ?? "TBD"}</p>
                    </div>
                    <div className="flex gap-2">
                      {p.status === "raised" && <Button size="sm" variant="outline" onClick={() => updatePoStatus(p.id, "confirmed")}><CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Confirmed</Button>}
                      {(p.status === "confirmed" || p.status === "shipped") && <Button size="sm" variant="outline" onClick={() => updatePoStatus(p.id, "delivered")}>Delivered</Button>}
                      <Button size="sm" variant="outline" onClick={() => generatePoDoc(p)}><FileDown className="mr-1 h-3.5 w-3.5" /> PDF</Button>
                    </div>
                  </div>
                </Card>);})}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
