import { SKILL_MODE_LIST, type SkillModeId, type SkillMode } from "@/components/copilot/skillModes";
import { cn } from "@/lib/utils";

interface Props {
  active: SkillModeId;
  onSelect: (id: SkillModeId) => void;
  /** Compact: smaller chips for inside header. */
  compact?: boolean;
}

export function SkillModeChips({ active, onSelect, compact = false }: Props) {
  return (
    <div
      className={cn(
        "flex items-center gap-1.5 overflow-x-auto scrollbar-thin",
        compact ? "py-1" : "py-2"
      )}
    >
      {SKILL_MODE_LIST.map((mode) => (
        <ModeChip
          key={mode.id}
          mode={mode}
          active={active === mode.id}
          compact={compact}
          onClick={() => onSelect(mode.id)}
        />
      ))}
    </div>
  );
}

function ModeChip({
  mode,
  active,
  compact,
  onClick,
}: {
  mode: SkillMode;
  active: boolean;
  compact: boolean;
  onClick: () => void;
}) {
  const Icon = mode.icon;
  return (
    <button
      onClick={onClick}
      title={mode.description}
      className={cn(
        "shrink-0 inline-flex items-center gap-1.5 rounded-full border transition-all whitespace-nowrap",
        compact ? "px-2.5 py-1 text-[11px]" : "px-3 py-1.5 text-xs",
        active
          ? cn(
              "border-transparent font-semibold ring-2 ring-offset-1 ring-offset-background shadow-sm",
              mode.accentBg,
              mode.accentText,
              mode.accentRing
            )
          : "border-border bg-card text-muted-foreground hover:bg-muted/60 hover:text-foreground"
      )}
    >
      <Icon className={cn("h-3.5 w-3.5", active && mode.accentText)} />
      <span>{compact ? mode.shortLabel : mode.label}</span>
    </button>
  );
}
