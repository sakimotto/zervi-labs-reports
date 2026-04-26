import { ReactNode, useState } from 'react';
import { Search, X, SlidersHorizontal, Bookmark, BookmarkPlus, Check, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import type { SavedView } from '@/hooks/useSavedViews';

export interface FilterDef {
  key: string;
  label: string;
  value: string;
  options: { value: string; label: string; count?: number }[];
  onChange: (v: string) => void;
  /** Value treated as "no filter applied" (default 'all') */
  allValue?: string;
}

interface SavedViewsConfig {
  views: SavedView<any>[];
  activeId: string | null;
  onApply: (id: string) => void;
  onSave: (name: string) => void;
  onDelete: (id: string) => void;
}

interface FilterBarProps {
  search: string;
  onSearchChange: (v: string) => void;
  searchPlaceholder?: string;
  filters?: FilterDef[];
  /** Right-aligned actions (extra buttons, view toggles, etc.) */
  actions?: ReactNode;
  /** Left-aligned summary above the bar (e.g. result count) */
  summary?: ReactNode;
  className?: string;
  /** Optional saved-views integration */
  savedViews?: SavedViewsConfig;
}

export function FilterBar({
  search,
  onSearchChange,
  searchPlaceholder = 'Search…',
  filters = [],
  actions,
  summary,
  className,
  savedViews,
}: FilterBarProps) {
  const activeFilters = filters.filter((f) => f.value !== (f.allValue ?? 'all') && f.value !== '');
  const hasActive = !!search || activeFilters.length > 0;

  const clearAll = () => {
    onSearchChange('');
    filters.forEach((f) => f.onChange(f.allValue ?? 'all'));
  };

  return (
    <Card className={cn('p-3 shadow-card', className)}>
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="pl-8 h-9 bg-background"
          />
          {search && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {filters.length > 0 && (
          <div className="hidden md:flex items-center gap-1 text-muted-foreground">
            <SlidersHorizontal className="h-3.5 w-3.5" />
          </div>
        )}

        {filters.map((f) => (
          <Select key={f.key} value={f.value} onValueChange={f.onChange}>
            <SelectTrigger className="h-9 w-auto min-w-[140px] bg-background">
              <SelectValue placeholder={f.label} />
            </SelectTrigger>
            <SelectContent>
              {f.options.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                  {opt.count !== undefined && (
                    <span className="ml-2 text-xs text-muted-foreground tabular-nums">{opt.count}</span>
                  )}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ))}

        {savedViews && <SavedViewsMenu config={savedViews} canSave={hasActive} />}

        <div className="flex-1" />

        {actions}
      </div>

      {(hasActive || summary) && (
        <div className="flex items-center gap-2 flex-wrap mt-2 pt-2 border-t border-border/50">
          {summary && <div className="text-xs text-muted-foreground mr-2">{summary}</div>}
          {search && (
            <Chip onClear={() => onSearchChange('')}>
              <span className="text-muted-foreground">Search:</span> {search}
            </Chip>
          )}
          {activeFilters.map((f) => {
            const opt = f.options.find((o) => o.value === f.value);
            return (
              <Chip key={f.key} onClear={() => f.onChange(f.allValue ?? 'all')}>
                <span className="text-muted-foreground">{f.label}:</span> {opt?.label ?? f.value}
              </Chip>
            );
          })}
          {hasActive && (
            <Button variant="ghost" size="sm" onClick={clearAll} className="h-6 px-2 text-xs">
              Clear all
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}

function SavedViewsMenu({ config, canSave }: { config: SavedViewsConfig; canSave: boolean }) {
  const [savePopoverOpen, setSavePopoverOpen] = useState(false);
  const [name, setName] = useState('');
  const active = config.views.find((v) => v.id === config.activeId);

  const handleSave = () => {
    if (!name.trim()) return;
    config.onSave(name.trim());
    setName('');
    setSavePopoverOpen(false);
  };

  return (
    <div className="flex items-center gap-1">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              'h-9 gap-1.5',
              active && 'bg-primary-soft text-primary border-primary/30',
            )}
          >
            <Bookmark className="h-3.5 w-3.5" />
            <span className="text-xs">{active ? active.name : 'Views'}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-60">
          <DropdownMenuLabel className="text-[11px] uppercase tracking-wider text-muted-foreground">
            Saved views
          </DropdownMenuLabel>
          {config.views.length === 0 ? (
            <div className="px-2 py-3 text-xs text-muted-foreground text-center">
              No saved views yet.
              <br />
              Apply filters and save one.
            </div>
          ) : (
            config.views.map((v) => (
              <DropdownMenuItem
                key={v.id}
                onSelect={(e) => e.preventDefault()}
                className="flex items-center justify-between gap-2 group"
              >
                <button
                  onClick={() => config.onApply(v.id)}
                  className="flex-1 flex items-center gap-2 min-w-0 text-left"
                >
                  {config.activeId === v.id ? (
                    <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                  ) : (
                    <Bookmark className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  )}
                  <span className="truncate text-xs">{v.name}</span>
                </button>
                <button
                  onClick={() => config.onDelete(v.id)}
                  className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                  aria-label={`Delete view ${v.name}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </DropdownMenuItem>
            ))
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              setSavePopoverOpen(true);
            }}
            disabled={!canSave}
          >
            <BookmarkPlus className="h-3.5 w-3.5 mr-2" />
            <span className="text-xs">
              {canSave ? 'Save current filters…' : 'Apply filters to save'}
            </span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Popover open={savePopoverOpen} onOpenChange={setSavePopoverOpen}>
        <PopoverTrigger asChild>
          <span />
        </PopoverTrigger>
        <PopoverContent align="end" className="w-64">
          <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">
            Save view as
          </Label>
          <Input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave();
              if (e.key === 'Escape') setSavePopoverOpen(false);
            }}
            placeholder="e.g. Urgent open items"
            className="mt-2 h-9"
          />
          <div className="flex justify-end gap-2 mt-3">
            <Button variant="outline" size="sm" onClick={() => setSavePopoverOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={!name.trim()}>
              Save
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

function Chip({ children, onClear }: { children: ReactNode; onClear: () => void }) {
  return (
    <Badge
      variant="outline"
      className="h-6 pl-2 pr-1 gap-1 bg-primary-soft text-primary border-primary/20 font-normal"
    >
      <span className="text-xs">{children}</span>
      <button
        onClick={onClear}
        className="hover:bg-primary/15 rounded-sm p-0.5 transition-colors"
        aria-label="Remove filter"
      >
        <X className="h-3 w-3" />
      </button>
    </Badge>
  );
}
