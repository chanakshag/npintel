import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { documentId } = await req.json();
    if (!documentId) throw new Error("documentId required");

    const authHeader = req.headers.get("Authorization") ?? "";
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: doc, error: docErr } = await supabase
      .from("documents").select("*").eq("id", documentId).single();
    if (docErr || !doc) throw new Error(docErr?.message ?? "Document not found");

    // Try to download a text-readable preview (works for .txt, .md, .csv); for binary types we fall back to filename heuristics.
    let textSample = "";
    try {
      const { data: file } = await supabase.storage.from("documents").download(doc.file_path);
      if (file) {
        const buf = await file.arrayBuffer();
        const head = new Uint8Array(buf).slice(0, 8000);
        textSample = new TextDecoder("utf-8", { fatal: false }).decode(head)
          .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, " ")
          .replace(/\s+/g, " ")
          .slice(0, 4000);
      }
    } catch (_) { /* binary or missing */ }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
            content: "You are an expert NPI engineering analyst. Categorize and summarize engineering documents (PRDs, datasheets, test reports, BOMs, gate review packs, ECOs, FMEA, etc.).",
          },
          {
            role: "user",
            content: `Filename: ${doc.name}\nMime: ${doc.mime_type ?? "unknown"}\n\nDocument excerpt:\n"""${textSample || "(binary file — infer from filename)"}"""\n\nReturn a category and analysis.`,
          },
        ],
        tools: [{
          type: "function",
          function: {
            name: "record_analysis",
            description: "Record document analysis",
            parameters: {
              type: "object",
              properties: {
                category: { type: "string", enum: ["PRD", "Datasheet", "Test Report", "BOM", "Gate Review", "ECO", "FMEA", "Spec", "Memo", "Other"] },
                summary: { type: "string", description: "2-3 sentence executive summary" },
                key_points: { type: "array", items: { type: "string" }, description: "3-6 key engineering takeaways" },
              },
              required: ["category", "summary", "key_points"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "record_analysis" } },
      }),
    });

    if (!aiResp.ok) {
      const t = await aiResp.text();
      throw new Error(`AI gateway error ${aiResp.status}: ${t}`);
    }
    const aiJson = await aiResp.json();
    const args = aiJson.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    const parsed = args ? JSON.parse(args) : {};

    await supabase.from("documents").update({
      category: parsed.category ?? "Other",
      summary: parsed.summary ?? "",
      key_points: parsed.key_points ?? [],
      status: "ready",
    }).eq("id", documentId);

    return new Response(JSON.stringify({ ok: true, ...parsed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-document error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
