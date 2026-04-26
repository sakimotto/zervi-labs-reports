import { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Sparkles,
  Send,
  Plus,
  MessageSquare,
  Trash2,
  Bot,
  User as UserIcon,
  Loader2,
  Pin,
  ShieldCheck,
  Eye,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useCopilot } from "@/hooks/useCopilot";
import { ToolCallStrip } from "@/components/copilot/ToolCallStrip";
import { DraftReviewModal, type DraftKind } from "@/components/copilot/DraftReviewModal";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

const STARTER_PROMPTS = [
  {
    icon: "📊",
    title: "Lab snapshot",
    prompt: "Give me a snapshot of the lab right now — open work, NG count, equipment due for calibration, overdue requests.",
  },
  {
    icon: "🔬",
    title: "Diagnose NG",
    prompt: "Show me all samples currently judged NG and identify any patterns across material, customer, or test method.",
  },
  {
    icon: "📝",
    title: "Draft a test report",
    prompt: "Help me draft a test report for sample [paste sample code or ID].",
  },
  {
    icon: "📅",
    title: "What's overdue",
    prompt: "List all overdue customer test requests sorted by how late they are, and suggest which ones to prioritise.",
  },
  {
    icon: "⚠️",
    title: "Calibration risk",
    prompt: "Which equipment is due for calibration in the next 30 days? Flag anything already overdue.",
  },
  {
    icon: "🧪",
    title: "Suggest a program",
    prompt: "Recommend a test program for an automotive seat fabric sample from a new OEM customer.",
  },
];

export default function CopilotPage() {
  const {
    conversations,
    activeId,
    setActiveId,
    messages,
    sending,
    toolEvents,
    send,
    newConversation,
    deleteConversation,
  } = useCopilot();

  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const autoLaunchedRef = useRef(false);

  // Pending draft expectation: when the user fires a draft action ("Draft report" / "Draft email"),
  // we remember the kind + label, then pop the review modal as soon as the agent's response arrives.
  const pendingDraftRef = useRef<{ kind: DraftKind; label: string } | null>(null);
  const lastReviewedContentRef = useRef<string | null>(null);
  const [reviewState, setReviewState] = useState<{
    open: boolean;
    kind: DraftKind;
    title: string;
    contextLabel?: string;
    content: string;
  } | null>(null);

  // Auto-launch: when navigated here from an "Ask AI" button with state,
  // open a fresh conversation pinned to the entity context and fire the prompt.
  useEffect(() => {
    const auto = (location.state as any)?.autoLaunch;
    if (!auto || autoLaunchedRef.current) return;
    autoLaunchedRef.current = true;
    // Clear router state so a refresh doesn't re-fire
    navigate(location.pathname, { replace: true, state: {} });

    if (auto.draftKind) {
      pendingDraftRef.current = { kind: auto.draftKind, label: auto.actionLabel ?? "AI draft" };
    }

    (async () => {
      const id = await newConversation(auto.context);
      if (id) {
        // Slight defer so activeId state settles before sending
        setTimeout(() => send(auto.prompt, auto.context), 50);
      }
    })();
  }, [location, navigate, newConversation, send]);

  // When a fresh assistant message arrives AND a draft is pending, open the review modal.
  useEffect(() => {
    if (sending) return;
    const pending = pendingDraftRef.current;
    if (!pending) return;
    const last = messages[messages.length - 1];
    if (!last || last.role !== "assistant" || !last.content || last.content === "...") return;
    if (lastReviewedContentRef.current === last.content) return;
    lastReviewedContentRef.current = last.content;
    pendingDraftRef.current = null;
    const ctxLabel =
      conversations.find((c) => c.id === activeId)?.context_label ?? undefined;
    setReviewState({
      open: true,
      kind: pending.kind,
      title: pending.label,
      contextLabel: ctxLabel,
      content: last.content,
    });
  }, [messages, sending, conversations, activeId]);

  // Heuristic: lets the user re-open review on any assistant message that looks draft-y.
  const detectDraftKind = (content: string): DraftKind | null => {
    const c = content.toLowerCase();
    if (/(^|\n)\s*(subject:|dear |hi |hello )/i.test(content) || c.includes("kind regards") || c.includes("best regards")) return "email";
    if (c.includes("test report") || c.includes("executive summary") || c.includes("overall judgment")) return "report";
    if (c.includes("root cause") || c.includes("ng diagnosis") || c.includes("corrective action")) return "diagnosis";
    return null;
  };

  const openManualReview = (content: string) => {
    const kind = detectDraftKind(content) ?? "generic";
    const ctxLabel =
      conversations.find((c) => c.id === activeId)?.context_label ?? undefined;
    setReviewState({
      open: true,
      kind,
      title: "Manual review",
      contextLabel: ctxLabel,
      content,
    });
  };

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  const submit = () => {
    if (!input.trim() || sending) return;
    const text = input;
    setInput("");
    // Detect "draft an email/report" intent in free-form input so the modal still triggers.
    const lower = text.toLowerCase();
    if (/\bdraft\b.*\bemail\b|\bemail draft\b|\bcompose .* email\b/.test(lower)) {
      pendingDraftRef.current = { kind: "email", label: "Email draft" };
    } else if (/\bdraft\b.*\breport\b|\btest report draft\b/.test(lower)) {
      pendingDraftRef.current = { kind: "report", label: "Test report draft" };
    } else if (/\bdiagnos(e|is)\b|\bng\b.*\b(why|root cause)\b/.test(lower)) {
      pendingDraftRef.current = { kind: "diagnosis", label: "NG diagnosis" };
    }
    send(text);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="flex h-[calc(100vh-3.5rem)] -m-6 bg-background">
      {/* Sidebar: conversations */}
      <aside className="w-72 border-r border-border bg-card/30 flex flex-col">
        <div className="p-3 border-b border-border">
          <Button
            onClick={() => newConversation()}
            className="w-full gap-2 bg-gradient-primary hover:opacity-90 shadow-sm"
            size="sm"
          >
            <Plus className="h-4 w-4" />
            New conversation
          </Button>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-0.5">
            {conversations.length === 0 && (
              <p className="text-xs text-muted-foreground p-3 text-center">
                No conversations yet. Start a new one above.
              </p>
            )}
            {conversations.map((c) => (
              <div
                key={c.id}
                onClick={() => setActiveId(c.id)}
                className={cn(
                  "group flex items-start gap-2 p-2 rounded-md cursor-pointer transition-colors",
                  activeId === c.id
                    ? "bg-primary/10 text-primary-foreground"
                    : "hover:bg-muted/60"
                )}
              >
                <MessageSquare className="h-3.5 w-3.5 mt-0.5 shrink-0 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <p className={cn("text-xs font-medium truncate", activeId === c.id ? "text-primary" : "text-foreground")}>
                    {c.title}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {formatDistanceToNow(new Date(c.last_message_at), { addSuffix: true })}
                    {c.message_count > 0 && ` · ${c.message_count} msgs`}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteConversation(c.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                  aria-label="Delete"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </ScrollArea>
        <div className="p-3 border-t border-border bg-muted/20">
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <ShieldCheck className="h-3 w-3 text-success" />
            <span className="font-medium">Suggest mode</span>
            <span>· no auto-writes</span>
          </div>
        </div>
      </aside>

      {/* Main chat */}
      <main className="flex-1 flex flex-col">
        {/* Header */}
        <header className="border-b border-border px-6 py-3 bg-card/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-primary flex items-center justify-center shadow-sm">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-sm font-semibold tracking-tight text-foreground flex items-center gap-2">
                Lab Copilot
                <Badge variant="outline" className="text-[10px] h-4 px-1.5 font-normal">
                  Gemini 2.5 Pro
                </Badge>
              </h1>
              <p className="text-[11px] text-muted-foreground">
                Senior lab manager AI · full read access · drafts everything for your approval
              </p>
            </div>
          </div>
        </header>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          {messages.length === 0 && !activeId ? (
            <WelcomeScreen onPrompt={(p) => { setInput(p); }} />
          ) : (
            <div className="max-w-3xl mx-auto px-6 py-6 space-y-6">
              {messages.map((m, i) => (
                <MessageBubble key={i} message={m} onReview={openManualReview} />
              ))}
              {sending && messages[messages.length - 1]?.content === "..." && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground pl-11">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Thinking, calling tools…
                </div>
              )}
              {toolEvents.length > 0 && !sending && (
                <div className="pl-11">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5 font-medium">
                    Tools used in last response
                  </p>
                  <ToolCallStrip events={toolEvents} />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Composer */}
        <div className="border-t border-border bg-card/40 p-4">
          <div className="max-w-3xl mx-auto">
            <div className="relative rounded-xl border border-border bg-background shadow-sm focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10 transition-all">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Ask anything about your lab — samples, results, customers, equipment, standards…"
                rows={2}
                className="border-0 resize-none focus-visible:ring-0 bg-transparent text-sm py-3 pr-14"
                disabled={sending}
              />
              <Button
                onClick={submit}
                disabled={!input.trim() || sending}
                size="icon"
                className="absolute right-2 bottom-2 h-8 w-8 bg-gradient-primary hover:opacity-90"
              >
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground mt-2 px-1">
              Lab Copilot can search across all modules and draft reports, diagnoses & emails. It never modifies data without your approval.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

function MessageBubble({ message }: { message: any }) {
  const isUser = message.role === "user";
  const isThinking = message.content === "...";
  return (
    <div className={cn("flex gap-3", isUser && "flex-row-reverse")}>
      <div
        className={cn(
          "h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
          isUser ? "bg-muted" : "bg-gradient-primary"
        )}
      >
        {isUser ? (
          <UserIcon className="h-4 w-4 text-foreground" />
        ) : (
          <Bot className="h-4 w-4 text-primary-foreground" />
        )}
      </div>
      <div className={cn("flex-1 min-w-0", isUser && "flex justify-end")}>
        <div
          className={cn(
            "inline-block max-w-full rounded-2xl px-4 py-2.5 text-sm",
            isUser
              ? "bg-primary text-primary-foreground rounded-tr-sm"
              : "bg-card border border-border rounded-tl-sm"
          )}
        >
          {isThinking ? (
            <div className="flex gap-1 py-1">
              <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          ) : isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="prose prose-sm max-w-none prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-li:text-foreground prose-table:text-xs prose-th:bg-muted/40 prose-th:font-semibold prose-th:p-2 prose-td:p-2 prose-th:border prose-td:border prose-th:border-border prose-td:border-border prose-code:text-primary prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:before:content-[''] prose-code:after:content-['']">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function WelcomeScreen({ onPrompt }: { onPrompt: (p: string) => void }) {
  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <div className="text-center mb-10">
        <div className="inline-flex h-14 w-14 rounded-2xl bg-gradient-primary items-center justify-center shadow-elevated mb-4">
          <Sparkles className="h-7 w-7 text-primary-foreground" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground mb-2">
          Hi, I'm your Lab Copilot
        </h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          I have full read access to your samples, materials, customers, suppliers, equipment, methods and standards.
          Ask me anything, or pick a starter prompt.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {STARTER_PROMPTS.map((s) => (
          <button
            key={s.title}
            onClick={() => onPrompt(s.prompt)}
            className="group text-left p-4 rounded-xl border border-border bg-card hover:bg-card/80 hover:border-primary/40 hover:shadow-sm transition-all"
          >
            <div className="flex items-start gap-3">
              <span className="text-xl shrink-0">{s.icon}</span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground mb-0.5 group-hover:text-primary transition-colors">
                  {s.title}
                </p>
                <p className="text-xs text-muted-foreground line-clamp-2">{s.prompt}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="mt-8 p-4 rounded-xl border border-dashed border-border bg-muted/30">
        <div className="flex gap-3 items-start">
          <ShieldCheck className="h-4 w-4 text-success shrink-0 mt-0.5" />
          <div className="text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">Suggest mode is active.</span>{" "}
            Lab Copilot will never create, edit, or delete records on its own. It only reads data and drafts content for you to approve. Every tool call is logged.
          </div>
        </div>
      </div>
    </div>
  );
}
