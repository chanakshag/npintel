import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  ArrowRight, FileText, GitBranch, Layers, Truck, ShoppingCart, Loader2, Sparkles,
  CheckCircle2, AlertTriangle, Plus, ArrowUpRight, Upload,
} from "lucide-react";
import { toast } from "sonner";
import { callIntelAi, statusBadge, riskColor } from "@/lib/intel";

type Project = {
  id: string; name: string; product_description: string;
  industry: string; gate_standard: string; updated_at: string;
};

export default function ProjectHub() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [project, setProject] = useState<Project | null>(null);
  const [docs, setDocs] = useState<any[]>([]);
  const [reqs, setReqs] = useState<any[]>([]);
  const [boms, setBoms] = useState<any[]>([]);
  const [bomItems, setBomItems] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [prs, setPrs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingPrd, setGeneratingPrd] = useState(false);
  const [generatingBom, setGeneratingBom] = useState(false);
  const [creatingPr, setCreatingPr] = useState(false);
  const [populatingSuppliers, setPopulatingSuppliers] = useState(false);
  const [bomDialogOpen, setBomDialogOpen] = useState(false);
  const [bomName, setBomName] = useState("");

  const prdDoc = docs.find(d => d.category === "PRD");

  const load = async () => {
    if (!projectId) return;
    setLoading(true);
    const [{ data: p }, { data: d }, { data: r }, { data: b }, { data: s }, { data: pr }] = await Promise.all([
      supabase.from("projects").select("*").eq("id", projectId).maybeSingle(),
      supabase.from("documents").select("*").eq("project_id", projectId).order("created_at", { ascending: false }),
      supabase.from("requirements").select("*").eq("project_id", projectId).order("ref_id"),
      supabase.from("boms").select("*").eq("project_id", projectId).order("updated_at", { ascending: false }),
      supabase.from("suppliers").select("*").eq("project_id", projectId).order("created_at", { ascending: false }),
      supabase.from("purchase_requisitions").select("*").eq("project_id", projectId).order("updated_at", { ascending: false }),
    ]);
    setProject(p as any);
    setDocs(d ?? []); setReqs(r ?? []); setBoms(b ?? []);
    setSuppliers(s ?? []); setPrs(pr ?? []);

    const bomIds = (b ?? []).map(x => x.id);
    if (bomIds.length) {
      const { data: items } = await supabase.from("bom_items").select("*").in("bom_id", bomIds);
      setBomItems(items ?? []);
    } else setBomItems([]);
    setLoading(false);
  };

  useEffect(() => { load(); }, [projectId]);

  const generatePrd = async () => {
    if (!project || !user) return;
    setGeneratingPrd(true);
    try {
      const content = await callIntelAi("prd_generate", {
        product_description: project.product_description,
        industry: project.industry,
        gate_standard: project.gate_standard,
        requirements: reqs,
      });
      const { error } = await supabase.from("documents").insert({
        user_id: user.id, project_id: project.id, name: `PRD — ${project.name}`,
        category: "PRD", summary: content.slice(0, 500), key_points: [], status: "ready",
        file_path: `prd/${project.id}.md`, mime_type: "text/markdown",
      });
      if (error) throw error;
      toast.success("PRD generated");
      load();
    } catch (e: any) { toast.error(e.message ?? "PRD generation failed"); }
    finally { setGeneratingPrd(false); }
  };

  const createBomManual = async () => {
    if (!project || !user || !bomName.trim()) return;
    const { data, error } = await supabase.from("boms")
      .insert({ user_id: user.id, project_id: project.id, name: bomName }).select().single();
    if (error) return toast.error(error.message);
    setBomDialogOpen(false); setBomName("");
    navigate(`/bom/${data.id}`);
  };

  const generateBomFromPrd = async () => {
    if (!project || !user || !prdDoc) return;
    setGeneratingBom(true);
    try {
      const raw = await callIntelAi("bom_from_prd", {
        product_description: project.product_description,
        prdContent: prdDoc.summary ?? prdDoc.name,
      });
      const cleaned = raw.replace(/```json\s*|\s*```/g, "").trim();
      const parsed = JSON.parse(cleaned);
      const items = parsed.items ?? [];
      const { data: bom, error } = await supabase.from("boms")
        .insert({ user_id: user.id, project_id: project.id, name: `BOM — ${project.name}` })
        .select().single();
      if (error) throw error;
      if (items.length) {
        await supabase.from("bom_items").insert(items.map((i: any) => ({
          user_id: user.id, bom_id: bom.id,
          part_number: i.part_number ?? "TBD", description: i.description,
          manufacturer: i.manufacturer, supplier: i.supplier,
          quantity: Number(i.quantity ?? 1), unit: i.unit ?? "ea",
          unit_cost: i.unit_cost ?? null, lead_time_days: i.lead_time_days ?? null,
          notes: i.notes,
        })));
      }
      toast.success(`BOM generated with ${items.length} items`);
      load();
    } catch (e: any) { toast.error(e.message ?? "BOM generation failed"); }
    finally { setGeneratingBom(false); }
  };

  const populateSuppliers = async () => {
    if (!project || !user) return;
    setPopulatingSuppliers(true);
    try {
      const names = Array.from(new Set(bomItems.map(i => i.supplier).filter(Boolean)));
      const existing = new Set(suppliers.map(s => s.name));
      const toAdd = names.filter(n => !existing.has(n))
        .map(name => ({ user_id: user.id, project_id: project.id, name, category: "component" }));
      if (!toAdd.length) { toast.info("All suppliers already added"); return; }
      const { error } = await supabase.from("suppliers").insert(toAdd);
      if (error) throw error;
      toast.success(`${toAdd.length} suppliers added`);
      load();
    } catch (e: any) { toast.error(e.message ?? "Failed to add suppliers"); }
    finally { setPopulatingSuppliers(false); }
  };

  const createPrFromBom = async () => {
    if (!project || !user || !boms.length) return;
    setCreatingPr(true);
    try {
      const bom = boms[0];
      const items = bomItems.filter(i => i.bom_id === bom.id);
      const { data: pr, error } = await supabase.from("purchase_requisitions").insert({
        user_id: user.id, project_id: project.id, bom_id: bom.id,
        title: `PR — ${project.name}`, status: "draft",
      }).select().single();
      if (error) throw error;
      if (items.length) {
        await supabase.from("pr_items").insert(items.map(i => ({
          user_id: user.id, pr_id: pr.id, bom_item_id: i.id,
          part_number: i.part_number, description: i.description,
          quantity: i.quantity, unit_cost: i.unit_cost,
        })));
      }
      navigate(`/procurement/pr/${pr.id}`);
    } catch (e: any) { toast.error(e.message ?? "PR creation failed"); }
    finally { setCreatingPr(false); }
  };

  if (loading) return <AppLayout title="Project"><div className="flex h-64 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div></AppLayout>;
  if (!project) return <AppLayout title="Project not found"><p className="text-sm text-muted-foreground">This project doesn't exist.</p></AppLayout>;

  const steps = [
    { label: "Documents", filled: docs.length > 0, anchor: "#docs" },
    { label: "Requirements", filled: reqs.length > 0, anchor: "#reqs" },
    { label: "PRD", filled: !!prdDoc, anchor: "#prd" },
    { label: "BOM", filled: boms.length > 0, anchor: "#bom" },
    { label: "Supply & Procurement", filled: suppliers.length > 0 || prs.length > 0, anchor: "#supply" },
  ];

  const q = `?project_id=${project.id}`;

  return (
    <AppLayout title={project.name} description="Project hub — full NPI workflow, end to end">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <Card className="border-border/60 bg-navy p-6 text-white">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">
              <h1 className="text-2xl font-semibold tracking-tight">{project.name}</h1>
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge variant="secondary" className="bg-white/10 text-white hover:bg-white/15">{project.industry}</Badge>
                <Badge variant="secondary" className="bg-white/10 text-white hover:bg-white/15">{project.gate_standard}</Badge>
              </div>
              <p className="mt-3 max-w-2xl text-sm text-white/70">{project.product_description}</p>
              <p className="mt-2 text-[11px] text-white/50">Updated {new Date(project.updated_at).toLocaleString()}</p>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button variant="outline" size="sm" className="border-white/20 bg-transparent text-white hover:bg-white/10" onClick={() => navigate("/projects")}>Edit Project</Button>
              <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => navigate(`/workflow/${project.id}`)}>Open Workflow <ArrowRight className="ml-1 h-3.5 w-3.5" /></Button>
            </div>
          </div>
        </Card>

        {/* Pipeline strip */}
        <Card className="border-border/60 p-4">
          <div className="flex flex-wrap items-center gap-2">
            {steps.map((s, i) => (
              <div key={s.label} className="flex items-center gap-2">
                <a href={s.anchor} className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${s.filled ? "bg-primary text-primary-foreground" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>
                  <span className="font-mono text-[10px] opacity-70">{i + 1}</span>{s.label}
                </a>
                {i < steps.length - 1 && <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />}
              </div>
            ))}
          </div>
        </Card>

        {/* Documents */}
        <Card id="docs" className="border-border/60">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-navy">Project Documents</h3>
              <Badge variant="secondary" className="text-[10px]">{docs.length} document{docs.length === 1 ? "" : "s"}</Badge>
            </div>
            <Link to={`/documents${q}`}><Button size="sm" variant="outline"><Upload className="mr-1 h-3.5 w-3.5" /> Upload Document</Button></Link>
          </div>
          {docs.length === 0 ? (
            <div className="border-t-0 p-8 text-center">
              <p className="text-sm text-muted-foreground">No documents uploaded yet for this project. Upload datasheets, PRDs, test reports, or supplier docs to get started.</p>
              <Link to={`/documents${q}`}><Button size="sm" className="mt-3 bg-primary text-primary-foreground hover:bg-primary/90"><Upload className="mr-1 h-3.5 w-3.5" /> Upload Document</Button></Link>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {docs.slice(0, 6).map(d => (
                <li key={d.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                  <div className="flex min-w-0 items-center gap-2">
                    <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{d.name}</p>
                      <p className="text-[11px] text-muted-foreground">{d.category ?? "Uncategorized"} · {new Date(d.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <Badge variant={d.status === "ready" ? "default" : "secondary"} className="text-[10px]">{d.status}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Requirements */}
        <Card id="reqs" className="border-border/60">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <GitBranch className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-navy">Requirements</h3>
              <Badge variant="secondary" className="text-[10px]">{reqs.length} requirement{reqs.length === 1 ? "" : "s"}</Badge>
            </div>
            <Link to={`/traceability${q}`}><Button size="sm" variant="outline">View All <ArrowUpRight className="ml-1 h-3 w-3" /></Button></Link>
          </div>
          {reqs.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm text-muted-foreground">No requirements extracted yet. Upload documents first, then use the AI agent to extract requirements automatically.</p>
              <Link to={`/research${q}`}><Button size="sm" className="mt-3 bg-primary text-primary-foreground hover:bg-primary/90"><Sparkles className="mr-1 h-3.5 w-3.5" /> Extract Requirements with AI</Button></Link>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {reqs.slice(0, 5).map(r => (
                <li key={r.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="font-mono text-[11px] text-muted-foreground">{r.ref_id}</span>
                    <span className="truncate text-sm">{r.title}</span>
                  </div>
                  <Badge variant={r.status === "verified" ? "default" : r.status === "blocked" ? "destructive" : "secondary"} className="text-[10px]">{r.status}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* PRD */}
        <Card id="prd" className="border-border/60">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-navy">PRD</h3>
              <Badge variant={prdDoc ? "default" : "secondary"} className="text-[10px]">{prdDoc ? "Generated" : "Not started"}</Badge>
            </div>
          </div>
          <div className="p-4">
            {prdDoc ? (
              <div className="flex items-center justify-between gap-3 rounded-md border border-border/60 p-3">
                <div className="flex min-w-0 items-center gap-2">
                  <FileText className="h-4 w-4 shrink-0 text-primary" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{prdDoc.name}</p>
                    <p className="text-[11px] text-muted-foreground">Created {new Date(prdDoc.created_at).toLocaleString()}</p>
                  </div>
                </div>
                <Link to={`/documents${q}`}><Button size="sm" variant="outline">Open PRD <ArrowUpRight className="ml-1 h-3 w-3" /></Button></Link>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">Generate your PRD automatically from the requirements extracted for this project.</p>
                <div className="flex items-center gap-2 text-xs">
                  {reqs.length > 0 ? (
                    <span className="flex items-center gap-1.5 rounded-md bg-emerald-50 px-2 py-1 text-emerald-700"><CheckCircle2 className="h-3.5 w-3.5" /> {reqs.length} requirements available</span>
                  ) : (
                    <span className="flex items-center gap-1.5 rounded-md bg-amber-50 px-2 py-1 text-amber-700"><AlertTriangle className="h-3.5 w-3.5" /> No requirements yet — upload documents first</span>
                  )}
                </div>
                <Button size="sm" onClick={generatePrd} disabled={generatingPrd} className="bg-primary text-primary-foreground hover:bg-primary/90">
                  {generatingPrd ? <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Generating PRD…</> : <><Sparkles className="mr-1.5 h-3.5 w-3.5" /> Generate PRD</>}
                </Button>
              </div>
            )}
          </div>
        </Card>

        {/* BOM */}
        <Card id="bom" className="border-border/60">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-navy">Bill of Materials</h3>
              <Badge variant="secondary" className="text-[10px]">{boms.length} BOM{boms.length === 1 ? "" : "s"}</Badge>
            </div>
            <Link to={`/bom${q}`}><Button size="sm" variant="outline">Open BOM Intel <ArrowUpRight className="ml-1 h-3 w-3" /></Button></Link>
          </div>
          <div className="p-4">
            {boms.length > 0 ? (
              <div className="grid gap-2 md:grid-cols-2">
                {boms.map(b => {
                  const sb = statusBadge(b.status);
                  const itemCount = bomItems.filter(i => i.bom_id === b.id).length;
                  return (
                    <Link key={b.id} to={`/bom/${b.id}`}>
                      <Card className="border-border/60 p-3 transition-colors hover:border-primary/40">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-medium text-navy">{b.name}</p>
                            <p className="text-[11px] text-muted-foreground">{b.version} · {itemCount} components</p>
                          </div>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${sb.className}`}>{sb.label}</span>
                        </div>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">No BOM yet. Create one manually or generate it from your PRD.</p>
                <div className="flex flex-wrap gap-2">
                  <Dialog open={bomDialogOpen} onOpenChange={setBomDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline"><Plus className="mr-1 h-3.5 w-3.5" /> Create BOM manually</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle>New BOM</DialogTitle></DialogHeader>
                      <div className="space-y-3"><Label>Name</Label><Input value={bomName} onChange={e => setBomName(e.target.value)} placeholder={`BOM — ${project.name}`} /></div>
                      <DialogFooter><Button onClick={createBomManual}>Create</Button></DialogFooter>
                    </DialogContent>
                  </Dialog>
                  <Button size="sm" disabled={!prdDoc || generatingBom} onClick={generateBomFromPrd} className="bg-primary text-primary-foreground hover:bg-primary/90">
                    {generatingBom ? <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Generating BOM…</> : <><Sparkles className="mr-1.5 h-3.5 w-3.5" /> Generate BOM from PRD</>}
                  </Button>
                </div>
                {!prdDoc && <p className="text-[11px] text-muted-foreground">Generate a PRD first to enable AI BOM generation.</p>}
              </div>
            )}
          </div>
        </Card>

        {/* Supply & Procurement */}
        <Card id="supply" className="border-border/60">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-navy">Supply Chain & Procurement</h3>
            </div>
            <div className="flex gap-2">
              <Link to={`/supply${q}`}><Button size="sm" variant="outline">Supply Intel <ArrowUpRight className="ml-1 h-3 w-3" /></Button></Link>
              <Link to={`/procurement${q}`}><Button size="sm" variant="outline">Procure Intel <ArrowUpRight className="ml-1 h-3 w-3" /></Button></Link>
            </div>
          </div>
          <div className="grid gap-3 p-4 md:grid-cols-2">
            {/* Supply sub-card */}
            <Card className="border-border/60 p-3">
              <div className="mb-2 flex items-center gap-2">
                <Truck className="h-3.5 w-3.5 text-muted-foreground" />
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Suppliers</h4>
                <Badge variant="secondary" className="ml-auto text-[10px]">{suppliers.length}</Badge>
              </div>
              {suppliers.length > 0 ? (
                <ul className="space-y-1.5">
                  {suppliers.slice(0, 3).map(s => (
                    <li key={s.id} className="flex items-center justify-between gap-2 rounded-md border border-border/60 px-2 py-1.5">
                      <div className="min-w-0">
                        <p className="truncate text-xs font-medium">{s.name}</p>
                        <p className="text-[10px] text-muted-foreground">{s.category ?? "—"}</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="h-1 w-12 overflow-hidden rounded-full bg-muted"><div className={`h-full ${riskColor(s.risk_score)}`} style={{ width: `${s.risk_score}%` }} /></div>
                        <span className="font-mono text-[10px]">{s.risk_score}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">No suppliers added yet. Add suppliers from BOM components.</p>
                  <Button size="sm" variant="outline" disabled={!bomItems.length || populatingSuppliers} onClick={populateSuppliers} className="w-full">
                    {populatingSuppliers ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Auto-populate from BOM"}
                  </Button>
                </div>
              )}
            </Card>

            {/* Procurement sub-card */}
            <Card className="border-border/60 p-3">
              <div className="mb-2 flex items-center gap-2">
                <ShoppingCart className="h-3.5 w-3.5 text-muted-foreground" />
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Purchase Requisitions</h4>
                <Badge variant="secondary" className="ml-auto text-[10px]">{prs.length}</Badge>
              </div>
              {prs.length > 0 ? (
                <div className="space-y-1.5 text-xs">
                  <p className="text-muted-foreground">
                    {prs.filter(p => p.status === "draft").length} draft ·{" "}
                    {prs.filter(p => p.status === "approved").length} approved ·{" "}
                    {prs.filter(p => p.status === "fulfilled").length} fulfilled
                  </p>
                  <ul className="space-y-1">
                    {prs.slice(0, 3).map(pr => (
                      <li key={pr.id}><Link to={`/procurement/pr/${pr.id}`} className="block truncate rounded-md border border-border/60 px-2 py-1.5 hover:border-primary/40">{pr.title}</Link></li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">No purchase requisitions yet. Create a PR from your BOM to start procurement.</p>
                  <Button size="sm" disabled={!boms.length || creatingPr} onClick={createPrFromBom} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                    {creatingPr ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Create PR from BOM"}
                  </Button>
                </div>
              )}
            </Card>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
