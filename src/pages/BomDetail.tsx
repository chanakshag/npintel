import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Plus, Download, Trash2, Sparkles, AlertTriangle, Package, Clock, Truck } from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { callIntelAi, statusBadge, downloadCsv } from "@/lib/intel";
import { downloadPdf } from "@/lib/exportArtifact";

type Item = {
  id: string; bom_id: string; part_number: string; description: string | null; manufacturer: string | null;
  supplier: string | null; quantity: number; unit: string; unit_cost: number | null; lead_time_days: number | null;
  status: string; spec_requirement: string | null; notes: string | null;
};
type Change = { id: string; change_type: string; field_changed: string | null; old_value: string | null; new_value: string | null; created_at: string; bom_item_id: string | null; impact_summary: string | null };

export default function BomDetail() {
  const { bomId } = useParams<{ bomId: string }>();
  const [bom, setBom] = useState<any>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [changes, setChanges] = useState<Change[]>([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterChange, setFilterChange] = useState<string>("all");
  const [risk, setRisk] = useState<string>("");
  const [riskLoading, setRiskLoading] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [draft, setDraft] = useState<Partial<Item>>({ part_number: "", quantity: 1, unit: "ea", status: "active" });

  const load = async () => {
    if (!bomId) return;
    const [{ data: b }, { data: it }, { data: ch }] = await Promise.all([
      supabase.from("boms").select("*").eq("id", bomId).maybeSingle(),
      supabase.from("bom_items").select("*").eq("bom_id", bomId).order("created_at", { ascending: true }),
      supabase.from("bom_changes").select("*").eq("bom_id", bomId).order("created_at", { ascending: false }),
    ]);
    setBom(b); setItems((it ?? []) as any); setChanges((ch ?? []) as any);
  };
  useEffect(() => { load(); }, [bomId]);

  const logChange = async (payload: Partial<Change> & { change_type: string }) => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user || !bomId) return;
    await supabase.from("bom_changes").insert({ ...payload, bom_id: bomId, user_id: u.user.id });
  };

  const addItem = async () => {
    if (!draft.part_number?.trim() || !bomId) return;
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const { data, error } = await supabase.from("bom_items").insert({ ...draft, bom_id: bomId, user_id: u.user.id } as any).select().single();
    if (error) return toast.error(error.message);
    await logChange({ change_type: "added", new_value: draft.part_number!, bom_item_id: data.id });
    toast.success("Component added"); setAddOpen(false); setDraft({ part_number: "", quantity: 1, unit: "ea", status: "active" });
    load();
  };

  const updateItem = async (id: string, patch: Partial<Item>, field?: string, oldV?: any) => {
    const { error } = await supabase.from("bom_items").update(patch).eq("id", id);
    if (error) return toast.error(error.message);
    if (field) await logChange({ change_type: patch.status === "eol" ? "eol_flagged" : "modified", field_changed: field, old_value: String(oldV ?? ""), new_value: String((patch as any)[field] ?? ""), bom_item_id: id });
    load();
  };

  const removeItem = async (item: Item) => {
    if (!confirm(`Remove ${item.part_number}?`)) return;
    await logChange({ change_type: "removed", old_value: item.part_number, bom_item_id: item.id });
    await supabase.from("bom_items").delete().eq("id", item.id);
    load();
  };

  const exportCsv = () => {
    downloadCsv(`${bom?.name ?? "bom"}.csv`, items.map(i => ({
      part_number: i.part_number, description: i.description ?? "", manufacturer: i.manufacturer ?? "",
      supplier: i.supplier ?? "", quantity: i.quantity, unit: i.unit, unit_cost: i.unit_cost ?? "",
      lead_time_days: i.lead_time_days ?? "", status: i.status, spec_requirement: i.spec_requirement ?? "",
    })));
  };

  const generateRisk = async () => {
    if (!items.length) return toast.error("Add components first");
    setRiskLoading(true);
    try {
      const content = await callIntelAi("bom_risk", { bomName: bom?.name, version: bom?.version, items });
      setRisk(content); toast.success("Risk analysis ready");
    } catch (e: any) { toast.error(e.message); } finally { setRiskLoading(false); }
  };

  const exportRiskPdf = () => {
    if (!risk) return;
    downloadPdf(`${bom?.name ?? "BOM"} — Risk Report`, "Risk Analysis", risk);
  };

  const filteredItems = items.filter(i => {
    if (filterStatus !== "all" && i.status !== filterStatus) return false;
    if (search && !`${i.part_number} ${i.description ?? ""} ${i.manufacturer ?? ""} ${i.supplier ?? ""}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const filteredChanges = filterChange === "all" ? changes : changes.filter(c => c.change_type === filterChange);

  const eolItems = items.filter(i => i.status === "eol");
  const supplierCounts = items.reduce((acc, i) => { if (i.supplier) acc[i.supplier] = (acc[i.supplier] ?? 0) + 1; return acc; }, {} as Record<string, number>);
  const singleSourceItems = items.filter(i => i.supplier && supplierCounts[i.supplier] === 1);
  const longLead = items.filter(i => (i.lead_time_days ?? 0) > 60);

  if (!bom) return <AppLayout title="BOM"><div className="p-8 text-sm text-muted-foreground">Loading…</div></AppLayout>;

  return (
    <AppLayout title={bom.name} description={`${bom.version} · ${items.length} components`}
      actions={<Link to="/bom"><Button size="sm" variant="ghost"><ArrowLeft className="mr-1 h-3.5 w-3.5" /> All BOMs</Button></Link>}>
      <div className="mx-auto max-w-7xl">
        <Tabs defaultValue="components">
          <TabsList>
            <TabsTrigger value="components">Components</TabsTrigger>
            <TabsTrigger value="changes">Change History</TabsTrigger>
            <TabsTrigger value="risk">Risk Analysis</TabsTrigger>
          </TabsList>

          <TabsContent value="components" className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Input placeholder="Search part, manufacturer, supplier…" value={search} onChange={e => setSearch(e.target.value)} className="max-w-xs" />
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="at_risk">At Risk</SelectItem>
                  <SelectItem value="eol">EOL</SelectItem>
                  <SelectItem value="substitute_needed">Substitute Needed</SelectItem>
                </SelectContent>
              </Select>
              <div className="ml-auto flex gap-2">
                <Button size="sm" variant="outline" onClick={exportCsv}><Download className="mr-1 h-3.5 w-3.5" /> CSV</Button>
                <Dialog open={addOpen} onOpenChange={setAddOpen}>
                  <DialogTrigger asChild><Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90"><Plus className="mr-1 h-3.5 w-3.5" /> Add Component</Button></DialogTrigger>
                  <DialogContent className="max-w-lg">
                    <DialogHeader><DialogTitle>Add component</DialogTitle></DialogHeader>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2"><Label>Part number</Label><Input value={draft.part_number ?? ""} onChange={e => setDraft({ ...draft, part_number: e.target.value })} /></div>
                      <div className="col-span-2"><Label>Description</Label><Input value={draft.description ?? ""} onChange={e => setDraft({ ...draft, description: e.target.value })} /></div>
                      <div><Label>Manufacturer</Label><Input value={draft.manufacturer ?? ""} onChange={e => setDraft({ ...draft, manufacturer: e.target.value })} /></div>
                      <div><Label>Supplier</Label><Input value={draft.supplier ?? ""} onChange={e => setDraft({ ...draft, supplier: e.target.value })} /></div>
                      <div><Label>Qty</Label><Input type="number" value={draft.quantity ?? 1} onChange={e => setDraft({ ...draft, quantity: Number(e.target.value) })} /></div>
                      <div><Label>Unit cost</Label><Input type="number" step="0.01" value={draft.unit_cost ?? ""} onChange={e => setDraft({ ...draft, unit_cost: Number(e.target.value) })} /></div>
                      <div><Label>Lead time (days)</Label><Input type="number" value={draft.lead_time_days ?? ""} onChange={e => setDraft({ ...draft, lead_time_days: Number(e.target.value) })} /></div>
                      <div><Label>Status</Label>
                        <Select value={draft.status ?? "active"} onValueChange={(v) => setDraft({ ...draft, status: v })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="at_risk">At Risk</SelectItem>
                            <SelectItem value="eol">EOL</SelectItem>
                            <SelectItem value="substitute_needed">Substitute Needed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-2"><Label>Spec / Requirement link</Label><Input value={draft.spec_requirement ?? ""} onChange={e => setDraft({ ...draft, spec_requirement: e.target.value })} placeholder="REQ-123" /></div>
                      <Button className="col-span-2 bg-primary text-primary-foreground hover:bg-primary/90" onClick={addItem}>Add</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            <Card className="border-border/60 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2 text-left">Part #</th><th className="px-3 py-2 text-left">Description</th>
                      <th className="px-3 py-2 text-left">Mfr</th><th className="px-3 py-2 text-left">Supplier</th>
                      <th className="px-3 py-2 text-right">Qty</th><th className="px-3 py-2 text-right">Unit $</th>
                      <th className="px-3 py-2 text-right">Lead (d)</th><th className="px-3 py-2 text-left">Status</th>
                      <th className="px-3 py-2 text-left">Spec</th><th className="px-3 py-2"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredItems.map(i => {
                      const sb = statusBadge(i.status);
                      return (
                        <tr key={i.id} className="hover:bg-muted/20">
                          <td className="px-3 py-2 font-mono text-xs">{i.part_number}</td>
                          <td className="px-3 py-2">{i.description ?? "—"}</td>
                          <td className="px-3 py-2">{i.manufacturer ?? "—"}</td>
                          <td className="px-3 py-2">{i.supplier ?? "—"}</td>
                          <td className="px-3 py-2 text-right font-mono">{i.quantity}</td>
                          <td className="px-3 py-2 text-right font-mono">{i.unit_cost != null ? `$${Number(i.unit_cost).toFixed(2)}` : "—"}</td>
                          <td className="px-3 py-2 text-right font-mono">{i.lead_time_days ?? "—"}</td>
                          <td className="px-3 py-2">
                            <Select value={i.status} onValueChange={(v) => updateItem(i.id, { status: v }, "status", i.status)}>
                              <SelectTrigger className={`h-7 w-32 border-0 ${sb.className}`}><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="at_risk">At Risk</SelectItem>
                                <SelectItem value="eol">EOL</SelectItem>
                                <SelectItem value="substitute_needed">Substitute Needed</SelectItem>
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="px-3 py-2 text-xs text-muted-foreground">{i.spec_requirement ?? "—"}</td>
                          <td className="px-3 py-2 text-right">
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => removeItem(i)}><Trash2 className="h-3.5 w-3.5" /></Button>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredItems.length === 0 && (
                      <tr><td colSpan={10} className="px-3 py-8 text-center text-sm text-muted-foreground">No components match.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="changes" className="space-y-3">
            <Select value={filterChange} onValueChange={setFilterChange}>
              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All changes</SelectItem>
                <SelectItem value="added">Added</SelectItem>
                <SelectItem value="removed">Removed</SelectItem>
                <SelectItem value="modified">Modified</SelectItem>
                <SelectItem value="eol_flagged">EOL Flagged</SelectItem>
              </SelectContent>
            </Select>
            <Card className="border-border/60">
              {filteredChanges.length === 0 ? (
                <p className="p-8 text-center text-sm text-muted-foreground">No changes logged yet.</p>
              ) : (
                <ul className="divide-y divide-border">
                  {filteredChanges.map(c => (
                    <li key={c.id} className="flex items-start gap-3 px-4 py-3">
                      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                        {c.change_type === "added" ? <Plus className="h-3.5 w-3.5" /> :
                         c.change_type === "removed" ? <Trash2 className="h-3.5 w-3.5" /> :
                         c.change_type === "eol_flagged" ? <AlertTriangle className="h-3.5 w-3.5" /> : <Package className="h-3.5 w-3.5" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm"><span className="font-medium capitalize">{c.change_type.replace("_", " ")}</span>{c.field_changed && <> · <span className="text-muted-foreground">{c.field_changed}:</span> <span className="line-through text-rose-600">{c.old_value || "—"}</span> → <span className="text-emerald-700">{c.new_value || "—"}</span></>}{!c.field_changed && c.new_value && <> · {c.new_value}</>}{!c.field_changed && c.old_value && <> · {c.old_value}</>}</p>
                        <p className="text-[11px] text-muted-foreground">{new Date(c.created_at).toLocaleString()}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="risk" className="space-y-4">
            <Card className="border-border/60 p-5">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-navy">AI Risk Analysis</h3>
                <div className="flex gap-2">
                  {risk && <Button size="sm" variant="outline" onClick={exportRiskPdf}><Download className="mr-1 h-3.5 w-3.5" /> PDF</Button>}
                  <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={generateRisk} disabled={riskLoading}>
                    <Sparkles className="mr-1 h-3.5 w-3.5" /> {riskLoading ? "Analyzing…" : risk ? "Regenerate" : "Generate Risk Report"}
                  </Button>
                </div>
              </div>
              {risk ? (
                <div className="prose prose-sm mt-4 max-w-none prose-headings:text-navy prose-h2:text-base prose-h3:text-sm">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{risk.replace(/^#{4,}\s+/gm, "### ").replace(/^#\s+/gm, "## ")}</ReactMarkdown>
                </div>
              ) : (
                <p className="mt-3 text-sm text-muted-foreground">Click Generate to produce an AI risk summary covering EOL, single-source, and lead time risks.</p>
              )}
            </Card>

            <div className="grid gap-3 md:grid-cols-3">
              <Card className="border-border/60 p-4">
                <div className="flex items-center gap-2 text-rose-600"><AlertTriangle className="h-4 w-4" /><h4 className="text-sm font-semibold">EOL Risk</h4></div>
                <p className="mt-1 font-mono text-2xl font-semibold">{eolItems.length}</p>
                <ul className="mt-2 space-y-1 text-xs text-muted-foreground">{eolItems.slice(0, 5).map(i => <li key={i.id}>• {i.part_number}</li>)}</ul>
              </Card>
              <Card className="border-border/60 p-4">
                <div className="flex items-center gap-2 text-amber-600"><Truck className="h-4 w-4" /><h4 className="text-sm font-semibold">Single Source</h4></div>
                <p className="mt-1 font-mono text-2xl font-semibold">{singleSourceItems.length}</p>
                <ul className="mt-2 space-y-1 text-xs text-muted-foreground">{singleSourceItems.slice(0, 5).map(i => <li key={i.id}>• {i.part_number} ({i.supplier})</li>)}</ul>
              </Card>
              <Card className="border-border/60 p-4">
                <div className="flex items-center gap-2 text-amber-600"><Clock className="h-4 w-4" /><h4 className="text-sm font-semibold">Long Lead (&gt;60d)</h4></div>
                <p className="mt-1 font-mono text-2xl font-semibold">{longLead.length}</p>
                <ul className="mt-2 space-y-1 text-xs text-muted-foreground">{longLead.slice(0, 5).map(i => <li key={i.id}>• {i.part_number} ({i.lead_time_days}d)</li>)}</ul>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
