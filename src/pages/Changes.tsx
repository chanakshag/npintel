import { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { GitCompare, Loader2, Plus, AlertTriangle, FileText, GitBranch, ClipboardCheck, Trash2, Sparkles, CheckCircle2 } from "lucide-react";

type Change = {
  id: string;
  title: string;
  change_type: string;
  component_ref: string | null;
  description: string | null;
  impact: any;
  status: string;
  created_at: string;
};

const SEVERITY_COLOR: Record<string, string> = {
  low: "bg-info/15 text-info border-info/30",
  medium: "bg-warning/15 text-warning border-warning/30",
  high: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  critical: "bg-destructive/15 text-destructive border-destructive/30",
};

const Changes = () => {
  const { user } = useAuth();
  const [changes, setChanges] = useState<Change[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Change | null>(null);
  const [form, setForm] = useState({ title: "", change_type: "component_swap", component_ref: "", description: "" });

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("changes").select("*").order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    else setChanges((data ?? []) as Change[]);
    setLoading(false);
  };

  useEffect(() => { if (user) load(); }, [user]);

  const create = async () => {
    if (!form.title.trim()) return toast.error("Title required");
    const { data, error } = await supabase.from("changes").insert({
      user_id: user!.id,
      title: form.title,
      change_type: form.change_type,
      component_ref: form.component_ref || null,
      description: form.description || null,
    }).select().single();
    if (error) return toast.error(error.message);
    setOpen(false);
    setForm({ title: "", change_type: "component_swap", component_ref: "", description: "" });
    toast.success("Change logged. Analyzing impact…");
    await load();
    if (data) await analyze(data.id);
  };

  const analyze = async (id: string) => {
    setAnalyzing(id);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-change", { body: { changeId: id } });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      toast.success("Impact analysis complete");
      await load();
    } catch (e: any) {
      toast.error(e.message ?? "Analysis failed");
    } finally {
      setAnalyzing(null);
    }
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("changes").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setChanges(changes.filter(c => c.id !== id));
    if (selected?.id === id) setSelected(null);
  };

  return (
    <AppLayout
      title="Change Impact Analyzer"
      description="Log component or spec changes and surface every downstream document, requirement, and gate touched."
      actions={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="mr-1.5 h-4 w-4" />Log change</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Log a change</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Title</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Replace MCU U12 with STM32H753" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Type</Label>
                  <Select value={form.change_type} onValueChange={v => setForm({ ...form, change_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="component_swap">Component swap</SelectItem>
                      <SelectItem value="spec_revision">Spec revision</SelectItem>
                      <SelectItem value="supplier_change">Supplier change</SelectItem>
                      <SelectItem value="design_decision">Design decision</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Component / spec</Label><Input value={form.component_ref} onChange={e => setForm({ ...form, component_ref: e.target.value })} placeholder="U12, REQ-014, …" /></div>
              </div>
              <div><Label>Description</Label><Textarea rows={4} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="What changed, why, and any constraints…" /></div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={create}>Log & analyze</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      }
    >
      <div className="grid gap-4 lg:grid-cols-[380px_1fr]">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Change log</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {loading ? (
              <div className="flex items-center justify-center py-10 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /></div>
            ) : changes.length === 0 ? (
              <p className="py-8 text-center text-xs text-muted-foreground">No changes logged yet.</p>
            ) : changes.map(c => {
              const sev = c.impact?.severity as string | undefined;
              return (
                <button key={c.id} onClick={() => setSelected(c)} className={`w-full rounded-md border p-3 text-left transition hover:bg-secondary/50 ${selected?.id === c.id ? "border-primary/50 bg-secondary/40" : "border-border"}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{c.title}</p>
                      <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{c.change_type.replace("_", " ")} {c.component_ref ? `· ${c.component_ref}` : ""}</p>
                    </div>
                    {sev && <Badge variant="outline" className={`shrink-0 text-[10px] ${SEVERITY_COLOR[sev] ?? ""}`}>{sev}</Badge>}
                  </div>
                </button>
              );
            })}
          </CardContent>
        </Card>

        <div>
          {!selected ? (
            <Card className="flex h-full flex-col items-center justify-center border-dashed py-20 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/30">
                <GitCompare className="h-6 w-6 text-primary" />
              </div>
              <p className="text-sm font-medium">Select a change</p>
              <p className="mt-1 max-w-md text-xs text-muted-foreground">Log a change to instantly see every downstream document, requirement, and gate review affected.</p>
            </Card>
          ) : (
            <Card>
              <CardHeader className="border-b border-border/60">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <CardTitle className="text-base">{selected.title}</CardTitle>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {selected.change_type.replace("_", " ")}{selected.component_ref ? ` · ${selected.component_ref}` : ""} · {new Date(selected.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" disabled={analyzing === selected.id} onClick={() => analyze(selected.id)}>
                      {analyzing === selected.id ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Sparkles className="mr-1.5 h-3.5 w-3.5" />}
                      Re-analyze
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => remove(selected.id)} aria-label="Delete"><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-5 pt-5">
                {selected.description && <p className="text-sm text-muted-foreground">{selected.description}</p>}

                {!selected.impact?.summary ? (
                  <div className="rounded-md border border-dashed border-border/60 bg-secondary/30 p-6 text-center text-xs text-muted-foreground">
                    {analyzing === selected.id ? "Analyzing impact…" : "No impact analysis yet. Click Re-analyze."}
                  </div>
                ) : (
                  <>
                    <div className="rounded-md border border-border/60 bg-secondary/30 p-4">
                      <div className="mb-2 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-primary" />
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Impact summary</span>
                        {selected.impact.severity && <Badge variant="outline" className={`text-[10px] ${SEVERITY_COLOR[selected.impact.severity] ?? ""}`}>{selected.impact.severity}</Badge>}
                      </div>
                      <p className="text-sm">{selected.impact.summary}</p>
                    </div>

                    <ImpactGroup icon={<FileText className="h-3.5 w-3.5" />} title="Affected documents" items={selected.impact.affected_documents} labelKey="name" />
                    <ImpactGroup icon={<GitBranch className="h-3.5 w-3.5" />} title="Affected requirements" items={selected.impact.affected_requirements} labelKey="ref_id" />
                    <ImpactGroup icon={<ClipboardCheck className="h-3.5 w-3.5" />} title="Affected gate reviews" items={selected.impact.affected_gates} labelKey="name" />

                    {selected.impact.follow_up_tasks?.length > 0 && (
                      <div>
                        <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          <CheckCircle2 className="h-3.5 w-3.5" />Follow-up tasks
                        </div>
                        <ul className="space-y-1.5">
                          {selected.impact.follow_up_tasks.map((t: any, i: number) => (
                            <li key={i} className="flex items-start gap-2 rounded-md border border-border/60 bg-card/40 p-2.5 text-sm">
                              <Badge variant="outline" className="mt-0.5 text-[10px] capitalize">{t.priority}</Badge>
                              <span>{t.task}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

const ImpactGroup = ({ icon, title, items, labelKey }: { icon: React.ReactNode; title: string; items: any[] | undefined; labelKey: string }) => {
  if (!items?.length) return null;
  return (
    <div>
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{icon}{title} <span className="text-muted-foreground/60">({items.length})</span></div>
      <ul className="space-y-1.5">
        {items.map((it, i) => (
          <li key={i} className="rounded-md border border-border/60 bg-card/40 p-2.5 text-sm">
            <div className="font-medium">{it[labelKey] ?? it.id}</div>
            <div className="text-xs text-muted-foreground">{it.reason}</div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Changes;
