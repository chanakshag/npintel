import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ArrowLeft, ArrowRight, Check, ChevronDown, Loader2, Lock, MessageSquare, Sparkles, Unlock, AlertTriangle, FileText, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Phase = {
  id: string;
  phase_index: number;
  title: string;
  subtitle: string | null;
  badge_color: string;
  tasks: { name: string; description: string }[];
  outputs: { name: string }[];
  gate_criteria: { text: string }[];
  gate_checked: number[];
  status: string;
  locked: boolean;
};

const BADGE_BG: Record<string, string> = {
  teal: "bg-primary/10 text-primary",
  indigo: "bg-indigo-100 text-indigo-700",
  amber: "bg-amber-100 text-amber-700",
  rose: "bg-rose-100 text-rose-700",
  violet: "bg-violet-100 text-violet-700",
  cyan: "bg-cyan-100 text-cyan-700",
  emerald: "bg-emerald-100 text-emerald-700",
  orange: "bg-orange-100 text-orange-700",
};

export default function Workflow() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState<any>(null);
  const [phases, setPhases] = useState<Phase[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [gateOpen, setGateOpen] = useState(true);
  const [regen, setRegen] = useState(false);

  const load = async () => {
    if (!projectId) return;
    setLoading(true);
    const [{ data: p }, { data: ph }] = await Promise.all([
      supabase.from("projects").select("*").eq("id", projectId).single(),
      supabase.from("project_phases").select("*").eq("project_id", projectId).order("phase_index"),
    ]);
    setProject(p);
    setPhases((ph as any) ?? []);
    if (p) setActiveIdx(p.active_phase_index ?? 0);
    setLoading(false);
  };
  useEffect(() => { load(); }, [projectId]);

  // Poll while phases are still being generated
  useEffect(() => {
    if (!loading && phases.length === 0 && project) {
      const t = setInterval(load, 2500);
      return () => clearInterval(t);
    }
  }, [loading, phases.length, project]);

  const active = phases[activeIdx];

  const allChecked = useMemo(
    () => active && active.gate_criteria.length > 0 && active.gate_checked.length === active.gate_criteria.length,
    [active],
  );

  const toggleGate = async (i: number) => {
    if (!active || active.locked) return;
    const checked = active.gate_checked.includes(i)
      ? active.gate_checked.filter(x => x !== i)
      : [...active.gate_checked, i];
    setPhases(ps => ps.map(p => p.id === active.id ? { ...p, gate_checked: checked } : p));
    await supabase.from("project_phases").update({ gate_checked: checked }).eq("id", active.id);
  };

  const completePhase = async () => {
    if (!active) return;
    await supabase.from("project_phases").update({ status: "complete", locked: true }).eq("id", active.id);
    const next = Math.min(activeIdx + 1, phases.length - 1);
    if (next !== activeIdx && phases[next]) {
      await supabase.from("project_phases").update({ status: "active" }).eq("id", phases[next].id);
    }
    await supabase.from("projects").update({ active_phase_index: next }).eq("id", projectId!);
    setActiveIdx(next);
    load();
    toast.success("Phase complete");
  };

  const unlockPhase = async () => {
    if (!active) return;
    await supabase.from("project_phases").update({ locked: false, status: "active" }).eq("id", active.id);
    load();
  };

  const handleOutputClick = async (outputName: string) => {
    if (!active || !project) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      // Create a placeholder document tied to this phase output
      const { data: doc, error } = await supabase.from("documents").insert({
        user_id: user.id,
        name: `${outputName} — ${project.name}`,
        file_path: `workflow/${project.id}/${active.id}/${outputName}`,
        category: active.title,
        status: "draft",
        summary: `Deliverable for phase "${active.title}" of project "${project.name}". Product: ${project.product_description}.`,
      }).select().single();
      if (error) throw error;
      await supabase.from("project_phase_documents").insert({
        phase_id: active.id, user_id: user.id, output_key: outputName, document_id: doc.id,
      });
      toast.success(`Created "${outputName}" in Documents`);
      navigate("/documents");
    } catch (e: any) {
      toast.error(e.message ?? "Failed to create document");
    }
  };

  const askAI = () => {
    if (!active || !project) return;
    const tasks = active.tasks.map((t, i) => `${i + 1}. ${t.name} — ${t.description}`).join("\n");
    const outputs = active.outputs.map(o => `- ${o.name}`).join("\n");
    const gates = active.gate_criteria.map((c, i) => `${i + 1}. ${c.text}`).join("\n");
    const q = `I'm working on a project and need a deep dive on one specific phase.

PROJECT CONTEXT
- Product: ${project.product_description}
- Industry: ${project.industry}
- Target gate standard: ${project.gate_standard}

CURRENT PHASE
- Phase ${active.phase_index + 1} of 8: ${active.title}
- Why it matters: ${active.subtitle ?? "—"}

KEY ACTIVITIES IN THIS PHASE
${tasks}

REQUIRED DELIVERABLES
${outputs}

STAGE GATE CRITERIA
${gates}

Please give me a thorough deep dive on this phase for my specific product. Cover:
1. The most critical risks and common failure modes engineers hit at this phase for this kind of product
2. Industry best practices and what "good" looks like here under ${project.gate_standard}
3. Concrete, actionable recommendations on how to execute each key activity above
4. How to satisfy each stage gate criterion (what evidence to collect, who signs off)
5. Practical guidance on producing each required deliverable (structure, must-have sections, traps to avoid)
6. Suggested suppliers / standards / tools / test methods that are relevant here
7. Realistic timeline and dependencies on other phases

Use markdown with clear headings. Be specific to my product — no generic answers.`;
    sessionStorage.setItem("research_prompt", q);
    navigate(`/research?phase=${active.id}`);
  };

  const regenerate = async () => {
    if (!projectId) return;
    setRegen(true);
    try {
      const { error } = await supabase.functions.invoke("generate-workflow", { body: { projectId } });
      if (error) throw error;
      toast.success("Workflow regenerated");
      load();
    } catch (e: any) {
      toast.error(e.message ?? "Failed");
    } finally { setRegen(false); }
  };

  if (loading) {
    return <AppLayout title="Workflow"><div className="flex items-center justify-center py-20"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div></AppLayout>;
  }

  if (!project) {
    return <AppLayout title="Workflow"><p className="text-sm text-muted-foreground">Project not found.</p></AppLayout>;
  }

  if (phases.length === 0) {
    return (
      <AppLayout title={project.name} description="Generating your tailored NPI workflow…">
        <div className="flex flex-col items-center justify-center gap-3 py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">AI is tailoring 8 phases for "{project.product_description}"…</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      title={project.name}
      description={`${project.product_description} • ${project.industry} • ${project.gate_standard}`}
      actions={
        <Button variant="outline" size="sm" onClick={regenerate} disabled={regen}>
          {regen ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="mr-1.5 h-3.5 w-3.5" />}
          Regenerate
        </Button>
      }
    >
      {/* Stepper */}
      <div className="mb-8 overflow-x-auto pb-2">
        <div className="flex min-w-max items-start gap-1 px-1">
          {phases.map((p, i) => {
            const isActive = i === activeIdx;
            const isComplete = p.status === "complete";
            return (
              <div key={p.id} className="flex items-start gap-1">
                <button
                  onClick={() => setActiveIdx(i)}
                  className="flex w-28 flex-col items-center gap-2 text-center"
                >
                  <div
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-full border-2 text-xs font-semibold transition-colors",
                      isComplete && "border-[hsl(142_71%_45%)] bg-[hsl(142_71%_45%)] text-white",
                      isActive && !isComplete && "border-primary bg-primary text-primary-foreground",
                      !isActive && !isComplete && "border-muted-foreground/30 bg-background text-muted-foreground",
                    )}
                  >
                    {isComplete ? <Check className="h-4 w-4" /> : i + 1}
                  </div>
                  <span className={cn("line-clamp-2 text-[11px] leading-tight", isActive ? "font-medium text-foreground" : "text-muted-foreground")}>
                    {p.title}
                  </span>
                </button>
                {i < phases.length - 1 && (
                  <div className={cn("mt-4 h-0.5 w-6 shrink-0", isComplete ? "bg-[hsl(142_71%_45%)]" : "bg-muted-foreground/20")} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Active phase card */}
      {active && (
        <Card className="border-border shadow-sm">
          <CardContent className="space-y-6 p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-2">
                <Badge className={cn("border-transparent", BADGE_BG[active.badge_color] ?? BADGE_BG.teal)}>
                  Phase {active.phase_index + 1}
                  {active.locked && <Lock className="ml-1 h-3 w-3" />}
                </Badge>
                <h2 className="text-xl font-semibold">{active.title}</h2>
                {active.subtitle && <p className="max-w-3xl text-sm text-muted-foreground">{active.subtitle}</p>}
              </div>
              <Button variant="outline" size="sm" onClick={askAI}>
                <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                Ask AI about this phase <MessageSquare className="ml-1.5 h-3 w-3" />
              </Button>
            </div>

            {/* Tasks */}
            <div>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Key activities</h3>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {active.tasks.map((t, i) => (
                  <div key={i} className="rounded-md border border-border bg-muted/40 p-4">
                    <p className="text-sm font-medium">{t.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{t.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Outputs */}
            {active.outputs.length > 0 && (
              <div>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Phase outputs</h3>
                <div className="flex flex-wrap gap-2">
                  {active.outputs.map((o, i) => (
                    <button
                      key={i}
                      onClick={() => handleOutputClick(o.name)}
                      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium transition-colors hover:border-primary hover:text-primary"
                    >
                      <FileText className="h-3 w-3" />
                      {o.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Gate */}
            {active.gate_criteria.length > 0 && (
              <Collapsible open={gateOpen} onOpenChange={setGateOpen}>
                <div className="rounded-md border border-amber-200 bg-amber-50/60">
                  <CollapsibleTrigger className="flex w-full items-center justify-between p-4 text-left">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                      <span className="text-sm font-semibold">Stage gate criteria</span>
                      <span className="text-xs text-muted-foreground">
                        {active.gate_checked.length}/{active.gate_criteria.length} complete
                      </span>
                    </div>
                    <ChevronDown className={cn("h-4 w-4 transition-transform", gateOpen && "rotate-180")} />
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <ul className="space-y-2 px-4 pb-4">
                      {active.gate_criteria.map((c, i) => {
                        const checked = active.gate_checked.includes(i);
                        return (
                          <li key={i} className="flex items-start gap-2.5">
                            <Checkbox
                              checked={checked}
                              onCheckedChange={() => toggleGate(i)}
                              disabled={active.locked}
                              className="mt-0.5"
                            />
                            <span className={cn("text-sm", !checked && "text-rose-700")}>{c.text}</span>
                          </li>
                        );
                      })}
                    </ul>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            )}

            {/* Nav */}
            <div className="flex items-center justify-between border-t border-border pt-4">
              <Button
                variant="outline"
                onClick={() => setActiveIdx(i => Math.max(0, i - 1))}
                disabled={activeIdx === 0}
              >
                <ArrowLeft className="mr-1.5 h-4 w-4" /> Previous
              </Button>
              {active.locked ? (
                <Button variant="outline" onClick={unlockPhase}>
                  <Unlock className="mr-1.5 h-4 w-4" /> Unlock for amendments
                </Button>
              ) : allChecked ? (
                <Button onClick={completePhase}>
                  Mark phase complete <Check className="ml-1.5 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={() => setActiveIdx(i => Math.min(phases.length - 1, i + 1))}
                  disabled={activeIdx === phases.length - 1}
                >
                  Next <ArrowRight className="ml-1.5 h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </AppLayout>
  );
}
