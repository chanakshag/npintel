import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, project_id } = await req.json();
    if (!Array.isArray(messages)) throw new Error("messages required");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Build context from user's documents (scoped to project when provided)
    let context = "";
    let projectHeader = "";
    const auth = req.headers.get("Authorization");
    if (auth) {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!,
        { global: { headers: { Authorization: auth } } }
      );

      if (project_id) {
        const { data: proj } = await supabase
          .from("projects")
          .select("name, industry, product_description, gate_standard")
          .eq("id", project_id)
          .maybeSingle();
        if (proj) {
          projectHeader = `Active project: ${proj.name} (${proj.industry}, ${proj.gate_standard}).\nProduct: ${proj.product_description}\n\n`;
        }
      }

      let q = supabase
        .from("documents")
        .select("name, category, summary, key_points")
        .eq("status", "ready")
        .limit(40);
      if (project_id) q = q.eq("project_id", project_id);
      const { data: docs } = await q;
      if (docs && docs.length) {
        context = "Indexed engineering documents (use as grounding):\n\n" +
          docs.map((d: any, i: number) =>
            `[${i + 1}] ${d.name} (${d.category ?? "Other"})\nSummary: ${d.summary ?? "n/a"}\nKey points: ${(d.key_points ?? []).join("; ")}`
          ).join("\n\n");
      }
    }

    const system = `You are NPI Intelligence, an expert AI assistant for hardware/NPI engineers. You help with semiconductor, aerospace, medical device, automotive, and industrial product development.

ALWAYS respond in English only. Never use any other language under any circumstances, even if the user writes in another language.

Be precise, concise, and engineering-focused. When citing information, reference document numbers like [1], [2] from the context. If information is not available in the context, say so plainly. Use tables and bullet lists where helpful.

FORMATTING RULES (strict):
- Use Markdown. Keep structure shallow and clean.
- Use at most TWO heading levels: '##' for main sections and '###' for sub-sections. NEVER use '#', '####', '#####', or '######'.
- Do not stack multiple headings in a row. Always include a short paragraph or list under each heading.
- Prefer short paragraphs and bullet lists over deep heading hierarchies.
- Bold key terms with **text** instead of turning them into headings.
- Use tables only when comparing 3+ items across attributes.

${projectHeader}${context || "No documents indexed yet. Answer from general engineering knowledge and tell the user to upload documents for grounded answers."}`;

    const upstream = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "system", content: system }, ...messages],
        stream: true,
      }),
    });

    if (upstream.status === 429) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (upstream.status === 402) {
      return new Response(JSON.stringify({ error: "Payment required" }), {
        status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!upstream.ok) {
      const t = await upstream.text();
      console.error("AI gateway error", upstream.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(upstream.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("research-chat error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
