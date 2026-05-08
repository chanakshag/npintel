import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TEMPLATES: Record<string, string> = {
  "PRD": "Produce a Product Requirements Document with sections: 1) Problem Statement, 2) Goals & Non-Goals, 3) User Personas, 4) Functional Requirements (numbered REQ-###), 5) Non-Functional Requirements, 6) System Architecture, 7) Risks & Mitigations, 8) Open Questions, 9) References (cite sources by [#]).",
  "Design Doc": "Produce a hardware/software design document with sections: 1) Overview, 2) Background & Prior Art (cite sources), 3) Architecture, 4) Component Selection Rationale, 5) Interfaces, 6) Power/Thermal Budget, 7) Validation Plan, 8) Open Issues, 9) References.",
  "Spec": "Produce an engineering specification: 1) Scope, 2) Definitions, 3) Performance Requirements, 4) Environmental Requirements, 5) Interface Requirements, 6) Compliance & Standards, 7) Verification Methods, 8) References.",
  "Literature Review": "Produce a literature review: 1) Topic Overview, 2) Methodology, 3) Synthesis by Theme, 4) Gaps in Current Research, 5) Implications for Product Development, 6) References.",
  "Test Plan": "Produce a test plan: 1) Objectives, 2) Test Items, 3) Test Strategy (DVT/EVT/PVT mapping), 4) Pass/Fail Criteria, 5) Risk Areas, 6) Schedule, 7) References.",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { artifactId } = await req.json();
    if (!artifactId) throw new Error("artifactId required");

    const authHeader = req.headers.get("Authorization") ?? "";
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: art, error } = await supabase
      .from("knowledge_artifacts").select("*").eq("id", artifactId).single();
    if (error || !art) throw new Error(error?.message ?? "Not found");

    const { data: sources } = await supabase
      .from("knowledge_sources").select("id,title,authors,year,venue,abstract,key_findings,citation")
      .in("id", art.source_ids?.length ? art.source_ids : ["00000000-0000-0000-0000-000000000000"]);

    const sourceCtx = (sources ?? []).map((s: any, i: number) => {
      const authors = (s.authors ?? []).join(", ");
      const findings = (s.key_findings ?? []).map((k: string) => `  - ${k}`).join("\n");
      return `[${i + 1}] ${s.title} — ${authors} (${s.year ?? "n.d."})\nVenue: ${s.venue ?? "—"}\nAbstract: ${s.abstract ?? ""}\nKey findings:\n${findings}`;
    }).join("\n\n");

    const template = TEMPLATES[art.artifact_type] ?? TEMPLATES["PRD"];

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: `You are a senior NPI engineer writing precise, dense Markdown documents for a gate review. ${template} Cite sources inline as [1], [2], etc. matching the numbered list provided.` },
          { role: "user", content: `Title: ${art.title}\nType: ${art.artifact_type}\n\nUser direction:\n${art.prompt ?? "(none)"}\n\nReference sources:\n${sourceCtx || "(no sources provided — generate based on title and prompt only)"}` },
        ],
      }),
    });

    if (aiResp.status === 429) return new Response(JSON.stringify({ error: "Rate limited" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (aiResp.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (!aiResp.ok) throw new Error(`AI gateway ${aiResp.status}: ${await aiResp.text()}`);
    const j = await aiResp.json();
    const content = j.choices?.[0]?.message?.content ?? "";

    await supabase.from("knowledge_artifacts").update({
      content, status: "ready", updated_at: new Date().toISOString(),
    }).eq("id", artifactId);

    return new Response(JSON.stringify({ ok: true, content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-artifact", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
