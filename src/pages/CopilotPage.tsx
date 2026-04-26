import { useState, useRef, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Send,
  Bot,
  User as UserIcon,
  Loader2,
  ShieldCheck,
  Eye,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useCopilot } from "@/hooks/useCopilot";
import { ToolCallStrip } from "@/components/copilot/ToolCallStrip";
import { DraftReviewModal, type DraftKind } from "@/components/copilot/DraftReviewModal";
import { ConversationSidebar } from "@/components/copilot/ConversationSidebar";
import { SkillModeChips } from "@/components/copilot/SkillModeChips";
import { SKILL_MODES, getMode, type SkillModeId } from "@/components/copilot/skillModes";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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
    updateConversationMode,
  } = useCopilot();

  const [input, setInput] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  // Pending mode for a NEW (yet-to-exist) conversation. Once a conv is active,
  // the mode is read from the conversation row.
  const [pendingMode, setPendingMode] = useState<SkillModeId>("general");

  const scrollRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const autoLaunchedRef = useRef(false);

  // Pending draft expectation for the review modal
  const pendingDraftRef = useRef<{ kind: DraftKind; label: string } | null>(null);
  const lastReviewedContentRef = useRef<string | null>(null);
  const [reviewState, setReviewState] = useState<{
    open: boolean;
    kind: DraftKind;
    title: string;
    contextLabel?: string;
    content: string;
  } | null>(null);

  // Resolve the active mode: from active conversation or pending selection.
  const activeMode = useMemo<SkillModeId>(() => {
    if (activeId) {
      const c = conversations.find((c) => c.id === activeId);
      return ((c?.mode as SkillModeId) ?? "general");
    }
    return pendingMode;
  }, [activeId, conversations, pendingMode]);

  const mode = getMode(activeMode);

  // Auto-launch from inline "Ask AI" buttons.
  useEffect(() => {
    const auto = (location.state as any)?.autoLaunch;
    if (!auto || autoLaunchedRef.current) return;
    autoLaunchedRef.current = true;
    navigate(location.pathname, { replace: true, state: {} });

    if (auto.draftKind) {
      pendingDraftRef.current = { kind: auto.draftKind, label: auto.actionLabel ?? "AI draft" };
    }
    // If the launch was a draft action, force Report Drafting mode.
    const launchMode: SkillModeId = auto.draftKind === "report" || auto.draftKind === "email"
      ? "report_drafting"
      : auto.draftKind === "diagnosis"
      ? "ng_diagnosis"
      : "general";

    (async () => {
      const id = await newConversation(auto.context, launchMode);
      if (id) {
        setTimeout(() => send(auto.prompt, auto.context, launchMode), 50);
      }
    })();
  }, [location, navigate, newConversation, send]);

  // Open review modal when a draft response arrives.
  useEffect(() => {
    if (sending) return;
    const pending = pendingDraftRef.current;
    if (!pending) return;
    const last = messages[messages.length - 1];
    if (!last || last.role !== "assistant" || !last.content || last.content === "...") return;
    if (lastReviewedContentRef.current === last.content) return;
    lastReviewedContentRef.current = last.content;
    pendingDraftRef.current = null;
    const ctxLabel = conversations.find((c) => c.id === activeId)?.context_label ?? undefined;
    setReviewState({
      open: true,
      kind: pending.kind,
      title: pending.label,
      contextLabel: ctxLabel,
      content: last.content,
    });
  }, [messages, sending, conversations, activeId]);

  const detectDraftKind = (content: string): DraftKind | null => {
    const c = content.toLowerCase();
    if (/(^|\n)\s*(subject:|dear |hi |hello )/i.test(content) || c.includes("kind regards") || c.includes("best regards")) return "email";
    if (c.includes("test report") || c.includes("executive summary") || c.includes("overall judgment")) return "report";
    if (c.includes("root cause") || c.includes("ng diagnosis") || c.includes("corrective action")) return "diagnosis";
    return null;
  };

  const openManualReview = (content: string) => {
    const kind = detectDraftKind(content) ?? "generic";
    const ctxLabel = conversations.find((c) => c.id === activeId)?.context_label ?? undefined;
    setReviewState({ open: true, kind, title: "Manual review", contextLabel: ctxLabel, content });
  };

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  const submit = () => {
    if (!input.trim() || sending) return;
    const text = input;
    setInput("");
    const lower = text.toLowerCase();
    if (/\bdraft\b.*\bemail\b|\bemail draft\b|\bcompose .* email\b/.test(lower)) {
      pendingDraftRef.current = { kind: "email", label: "Email draft" };
    } else if (/\bdraft\b.*\breport\b|\btest report draft\b/.test(lower)) {
      pendingDraftRef.current = { kind: "report", label: "Test report draft" };
    } else if (/\bdiagnos(e|is)\b|\bng\b.*\b(why|root cause)\b/.test(lower)) {
      pendingDraftRef.current = { kind: "diagnosis", label: "NG diagnosis" };
    }
    send(text, undefined, activeMode);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const handleModeChange = async (id: SkillModeId) => {
    if (activeId) {
      await updateConversationMode(activeId, id);
    } else {
      setPendingMode(id);
    }
  };

  const handleNewConversation = () => {
    setActiveId(null);
    // Keep pending mode so a fresh chat starts in whatever the user was browsing.
  };

  const Icon = mode.icon;

  return (
    <div className="flex h-[calc(100vh-3.5rem)] -m-6 bg-background">
      <ConversationSidebar
        conversations={conversations}
        activeId={activeId}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
        onSelect={setActiveId}
        onNew={handleNewConversation}
        onDelete={deleteConversation}
      />

      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="border-b border-border px-6 pt-3 pb-2 bg-card/40">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3 min-w-0">
              <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center shadow-sm shrink-0", mode.accentBg)}>
                <Icon className={cn("h-4 w-4", mode.accentText)} />
              </div>
              <div className="min-w-0">
                <h1 className="text-sm font-semibold tracking-tight text-foreground flex items-center gap-2">
                  Lab Copilot
                  <Badge variant="outline" className="text-[10px] h-4 px-1.5 font-normal">
                    Gemini 2.5 Pro
                  </Badge>
                  <Badge className={cn("text-[10px] h-4 px-1.5 font-medium border-transparent", mode.accentBg, mode.accentText)}>
                    {mode.label}
                  </Badge>
                </h1>
                <p className="text-[11px] text-muted-foreground truncate">{mode.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground shrink-0">
              <ShieldCheck className="h-3 w-3 text-success" />
              <span className="font-medium">Suggest mode</span>
            </div>
          </div>
          <SkillModeChips active={activeMode} onSelect={handleModeChange} compact />
        </header>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          {messages.length === 0 && !activeId ? (
            <WelcomeScreen
              modeId={activeMode}
              onPrompt={(p) => {
                setInput(p);
              }}
            />
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
            <div
              className={cn(
                "relative rounded-xl border bg-background shadow-sm transition-all",
                "border-border focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10"
              )}
            >
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder={`Ask in ${mode.label} mode…`}
                rows={2}
                className="border-0 resize-none focus-visible:ring-0 bg-transparent text-sm py-3 pr-14"
                disabled={sending}
              />
              <Button
                onClick={submit}
                disabled={!input.trim() || sending}
                size="icon"
                className={cn(
                  "absolute right-2 bottom-2 h-8 w-8 hover:opacity-90 text-primary-foreground",
                  mode.sendBtnClass
                )}
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

      {reviewState && (
        <DraftReviewModal
          open={reviewState.open}
          onOpenChange={(open) => setReviewState((s) => (s ? { ...s, open } : s))}
          kind={reviewState.kind}
          title={reviewState.title}
          contextLabel={reviewState.contextLabel}
          content={reviewState.content}
        />
      )}
    </div>
  );
}

function MessageBubble({
  message,
  onReview,
}: {
  message: any;
  onReview?: (content: string) => void;
}) {
  const isUser = message.role === "user";
  const isThinking = message.content === "...";
  const isAssistant = message.role === "assistant";
  const canReview =
    isAssistant && !isThinking && typeof message.content === "string" && message.content.length > 80;
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
        {canReview && onReview && (
          <div className="mt-1.5">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onReview(message.content)}
              className="h-6 px-2 text-[11px] text-muted-foreground hover:text-primary gap-1"
            >
              <Eye className="h-3 w-3" />
              Review before sending
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function WelcomeScreen({
  modeId,
  onPrompt,
}: {
  modeId: SkillModeId;
  onPrompt: (p: string) => void;
}) {
  const mode = SKILL_MODES[modeId];
  const Icon = mode.icon;

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <div className="text-center mb-10">
        <div className={cn("inline-flex h-14 w-14 rounded-2xl items-center justify-center shadow-elevated mb-4", mode.accentBg)}>
          <Icon className={cn("h-7 w-7", mode.accentText)} />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground mb-2">
          {mode.welcome.headline}
        </h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          {mode.welcome.blurb}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {mode.starters.map((s) => (
          <button
            key={s.title}
            onClick={() => onPrompt(s.prompt)}
            className="group text-left p-4 rounded-xl border bg-card hover:bg-card/80 transition-all border-border hover:shadow-sm hover:border-primary/40"
          >
            <div className="flex items-start gap-3">
              <span className="text-xl shrink-0">{s.emoji}</span>
              <div className="min-w-0">
                <p className="text-sm font-semibold mb-0.5 text-foreground group-hover:text-primary transition-colors">
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
            Lab Copilot will never create, edit, or delete records on its own. Switch skill modes any
            time using the chips above — each mode tunes the agent's focus and starter prompts.
          </div>
        </div>
      </div>
    </div>
  );
}
