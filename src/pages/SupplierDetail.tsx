import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Plus, Sparkles, Download, FileUp, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { callIntelAi, statusBadge, severityBadge, riskColor } from "@/lib/intel";
import { downloadPdf } from "@/lib/exportArtifact";

export default function SupplierDetail() {
  const { supplierId } = useParams<{ supplierId: string }>();
  const [supplier, setSupplier] = useState<any>(null);
  const [quals, setQuals] = useState<any[]>([]);
  const [risks, setRisks] = useState<any[]>([]);
  const [leadTimes, setLeadTimes] = useState<any[]>([]);
  const [summary, setSummary] = useState("");
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [qualOpen, setQualOpen] = useState(false);
  const [qualDraft, setQualDraft] = useState<any>({ document_name: "", document_type: "datasheet", notes: "" });
  const [riskOpen, setRiskOpen] = useState(false);
  const [riskDraft, setRiskDraft] = useState<any>({ risk_type: "geopolitical", severity: "medium", description: "", source: "" });
  const [ltOpen, setLtOpen] = useState(false);
  const [ltDraft, setLtDraft] = useState<any>({ part_number: "", quoted_lead_days: 0, actual_lead_days: 0, npi_gate: "EVT", status: "on_track" });

  const load = async () => {
    if (!supplierId) return;
    const [{ data: s }, { data: q }, { data: r }, { data: lt }] = await Promise.all([
      supabase.from("suppliers").select("*").eq("id", supplierId).maybeSingle(),
      supabase.from("supplier_qualifications").select("*").eq("supplier_id", supplierId).order("created_at", { ascending: false }),
      supabase.from("supply_risks").select("*").eq("supplier_id", supplierId).order("flagged_at", { ascending: false }),
      supabase.from("lead_time_entries").select("*").eq("supplier_id", supplierId).order("created_at", { ascending: false }),
    ]);
    setSupplier(s); setQuals(q ?? []); setRisks(r ?? []); setLeadTimes(lt ?? []);
  };
  useEffect(() => { load(); }, [supplierId]);

  const updateStatus = async (status: string) => {
    if (!supplierId) return;
    await supabase.from("suppliers").update({ status }).eq("id", supplierId);
    load();
  };

  const generateSummary = async () => {
    if (!supplier) return;
    setSummaryLoading(true);
    try {
      const content = await callIntelAi("supplier_summary", { supplier, qualifications: quals, risks });
      setSummary(content);
    } catch (e: any) { toast.error(e.message); } finally { setSummaryLoading(false); }
  };

  const addQual = async () => {
    if (!qualDraft.document_name?.trim() || !supplierId) return;
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    try {
      const extracted = await callIntelAi("spec_extract", qualDraft);
      let parsed: any = {};
      try { parsed = JSON.parse(extracted.replace(/```json/gi, "").replace(/```/g, "").trim()); } catch { parsed = { raw: extracted }; }
      await supabase.from("supplier_qualifications").insert({ ...qualDraft, supplier_id: supplierId, user_id: u.user.id, extracted_specs: parsed });
      toast.success("Document added with AI-extracted specs");
    } catch {
      await supabase.from("supplier_qualifications").insert({ ...qualDraft, supplier_id: supplierId, user_id: u.user.id });
      toast.success("Document added");
    }
    setQualOpen(false); setQualDraft({ document_name: "", document_type: "datasheet", notes: "" }); load();
  };

  const updateQualStatus = async (id: string, qualification_status: string) => {
    await supabase.from("supplier_qualifications").update({ qualification_status }).eq("id", id); load();
  };

  const generateQualPackage = async () => {
    try {
      const content = await callIntelAi("qual_package", { supplier, qualifications: quals });
      downloadPdf(`${supplier.name} — Qualification Package`, "Supplier Qualification", content);
      toast.success("Qualification package exported");
    } catch (e: any) { toast.error(e.message); }
  };

  const addRisk = async () => {
    if (!supplierId) return;
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    await supabase.from("supply_risks").insert({ ...riskDraft, supplier_id: supplierId, user_id: u.user.id });
    toast.success("Risk flagged"); setRiskOpen(false); setRiskDraft({ risk_type: "geopolitical", severity: "medium", description: "", source: "" }); load();
  };

  const updateRiskStatus = async (id: string, status: string) => {
    await supabase.from("supply_risks").update({ status, resolved_at: status === "resolved" ? new Date().toISOString() : null }).eq("id", id); load();
  };

  const addLt = async () => {
    if (!supplierId) return;
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    await supabase.from("lead_time_entries").insert({ ...ltDraft, supplier_id: supplierId, user_id: u.user.id });
    setLtOpen(false); setLtDraft({ part_number: "", quoted_lead_days: 0, actual_lead_days: 0, npi_gate: "EVT", status: "on_track" }); load();
  };

  // Risk timeline data: count risks by month
  const riskTimeline = (() => {
    const buckets: Record<string, number> = {};
    risks.forEach(r => {
      const m = r.flagged_at?.slice(0, 7) ?? "unknown";
      buckets[m] = (buckets[m] ?? 0) + 1;
    });
    return Object.entries(buckets).map(([month, count]) => ({ month, count })).sort((a, b) => a.month.localeCompare(b.month));
  })();

  const avgLT = leadTimes.length ? Math.round(leadTimes.reduce((s, l) => s + (l.actual_lead_days ?? l.quoted_lead_days ?? 0), 0) / leadTimes.length) : 0;
  const onTimeRate = leadTimes.length ? Math.round(100 * leadTimes.filter(l => l.status === "on_track").length / leadTimes.length) : 0;

  if (!supplier) return <AppLayout title="Supplier"><div className="p-8 text-sm text-muted-foreground">Loading…</div></AppLayout>;

  const sb = statusBadge(supplier.status);

  return (
    <AppLayout title={supplier.name} description={`${supplier.category ?? "—"} · ${supplier.country ?? ""}`}
      actions={<Link to="/supply"><Button size="sm" variant="ghost"><ArrowLeft className="mr-1 h-3.5 w-3.5" /> All suppliers</Button></Link>}>
      <div className="mx-auto max-w-7xl">
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="quals">Qualification Docs</TabsTrigger>
            <TabsTrigger value="risks">Risk Signals</TabsTrigger>
            <TabsTrigger value="leadtimes">Lead Times</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card className="border-border/60 p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-navy">{supplier.name}</h2>
                  <p className="text-xs text-muted-foreground">{supplier.category} · {supplier.country} · {supplier.contact_email}</p>
                </div>
                <div className="text-right">
                  <Select value={supplier.status} onValueChange={updateStatus}>
                    <SelectTrigger className={`h-8 w-36 border-0 ${sb.className}`}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="qualified">Qualified</SelectItem>
                      <SelectItem value="under_review">Under Review</SelectItem>
                      <SelectItem value="disqualified">Disqualified</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="mt-2 flex items-center gap-2"><span className="text-xs text-muted-foreground">Risk</span><div className="h-1.5 w-32 overflow-hidden rounded-full bg-muted"><div className={`h-full ${riskColor(supplier.risk_score)}`} style={{ width: `${supplier.risk_score}%` }} /></div><span className="font-mono text-xs">{supplier.risk_score}/100</span></div>
                </div>
              </div>
            </Card>

            <div className="grid gap-3 md:grid-cols-3">
              <Card className="border-border/60 p-4"><p className="text-xs text-muted-foreground">Qualification docs</p><p className="mt-1 font-mono text-2xl font-semibold">{quals.length}</p></Card>
              <Card className="border-border/60 p-4"><p className="text-xs text-muted-foreground">Open risks</p><p className="mt-1 font-mono text-2xl font-semibold">{risks.filter(r => r.status === "open").length}</p></Card>
              <Card className="border-border/60 p-4"><p className="text-xs text-muted-foreground">Avg lead time</p><p className="mt-1 font-mono text-2xl font-semibold">{avgLT}d</p></Card>
            </div>

            <Card className="border-border/60 p-5">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-navy">AI-generated risk profile</h3>
                <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={generateSummary} disabled={summaryLoading}>
                  <Sparkles className="mr-1 h-3.5 w-3.5" /> {summaryLoading ? "Analyzing…" : summary ? "Regenerate" : "Generate"}
                </Button>
              </div>
              {summary ? (
                <div className="prose prose-sm mt-4 max-w-none prose-headings:text-navy prose-h2:text-base prose-h3:text-sm">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{summary.replace(/^#{4,}\s+/gm, "### ").replace(/^#\s+/gm, "## ")}</ReactMarkdown>
                </div>
              ) : <p className="mt-3 text-sm text-muted-foreground">Click Generate for an AI summary of this supplier's risk profile and qualification status.</p>}
            </Card>
          </TabsContent>

          <TabsContent value="quals" className="space-y-3">
            <div className="flex items-center justify-end gap-2">
              <Button size="sm" variant="outline" onClick={generateQualPackage}><Download className="mr-1 h-3.5 w-3.5" /> Generate Qualification Package</Button>
              <Dialog open={qualOpen} onOpenChange={setQualOpen}>
                <DialogTrigger asChild><Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90"><FileUp className="mr-1 h-3.5 w-3.5" /> Add Document</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Add qualification document</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <div><Label>Document name</Label><Input value={qualDraft.document_name} onChange={e => setQualDraft({ ...qualDraft, document_name: e.target.value })} /></div>
                    <div><Label>Type</Label>
                      <Select value={qualDraft.document_type} onValueChange={(v) => setQualDraft({ ...qualDraft, document_type: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="datasheet">Datasheet</SelectItem>
                          <SelectItem value="iso_cert">ISO Cert</SelectItem>
                          <SelectItem value="quality_manual">Quality Manual</SelectItem>
                          <SelectItem value="test_report">Test Report</SelectItem>
                          <SelectItem value="audit_report">Audit Report</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div><Label>Notes / content summary</Label><Textarea rows={4} value={qualDraft.notes} onChange={e => setQualDraft({ ...qualDraft, notes: e.target.value })} placeholder="Paste key content for AI to extract specifications…" /></div>
                    <Button onClick={addQual} className="w-full bg-primary text-primary-foreground hover:bg-primary/90"><Sparkles className="mr-1 h-3.5 w-3.5" /> Add & Extract</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            {quals.length === 0 ? <Card className="border-border/60 p-8 text-center text-sm text-muted-foreground">No qualification documents yet.</Card> : (
              <div className="space-y-3">
                {quals.map(q => (
                  <Card key={q.id} className="border-border/60 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="text-sm font-semibold text-navy">{q.document_name}</h4>
                        <p className="text-xs text-muted-foreground">{q.document_type ?? "—"}{q.valid_until && <> · valid until {q.valid_until}</>}</p>
                      </div>
                      <Select value={q.qualification_status} onValueChange={(v) => updateQualStatus(q.id, v)}>
                        <SelectTrigger className="h-7 w-32"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="qualified">Qualified</SelectItem>
                          <SelectItem value="failed">Failed</SelectItem>
                          <SelectItem value="expired">Expired</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {q.extracted_specs && Object.keys(q.extracted_specs).length > 0 && (
                      <div className="mt-3 rounded-md border border-border bg-muted/30 p-3">
                        <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">AI-extracted</p>
                        <pre className="overflow-x-auto whitespace-pre-wrap break-words text-[11px] text-slate-700">{JSON.stringify(q.extracted_specs, null, 2)}</pre>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="risks" className="space-y-3">
            <div className="flex items-center justify-end">
              <Dialog open={riskOpen} onOpenChange={setRiskOpen}>
                <DialogTrigger asChild><Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90"><Plus className="mr-1 h-3.5 w-3.5" /> Flag Risk</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Flag new risk</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <div><Label>Type</Label>
                      <Select value={riskDraft.risk_type} onValueChange={(v) => setRiskDraft({ ...riskDraft, risk_type: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="geopolitical">Geopolitical</SelectItem>
                          <SelectItem value="financial">Financial</SelectItem>
                          <SelectItem value="capacity">Capacity</SelectItem>
                          <SelectItem value="lead_time">Lead Time</SelectItem>
                          <SelectItem value="quality">Quality</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div><Label>Severity</Label>
                      <Select value={riskDraft.severity} onValueChange={(v) => setRiskDraft({ ...riskDraft, severity: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{["low","medium","high","critical"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div><Label>Description</Label><Textarea rows={3} value={riskDraft.description} onChange={e => setRiskDraft({ ...riskDraft, description: e.target.value })} /></div>
                    <div><Label>Source</Label><Input value={riskDraft.source} onChange={e => setRiskDraft({ ...riskDraft, source: e.target.value })} /></div>
                    <Button onClick={addRisk} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">Flag</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {riskTimeline.length > 0 && (
              <Card className="border-border/60 p-4">
                <p className="mb-2 text-xs font-semibold text-muted-foreground">Risk signals over time</p>
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={riskTimeline}>
                      <XAxis dataKey="month" fontSize={10} /><YAxis fontSize={10} allowDecimals={false} /><Tooltip />
                      <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            )}

            {risks.length === 0 ? <Card className="border-border/60 p-8 text-center text-sm text-muted-foreground">No risks logged.</Card> : (
              <div className="space-y-2">
                {risks.map(r => (
                  <Card key={r.id} className="border-border/60 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${severityBadge(r.severity)}`}>{r.severity}</span>
                          <span className="text-xs font-medium capitalize">{r.risk_type.replace("_", " ")}</span>
                          <span className="text-[10px] text-muted-foreground">{new Date(r.flagged_at).toLocaleDateString()}</span>
                        </div>
                        {r.description && <p className="mt-1 text-xs text-slate-700">{r.description}</p>}
                        {r.source && <p className="mt-0.5 text-[10px] text-muted-foreground">Source: {r.source}</p>}
                      </div>
                      <div className="flex gap-1">
                        {r.status !== "acknowledged" && r.status !== "resolved" && <Button size="sm" variant="outline" onClick={() => updateRiskStatus(r.id, "acknowledged")}>Ack</Button>}
                        {r.status !== "resolved" && <Button size="sm" variant="outline" onClick={() => updateRiskStatus(r.id, "resolved")}><CheckCircle2 className="h-3.5 w-3.5" /></Button>}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="leadtimes" className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex gap-4 text-xs"><span><span className="text-muted-foreground">Avg:</span> <span className="font-mono">{avgLT}d</span></span><span><span className="text-muted-foreground">On-time:</span> <span className="font-mono">{onTimeRate}%</span></span></div>
              <Dialog open={ltOpen} onOpenChange={setLtOpen}>
                <DialogTrigger asChild><Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90"><Plus className="mr-1 h-3.5 w-3.5" /> Add Entry</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Add lead time entry</DialogTitle></DialogHeader>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2"><Label>Part #</Label><Input value={ltDraft.part_number} onChange={e => setLtDraft({ ...ltDraft, part_number: e.target.value })} /></div>
                    <div><Label>Quoted (d)</Label><Input type="number" value={ltDraft.quoted_lead_days} onChange={e => setLtDraft({ ...ltDraft, quoted_lead_days: Number(e.target.value) })} /></div>
                    <div><Label>Actual (d)</Label><Input type="number" value={ltDraft.actual_lead_days} onChange={e => setLtDraft({ ...ltDraft, actual_lead_days: Number(e.target.value) })} /></div>
                    <div><Label>Gate</Label>
                      <Select value={ltDraft.npi_gate} onValueChange={(v) => setLtDraft({ ...ltDraft, npi_gate: v })}><SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{["EVT","DVT","PVT"].map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent></Select>
                    </div>
                    <div><Label>Status</Label>
                      <Select value={ltDraft.status} onValueChange={(v) => setLtDraft({ ...ltDraft, status: v })}><SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="on_track">On Track</SelectItem><SelectItem value="at_risk">At Risk</SelectItem><SelectItem value="delayed">Delayed</SelectItem></SelectContent></Select>
                    </div>
                    <Button className="col-span-2 bg-primary text-primary-foreground hover:bg-primary/90" onClick={addLt}>Add</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <Card className="border-border/60 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground"><tr><th className="px-3 py-2 text-left">Part</th><th className="px-3 py-2 text-right">Quoted</th><th className="px-3 py-2 text-right">Actual</th><th className="px-3 py-2 text-left">Gate</th><th className="px-3 py-2 text-left">Needed by</th><th className="px-3 py-2 text-left">Status</th></tr></thead>
                <tbody className="divide-y divide-border">
                  {leadTimes.map(l => { const sb = statusBadge(l.status); return (
                    <tr key={l.id}><td className="px-3 py-2 font-mono text-xs">{l.part_number ?? "—"}</td><td className="px-3 py-2 text-right font-mono">{l.quoted_lead_days ?? "—"}</td><td className="px-3 py-2 text-right font-mono">{l.actual_lead_days ?? "—"}</td><td className="px-3 py-2">{l.npi_gate ?? "—"}</td><td className="px-3 py-2 text-xs">{l.needed_by ?? "—"}</td><td className="px-3 py-2"><span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${sb.className}`}>{sb.label}</span></td></tr>
                  );})}
                  {leadTimes.length === 0 && <tr><td colSpan={6} className="px-3 py-8 text-center text-sm text-muted-foreground">No entries.</td></tr>}
                </tbody>
              </table>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
