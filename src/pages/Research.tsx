import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Send, Sparkles, User, Bot, Loader2, FileText } from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Msg = { id?: string; role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "Which supplier meets our thermal requirements?",
  "Summarize the latest DVT test report.",
  "What are the unresolved risks for the power subsystem?",
  "Generate a PRD section for the optical module.",
];

const Research = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [docCount, setDocCount] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const autoSentRef = useRef(false);

  useEffect(() => {
    (async () => {
      const [hist, dc] = await Promise.all([
        supabase.from("chat_messages").select("*").order("created_at", { ascending: true }).limit(50),
        supabase.from("documents").select("id", { count: "exact", head: true }),
      ]);
      setMessages((hist.data as any[])?.map(m => ({ id: m.id, role: m.role, content: m.content })) ?? []);
      setDocCount(dc.count ?? 0);
    })();
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, streaming]);

  useEffect(() => {
    const stored = sessionStorage.getItem("research_prompt");
    const prompt = stored || searchParams.get("prompt");
    if (prompt && user && !autoSentRef.current && !streaming) {
      autoSentRef.current = true;
      sessionStorage.removeItem("research_prompt");
      send(prompt);
      if (searchParams.get("prompt") || searchParams.get("phase")) {
        searchParams.delete("prompt");
        searchParams.delete("phase");
        setSearchParams(searchParams, { replace: true });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const send = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || streaming || !user) return;
    setInput("");
    const userMsg: Msg = { role: "user", content };
    const next = [...messages, userMsg];
    setMessages(next);
    setStreaming(true);

    await supabase.from("chat_messages").insert({ user_id: user.id, role: "user", content });

    let assistantText = "";
    const upsert = (chunk: string) => {
      assistantText += chunk;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantText } : m);
        }
        return [...prev, { role: "assistant", content: assistantText }];
      });
    };

    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/research-chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: next.map(m => ({ role: m.role, content: m.content })) }),
      });

      if (resp.status === 429) { toast.error("Rate limited. Try again in a moment."); setStreaming(false); return; }
      if (resp.status === 402) { toast.error("AI credits exhausted. Add credits in Settings → Workspace → Usage."); setStreaming(false); return; }
      if (!resp.ok || !resp.body) throw new Error("Stream failed");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let done = false;
      while (!done) {
        const { done: d, value } = await reader.read();
        if (d) break;
        buf += decoder.decode(value, { stream: true });
        let nl: number;
        while ((nl = buf.indexOf("\n")) !== -1) {
          let line = buf.slice(0, nl);
          buf = buf.slice(nl + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") { done = true; break; }
          try {
            const parsed = JSON.parse(json);
            const c = parsed.choices?.[0]?.delta?.content;
            if (c) upsert(c);
          } catch { buf = line + "\n" + buf; break; }
        }
      }

      if (assistantText) {
        await supabase.from("chat_messages").insert({ user_id: user.id, role: "assistant", content: assistantText });
      }
    } catch (e: any) {
      toast.error(e.message ?? "Chat failed");
    } finally {
      setStreaming(false);
    }
  };

  return (
    <AppLayout
      title="AI Research Synthesis"
      description={`Ask natural-language questions across your ${docCount} indexed document${docCount === 1 ? "" : "s"}.`}
    >
      <div className="mx-auto flex h-[calc(100vh-7rem)] max-w-4xl flex-col">
        <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto pb-4">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/30">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-lg font-semibold">Research the agent.</h2>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                Pulls context from your uploaded datasheets, test reports, and internal memos.
              </p>
              <div className="mt-6 grid w-full max-w-2xl grid-cols-1 gap-2 md:grid-cols-2">
                {SUGGESTIONS.map(s => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="rounded-md border border-border/60 px-3 py-2.5 text-left text-xs transition-colors hover:border-primary/40 hover:bg-secondary/40"
                  >
                    {s}
                  </button>
                ))}
              </div>
              {docCount === 0 && (
                <div className="mt-6 flex items-center gap-2 rounded-md border border-warning/30 bg-warning/5 px-3 py-2 text-xs text-warning">
                  <FileText className="h-3.5 w-3.5" />Upload documents first for grounded answers.
                </div>
              )}
            </div>
          ) : (
            messages.map((m, i) => (
              <div key={i} className={`flex gap-3 ${m.role === "user" ? "justify-end" : ""}`}>
                {m.role === "assistant" && (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/15 ring-1 ring-primary/30">
                    <Bot className="h-3.5 w-3.5 text-primary" />
                  </div>
                )}
                <Card className={`max-w-[80%] border-border/60 px-3.5 py-2.5 ${m.role === "user" ? "bg-primary/10" : ""}`}>
                  {m.role === "assistant" ? (
                    <div className="prose prose-sm max-w-none prose-headings:font-semibold prose-headings:text-foreground prose-h2:text-base prose-h2:mt-4 prose-h2:mb-2 prose-h2:pb-1 prose-h2:border-b prose-h2:border-border/60 prose-h3:text-sm prose-h3:mt-3 prose-h3:mb-1.5 prose-p:my-2 prose-p:text-sm prose-p:leading-relaxed prose-li:text-sm prose-li:my-0.5 prose-ul:my-2 prose-ol:my-2 prose-strong:font-semibold prose-strong:text-foreground prose-code:text-xs prose-code:bg-secondary prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none prose-table:text-sm prose-th:px-2 prose-th:py-1 prose-td:px-2 prose-td:py-1 prose-a:text-primary">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {m.content
                          .replace(/^#{4,}\s+/gm, "### ")
                          .replace(/^#\s+/gm, "## ")}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">{m.content}</p>
                  )}
                </Card>
                {m.role === "user" && (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-secondary">
                    <User className="h-3.5 w-3.5" />
                  </div>
                )}
              </div>
            ))
          )}
          {streaming && messages[messages.length - 1]?.role === "user" && (
            <div className="flex gap-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/15 ring-1 ring-primary/30">
                <Bot className="h-3.5 w-3.5 text-primary" />
              </div>
              <Card className="border-border/60 px-3.5 py-2.5"><Loader2 className="h-4 w-4 animate-spin text-primary" /></Card>
            </div>
          )}
        </div>

        <div className="border-t border-border pt-3">
          <form
            onSubmit={(e) => { e.preventDefault(); send(); }}
            className="flex items-end gap-2"
          >
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder="Ask about requirements, suppliers, test results…"
              rows={1}
              className="max-h-32 min-h-[42px] resize-none"
              disabled={streaming}
            />
            <Button type="submit" size="icon" disabled={streaming || !input.trim()}>
              {streaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
          <p className="mt-1.5 text-[10px] text-muted-foreground">
            Powered by Lovable AI · Sources from your indexed documents
          </p>
        </div>
      </div>
    </AppLayout>
  );
};

export default Research;
