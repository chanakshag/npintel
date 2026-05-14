import { supabase } from "@/integrations/supabase/client";

export async function callIntelAi(task: string, payload: any): Promise<string> {
  const { data, error } = await supabase.functions.invoke("intel-ai", { body: { task, payload } });
  if (error) throw error;
  if ((data as any)?.error) throw new Error((data as any).error);
  return (data as any)?.content ?? "";
}

export const statusBadge = (status: string): { label: string; className: string } => {
  const map: Record<string, { label: string; className: string }> = {
    active: { label: "Active", className: "bg-emerald-100 text-emerald-700" },
    eol: { label: "EOL", className: "bg-rose-100 text-rose-700" },
    at_risk: { label: "At Risk", className: "bg-amber-100 text-amber-700" },
    substitute_needed: { label: "Substitute", className: "bg-purple-100 text-purple-700" },
    draft: { label: "Draft", className: "bg-slate-100 text-slate-700" },
    submitted: { label: "Submitted", className: "bg-blue-100 text-blue-700" },
    approved: { label: "Approved", className: "bg-emerald-100 text-emerald-700" },
    po_raised: { label: "PO Raised", className: "bg-teal-100 text-teal-700" },
    fulfilled: { label: "Fulfilled", className: "bg-emerald-100 text-emerald-700" },
    pending: { label: "Pending", className: "bg-slate-100 text-slate-700" },
    rfq_sent: { label: "RFQ Sent", className: "bg-blue-100 text-blue-700" },
    quote_received: { label: "Quoted", className: "bg-indigo-100 text-indigo-700" },
    delivered: { label: "Delivered", className: "bg-emerald-100 text-emerald-700" },
    qualified: { label: "Qualified", className: "bg-emerald-100 text-emerald-700" },
    under_review: { label: "Review", className: "bg-amber-100 text-amber-700" },
    disqualified: { label: "Disqualified", className: "bg-rose-100 text-rose-700" },
    failed: { label: "Failed", className: "bg-rose-100 text-rose-700" },
    expired: { label: "Expired", className: "bg-rose-100 text-rose-700" },
    on_track: { label: "On Track", className: "bg-emerald-100 text-emerald-700" },
    delayed: { label: "Delayed", className: "bg-rose-100 text-rose-700" },
    open: { label: "Open", className: "bg-rose-100 text-rose-700" },
    acknowledged: { label: "Ack'd", className: "bg-amber-100 text-amber-700" },
    resolved: { label: "Resolved", className: "bg-emerald-100 text-emerald-700" },
    raised: { label: "Raised", className: "bg-blue-100 text-blue-700" },
    confirmed: { label: "Confirmed", className: "bg-teal-100 text-teal-700" },
    shipped: { label: "Shipped", className: "bg-indigo-100 text-indigo-700" },
    cancelled: { label: "Cancelled", className: "bg-slate-100 text-slate-500" },
    frozen: { label: "Frozen", className: "bg-indigo-100 text-indigo-700" },
    sent: { label: "Sent", className: "bg-blue-100 text-blue-700" },
    responded: { label: "Responded", className: "bg-indigo-100 text-indigo-700" },
    accepted: { label: "Accepted", className: "bg-emerald-100 text-emerald-700" },
    rejected: { label: "Rejected", className: "bg-rose-100 text-rose-700" },
  };
  return map[status] ?? { label: status, className: "bg-slate-100 text-slate-700" };
};

export const severityBadge = (sev: string) => {
  const map: Record<string, string> = {
    critical: "bg-rose-200 text-rose-900",
    high: "bg-rose-100 text-rose-700",
    medium: "bg-amber-100 text-amber-700",
    low: "bg-emerald-100 text-emerald-700",
  };
  return map[sev] ?? "bg-slate-100 text-slate-700";
};

export const riskColor = (score: number) =>
  score < 30 ? "bg-emerald-500" : score < 70 ? "bg-amber-500" : "bg-rose-500";

export function downloadCsv(filename: string, rows: Record<string, any>[]) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const escape = (v: any) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [headers.join(","), ...rows.map(r => headers.map(h => escape(r[h])).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}
