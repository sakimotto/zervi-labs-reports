import { useState } from "react";
import { Sparkles, Plus, MessageSquare, Trash2, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { formatDistanceToNow, isToday, isYesterday, isThisWeek } from "date-fns";
import { getMode, type SkillMode } from "@/components/copilot/skillModes";
import type { CopilotConversation } from "@/hooks/useCopilot";

type Group = { key: string; label: string; conversations: CopilotConversation[] };

function groupConversations(convos: CopilotConversation[]): Group[] {
  const today: CopilotConversation[] = [];
  const yesterday: CopilotConversation[] = [];
  const thisWeek: CopilotConversation[] = [];
  const older: CopilotConversation[] = [];

  for (const c of convos) {
    const d = new Date(c.last_message_at);
    if (isToday(d)) today.push(c);
    else if (isYesterday(d)) yesterday.push(c);
    else if (isThisWeek(d, { weekStartsOn: 1 })) thisWeek.push(c);
    else older.push(c);
  }

  return [
    { key: "today", label: "Today", conversations: today },
    { key: "yesterday", label: "Yesterday", conversations: yesterday },
    { key: "thisWeek", label: "This week", conversations: thisWeek },
    { key: "older", label: "Older", conversations: older },
  ].filter((g) => g.conversations.length > 0);
}

interface Props {
  conversations: CopilotConversation[];
  activeId: string | null;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
}

export function ConversationSidebar({
  conversations,
  activeId,
  collapsed,
  onToggleCollapse,
  onSelect,
  onNew,
  onDelete,
}: Props) {
  const groups = groupConversations(conversations);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    today: true,
    yesterday: true,
    thisWeek: true,
    older: false,
  });
  const toggleGroup = (k: string) => setOpenGroups((s) => ({ ...s, [k]: !s[k] }));

  if (collapsed) {
    return (
      <aside className="w-12 border-r border-border bg-card/30 flex flex-col items-center py-3 gap-2">
        <Button
          onClick={onToggleCollapse}
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          title="Expand conversations"
          aria-label="Expand conversations"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          onClick={onNew}
          size="icon"
          className="h-8 w-8 bg-gradient-primary hover:opacity-90"
          title="New conversation"
          aria-label="New conversation"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </aside>
    );
  }

  return (
    <aside className="w-72 border-r border-border bg-card/30 flex flex-col">
      <div className="p-3 border-b border-border flex items-center gap-2">
        <Button
          onClick={onNew}
          className="flex-1 gap-2 bg-gradient-primary hover:opacity-90 shadow-sm"
          size="sm"
        >
          <Plus className="h-4 w-4" />
          New conversation
        </Button>
        <Button
          onClick={onToggleCollapse}
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          title="Collapse"
          aria-label="Collapse"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-3">
          {groups.length === 0 && (
            <p className="text-xs text-muted-foreground p-3 text-center">
              No conversations yet. Start a new one above.
            </p>
          )}
          {groups.map((g) => {
            const isOpen = openGroups[g.key] ?? true;
            return (
              <div key={g.key}>
                <button
                  onClick={() => toggleGroup(g.key)}
                  className="w-full flex items-center justify-between px-2 py-1 text-[10px] uppercase tracking-wider font-semibold text-muted-foreground hover:text-foreground transition-colors"
                >
                  <span>{g.label}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-muted-foreground/70">{g.conversations.length}</span>
                    <ChevronDown
                      className={cn("h-3 w-3 transition-transform", !isOpen && "-rotate-90")}
                    />
                  </div>
                </button>
                {isOpen && (
                  <div className="space-y-0.5 mt-0.5">
                    {g.conversations.map((c) => (
                      <ConvRow
                        key={c.id}
                        conv={c}
                        active={activeId === c.id}
                        onSelect={() => onSelect(c.id)}
                        onDelete={() => onDelete(c.id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </aside>
  );
}

function ConvRow({
  conv,
  active,
  onSelect,
  onDelete,
}: {
  conv: CopilotConversation;
  active: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  const mode: SkillMode = getMode(conv.mode);
  const Icon = mode.icon ?? MessageSquare;
  return (
    <div
      onClick={onSelect}
      className={cn(
        "group flex items-start gap-2 p-2 rounded-md cursor-pointer transition-colors",
        active ? "bg-primary/10" : "hover:bg-muted/60"
      )}
    >
      <div
        className={cn(
          "h-5 w-5 rounded flex items-center justify-center shrink-0 mt-0.5",
          mode.accentBg
        )}
        title={mode.label}
      >
        <Icon className={cn("h-3 w-3", mode.accentText)} />
      </div>
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "text-xs font-medium truncate",
            active ? "text-primary" : "text-foreground"
          )}
        >
          {conv.title}
        </p>
        <p className="text-[10px] text-muted-foreground flex items-center gap-1">
          <span className={cn("font-medium", mode.accentText)}>{mode.shortLabel}</span>
          <span>·</span>
          <span>{formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: true })}</span>
          {conv.message_count > 0 && (
            <>
              <span>·</span>
              <span>{conv.message_count}m</span>
            </>
          )}
        </p>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
        aria-label="Delete"
      >
        <Trash2 className="h-3 w-3" />
      </button>
    </div>
  );
}
