import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Plus, BarChart3, ShoppingCart, FileText, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { statusBadge } from "@/lib/intel";
import { ProjectBreadcrumb, NoProjectGuard } from "@/components/ProjectBreadcrumb";
import { useProject } from "@/hooks/useProject";

const STAGES = [
  { key: "draft", label: "Draft" },
  { key: "submitted", label: "Submitted" },
  { key: "approved", label: "Approved" },
  { key: "po_raised", label: "PO Raised" },
  { key: "fulfilled", label: "Fulfilled" },
];

export default function ProcureIntel() {
  const { projectId, project } = useProject();
  const [prs, setPrs] = useState<any[]>([]);
  const [stats, setStats] = useState({ openPrs: 0, monthSpend: 0, openRfqs: 0, posPending: 0 });

  const load = async () => {
    if (!projectId) return;
    const monthStart = new Date(); monthStart.setDate(1);
    const [{ data: prData }, { data: rfqs }, { data: pos }] = await Promise.all([
      supabase.from("purchase_requisitions").select("*, pr_items(quantity, unit_cost)")
        .eq("project_id", projectId).order("updated_at", { ascending: false }),
      supabase.from("rfqs").select("status").eq("project_id", projectId).in("status", ["draft", "sent"]),
      supabase.from("purchase_orders").select("total_amount, created_at, status").eq("project_id", projectId),
    ]);
    const monthSpend = (pos ?? []).filter(p => p.created_at >= monthStart.toISOString()).reduce((s, p) => s + Number(p.total_amount ?? 0), 0);
    setPrs(prData ?? []);
    setStats({
      openPrs: (prData ?? []).filter(p => p.status !== "fulfilled").length,
      monthSpend, openRfqs: rfqs?.length ?? 0,
      posPending: (pos ?? []).filter(p => p.status === "raised").length,
    });
  };
  useEffect(() => { load(); }, [projectId]);

  const itemsCount = (pr: any) => (pr.pr_items ?? []).length;
  const estCost = (pr: any) => (pr.pr_items ?? []).reduce((s: number, i: any) => s + Number(i.quantity ?? 0) * Number(i.unit_cost ?? 0), 0) || pr.total_estimated_cost || 0;

  const tiles = [
    { label: "Open PRs", value: stats.openPrs, icon: FileText },
    { label: "Spend (this month)", value: `$${stats.monthSpend.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, icon: BarChart3 },
    { label: "Open RFQs", value: stats.openRfqs, icon: Package },
    { label: "POs awaiting confirm", value: stats.posPending, icon: ShoppingCart },
  ];

  const PrCard = ({ pr }: { pr: any }) => {
    const sb = statusBadge(pr.status);
    return (
      <Link to={`/procurement/pr/${pr.id}`}><Card className="border-border/60 p-3 transition-colors hover:border-primary/40">
        <div className="flex items-start justify-between gap-2">
          <h4 className="text-sm font-medium text-navy">{pr.title}</h4>
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${sb.className}`}>{sb.label}</span>
        </div>
        <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
          <span>{pr.npi_gate ?? "—"} · {itemsCount(pr)} items</span>
          <span className="font-mono">${estCost(pr).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
        </div>
      </Card></Link>
    );
  };

  if (!projectId) {
    return (
      <AppLayout title="Procure Intel" description="Procurement automation">
        <NoProjectGuard hard message="Purchase requisitions, RFQs, and POs are organized by project. Open a project from the Projects page." />
      </AppLayout>
    );
  }

  const newPrHref = `/procurement/pr/new?project_id=${projectId}`;
  const spendHref = `/procurement/spend?project_id=${projectId}`;

  return (
    <AppLayout title="Procure Intel" description={project ? `Project: ${project.name}` : "Procurement automation"}
      actions={
        <div className="flex gap-2">
          <Link to={spendHref}><Button size="sm" variant="outline"><BarChart3 className="mr-1 h-3.5 w-3.5" /> Spend</Button></Link>
          <Link to={newPrHref}><Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90"><Plus className="mr-1 h-3.5 w-3.5" /> New PR</Button></Link>
        </div>
      }>
      <div className="mx-auto max-w-7xl space-y-6">
        <ProjectBreadcrumb project={project} currentPage="Procurement" />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {tiles.map(t => (
            <Card key={t.label} className="border-border/60 p-4">
              <t.icon className="h-4 w-4 text-muted-foreground" />
              <div className="mt-3"><div className="font-mono text-2xl font-semibold tracking-tight">{t.value}</div>
                <div className="mt-0.5 text-xs text-muted-foreground">{t.label}</div></div>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="pipeline">
          <TabsList>
            <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
            <TabsTrigger value="list">List</TabsTrigger>
          </TabsList>

          <TabsContent value="pipeline">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3 lg:grid-cols-5">
              {STAGES.map(s => {
                const stagePrs = prs.filter(p => p.status === s.key);
                return (
                  <div key={s.key} className="space-y-2">
                    <div className="flex items-center justify-between px-1">
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{s.label}</h3>
                      <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-mono">{stagePrs.length}</span>
                    </div>
                    <div className="min-h-[100px] space-y-2 rounded-md bg-muted/30 p-2">
                      {stagePrs.length === 0 ? <p className="px-1 py-3 text-center text-[11px] text-muted-foreground">—</p> : stagePrs.map(pr => <PrCard key={pr.id} pr={pr} />)}
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="list">
            <Card className="border-border/60 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground"><tr><th className="px-3 py-2 text-left">Title</th><th className="px-3 py-2 text-left">Gate</th><th className="px-3 py-2 text-right">Items</th><th className="px-3 py-2 text-right">Est. Cost</th><th className="px-3 py-2 text-left">Status</th><th className="px-3 py-2 text-left">Updated</th></tr></thead>
                <tbody className="divide-y divide-border">
                  {prs.map(pr => { const sb = statusBadge(pr.status); return (
                    <tr key={pr.id} className="hover:bg-muted/20"><td className="px-3 py-2"><Link to={`/procurement/pr/${pr.id}`} className="font-medium text-navy hover:text-primary">{pr.title}</Link></td><td className="px-3 py-2 text-xs">{pr.npi_gate ?? "—"}</td><td className="px-3 py-2 text-right font-mono">{itemsCount(pr)}</td><td className="px-3 py-2 text-right font-mono">${estCost(pr).toLocaleString(undefined, { maximumFractionDigits: 0 })}</td><td className="px-3 py-2"><span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${sb.className}`}>{sb.label}</span></td><td className="px-3 py-2 text-xs text-muted-foreground">{new Date(pr.updated_at).toLocaleDateString()}</td></tr>
                  );})}
                  {prs.length === 0 && <tr><td colSpan={6} className="px-3 py-8 text-center text-sm text-muted-foreground">No purchase requisitions yet.</td></tr>}
                </tbody>
              </table>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
