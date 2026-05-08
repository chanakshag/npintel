import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PHASE_TEMPLATES = [
  { title: "Requirements & Mission Definition", color: "teal" },
  { title: "System Architecture & Trade Studies", color: "indigo" },
  { title: "Component Selection & Procurement", color: "amber" },
  { title: "Design & Prototyping", color: "rose" },
  { title: "Electronics, Firmware & Software", color: "violet" },
  { title: "Integration & Verification", color: "cyan" },
  { title: "Regulatory Compliance & Certification", color: "emerald" },
  { title: "Pilot Production & Deployment", color: "orange" },
];

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { projectId } = await req.json();
    if (!projectId) throw new Error("projectId required");

    const authHeader = req.headers.get("Authorization") ?? "";
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: project, error } = await supabase.from("projects").select("*").eq("id", projectId).single();
    if (error || !project) throw new Error(error?.message ?? "Project not found");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const phaseList = PHASE_TEMPLATES.map((p, i) => `${i + 1}. ${p.title}`).join("\n");

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content:
              "You are a senior NPI program manager. You generate concrete, product-specific NPI workflows. Tailor every task, deliverable, and gate criterion to the exact product, industry, and regulatory standard. Never use generic placeholder language. Use industry vocabulary (e.g. ISO 10993, AS9100 first article inspection, EVT/DVT/PVT, UN38.3) where appropriate.",
          },
          {
            role: "user",
            content: `Generate a tailored 8-phase NPI workflow.

Product: ${project.product_description}
Industry: ${project.industry}
Target gate standard: ${project.gate_standard}

The 8 phases (in order):
${phaseList}

For EACH phase produce:
- subtitle: 1 sentence explaining why this phase matters for THIS specific product
- tasks: 4-6 product-specific key activities, each with name + 1-sentence description
- outputs: 3-5 deliverable document names (PRD, BOM, Trade Study, Test Plan, etc.) tailored to this product
- gate_criteria: 4-6 checklist items that must pass before exiting this phase, adapted to the gate standard

Be specific. Mention real components, standards, suppliers patterns relevant to the product.`,
          },
        ],
        tools: [{
          type: "function",
          function: {
            name: "emit_workflow",
            description: "Return the tailored 8-phase NPI workflow.",
            parameters: {
              type: "object",
              properties: {
                phases: {
                  type: "array",
                  minItems: 8,
                  maxItems: 8,
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string" },
                      subtitle: { type: "string" },
                      tasks: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            name: { type: "string" },
                            description: { type: "string" },
                          },
                          required: ["name", "description"],
                          additionalProperties: false,
                        },
                      },
                      outputs: { type: "array", items: { type: "string" } },
                      gate_criteria: { type: "array", items: { type: "string" } },
                    },
                    required: ["title", "subtitle", "tasks", "outputs", "gate_criteria"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["phases"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "emit_workflow" } },
      }),
    });

    if (aiResp.status === 429) return new Response(JSON.stringify({ error: "Rate limited, please retry" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (aiResp.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (!aiResp.ok) throw new Error(`AI gateway ${aiResp.status}: ${await aiResp.text()}`);

    const j = await aiResp.json();
    const toolCall = j.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in response");
    const args = JSON.parse(toolCall.function.arguments);
    const phases = args.phases as Array<any>;

    // wipe existing phases
    await supabase.from("project_phases").delete().eq("project_id", projectId);

    const rows = phases.slice(0, 8).map((p, i) => ({
      project_id: projectId,
      user_id: project.user_id,
      phase_index: i,
      title: p.title || PHASE_TEMPLATES[i].title,
      subtitle: p.subtitle ?? "",
      badge_color: PHASE_TEMPLATES[i].color,
      tasks: p.tasks ?? [],
      outputs: (p.outputs ?? []).map((o: string) => ({ name: o })),
      gate_criteria: (p.gate_criteria ?? []).map((c: string) => ({ text: c })),
      gate_checked: [],
      status: i === 0 ? "active" : "not_started",
    }));

    const { error: insErr } = await supabase.from("project_phases").insert(rows);
    if (insErr) throw new Error(insErr.message);

    return new Response(JSON.stringify({ ok: true, count: rows.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-workflow", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
