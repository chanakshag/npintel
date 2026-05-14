import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Truck, Plus, Building2, AlertTriangle, ShieldCheck, Clock } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { statusBadge, severityBadge, riskColor } from "@/lib/intel";
import { ProjectBreadcrumb, NoProjectGuard } from "@/components/ProjectBreadcrumb";
import { useProject } from "@/hooks/useProject";

export default function SupplyIntel() {
  const { projectId, project } = useProject();
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [risks, setRisks] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, qualified: 0, openRisks: 0, atRiskLT: 0 });
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<any>({ name: "", category: "component", country: "", contact_email: "" });

  const load = async () => {
    if (!projectId) return;
    const [{ data: s }, { data: r }, { data: lt }] = await Promise.all([
      supabase.from("suppliers").select("*").eq("project_id", projectId).order("created_at", { ascending: false }),
      supabase.from("supply_risks").select("*, suppliers(name)").eq("project_id", projectId).eq("status", "open").order("flagged_at", { ascending: false }).limit(15),
      supabase.from("lead_time_entries").select("status").eq("project_id", projectId).neq("status", "on_track"),
    ]);
    setSuppliers(s ?? []); setRisks(r ?? []);
    setStats({
      total: s?.length ?? 0,
      qualified: (s ?? []).filter((x: any) => x.status === "qualified").length,
      openRisks: r?.length ?? 0,
      atRiskLT: lt?.length ?? 0,
    });
  };
  useEffect(() => { load(); }, [projectId]);

  const create = async () => {
    if (!draft.name?.trim()) return;
    if (!projectId) return toast.error("Open a project first");
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const { error } = await supabase.from("suppliers").insert({ ...draft, user_id: u.user.id, project_id: projectId });
    if (error) return toast.error(error.message);
    toast.success("Supplier added"); setOpen(false); setDraft({ name: "", category: "component", country: "", contact_email: "" });
    load();
  };

  const tiles = [
    { label: "Suppliers", value: stats.total, icon: Building2 },
    { label: "Qualified", value: stats.qualified, icon: ShieldCheck },
    { label: "Open risks", value: stats.openRisks, icon: AlertTriangle },
    { label: "At-risk lead times", value: stats.atRiskLT, icon: Clock },
  ];

  if (!projectId) {
    return (
      <AppLayout title="Supply Intel" description="Supplier qualification & supply chain risk">
        <NoProjectGuard hard message="Suppliers are organized by project. Open a project from the Projects page to manage suppliers." />
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Supply Intel" description={project ? `Project: ${project.name}` : "Supplier qualification automation"}
      actions={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90"><Plus className="mr-1 h-3.5 w-3.5" /> Add Supplier</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add supplier</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Name</Label><Input value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} /></div>
              <div><Label>Category</Label>
                <Select value={draft.category} onValueChange={(v) => setDraft({ ...draft, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="component">Component</SelectItem>
                    <SelectItem value="contract_manufacturer">Contract Manufacturer</SelectItem>
                    <SelectItem value="distributor">Distributor</SelectItem>
                    <SelectItem value="raw_material">Raw Material</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Country</Label><Input value={draft.country} onChange={e => setDraft({ ...draft, country: e.target.value })} /></div>
              <div><Label>Contact email</Label><Input type="email" value={draft.contact_email} onChange={e => setDraft({ ...draft, contact_email: e.target.value })} /></div>
              <Button onClick={create} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">Add</Button>
            </div>
          </DialogContent>
        </Dialog>
      }>
      <div className="mx-auto max-w-7xl space-y-6">
        <ProjectBreadcrumb project={project} currentPage="Suppliers" />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {tiles.map(t => (
            <Card key={t.label} className="border-border/60 p-4">
              <t.icon className="h-4 w-4 text-muted-foreground" />
              <div className="mt-3"><div className="font-mono text-2xl font-semibold tracking-tight">{t.value}</div>
                <div className="mt-0.5 text-xs text-muted-foreground">{t.label}</div></div>
            </Card>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="border-border/60 lg:col-span-2">
            <div className="border-b border-border px-4 py-3"><h3 className="text-sm font-semibold">Suppliers</h3></div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr><th className="px-3 py-2 text-left">Name</th><th className="px-3 py-2 text-left">Category</th><th className="px-3 py-2 text-left">Country</th><th className="px-3 py-2 text-left">Risk</th><th className="px-3 py-2 text-left">Status</th></tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {suppliers.map(s => {
                    const sb = statusBadge(s.status);
                    return (
                      <tr key={s.id} className="hover:bg-muted/20">
                        <td className="px-3 py-2"><Link to={`/supply/${s.id}`} className="font-medium text-navy hover:text-primary">{s.name}</Link></td>
                        <td className="px-3 py-2 text-xs text-muted-foreground">{s.category ?? "—"}</td>
                        <td className="px-3 py-2 text-xs text-muted-foreground">{s.country ?? "—"}</td>
                        <td className="px-3 py-2"><div className="flex items-center gap-2"><div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted"><div className={`h-full ${riskColor(s.risk_score)}`} style={{ width: `${s.risk_score}%` }} /></div><span className="font-mono text-xs">{s.risk_score}</span></div></td>
                        <td className="px-3 py-2"><span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${sb.className}`}>{sb.label}</span></td>
                      </tr>
                    );
                  })}
                  {suppliers.length === 0 && <tr><td colSpan={5} className="px-3 py-8 text-center text-sm text-muted-foreground">No suppliers yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </Card>

          <Card className="border-border/60">
            <div className="border-b border-border px-4 py-3"><h3 className="text-sm font-semibold">Risk feed</h3></div>
            {risks.length === 0 ? (
              <p className="p-6 text-center text-xs text-muted-foreground">No open risk signals.</p>
            ) : (
              <ul className="divide-y divide-border">
                {risks.map(r => (
                  <li key={r.id} className="px-4 py-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-navy">{r.suppliers?.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">{r.risk_type.replace("_", " ")}</p>
                      </div>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${severityBadge(r.severity)}`}>{r.severity}</span>
                    </div>
                    {r.description && <p className="mt-1 text-xs text-slate-600">{r.description}</p>}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
