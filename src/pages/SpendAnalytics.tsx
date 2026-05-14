import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProjectBreadcrumb, NoProjectGuard } from "@/components/ProjectBreadcrumb";
import { useProject } from "@/hooks/useProject";

const COLORS = ["#0D9488", "#0D1B3E", "#14B8A6", "#6366F1", "#F59E0B", "#EF4444", "#22C55E", "#A855F7"];

export default function SpendAnalytics() {
  const { projectId, project } = useProject();
  const [pos, setPos] = useState<any[]>([]);
  const [rfqs, setRfqs] = useState<any[]>([]);

  useEffect(() => {
    if (!projectId) return;
    supabase.from("purchase_orders").select("*, suppliers(name)").eq("project_id", projectId)
      .then(({ data }) => setPos(data ?? []));
    supabase.from("rfqs").select("quoted_price, supplier_id, status").eq("project_id", projectId)
      .then(({ data }) => setRfqs(data ?? []));
  }, [projectId]);

  const monthly = useMemo(() => {
    const buckets: Record<string, number> = {};
    pos.forEach(p => {
      const m = p.created_at?.slice(0, 7); if (!m) return;
      buckets[m] = (buckets[m] ?? 0) + Number(p.total_amount ?? 0);
    });
    return Object.entries(buckets).map(([month, spend]) => ({ month, spend })).sort((a, b) => a.month.localeCompare(b.month));
  }, [pos]);

  const bySupplier = useMemo(() => {
    const buckets: Record<string, number> = {};
    pos.forEach(p => {
      const k = p.suppliers?.name ?? "—";
      buckets[k] = (buckets[k] ?? 0) + Number(p.total_amount ?? 0);
    });
    return Object.entries(buckets).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [pos]);

  const byGate = useMemo(() => {
    const buckets: Record<string, number> = { EVT: 0, DVT: 0, PVT: 0 };
    pos.forEach(p => { if (p.npi_gate && buckets[p.npi_gate] !== undefined) buckets[p.npi_gate] += Number(p.total_amount ?? 0); });
    return Object.entries(buckets).map(([gate, spend]) => ({ gate, spend }));
  }, [pos]);

  const totalSpend = pos.reduce((s, p) => s + Number(p.total_amount ?? 0), 0);
  const totalQuoted = rfqs.filter(r => r.status === "accepted").reduce((s, r) => s + Number(r.quoted_price ?? 0), 0);

  if (!projectId) {
    return (
      <AppLayout title="Spend Analytics" description="Procurement spend breakdown">
        <NoProjectGuard hard message="Spend analytics are scoped to a project. Open a project from the Projects page." />
      </AppLayout>
    );
  }
  const backHref = `/procurement?project_id=${projectId}`;

  return (
    <AppLayout title="Spend Analytics" description={project ? `Project: ${project.name}` : "Procurement spend breakdown"}
      actions={<Link to={backHref}><Button size="sm" variant="ghost"><ArrowLeft className="mr-1 h-3.5 w-3.5" /> Back</Button></Link>}>
      <div className="mx-auto max-w-7xl space-y-6">
        <ProjectBreadcrumb project={project} currentPage="Spend Analytics" />
        <div className="grid gap-3 md:grid-cols-3">
          <Card className="border-border/60 p-4"><p className="text-xs text-muted-foreground">Total spend</p><p className="mt-1 font-mono text-2xl font-semibold">${totalSpend.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p></Card>
          <Card className="border-border/60 p-4"><p className="text-xs text-muted-foreground">Total quoted</p><p className="mt-1 font-mono text-2xl font-semibold">${totalQuoted.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p></Card>
          <Card className="border-border/60 p-4"><p className="text-xs text-muted-foreground">Variance</p><p className="mt-1 font-mono text-2xl font-semibold">${(totalSpend - totalQuoted).toLocaleString(undefined, { maximumFractionDigits: 0 })}</p></Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="border-border/60 p-5">
            <h3 className="mb-3 text-sm font-semibold text-navy">Spend by month</h3>
            <div className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={monthly}><XAxis dataKey="month" fontSize={10} /><YAxis fontSize={10} /><Tooltip /><Bar dataKey="spend" fill="hsl(var(--primary))" /></BarChart></ResponsiveContainer></div>
          </Card>
          <Card className="border-border/60 p-5">
            <h3 className="mb-3 text-sm font-semibold text-navy">Spend by NPI gate</h3>
            <div className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={byGate}><XAxis dataKey="gate" fontSize={10} /><YAxis fontSize={10} /><Tooltip /><Bar dataKey="spend" fill="hsl(var(--navy))" /></BarChart></ResponsiveContainer></div>
          </Card>
          <Card className="border-border/60 p-5">
            <h3 className="mb-3 text-sm font-semibold text-navy">Spend by supplier</h3>
            <div className="h-64"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={bySupplier.slice(0, 8)} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>{bySupplier.slice(0, 8).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip /><Legend /></PieChart></ResponsiveContainer></div>
          </Card>
          <Card className="border-border/60 p-5">
            <h3 className="mb-3 text-sm font-semibold text-navy">Top 10 suppliers</h3>
            <table className="w-full text-sm"><thead className="text-xs uppercase tracking-wider text-muted-foreground"><tr><th className="py-2 text-left">Supplier</th><th className="py-2 text-right">Spend</th></tr></thead>
              <tbody className="divide-y divide-border">{bySupplier.slice(0, 10).map(s => <tr key={s.name}><td className="py-2">{s.name}</td><td className="py-2 text-right font-mono">${s.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td></tr>)}{bySupplier.length === 0 && <tr><td colSpan={2} className="py-6 text-center text-xs text-muted-foreground">No spend yet.</td></tr>}</tbody></table>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
