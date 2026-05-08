import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { changeId } = await req.json();
    if (!changeId) throw new Error("changeId required");

    const auth = req.headers.get("Authorization") ?? "";
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { global: { headers: { Authorization: auth } } }
    );

    const { data: change, error: chErr } = await supabase
      .from("changes").select("*").eq("id", changeId).single();
    if (chErr || !change) throw new Error(chErr?.message ?? "Change not found");

    const [{ data: docs }, { data: reqs }, { data: gates }] = await Promise.all([
      supabase.from("documents").select("id,name,category,summary,key_points").eq("user_id", change.user_id).limit(60),
      supabase.from("requirements").select("id,ref_id,title,description,subsystem,gate_stage,status").eq("user_id", change.user_id).limit(100),
      supabase.from("gate_reviews").select("id,name,gate_type,status").eq("user_id", change.user_id).limit(40),
    ]);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const ctx = `Change:
Title: ${change.title}
Type: ${change.change_type}
Component/Spec: ${change.component_ref ?? "n/a"}
Description: ${change.description ?? ""}

Documents (${docs?.length ?? 0}):
${(docs ?? []).map((d: any) => `- [${d.id}] ${d.name} (${d.category ?? "Other"}): ${d.summary ?? ""} | KP: ${(d.key_points ?? []).join("; ")}`).join("\n")}

Requirements (${reqs?.length ?? 0}):
${(reqs ?? []).map((r: any) => `- [${r.id}] ${r.ref_id} ${r.title} — ${r.subsystem ?? ""}/${r.gate_stage ?? ""} (${r.status}): ${r.description ?? ""}`).join("\n")}

Gate Reviews (${gates?.length ?? 0}):
${(gates ?? []).map((g: any) => `- [${g.id}] ${g.name} (${g.gate_type}) — ${g.status}`).join("\n")}`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are an expert NPI change-impact analyst. Given a change and a project's documents, requirements, and gate reviews, identify every downstream item affected and produce a prioritized impact assessment with concrete follow-up tasks." },
          { role: "user", content: ctx },
        ],
        tools: [{
          type: "function",
          function: {
            name: "record_impact",
            description: "Record change impact analysis",
            parameters: {
              type: "object",
              properties: {
                summary: { type: "string", description: "2-3 sentence executive summary of the impact" },
                severity: { type: "string", enum: ["low", "medium", "high", "critical"] },
                affected_documents: { type: "array", items: { type: "object", properties: { id: { type: "string" }, name: { type: "string" }, reason: { type: "string" } }, required: ["id", "name", "reason"], additionalProperties: false } },
                affected_requirements: { type: "array", items: { type: "object", properties: { id: { type: "string" }, ref_id: { type: "string" }, reason: { type: "string" } }, required: ["id", "ref_id", "reason"], additionalProperties: false } },
                affected_gates: { type: "array", items: { type: "object", properties: { id: { type: "string" }, name: { type: "string" }, reason: { type: "string" } }, required: ["id", "name", "reason"], additionalProperties: false } },
                follow_up_tasks: { type: "array", items: { type: "object", properties: { task: { type: "string" }, priority: { type: "string", enum: ["low", "medium", "high"] } }, required: ["task", "priority"], additionalProperties: false } },
              },
              required: ["summary", "severity", "affected_documents", "affected_requirements", "affected_gates", "follow_up_tasks"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "record_impact" } },
      }),
    });

    if (aiResp.status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (aiResp.status === 402) return new Response(JSON.stringify({ error: "Payment required" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (!aiResp.ok) {
      const t = await aiResp.text();
      throw new Error(`AI gateway ${aiResp.status}: ${t}`);
    }

    const aiJson = await aiResp.json();
    const args = aiJson.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    const impact = args ? JSON.parse(args) : {};

    await supabase.from("changes").update({ impact, status: "analyzed", updated_at: new Date().toISOString() }).eq("id", changeId);

    return new Response(JSON.stringify({ ok: true, impact }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("analyze-change error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "unknown" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
