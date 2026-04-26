import { useEffect, useState } from "react";
import { Plus, RotateCcw, Trash2, Save } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { SKILL_MODES, type SkillModeId, type StarterPrompt } from "@/components/copilot/skillModes";

type Props = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  modeId: SkillModeId;
  currentStarters: StarterPrompt[];
  onSave: (modeId: SkillModeId, starters: StarterPrompt[]) => void;
  onReset: (modeId: SkillModeId) => void;
};

const MAX_CARDS = 6;
const MIN_CARDS = 1;

export function StarterEditorModal({
  open,
  onOpenChange,
  modeId,
  currentStarters,
  onSave,
  onReset,
}: Props) {
  const mode = SKILL_MODES[modeId];
  const [items, setItems] = useState<StarterPrompt[]>(currentStarters);

  // Re-seed every time the modal opens or the mode changes.
  useEffect(() => {
    if (open) setItems(currentStarters.map((s) => ({ ...s })));
  }, [open, modeId]); // eslint-disable-line react-hooks/exhaustive-deps

  const update = (idx: number, patch: Partial<StarterPrompt>) => {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  };

  const remove = (idx: number) => {
    if (items.length <= MIN_CARDS) return;
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const add = () => {
    if (items.length >= MAX_CARDS) return;
    setItems((prev) => [...prev, { emoji: "✨", title: "", prompt: "" }]);
  };

  const handleSave = () => {
    const cleaned = items
      .map((s) => ({
        emoji: (s.emoji || "✨").trim().slice(0, 4),
        title: s.title.trim(),
        prompt: s.prompt.trim(),
      }))
      .filter((s) => s.title && s.prompt);

    if (cleaned.length < MIN_CARDS) {
      toast({
        title: "Need at least one card",
        description: "Each card needs both a title and a prompt.",
        variant: "destructive",
      });
      return;
    }

    onSave(modeId, cleaned);
    toast({
      title: "Starter cards saved",
      description: `Updated ${cleaned.length} card${cleaned.length === 1 ? "" : "s"} for ${mode.label}.`,
    });
    onOpenChange(false);
  };

  const handleReset = () => {
    onReset(modeId);
    setItems(SKILL_MODES[modeId].starters.map((s) => ({ ...s })));
    toast({ title: "Reset to defaults", description: `${mode.label} starter cards restored.` });
  };

  const Icon = mode.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center shrink-0", mode.accentBg)}>
              <Icon className={cn("h-4 w-4", mode.accentText)} />
            </div>
            <div className="min-w-0">
              <DialogTitle className="flex items-center gap-2">
                Customize starter cards
                <Badge variant="outline" className="text-[10px] h-4 px-1.5 font-normal">
                  {mode.label}
                </Badge>
              </DialogTitle>
              <DialogDescription className="text-xs">
                Edit the prompts shown on the welcome screen for this skill mode. Changes are saved
                to your browser only.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto -mx-6 px-6 space-y-3 py-2">
          {items.map((item, idx) => (
            <div
              key={idx}
              className="rounded-lg border border-border bg-card/50 p-3 space-y-2.5 relative group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
                  Card {idx + 1}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => remove(idx)}
                  disabled={items.length <= MIN_CARDS}
                  className="h-7 px-2 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>

              <div className="grid grid-cols-[64px_1fr] gap-2">
                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground">Emoji</Label>
                  <Input
                    value={item.emoji}
                    onChange={(e) => update(idx, { emoji: e.target.value })}
                    maxLength={4}
                    className="h-8 text-center"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground">Card title (shown on chip)</Label>
                  <Input
                    value={item.title}
                    onChange={(e) => update(idx, { title: e.target.value })}
                    placeholder="What customer requests are overdue?"
                    className="h-8"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground">
                  Prompt sent to Copilot when clicked
                </Label>
                <Textarea
                  value={item.prompt}
                  onChange={(e) => update(idx, { prompt: e.target.value })}
                  placeholder="List all overdue customer test requests sorted by how late they are."
                  rows={2}
                  className="resize-none text-sm"
                />
              </div>
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            onClick={add}
            disabled={items.length >= MAX_CARDS}
            className="w-full border-dashed gap-2 h-9"
          >
            <Plus className="h-3.5 w-3.5" />
            Add card {items.length >= MAX_CARDS && `(max ${MAX_CARDS})`}
          </Button>
        </div>

        <DialogFooter className="flex sm:justify-between gap-2 border-t border-border pt-3">
          <Button type="button" variant="ghost" onClick={handleReset} className="gap-2 text-muted-foreground">
            <RotateCcw className="h-3.5 w-3.5" />
            Reset to defaults
          </Button>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSave} className="gap-2">
              <Save className="h-3.5 w-3.5" />
              Save cards
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
