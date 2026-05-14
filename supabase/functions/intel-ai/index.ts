import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PROMPTS: Record<string, (p: any) => string> = {
  bom_risk: (p) => `You are a supply chain risk analyst for hardware NPI programs.
Analyze this Bill of Materials and produce a concise risk report in markdown.

BOM: ${p.bomName} (${p.version})
Items (${p.items.length}):
${p.items.map((i: any) => `- ${i.part_number} | ${i.manufacturer ?? "?"} | ${i.supplier ?? "?"} | qty ${i.quantity} | lead ${i.lead_time_days ?? "?"}d | status ${i.status} | $${i.unit_cost ?? "?"}`).join("\n")}

Use ONLY '##' and '###' headings (never '#').
Sections: ## Summary, ## EOL Risk (with suggested substitutes), ## Single Source Risk, ## Lead Time Risk, ## Recommended Actions.
Be specific, reference part numbers, keep it under 500 words.`,

  supplier_summary: (p) => `Summarize this supplier's risk profile and qualification status in markdown.
Use only '##' / '###' headings.

Supplier: ${p.supplier.name} (${p.supplier.category ?? "?"}, ${p.supplier.country ?? "?"})
Status: ${p.supplier.status} · Risk score: ${p.supplier.risk_score}/100

Qualification documents (${p.qualifications.length}):
${p.qualifications.map((q: any) => `- ${q.document_name} [${q.document_type ?? "?"}] · ${q.qualification_status}${q.valid_until ? ` · valid until ${q.valid_until}` : ""}`).join("\n") || "None"}

Open risk signals (${p.risks.length}):
${p.risks.map((r: any) => `- [${r.severity}] ${r.risk_type}: ${r.description ?? ""}`).join("\n") || "None"}

Sections: ## Summary, ## Strengths, ## Concerns, ## Recommended Actions. <300 words.`,

  spec_extract: (p) => `Extract key technical specifications, certifications, and qualification criteria from this supplier document description and return STRICT JSON only (no markdown).

Document: ${p.document_name} (${p.document_type ?? "unknown"})
Notes: ${p.notes ?? "none"}

Return JSON: { "specifications": [{"name":"...","value":"..."}], "certifications": ["..."], "qualification_criteria": ["..."] }`,

  rfq_draft: (p) => `Write a professional RFQ email to ${p.supplierName} for an NPI program.
Target gate: ${p.gate ?? "EVT"} · Needed by: ${p.neededBy ?? "TBD"}

Parts requested:
${p.items.map((i: any) => `- ${i.part_number} (${i.description ?? ""}) — qty ${i.quantity}`).join("\n")}

Request: pricing, lead time, MOQ, payment terms.
Tone: precise, confident, enterprise. Output the email body as plain text only (no markdown, no subject line).`,

  pr_review: (p) => `Review this purchase requisition for an NPI program targeting ${p.gate ?? "EVT"} by ${p.neededBy ?? "TBD"}.
Items:
${p.items.map((i: any) => `- ${i.part_number} (${i.description ?? ""}) — qty ${i.quantity}, $${i.unit_cost ?? "?"}, supplier ${i.supplier_name ?? "unassigned"}, needed ${i.needed_by ?? "?"}`).join("\n")}

Use ONLY '##' / '###' headings.
Sections: ## Summary, ## Flagged Items, ## Cost Concerns, ## Lead Time Risks, ## Single-Source Dependencies, ## Substitution Suggestions.
Reference part numbers. <400 words.`,

  po_doc: (p) => `Generate a formal Purchase Order document in markdown for the following.

PO Number: ${p.po_number}
Supplier: ${p.supplier.name} (${p.supplier.country ?? ""})
Date: ${new Date().toISOString().slice(0, 10)}
Delivery date: ${p.delivery_date ?? "TBD"}
NPI Gate: ${p.npi_gate ?? "—"}
Total: $${p.total_amount ?? "—"}

Items:
${(p.items ?? []).map((i: any) => `- ${i.part_number} | ${i.description ?? ""} | qty ${i.quantity} | $${i.unit_cost ?? "?"} ea`).join("\n")}

Notes: ${p.notes ?? "—"}

Use only '##' / '###' headings. Sections: ## Purchase Order, ## Supplier, ## Line Items (table), ## Terms & Conditions (standard NPI procurement boilerplate), ## Acknowledgement.`,

  prd_generate: (p) => `You are an expert hardware product manager. Generate a comprehensive Product Requirements Document (PRD) for a ${p.product_description} in the ${p.industry} industry following ${p.gate_standard} standards.

Use these extracted requirements as the basis:
${(p.requirements ?? []).map((r: any) => `- ${r.ref_id ?? ""} ${r.title}${r.description ? `: ${r.description}` : ""}`).join("\n") || "(no requirements extracted yet — infer reasonable defaults from the product description)"}

Use ONLY '##' / '###' headings (never '#'). Structure the PRD with these sections:
## Executive Summary
## Product Overview
## Functional Requirements
## Non-Functional Requirements
## Technical Constraints
## Regulatory Requirements
## Success Criteria
## Open Questions

Be specific and engineering-grade. ~800-1200 words.`,

  bom_from_prd: (p) => `Based on this PRD for a ${p.product_description}:

${p.prdContent}

Suggest an initial Bill of Materials. Return STRICT JSON only (no markdown, no code fences). Schema:
{ "items": [ { "part_number": "string (suggested)", "description": "string", "manufacturer": "string", "supplier": "string", "quantity": number, "unit": "ea", "unit_cost": number, "lead_time_days": number, "notes": "string (regulatory or sourcing note)" } ] }

Return 8-20 realistic components.`,

  qual_package: (p) => `Generate a formal Supplier Qualification Package in markdown.

Supplier: ${p.supplier.name} (${p.supplier.category ?? ""}, ${p.supplier.country ?? ""})
Status: ${p.supplier.status} · Risk score: ${p.supplier.risk_score}/100

Documents:
${p.qualifications.map((q: any) => `- ${q.document_name} [${q.document_type ?? "?"}] · ${q.qualification_status}`).join("\n") || "None"}

Use only '##' / '###' headings.
Sections: ## Executive Summary, ## Supplier Profile, ## Qualification Documents Reviewed, ## Compliance & Certifications, ## Risk Assessment, ## Qualification Decision & Recommendations.`,
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { task, payload } = await req.json();
    const buildPrompt = PROMPTS[task];
    if (!buildPrompt) {
      return new Response(JSON.stringify({ error: `unknown task: ${task}` }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const prompt = buildPrompt(payload);
    const upstream = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are an expert supply chain & procurement assistant for hardware NPI teams. Be precise, terse, and engineering-focused." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (upstream.status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (upstream.status === 402) return new Response(JSON.stringify({ error: "Payment required" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (!upstream.ok) {
      const t = await upstream.text();
      console.error("AI gateway error", upstream.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const data = await upstream.json();
    const content = data?.choices?.[0]?.message?.content ?? "";
    return new Response(JSON.stringify({ content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("intel-ai error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
