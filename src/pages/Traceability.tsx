import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, GitBranch, Trash2, Link2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useProject } from "@/hooks/useProject";
import { ProjectBreadcrumb, NoProjectGuard } from "@/components/ProjectBreadcrumb";

type Req = {
  id: string; ref_id: string; title: string; description: string | null;
  subsystem: string | null; owner: string | null; gate_stage: string | null; status: string;
};
type Link = { id: string; from_req: string; to_req: string; link_type: string };

const STATUSES = ["draft", "approved", "verified", "blocked"];
const GATES = ["PDR", "EVT", "DVT", "PVT", "CDR"];

const Traceability = () => {
  const { user } = useAuth();
  const { projectId, project } = useProject();
  const [reqs, setReqs] = useState<Req[]>([]);
  const [links, setLinks] = useState<Link[]>([]);
  const [filterSub, setFilterSub] = useState<string>("all");
  const [filterGate, setFilterGate] = useState<string>("all");

  // new req form
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ ref_id: "", title: "", description: "", subsystem: "", owner: "", gate_stage: "EVT", status: "draft" });

  // link form
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkFrom, setLinkFrom] = useState<string>("");
  const [linkTo, setLinkTo] = useState<string>("");
  const [linkType, setLinkType] = useState("derives");

  const load = async () => {
    if (!projectId) { setReqs([]); setLinks([]); return; }
    const [r, l] = await Promise.all([
      supabase.from("requirements").select("*").eq("project_id", projectId).order("ref_id"),
      supabase.from("trace_links").select("*").eq("project_id", projectId),
    ]);
    setReqs((r.data as any) ?? []);
    setLinks((l.data as any) ?? []);
  };
  useEffect(() => { load(); }, [projectId]);

  const addReq = async () => {
    if (!user) return;
    if (!projectId) return toast.error("Open a project first");
    if (!form.ref_id || !form.title) return toast.error("Ref ID and title required");
    const { error } = await supabase.from("requirements").insert({ ...form, user_id: user.id, project_id: projectId });
    if (error) return toast.error(error.message);
    toast.success("Requirement added");
    setOpen(false);
    setForm({ ref_id: "", title: "", description: "", subsystem: "", owner: "", gate_stage: "EVT", status: "draft" });
    load();
  };

  const addLink = async () => {
    if (!user || !linkFrom || !linkTo || linkFrom === linkTo) return toast.error("Pick two different requirements");
    if (!projectId) return toast.error("Open a project first");
    const { error } = await supabase.from("trace_links").insert({ user_id: user.id, from_req: linkFrom, to_req: linkTo, link_type: linkType, project_id: projectId });
    if (error) return toast.error(error.message);
    toast.success("Trace link added");
    setLinkOpen(false); setLinkFrom(""); setLinkTo("");
    load();
  };

  const removeReq = async (id: string) => {
    await supabase.from("requirements").delete().eq("id", id);
    load();
  };
  const removeLink = async (id: string) => {
    await supabase.from("trace_links").delete().eq("id", id);
    load();
  };

  const subsystems = Array.from(new Set(reqs.map(r => r.subsystem).filter(Boolean))) as string[];
  const filtered = reqs.filter(r =>
    (filterSub === "all" || r.subsystem === filterSub) &&
    (filterGate === "all" || r.gate_stage === filterGate)
  );

  // orphans: reqs with no incoming or outgoing links
  const linkedIds = new Set([...links.map(l => l.from_req), ...links.map(l => l.to_req)]);
  const orphanCount = reqs.filter(r => !linkedIds.has(r.id)).length;

  const reqById = (id: string) => reqs.find(r => r.id === id);

  return (
    <AppLayout
      title="Requirements Traceability"
      description="Link requirements → design decisions → tests → sign-offs."
      actions={
        <>
          <Dialog open={linkOpen} onOpenChange={setLinkOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" disabled={reqs.length < 2}>
                <Link2 className="mr-2 h-4 w-4" />Add link
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add trace link</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">From</Label>
                  <Select value={linkFrom} onValueChange={setLinkFrom}>
                    <SelectTrigger><SelectValue placeholder="Source requirement" /></SelectTrigger>
                    <SelectContent>{reqs.map(r => <SelectItem key={r.id} value={r.id}>{r.ref_id} — {r.title}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">To</Label>
                  <Select value={linkTo} onValueChange={setLinkTo}>
                    <SelectTrigger><SelectValue placeholder="Target requirement" /></SelectTrigger>
                    <SelectContent>{reqs.map(r => <SelectItem key={r.id} value={r.id}>{r.ref_id} — {r.title}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Type</Label>
                  <Select value={linkType} onValueChange={setLinkType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["derives", "verifies", "implements", "depends_on"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter><Button onClick={addLink}>Create link</Button></DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="mr-2 h-4 w-4" />New requirement</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>New requirement</DialogTitle></DialogHeader>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Ref ID</Label>
                  <Input value={form.ref_id} onChange={(e) => setForm({ ...form, ref_id: e.target.value })} placeholder="REQ-001" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Subsystem</Label>
                  <Input value={form.subsystem} onChange={(e) => setForm({ ...form, subsystem: e.target.value })} placeholder="Power" />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label className="text-xs">Title</Label>
                  <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label className="text-xs">Description</Label>
                  <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Owner</Label>
                  <Input value={form.owner} onChange={(e) => setForm({ ...form, owner: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Gate stage</Label>
                  <Select value={form.gate_stage} onValueChange={(v) => setForm({ ...form, gate_stage: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{GATES.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label className="text-xs">Status</Label>
                  <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter><Button onClick={addReq}>Create</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      }
    >
      <div className="mx-auto max-w-7xl space-y-4">
        <ProjectBreadcrumb project={project} currentPage="Traceability" />
        {!projectId ? (
          <NoProjectGuard message="Requirements and trace links are scoped per project. Pick a project to view or build the traceability matrix." hard />
        ) : (
        <>

        {/* Filters + alert */}
        <div className="flex flex-wrap items-center gap-3">
          <Select value={filterSub} onValueChange={setFilterSub}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All subsystems</SelectItem>
              {subsystems.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterGate} onValueChange={setFilterGate}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All gates</SelectItem>
              {GATES.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
            </SelectContent>
          </Select>
          {orphanCount > 0 && (
            <Badge variant="outline" className="border-warning/40 text-warning">
              <AlertTriangle className="mr-1 h-3 w-3" />{orphanCount} unlinked requirement{orphanCount === 1 ? "" : "s"}
            </Badge>
          )}
          <div className="ml-auto text-xs text-muted-foreground">
            {reqs.length} requirements · {links.length} links
          </div>
        </div>

        {/* Requirements table */}
        <Card className="overflow-hidden border-border/60">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary/50 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-2.5 text-left font-medium">Ref</th>
                  <th className="px-4 py-2.5 text-left font-medium">Title</th>
                  <th className="px-4 py-2.5 text-left font-medium">Subsystem</th>
                  <th className="px-4 py-2.5 text-left font-medium">Owner</th>
                  <th className="px-4 py-2.5 text-left font-medium">Gate</th>
                  <th className="px-4 py-2.5 text-left font-medium">Status</th>
                  <th className="px-4 py-2.5 text-right font-medium">Links</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.length === 0 && (
                  <tr><td colSpan={8} className="px-4 py-12 text-center text-sm text-muted-foreground">
                    No requirements yet. Add the first one to start the traceability matrix.
                  </td></tr>
                )}
                {filtered.map(r => {
                  const isLinked = linkedIds.has(r.id);
                  const out = links.filter(l => l.from_req === r.id).length;
                  const inn = links.filter(l => l.to_req === r.id).length;
                  return (
                    <tr key={r.id} className="hover:bg-secondary/30">
                      <td className="px-4 py-2.5 font-mono text-xs">{r.ref_id}</td>
                      <td className="px-4 py-2.5">
                        <div className="font-medium">{r.title}</div>
                        {r.description && <div className="line-clamp-1 text-xs text-muted-foreground">{r.description}</div>}
                      </td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground">{r.subsystem ?? "—"}</td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground">{r.owner ?? "—"}</td>
                      <td className="px-4 py-2.5"><Badge variant="outline" className="text-[10px]">{r.gate_stage ?? "—"}</Badge></td>
                      <td className="px-4 py-2.5">
                        <Badge variant={r.status === "verified" ? "default" : r.status === "blocked" ? "destructive" : "secondary"} className="text-[10px]">{r.status}</Badge>
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        {isLinked ? (
                          <span className="font-mono text-xs text-muted-foreground">↑{inn} ↓{out}</span>
                        ) : (
                          <span className="text-xs text-warning">unlinked</span>
                        )}
                      </td>
                      <td className="px-2 py-2.5">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeReq(r.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Trace links list */}
        {links.length > 0 && (
          <Card className="border-border/60 p-4">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <GitBranch className="h-4 w-4 text-primary" />Trace links
            </h3>
            <ul className="space-y-1.5">
              {links.map(l => {
                const f = reqById(l.from_req); const t = reqById(l.to_req);
                return (
                  <li key={l.id} className="flex items-center justify-between rounded-md border border-border/60 bg-secondary/20 px-3 py-2 text-xs">
                    <div className="flex items-center gap-2 font-mono">
                      <span className="text-foreground">{f?.ref_id ?? "?"}</span>
                      <span className="text-muted-foreground">→ {l.link_type} →</span>
                      <span className="text-foreground">{t?.ref_id ?? "?"}</span>
                    </div>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeLink(l.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </li>
                );
              })}
            </ul>
          </Card>
        )}
        </>
        )}
      </div>
    </AppLayout>
  );
};

export default Traceability;
