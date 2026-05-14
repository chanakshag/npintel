import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Layers, Plus, ArrowUpRight, Package, AlertTriangle, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { statusBadge } from "@/lib/intel";

type Bom = { id: string; name: string; version: string; status: string; updated_at: string };

export default function BomIntel() {
  const [boms, setBoms] = useState<Bom[]>([]);
  const [stats, setStats] = useState({ total: 0, components: 0, atRisk: 0, cost: 0 });
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");

  const load = async () => {
    const { data: bomList } = await supabase.from("boms").select("id,name,version,status,updated_at").order("updated_at", { ascending: false });
    const { data: items } = await supabase.from("bom_items").select("status,unit_cost,quantity");
    setBoms(bomList ?? []);
    const cost = (items ?? []).reduce((s, i: any) => s + (Number(i.unit_cost ?? 0) * Number(i.quantity ?? 0)), 0);
    const atRisk = (items ?? []).filter((i: any) => ["eol", "at_risk", "substitute_needed"].includes(i.status)).length;
    setStats({ total: bomList?.length ?? 0, components: items?.length ?? 0, atRisk, cost });
  };

  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!name.trim()) return;
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const { data, error } = await supabase.from("boms").insert({ name, user_id: u.user.id }).select().single();
    if (error) return toast.error(error.message);
    toast.success("BOM created");
    setOpen(false); setName("");
    if (data) window.location.href = `/bom/${data.id}`;
  };

  const tiles = [
    { label: "Total BOMs", value: stats.total, icon: Layers },
    { label: "Components", value: stats.components, icon: Package },
    { label: "At-risk items", value: stats.atRisk, icon: AlertTriangle },
    { label: "Est. BOM cost", value: `$${stats.cost.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, icon: DollarSign },
  ];

  return (
    <AppLayout
      title="BOM Intel"
      description="Bill of materials intelligence and component risk monitoring"
      actions={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90"><Plus className="mr-1 h-3.5 w-3.5" /> New BOM</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create new BOM</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Name</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Mainboard Rev A" /></div>
              <Button onClick={create} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">Create</Button>
            </div>
          </DialogContent>
        </Dialog>
      }
    >
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {tiles.map(t => (
            <Card key={t.label} className="border-border/60 p-4">
              <div className="flex items-center justify-between"><t.icon className="h-4 w-4 text-muted-foreground" /></div>
              <div className="mt-3"><div className="font-mono text-2xl font-semibold tracking-tight">{t.value}</div>
                <div className="mt-0.5 text-xs text-muted-foreground">{t.label}</div></div>
            </Card>
          ))}
        </div>

        {boms.length === 0 ? (
          <Card className="border-border/60 p-10 text-center">
            <Layers className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">No BOMs yet. Create your first BOM to start tracking components and risk.</p>
          </Card>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {boms.map(b => {
              const sb = statusBadge(b.status);
              return (
                <Link key={b.id} to={`/bom/${b.id}`}>
                  <Card className="group h-full border-border/60 p-5 transition-colors hover:border-primary/40">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-sm font-semibold text-navy">{b.name}</h3>
                        <p className="mt-0.5 text-xs text-muted-foreground">{b.version}</p>
                      </div>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${sb.className}`}>{sb.label}</span>
                    </div>
                    <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                      <span>Updated {new Date(b.updated_at).toLocaleDateString()}</span>
                      <span className="text-primary opacity-0 transition-opacity group-hover:opacity-100">Open <ArrowUpRight className="inline h-3 w-3" /></span>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
