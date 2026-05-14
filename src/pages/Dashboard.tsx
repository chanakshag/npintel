import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, GitBranch, ClipboardCheck, MessagesSquare, ArrowUpRight, Cpu, Activity, Layers, Truck, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";

type Stats = {
  documents: number;
  requirements: number;
  links: number;
  gates: number;
  boms: number;
  suppliers: number;
  prs: number;
};

const Dashboard = () => {
  const [stats, setStats] = useState<Stats>({ documents: 0, requirements: 0, links: 0, gates: 0, boms: 0, suppliers: 0, prs: 0 });
  const [recentDocs, setRecentDocs] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const [d, r, l, g, rd, b, s, p] = await Promise.all([
        supabase.from("documents").select("id", { count: "exact", head: true }),
        supabase.from("requirements").select("id", { count: "exact", head: true }),
        supabase.from("trace_links").select("id", { count: "exact", head: true }),
        supabase.from("gate_reviews").select("id", { count: "exact", head: true }),
        supabase.from("documents").select("*").order("created_at", { ascending: false }).limit(5),
        supabase.from("boms").select("id", { count: "exact", head: true }),
        supabase.from("suppliers").select("id", { count: "exact", head: true }),
        supabase.from("purchase_requisitions").select("id", { count: "exact", head: true }),
      ]);
      setStats({
        documents: d.count ?? 0,
        requirements: r.count ?? 0,
        links: l.count ?? 0,
        gates: g.count ?? 0,
        boms: b.count ?? 0,
        suppliers: s.count ?? 0,
        prs: p.count ?? 0,
      });
      setRecentDocs(rd.data ?? []);
    })();
  }, []);

const Dashboard = () => {
  const [stats, setStats] = useState<Stats>({ documents: 0, requirements: 0, links: 0, gates: 0 });
  const [recentDocs, setRecentDocs] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const [d, r, l, g, rd] = await Promise.all([
        supabase.from("documents").select("id", { count: "exact", head: true }),
        supabase.from("requirements").select("id", { count: "exact", head: true }),
        supabase.from("trace_links").select("id", { count: "exact", head: true }),
        supabase.from("gate_reviews").select("id", { count: "exact", head: true }),
        supabase.from("documents").select("*").order("created_at", { ascending: false }).limit(5),
      ]);
      setStats({
        documents: d.count ?? 0,
        requirements: r.count ?? 0,
        links: l.count ?? 0,
        gates: g.count ?? 0,
      });
      setRecentDocs(rd.data ?? []);
    })();
  }, []);

  const tiles = [
    { label: "Documents indexed", value: stats.documents, icon: FileText, to: "/documents" },
    { label: "Requirements", value: stats.requirements, icon: GitBranch, to: "/traceability" },
    { label: "Trace links", value: stats.links, icon: Activity, to: "/traceability" },
    { label: "Gate reviews", value: stats.gates, icon: ClipboardCheck, to: "/gates" },
  ];

  return (
    <AppLayout title="Dashboard" description="Operational overview of your NPI program">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Hero */}
        <Card className="relative overflow-hidden border-border/60 p-6">
          <div className="absolute inset-0 opacity-60" style={{ backgroundImage: "var(--gradient-glow)" }} />
          <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/15 ring-1 ring-primary/30">
                <Cpu className="h-5 w-5 text-primary" />
              </div>
              <div>
                <Badge variant="secondary" className="mb-2 text-[10px] font-medium uppercase tracking-wider">NPI Agent · Online</Badge>
                <h2 className="text-xl font-semibold tracking-tight">Your engineering knowledge base, automated.</h2>
                <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                  Upload datasheets, PRDs, and test reports — the agent extracts requirements, builds traceability,
                  and generates gate review packages.
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {tiles.map((t) => (
            <Link key={t.label} to={t.to}>
              <Card className="group flex h-full flex-col justify-between border-border/60 p-4 transition-colors hover:border-primary/40">
                <div className="flex items-center justify-between">
                  <t.icon className="h-4 w-4 text-muted-foreground" />
                  <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                </div>
                <div className="mt-3">
                  <div className="font-mono text-2xl font-semibold tracking-tight">{t.value}</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">{t.label}</div>
                </div>
              </Card>
            </Link>
          ))}
        </div>

        {/* Platform products */}
        <div>
          <h2 className="mb-3 text-lg font-semibold text-navy">The Spectir Platform</h2>
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-4">
            {[
              {
                name: "NPI Intel", icon: Cpu, active: true, to: "/projects",
                desc: "AI documentation, traceability & gate reviews",
                stat: `${stats.documents} documents · ${stats.gates} gate reviews`,
              },
              {
                name: "BOM Intel", icon: Layers, active: false, to: "/bom",
                desc: "Bill of materials intelligence & component risk",
                stat: "BOM versioning · EOL detection",
              },
              {
                name: "Supply Intel", icon: Truck, active: false, to: "/supply",
                desc: "Supplier qualification & supply chain risk",
                stat: "Qualification packages · Lead tracking",
              },
              {
                name: "Procure Intel", icon: ShoppingCart, active: false, to: "/procurement",
                desc: "Procurement automation, PRs & POs",
                stat: "Auto-PRs · RFQ drafting · PO tracking",
              },
            ].map(p => (
              <Card key={p.name} className="relative overflow-hidden border-border/60 p-5 transition-colors hover:border-primary/40">
                <div className="absolute left-0 top-0 h-full w-1 rounded-full bg-primary" />
                <div className="flex items-start justify-between">
                  <p.icon className={`h-5 w-5 ${p.active ? "text-primary" : "text-slate-400"}`} />
                  {p.active ? (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-700">Active</span>
                  ) : (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-700">Coming Soon</span>
                  )}
                </div>
                <h3 className="mt-3 text-sm font-semibold text-navy">{p.name}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{p.desc}</p>
                <p className={`mt-3 text-[11px] ${p.active ? "text-slate-600" : "text-slate-400"}`}>{p.stat}</p>
                {p.active ? (
                  <Button asChild size="sm" className="mt-4 w-full bg-primary text-primary-foreground hover:bg-primary/90">
                    <Link to={p.to}>Open <ArrowUpRight className="ml-1 h-3.5 w-3.5" /></Link>
                  </Button>
                ) : (
                  <Button asChild size="sm" variant="outline" className="mt-4 w-full border-navy/20 text-navy opacity-70 hover:bg-navy/5">
                    <Link to={p.to}>Join Waitlist</Link>
                  </Button>
                )}
              </Card>
            ))}
          </div>
        </div>

        {/* Recent activity + quick actions */}
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="border-border/60 lg:col-span-2">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h3 className="text-sm font-semibold">Recently ingested documents</h3>
              <Link to="/documents" className="text-xs text-primary hover:underline">View all</Link>
            </div>
            {recentDocs.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-muted-foreground">
                No documents yet. <Link to="/documents" className="text-primary hover:underline">Upload your first PDF →</Link>
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {recentDocs.map((d) => (
                  <li key={d.id} className="flex items-center justify-between gap-3 px-4 py-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{d.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{d.category ?? "Uncategorized"} · {d.summary?.slice(0, 80) ?? "Awaiting analysis"}</p>
                      </div>
                    </div>
                    <Badge variant={d.status === "ready" ? "default" : "secondary"} className="text-[10px]">{d.status}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="border-border/60 p-4">
            <h3 className="mb-3 text-sm font-semibold">Quick actions</h3>
            <div className="space-y-2">
              {[
                { to: "/documents", icon: FileText, label: "Upload a document", hint: "PDF, DOCX, XLSX" },
                { to: "/research", icon: MessagesSquare, label: "Ask the agent", hint: "Search your knowledge base" },
                { to: "/gates", icon: ClipboardCheck, label: "New gate review", hint: "EVT / DVT / PVT / PDR / CDR" },
                { to: "/traceability", icon: GitBranch, label: "Build traceability", hint: "Link requirements" },
              ].map((a) => (
                <Link key={a.label} to={a.to} className="flex items-center gap-3 rounded-md border border-border/60 px-3 py-2.5 transition-colors hover:border-primary/40 hover:bg-secondary/40">
                  <a.icon className="h-4 w-4 text-primary" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium">{a.label}</p>
                    <p className="text-[11px] text-muted-foreground">{a.hint}</p>
                  </div>
                  <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground" />
                </Link>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
