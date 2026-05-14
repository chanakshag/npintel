import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { FileText, Upload, Loader2, Trash2, Sparkles, Search, ExternalLink } from "lucide-react";
import { toast } from "sonner";

type Doc = {
  id: string;
  name: string;
  category: string | null;
  summary: string | null;
  key_points: string[] | null;
  status: string;
  size_bytes: number | null;
  file_path: string;
  created_at: string;
};

const Documents = () => {
  const { user } = useAuth();
  const location = useLocation();
  const projectId = useMemo(() => new URLSearchParams(location.search).get("project_id"), [location.search]);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [query, setQuery] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    let q = supabase.from("documents").select("*").order("created_at", { ascending: false });
    if (projectId) q = q.eq("project_id", projectId);
    const { data, error } = await q;
    if (error) toast.error(error.message);
    setDocs((data as any) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [projectId]);

  const handleUpload = async (file: File) => {
    if (!user) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("documents").upload(path, file);
      if (upErr) throw upErr;

      const { data: doc, error: insErr } = await supabase
        .from("documents")
        .insert({
          user_id: user.id,
          project_id: projectId ?? null,
          name: file.name,
          file_path: path,
          mime_type: file.type,
          size_bytes: file.size,
          status: "processing",
        })
        .select()
        .single();
      if (insErr) throw insErr;

      toast.success("Uploaded. Analyzing with AI…");
      await load();

      // Trigger AI analysis
      supabase.functions.invoke("analyze-document", { body: { documentId: doc.id } }).then(({ error }) => {
        if (error) toast.error(`AI analysis failed: ${error.message}`);
        else toast.success(`Analysis complete: ${file.name}`);
        load();
      });
    } catch (e: any) {
      toast.error(e.message ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const remove = async (d: Doc) => {
    await supabase.storage.from("documents").remove([d.file_path]);
    await supabase.from("documents").delete().eq("id", d.id);
    toast.success("Deleted");
    load();
  };

  const openDoc = async (d: Doc) => {
    const { data, error } = await supabase.storage
      .from("documents")
      .createSignedUrl(d.file_path, 3600);
    if (error || !data?.signedUrl) {
      toast.error(error?.message ?? "Could not open document");
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  };

  const filtered = docs.filter((d) =>
    !query || d.name.toLowerCase().includes(query.toLowerCase()) || d.summary?.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <AppLayout
      title="Documents"
      description="Upload engineering docs — the agent parses, categorizes, and indexes them."
      actions={
        <Button size="sm" onClick={() => fileInput.current?.click()} disabled={uploading}>
          {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
          Upload
        </Button>
      }
    >
      <input
        ref={fileInput}
        type="file"
        accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.md"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleUpload(f);
          e.target.value = "";
        }}
      />

      <div className="mx-auto max-w-7xl space-y-4">
        {projectId && (
          <div className="flex items-center gap-2 text-xs">
            <Link to={`/projects/${projectId}`} className="text-primary hover:underline">← Back to project</Link>
            <span className="text-muted-foreground">· Filtered to this project</span>
          </div>
        )}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search documents, summaries, categories…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {loading ? (
          <div className="flex h-64 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
        ) : filtered.length === 0 ? (
          <Card className="flex flex-col items-center justify-center border-dashed py-16 text-center">
            <FileText className="mb-3 h-10 w-10 text-muted-foreground" />
            <p className="text-sm font-medium">No documents yet</p>
            <p className="mt-1 max-w-sm text-xs text-muted-foreground">
              Upload PDFs, Word docs, spreadsheets, or supplier datasheets. The agent will parse and categorize them.
            </p>
            <Button className="mt-4" size="sm" onClick={() => fileInput.current?.click()}>
              <Upload className="mr-2 h-4 w-4" />Upload your first document
            </Button>
          </Card>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((d) => (
              <Card key={d.id} className="flex flex-col border-border/60 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10">
                      <FileText className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{d.name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {d.size_bytes ? `${(d.size_bytes / 1024).toFixed(1)} KB` : ""} · {new Date(d.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openDoc(d)} title="Open">
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => remove(d)} title="Delete">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <Badge variant={d.status === "ready" ? "default" : "secondary"} className="text-[10px]">
                  {d.status === "processing" && <Loader2 className="mr-1 h-2.5 w-2.5 animate-spin" />}
                  {d.status}
                </Badge>
                  {d.category && <Badge variant="outline" className="text-[10px]">{d.category}</Badge>}
                </div>
                {d.summary && (
                  <p className="mt-3 line-clamp-3 text-xs leading-relaxed text-muted-foreground">{d.summary}</p>
                )}
                {d.key_points && d.key_points.length > 0 && (
                  <div className="mt-3 border-t border-border pt-3">
                    <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                      <Sparkles className="h-3 w-3 text-primary" />Key points
                    </div>
                    <ul className="space-y-1">
                      {d.key_points.slice(0, 3).map((kp, i) => (
                        <li key={i} className="text-[11px] leading-relaxed text-foreground/80">• {kp}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Documents;
