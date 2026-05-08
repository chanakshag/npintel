import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Loader2, ArrowRight, Workflow } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const INDUSTRIES = [
  "Semiconductor",
  "Aerospace & Defense",
  "Medical Devices",
  "Automotive & EV",
  "Industrial Robotics",
  "Consumer Electronics",
  "Energy & Cleantech",
  "Biotech Hardware",
  "Other",
];

const GATE_STANDARDS = [
  "ISO 9001",
  "AS9100",
  "IATF 16949",
  "FDA 21 CFR",
  "IEC 62061",
  "Custom",
  "Not sure yet",
];

export default function Projects() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", product_description: "", industry: "", gate_standard: "" });

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("projects").select("*").order("created_at", { ascending: false });
    setProjects(data ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!form.product_description.trim() || !form.industry || !form.gate_standard) {
      toast.error("Please fill in all three fields");
      return;
    }
    setCreating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const name = form.name.trim() || form.product_description.slice(0, 60);
      const { data: project, error } = await supabase
        .from("projects")
        .insert({ user_id: user.id, name, product_description: form.product_description, industry: form.industry, gate_standard: form.gate_standard })
        .select()
        .single();
      if (error) throw error;
      toast.success("Project created — generating tailored workflow…");
      const { error: fnErr } = await supabase.functions.invoke("generate-workflow", { body: { projectId: project.id } });
      if (fnErr) throw fnErr;
      setOpen(false);
      setForm({ name: "", product_description: "", industry: "", gate_standard: "" });
      navigate(`/workflow/${project.id}`);
    } catch (e: any) {
      toast.error(e.message ?? "Failed to create project");
    } finally {
      setCreating(false);
    }
  };

  return (
    <AppLayout
      title="Projects"
      description="Each project gets its own AI-tailored NPI workflow"
      actions={<Button onClick={() => setOpen(true)}><Plus className="mr-1.5 h-4 w-4" /> New project</Button>}
    >
      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
      ) : projects.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <Workflow className="h-10 w-10 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">No projects yet</p>
              <p className="text-xs text-muted-foreground">Create a project and we'll generate an NPI workflow tailored to your product.</p>
            </div>
            <Button onClick={() => setOpen(true)}><Plus className="mr-1.5 h-4 w-4" /> New project</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map(p => (
            <Card key={p.id} className="cursor-pointer transition-shadow hover:shadow-md" onClick={() => navigate(`/workflow/${p.id}`)}>
              <CardContent className="space-y-3 p-5">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold leading-tight">{p.name}</h3>
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </div>
                <p className="line-clamp-2 text-xs text-muted-foreground">{p.product_description}</p>
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="secondary" className="text-[10px]">{p.industry}</Badge>
                  <Badge variant="outline" className="text-[10px]">{p.gate_standard}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>New project</DialogTitle>
            <DialogDescription>Three quick questions — your NPI workflow will be auto-generated from these answers.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Project name <span className="text-muted-foreground">(optional)</span></Label>
              <Input placeholder="e.g. Pump Rev B" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>What are you building?</Label>
              <Textarea
                rows={3}
                placeholder='e.g. "insulin pump", "industrial robot arm", "GPU server tray", "EV battery pack"'
                value={form.product_description}
                onChange={e => setForm(f => ({ ...f, product_description: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>What industry are you in?</Label>
              <Select value={form.industry} onValueChange={v => setForm(f => ({ ...f, industry: v }))}>
                <SelectTrigger><SelectValue placeholder="Select industry" /></SelectTrigger>
                <SelectContent>
                  {INDUSTRIES.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Target gate standard</Label>
              <Select value={form.gate_standard} onValueChange={v => setForm(f => ({ ...f, gate_standard: v }))}>
                <SelectTrigger><SelectValue placeholder="Select standard" /></SelectTrigger>
                <SelectContent>
                  {GATE_STANDARDS.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={creating}>Cancel</Button>
            <Button onClick={handleCreate} disabled={creating}>
              {creating ? <><Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Generating workflow…</> : "Create & generate workflow"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
