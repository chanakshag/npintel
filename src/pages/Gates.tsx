import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, ClipboardCheck, Loader2, Trash2, Download, Sparkles } from "lucide-react";
import { toast } from "sonner";

type ChecklistItem = { id: string; text: string; category: string; done: boolean };
type Gate = { id: string; name: string; gate_type: string; checklist: ChecklistItem[]; status: string; created_at: string };

const GATES = ["PDR", "EVT", "DVT", "PVT", "CDR"];
const GATE_DESC: Record<string, string> = {
  PDR: "Preliminary Design Review",
  EVT: "Engineering Validation Test",
  DVT: "Design Validation Test",
  PVT: "Production Validation Test",
  CDR: "Critical Design Review",
};

const Gates = () => {
  const { user } = useAuth();
  const [gates, setGates] = useState<Gate[]>([]);
  const [open, setOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState("EVT");
  const [active, setActive] = useState<string | null>(null);

  const load = async () => {
    const { data } = await supabase.from("gate_reviews").select("*").order("created_at", { ascending: false });
    setGates((data as any) ?? []);
    if (!active && data && data.length) setActive((data[0] as any).id);
  };
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!user || !name.trim()) return toast.error("Name required");
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-gate-checklist", {
        body: { gateType: type, name },
      });
      if (error) throw error;
      const checklist = data?.checklist ?? [];
      const { data: row, error: insErr } = await supabase
        .from("gate_reviews")
        .insert({ user_id: user.id, name, gate_type: type, checklist, status: "in_progress" })
        .select().single();
      if (insErr) throw insErr;
      toast.success(`Generated ${checklist.length} checklist items`);
      setOpen(false); setName("");
      setActive((row as any).id);
      load();
    } catch (e: any) {
      toast.error(e.message ?? "Generation failed");
    } finally {
      setGenerating(false);
    }
  };

  const toggleItem = async (g: Gate, itemId: string) => {
    const next = g.checklist.map(i => i.id === itemId ? { ...i, done: !i.done } : i);
    const allDone = next.every(i => i.done);
    await supabase.from("gate_reviews").update({
      checklist: next,
      status: allDone ? "complete" : "in_progress",
    }).eq("id", g.id);
    setGates(prev => prev.map(x => x.id === g.id ? { ...x, checklist: next, status: allDone ? "complete" : "in_progress" } : x));
  };

  const removeGate = async (id: string) => {
    await supabase.from("gate_reviews").delete().eq("id", id);
    if (active === id) setActive(null);
    load();
  };

  const exportPackage = (g: Gate) => {
    const lines = [
      `# ${g.name}`,
      `Gate: ${g.gate_type} — ${GATE_DESC[g.gate_type] ?? ""}`,
      `Status: ${g.status}`,
      `Generated: ${new Date(g.created_at).toLocaleString()}`,
      ``,
      `## Checklist (${g.checklist.filter(i => i.done).length}/${g.checklist.length} complete)`,
      ``,
      ...g.checklist.map(i => `- [${i.done ? "x" : " "}] (${i.category}) ${i.text}`),
    ].join("\n");
    const blob = new Blob([lines], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${g.name.replace(/\s+/g, "_")}_${g.gate_type}.md`;
    a.click(); URL.revokeObjectURL(url);
  };

  const activeGate = gates.find(g => g.id === active);

  return (
    <AppLayout
      title="Gate Review Assistant"
      description="AI-generated review packages for EVT, DVT, PVT, PDR, and CDR."
      actions={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="mr-2 h-4 w-4" />New gate review</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" />Generate gate review package</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Project / package name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Optical Module v3 — DVT" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Gate type</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {GATES.map(g => <SelectItem key={g} value={g}>{g} — {GATE_DESC[g]}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <p className="text-xs text-muted-foreground">
                The agent will generate a comprehensive, industry-standard checklist tailored to the {type} stage.
              </p>
            </div>
            <DialogFooter>
              <Button onClick={create} disabled={generating}>
                {generating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                Generate checklist
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      }
    >
      <div className="mx-auto grid max-w-7xl gap-4 lg:grid-cols-[280px_1fr]">
        {/* List */}
        <Card className="border-border/60 p-2 lg:max-h-[calc(100vh-10rem)] lg:overflow-y-auto">
          {gates.length === 0 ? (
            <div className="px-3 py-8 text-center text-xs text-muted-foreground">
              No gate reviews yet.
            </div>
          ) : (
            <ul className="space-y-1">
              {gates.map(g => {
                const done = g.checklist.filter(i => i.done).length;
                const isActive = g.id === active;
                return (
                  <li key={g.id}>
                    <button
                      onClick={() => setActive(g.id)}
                      className={`w-full rounded-md px-2.5 py-2 text-left transition-colors ${isActive ? "bg-secondary" : "hover:bg-secondary/50"}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-xs font-medium">{g.name}</span>
                        <Badge variant="outline" className="shrink-0 text-[9px]">{g.gate_type}</Badge>
                      </div>
                      <div className="mt-1 flex items-center justify-between text-[10px] text-muted-foreground">
                        <span>{done}/{g.checklist.length} done</span>
                        <span>{g.status}</span>
                      </div>
                      <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-secondary">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{ width: `${g.checklist.length ? (done / g.checklist.length) * 100 : 0}%` }}
                        />
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        {/* Detail */}
        {activeGate ? (
          <Card className="border-border/60">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-5 py-4">
              <div>
                <div className="flex items-center gap-2">
                  <ClipboardCheck className="h-4 w-4 text-primary" />
                  <h2 className="text-base font-semibold">{activeGate.name}</h2>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {activeGate.gate_type} · {GATE_DESC[activeGate.gate_type]}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => exportPackage(activeGate)}>
                  <Download className="mr-2 h-3.5 w-3.5" />Export
                </Button>
                <Button size="sm" variant="ghost" onClick={() => removeGate(activeGate.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            <div className="divide-y divide-border">
              {Object.entries(
                activeGate.checklist.reduce<Record<string, ChecklistItem[]>>((acc, i) => {
                  (acc[i.category] = acc[i.category] || []).push(i);
                  return acc;
                }, {})
              ).map(([cat, items]) => (
                <div key={cat} className="px-5 py-4">
                  <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{cat}</h3>
                  <ul className="space-y-2">
                    {items.map(i => (
                      <li key={i.id} className="flex items-start gap-3">
                        <Checkbox
                          checked={i.done}
                          onCheckedChange={() => toggleItem(activeGate, i.id)}
                          className="mt-0.5"
                        />
                        <span className={`text-sm ${i.done ? "text-muted-foreground line-through" : ""}`}>{i.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Card>
        ) : (
          <Card className="flex h-64 flex-col items-center justify-center border-dashed border-border/60 text-center">
            <ClipboardCheck className="mb-2 h-8 w-8 text-muted-foreground" />
            <p className="text-sm font-medium">No gate review selected</p>
            <p className="mt-1 text-xs text-muted-foreground">Create a new package to get started.</p>
          </Card>
        )}
      </div>
    </AppLayout>
  );
};

export default Gates;
