import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { sourceId } = await req.json();
    if (!sourceId) throw new Error("sourceId required");

    const authHeader = req.headers.get("Authorization") ?? "";
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: src, error } = await supabase
      .from("knowledge_sources").select("*").eq("id", sourceId).single();
    if (error || !src) throw new Error(error?.message ?? "Not found");

    let textSample = "";
    if (src.file_path) {
      try {
        const { data: file } = await supabase.storage.from("knowledge").download(src.file_path);
        if (file) {
          const buf = await file.arrayBuffer();
          const head = new Uint8Array(buf).slice(0, 16000);
          textSample = new TextDecoder("utf-8", { fatal: false }).decode(head)
            .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, " ")
            .replace(/\s+/g, " ").slice(0, 8000);
        }
      } catch (_) {}
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are a research librarian. Extract structured bibliographic metadata and key engineering takeaways from academic papers, books, and standards." },
          { role: "user", content: `Filename/title hint: ${src.title}\n\nExcerpt:\n"""${textSample || "(binary — infer from title)"}"""` },
        ],
        tools: [{
          type: "function",
          function: {
            name: "record_source",
            description: "Record source metadata",
            parameters: {
              type: "object",
              properties: {
                title: { type: "string" },
                kind: { type: "string", enum: ["paper", "book", "standard", "article"] },
                authors: { type: "array", items: { type: "string" } },
                year: { type: "integer" },
                venue: { type: "string", description: "Journal, conference, or publisher" },
                doi: { type: "string" },
                abstract: { type: "string", description: "2-4 sentence abstract" },
                key_findings: { type: "array", items: { type: "string" }, description: "4-7 key engineering takeaways relevant to product development" },
                tags: { type: "array", items: { type: "string" } },
                citation: { type: "string", description: "Formatted citation (IEEE or APA)" },
              },
              required: ["title", "kind", "authors", "abstract", "key_findings", "tags", "citation"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "record_source" } },
      }),
    });

    if (!aiResp.ok) throw new Error(`AI gateway ${aiResp.status}: ${await aiResp.text()}`);
    const j = await aiResp.json();
    const args = j.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    const p = args ? JSON.parse(args) : {};

    await supabase.from("knowledge_sources").update({
      title: p.title ?? src.title,
      kind: p.kind ?? src.kind,
      authors: p.authors ?? [],
      year: p.year ?? null,
      venue: p.venue ?? null,
      doi: p.doi ?? null,
      abstract: p.abstract ?? "",
      key_findings: p.key_findings ?? [],
      tags: p.tags ?? [],
      citation: p.citation ?? "",
      status: "ready",
      updated_at: new Date().toISOString(),
    }).eq("id", sourceId);

    return new Response(JSON.stringify({ ok: true, ...p }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ingest-knowledge", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
