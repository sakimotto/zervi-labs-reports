import { useState, useEffect } from "react";
import { Copy, Check, Pencil, Send, Trash2, ShieldCheck, FileText, Mail, Stethoscope } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";

export type DraftKind = "report" | "email" | "diagnosis" | "generic";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kind: DraftKind;
  title: string;
  contextLabel?: string;
  content: string;
  /** Approve handler — receives the (possibly edited) final content. */
  onApprove?: (finalContent: string) => void;
  /** Discard handler — fired when the user rejects the draft. */
  onDiscard?: () => void;
}

const KIND_META: Record<DraftKind, { icon: any; label: string; verb: string; tone: string }> = {
  report: { icon: FileText, label: "Test report draft", verb: "Approve report", tone: "text-primary" },
  email: { icon: Mail, label: "Email draft", verb: "Approve & copy", tone: "text-primary" },
  diagnosis: { icon: Stethoscope, label: "NG diagnosis draft", verb: "Approve diagnosis", tone: "text-primary" },
  generic: { icon: FileText, label: "AI-generated draft", verb: "Approve & copy", tone: "text-primary" },
};

/**
 * Confirmation modal shown after the agent produces a draft (report / email / diagnosis).
 * The user can review, edit inline, copy, approve, or discard before any "send" action.
 * No data is persisted or emailed without explicit approval here.
 */
export function DraftReviewModal({
  open,
  onOpenChange,
  kind,
  title,
  contextLabel,
  content,
  onApprove,
  onDiscard,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(content);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setDraft(content);
    setEditing(false);
    setCopied(false);
  }, [content, open]);

  const meta = KIND_META[kind];
  const Icon = meta.icon;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(draft);
      setCopied(true);
      toast({ title: "Copied", description: "Draft copied to clipboard" });
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast({ title: "Copy failed", variant: "destructive" });
    }
  };

  const handleApprove = () => {
    onApprove?.(draft);
    toast({
      title: kind === "email" ? "Email approved" : "Draft approved",
      description: "Copied to clipboard — ready for you to send / paste into the record.",
    });
    handleCopy();
    onOpenChange(false);
  };

  const handleDiscard = () => {
    onDiscard?.();
    onOpenChange(false);
    toast({ title: "Draft discarded", description: "Nothing was sent or saved." });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Icon className={`h-5 w-5 ${meta.tone}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <DialogTitle className="text-base">Review before sending</DialogTitle>
                <Badge variant="outline" className="text-[10px] h-4 px-1.5 font-normal">
                  {meta.label}
                </Badge>
              </div>
              <DialogDescription className="text-xs mt-1">
                {title}
                {contextLabel && (
                  <span className="text-muted-foreground"> · {contextLabel}</span>
                )}
              </DialogDescription>
            </div>
          </div>
          <div className="flex items-center gap-1.5 mt-3 text-[11px] text-muted-foreground bg-muted/40 px-3 py-1.5 rounded-md">
            <ShieldCheck className="h-3 w-3 text-success shrink-0" />
            <span>
              Nothing has been sent or saved yet. Review and edit below — approval only copies the
              final text to your clipboard.
            </span>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {editing ? (
            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="min-h-[400px] text-sm font-mono leading-relaxed"
              autoFocus
            />
          ) : (
            <div className="prose prose-sm max-w-none prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-li:text-foreground prose-table:text-xs prose-th:bg-muted/40 prose-th:font-semibold prose-th:p-2 prose-td:p-2 prose-th:border prose-td:border prose-th:border-border prose-td:border-border prose-code:text-primary prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:before:content-[''] prose-code:after:content-['']">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{draft}</ReactMarkdown>
            </div>
          )}
        </div>

        <DialogFooter className="px-6 py-4 border-t border-border bg-card/40 flex-row sm:justify-between gap-2">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDiscard}
              className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-1.5"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Discard
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEditing((e) => !e)}
              className="gap-1.5"
            >
              <Pencil className="h-3.5 w-3.5" />
              {editing ? "Preview" : "Edit"}
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleCopy} className="gap-1.5">
              {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied" : "Copy only"}
            </Button>
            <Button
              size="sm"
              onClick={handleApprove}
              className="gap-1.5 bg-gradient-primary hover:opacity-90"
            >
              <Send className="h-3.5 w-3.5" />
              {meta.verb}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
