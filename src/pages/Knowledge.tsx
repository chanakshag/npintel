import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  BookOpen, Upload, Loader2, Trash2, Sparkles, Search, FileText, Wand2, Download, Library, Tag, FileType, FileDown,
} from "lucide-react";
import { downloadMarkdown, downloadPdf, downloadDocx } from "@/lib/exportArtifact";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";

type Source = {
  id: string;
  title: string;
  kind: string;
  authors: string[] | null;
  year: number | null;
  venue: string | null;
  doi: string | null;
  abstract: string | null;
  key_findings: string[] | null;
  tags: string[] | null;
  citation: string | null;
  file_path: string | null;
  status: string;
  size_bytes: number | null;
  created_at: string;
};

type Artifact = {
  id: string;
  title: string;
  artifact_type: string;
  prompt: string | null;
  content: string;
  source_ids: string[];
  status: string;
  created_at: string;
};

const ARTIFACT_TYPES = ["PRD", "Design Doc", "Spec", "Literature Review", "Test Plan"] as const;

const Knowledge = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState<"library" | "artifacts">("library");
  const [sources, setSources] = useState<Source[]>([]);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [query, setQuery] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);

  // Generation dialog
  const [genOpen, setGenOpen] = useState(false);
  const [genTitle, setGenTitle] = useState("");
  const [genType, setGenType] = useState<typeof ARTIFACT_TYPES[number]>("PRD");
  const [genPrompt, setGenPrompt] = useState("");
  const [genSources, setGenSources] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);

  const [activeArtifact, setActiveArtifact] = useState<Artifact | null>(null);

  const load = async () => {
    setLoading(true);
    const [s, a] = await Promise.all([
      supabase.from("knowledge_sources").select("*").order("created_at", { ascending: false }),
      supabase.from("knowledge_artifacts").select("*").order("created_at", { ascending: false }),
    ]);
    if (s.error) toast.error(s.error.message);
    if (a.error) toast.error(a.error.message);
    setSources((s.data as any) ?? []);
    setArtifacts((a.data as any) ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const handleUpload = async (file: File) => {
    if (!user) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("knowledge").upload(path, file);
      if (upErr) throw upErr;
      const { data: src, error: insErr } = await supabase.from("knowledge_sources").insert({
        user_id: user.id,
        title: file.name.replace(/\.[^.]+$/, ""),
        kind: "paper",
        file_path: path,
        mime_type: file.type,
        size_bytes: file.size,
        status: "processing",
      }).select().single();
      if (insErr) throw insErr;
      toast.success("Uploaded. Extracting metadata…");
      load();
      supabase.functions.invoke("ingest-knowledge", { body: { sourceId: src.id } }).then(({ error }) => {
        if (error) toast.error(`Ingest failed: ${error.message}`);
        else toast.success(`Indexed: ${file.name}`);
        load();
      });
    } catch (e: any) {
      toast.error(e.message ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const removeSource = async (s: Source) => {
    if (s.file_path) await supabase.storage.from("knowledge").remove([s.file_path]);
    await supabase.from("knowledge_sources").delete().eq("id", s.id);
    toast.success("Removed");
    load();
  };

  const removeArtifact = async (a: Artifact) => {
    await supabase.from("knowledge_artifacts").delete().eq("id", a.id);
    if (activeArtifact?.id === a.id) setActiveArtifact(null);
    load();
  };

  const generate = async () => {
    if (!user || !genTitle.trim()) { toast.error("Title required"); return; }
    setGenerating(true);
    try {
      const { data: art, error } = await supabase.from("knowledge_artifacts").insert({
        user_id: user.id,
        title: genTitle.trim(),
        artifact_type: genType,
        prompt: genPrompt.trim() || null,
        source_ids: genSources,
        status: "generating",
      }).select().single();
      if (error) throw error;
      setGenOpen(false);
      setGenTitle(""); setGenPrompt(""); setGenSources([]);
      setTab("artifacts");
      toast.success("Generating draft…");
      load();
      const { error: fnErr } = await supabase.functions.invoke("generate-artifact", { body: { artifactId: art.id } });
      if (fnErr) toast.error(`Generation failed: ${fnErr.message}`);
      else toast.success("Draft ready");
      load();
    } catch (e: any) {
      toast.error(e.message ?? "Generation failed");
    } finally {
      setGenerating(false);
    }
  };

  const exportAs = async (a: Artifact, fmt: "md" | "pdf" | "docx") => {
    try {
      if (fmt === "md") downloadMarkdown(a.title, a.artifact_type, a.content);
      else if (fmt === "pdf") downloadPdf(a.title, a.artifact_type, a.content);
      else await downloadDocx(a.title, a.artifact_type, a.content);
      toast.success(`Downloaded ${fmt.toUpperCase()}`);
    } catch (e: any) {
      toast.error(e?.message ?? "Export failed");
    }
  };

  const filteredSources = sources.filter(s =>
    !query || s.title.toLowerCase().includes(query.toLowerCase())
    || s.authors?.some(a => a.toLowerCase().includes(query.toLowerCase()))
    || s.tags?.some(t => t.toLowerCase().includes(query.toLowerCase()))
    || s.abstract?.toLowerCase().includes(query.toLowerCase())
  );

  const readySourceCount = sources.filter(s => s.status === "ready").length;

  return (
    <AppLayout
      title="Knowledge Board"
      description="Upload academic papers, books, and standards. Synthesize PRDs, design docs, and specs from grounded research."
      actions={
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => fileInput.current?.click()} disabled={uploading}>
            {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
            Add source
          </Button>
          <Dialog open={genOpen} onOpenChange={setGenOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Wand2 className="mr-2 h-4 w-4" />Generate document</Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl">
              <DialogHeader>
                <DialogTitle>Generate engineering document</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs">Title</Label>
                  <Input value={genTitle} onChange={(e) => setGenTitle(e.target.value)} placeholder="e.g. Optical module PRD v0.1" />
                </div>
                <div>
                  <Label className="text-xs">Document type</Label>
                  <Select value={genType} onValueChange={(v) => setGenType(v as any)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ARTIFACT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Direction (optional)</Label>
                  <Textarea rows={3} value={genPrompt} onChange={(e) => setGenPrompt(e.target.value)}
                    placeholder="Specific scope, constraints, or sections to emphasize…" />
                </div>
                <div>
                  <Label className="text-xs">Ground in sources ({genSources.length} selected)</Label>
                  <div className="mt-1.5 max-h-48 space-y-1.5 overflow-y-auto rounded-md border border-border p-2">
                    {sources.length === 0 ? (
                      <p className="px-1 py-2 text-xs text-muted-foreground">No sources yet — upload a paper first.</p>
                    ) : sources.map(s => (
                      <label key={s.id} className="flex cursor-pointer items-start gap-2 rounded px-1.5 py-1 hover:bg-secondary/40">
                        <Checkbox
                          checked={genSources.includes(s.id)}
                          onCheckedChange={(c) => setGenSources(prev => c ? [...prev, s.id] : prev.filter(x => x !== s.id))}
                          disabled={s.status !== "ready"}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-medium">{s.title}</p>
                          <p className="truncate text-[10px] text-muted-foreground">
                            {(s.authors ?? []).slice(0, 2).join(", ")}{s.year ? ` · ${s.year}` : ""} · {s.status}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setGenOpen(false)}>Cancel</Button>
                <Button onClick={generate} disabled={generating || !genTitle.trim()}>
                  {generating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                  Generate
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      }
    >
      <input
        ref={fileInput}
        type="file"
        accept=".pdf,.txt,.md,.doc,.docx,.epub"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); e.target.value = ""; }}
      />

      <div className="mx-auto max-w-7xl space-y-4">
        <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
          <TabsList>
            <TabsTrigger value="library"><Library className="mr-1.5 h-3.5 w-3.5" />Library ({sources.length})</TabsTrigger>
            <TabsTrigger value="artifacts"><FileText className="mr-1.5 h-3.5 w-3.5" />Generated Documents ({artifacts.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="library" className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search title, author, tag, abstract…" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9" />
            </div>
            {loading ? (
              <div className="flex h-64 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
            ) : filteredSources.length === 0 ? (
              <Card className="flex flex-col items-center justify-center border-dashed py-16 text-center">
                <BookOpen className="mb-3 h-10 w-10 text-muted-foreground" />
                <p className="text-sm font-medium">No sources yet</p>
                <p className="mt-1 max-w-sm text-xs text-muted-foreground">
                  Upload PDFs of academic papers, textbooks, or standards. The agent extracts metadata, abstract, and key findings — then maps them to PRDs and specs.
                </p>
                <Button className="mt-4" size="sm" onClick={() => fileInput.current?.click()}>
                  <Upload className="mr-2 h-4 w-4" />Upload first paper
                </Button>
              </Card>
            ) : (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {filteredSources.map(s => (
                  <Card key={s.id} className="flex flex-col border-border/60 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10">
                          <BookOpen className="h-4 w-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium" title={s.title}>{s.title}</p>
                          <p className="truncate text-[11px] text-muted-foreground">
                            {(s.authors ?? []).slice(0, 3).join(", ") || "—"}{s.year ? ` · ${s.year}` : ""}
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeSource(s)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-1.5">
                      <Badge variant={s.status === "ready" ? "default" : "secondary"} className="text-[10px]">
                        {s.status === "processing" && <Loader2 className="mr-1 h-2.5 w-2.5 animate-spin" />}
                        {s.status}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] capitalize">{s.kind}</Badge>
                      {s.venue && <Badge variant="outline" className="text-[10px]">{s.venue}</Badge>}
                    </div>
                    {s.abstract && (
                      <p className="mt-3 line-clamp-3 text-xs leading-relaxed text-muted-foreground">{s.abstract}</p>
                    )}
                    {s.key_findings && s.key_findings.length > 0 && (
                      <div className="mt-3 border-t border-border pt-3">
                        <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                          <Sparkles className="h-3 w-3 text-primary" />Key findings
                        </div>
                        <ul className="space-y-1">
                          {s.key_findings.slice(0, 3).map((kp, i) => (
                            <li key={i} className="text-[11px] leading-relaxed text-foreground/80">• {kp}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {s.tags && s.tags.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {s.tags.slice(0, 5).map(t => (
                          <span key={t} className="inline-flex items-center gap-1 rounded bg-secondary/60 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                            <Tag className="h-2.5 w-2.5" />{t}
                          </span>
                        ))}
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="artifacts">
            {artifacts.length === 0 ? (
              <Card className="flex flex-col items-center justify-center border-dashed py-16 text-center">
                <FileText className="mb-3 h-10 w-10 text-muted-foreground" />
                <p className="text-sm font-medium">No documents generated yet</p>
                <p className="mt-1 max-w-sm text-xs text-muted-foreground">
                  Once you've added sources, generate a PRD, design doc, or spec grounded in them. Citations are inline.
                </p>
                <Button className="mt-4" size="sm" onClick={() => setGenOpen(true)} disabled={readySourceCount === 0}>
                  <Wand2 className="mr-2 h-4 w-4" />Generate document
                </Button>
              </Card>
            ) : (
              <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
                <div className="space-y-2">
                  {artifacts.map(a => (
                    <button
                      key={a.id}
                      onClick={() => setActiveArtifact(a)}
                      className={`w-full rounded-md border p-3 text-left transition-colors ${activeArtifact?.id === a.id ? "border-primary/60 bg-primary/5" : "border-border/60 hover:border-primary/40 hover:bg-secondary/30"}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="line-clamp-2 text-sm font-medium">{a.title}</p>
                        <Badge variant="outline" className="shrink-0 text-[10px]">{a.artifact_type}</Badge>
                      </div>
                      <div className="mt-1.5 flex items-center gap-2 text-[10px] text-muted-foreground">
                        <Badge variant={a.status === "ready" ? "default" : "secondary"} className="text-[10px]">
                          {a.status === "generating" && <Loader2 className="mr-1 h-2.5 w-2.5 animate-spin" />}
                          {a.status}
                        </Badge>
                        <span>{a.source_ids.length} source{a.source_ids.length === 1 ? "" : "s"}</span>
                      </div>
                    </button>
                  ))}
                </div>

                <Card className="border-border/60 p-5">
                  {!activeArtifact ? (
                    <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
                      Select a document to preview.
                    </div>
                  ) : (
                    <div>
                      <div className="mb-4 flex items-start justify-between gap-3 border-b border-border pb-3">
                        <div>
                          <p className="text-xs uppercase tracking-wider text-muted-foreground">{activeArtifact.artifact_type}</p>
                          <h2 className="mt-0.5 text-lg font-semibold">{activeArtifact.title}</h2>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="sm" variant="outline" disabled={!activeArtifact.content}>
                                <Download className="mr-1.5 h-3.5 w-3.5" />Download
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44">
                              <DropdownMenuItem onClick={() => exportAs(activeArtifact, "pdf")}>
                                <FileDown className="mr-2 h-4 w-4" />PDF
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => exportAs(activeArtifact, "docx")}>
                                <FileType className="mr-2 h-4 w-4" />Word (.docx)
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => exportAs(activeArtifact, "md")}>
                                <FileText className="mr-2 h-4 w-4" />Markdown
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => removeArtifact(activeArtifact)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                      {activeArtifact.status === "generating" ? (
                        <div className="flex h-48 items-center justify-center">
                          <Loader2 className="h-5 w-5 animate-spin text-primary" />
                        </div>
                      ) : (
                        <div className="prose prose-sm max-w-none prose-headings:font-semibold prose-headings:text-foreground prose-h1:text-xl prose-h1:mt-5 prose-h1:mb-3 prose-h1:pb-1.5 prose-h1:border-b prose-h1:border-border prose-h2:text-base prose-h2:mt-4 prose-h2:mb-2 prose-h2:pb-1 prose-h2:border-b prose-h2:border-border/60 prose-h3:text-sm prose-h3:mt-3 prose-h3:mb-1.5 prose-p:my-2 prose-p:text-[13px] prose-p:leading-relaxed prose-li:text-[13px] prose-li:my-0.5 prose-ul:my-2 prose-ol:my-2 prose-strong:font-semibold prose-strong:text-foreground prose-code:text-xs prose-code:bg-secondary prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none prose-table:text-[13px] prose-th:px-2 prose-th:py-1 prose-td:px-2 prose-td:py-1 prose-a:text-primary">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {(activeArtifact.content || "(empty)")
                              .replace(/^#{5,}\s+/gm, "#### ")}
                          </ReactMarkdown>
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default Knowledge;
