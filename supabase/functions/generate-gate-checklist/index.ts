import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { gateType, name } = await req.json();
    if (!gateType) throw new Error("gateType required");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: "You are an NPI gate review expert for hardware engineering teams. Generate comprehensive, industry-standard checklists for PDR, EVT, DVT, PVT, or CDR gates.",
          },
          {
            role: "user",
            content: `Generate a checklist for gate "${gateType}" for project "${name ?? "(unnamed)"}". Include 12-20 items grouped by category (e.g. "Design", "Test Coverage", "Manufacturing Readiness", "Quality & Reliability", "Documentation", "Sign-offs"). Items must be specific and actionable.`,
          },
        ],
        tools: [{
          type: "function",
          function: {
            name: "record_checklist",
            description: "Record the gate review checklist",
            parameters: {
              type: "object",
              properties: {
                checklist: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      id: { type: "string" },
                      text: { type: "string" },
                      category: { type: "string" },
                      done: { type: "boolean" },
                    },
                    required: ["id", "text", "category", "done"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["checklist"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "record_checklist" } },
      }),
    });

    if (!resp.ok) {
      const t = await resp.text();
      throw new Error(`AI gateway error ${resp.status}: ${t}`);
    }
    const json = await resp.json();
    const args = json.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    const parsed = args ? JSON.parse(args) : { checklist: [] };

    // Ensure ids and done=false
    const checklist = (parsed.checklist ?? []).map((it: any, i: number) => ({
      id: it.id || `item-${i + 1}`,
      text: String(it.text ?? ""),
      category: String(it.category ?? "General"),
      done: false,
    }));

    return new Response(JSON.stringify({ checklist }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-gate-checklist error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
