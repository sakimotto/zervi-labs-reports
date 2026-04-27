import { useMemo, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import {
  History,
  Loader2,
  RotateCcw,
  Trash2,
  Pencil,
  Camera,
  Eye,
  EyeOff,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { EmptyState } from '@/components/data/EmptyState';
import {
  type DbTestRequestTemplate,
  type DbTestRequestTemplateVersion,
  useTemplateVersions,
  useRestoreTemplateVersion,
} from '@/hooks/useTestRequestTemplates';

interface Props {
  template: DbTestRequestTemplate | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

const KIND_META: Record<
  DbTestRequestTemplateVersion['change_kind'],
  { label: string; icon: typeof Pencil; tone: string }
> = {
  snapshot: { label: 'Initial snapshot', icon: Camera, tone: 'text-info' },
  update: { label: 'Edited', icon: Pencil, tone: 'text-warning' },
  delete: { label: 'Deleted', icon: Trash2, tone: 'text-destructive' },
  restore: { label: 'Restored', icon: RotateCcw, tone: 'text-success' },
};

export function TemplateHistorySheet({ template, open, onOpenChange }: Props) {
  const { data: versions = [], isLoading } = useTemplateVersions(template?.id ?? null);
  const restore = useRestoreTemplateVersion();

  const [confirmRestore, setConfirmRestore] =
    useState<DbTestRequestTemplateVersion | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Compare each version against the version that came BEFORE it chronologically
  // (i.e. higher version_number), so users see what changed at this snapshot.
  const diffs = useMemo(() => {
    const map = new Map<string, string[]>();
    const sorted = [...versions].sort((a, b) => a.version_number - b.version_number);
    for (let i = 0; i < sorted.length; i++) {
      const cur = sorted[i];
      const prev = sorted[i - 1];
      const changed: string[] = [];
      if (!prev) {
        map.set(cur.id, []);
        continue;
      }
      if (cur.label !== prev.label) changed.push('label');
      if ((cur.description ?? '') !== (prev.description ?? '')) changed.push('description');
      if (cur.scope !== prev.scope) changed.push('scope');
      if (cur.materials !== prev.materials) changed.push('materials');
      if (cur.is_active !== prev.is_active) changed.push('visibility');
      if (cur.sort_order !== prev.sort_order) changed.push('order');
      map.set(cur.id, changed);
    }
    return map;
  }, [versions]);

  const handleRestore = (v: DbTestRequestTemplateVersion) => {
    restore.mutate(v, {
      onSuccess: () => {
        toast.success(`Restored to v${v.version_number}`);
        setConfirmRestore(null);
      },
      onError: (err: any) => toast.error(err?.message ?? 'Failed to restore'),
    });
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2 text-base">
              <History className="h-4 w-4 text-primary" />
              Version history
            </SheetTitle>
            <SheetDescription>
              {template?.label ?? '—'} ·{' '}
              <span className="text-foreground/70">
                {versions.length} {versions.length === 1 ? 'version' : 'versions'}
              </span>
            </SheetDescription>
          </SheetHeader>

          <div className="mt-5">
            {isLoading ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : versions.length === 0 ? (
              <EmptyState
                icon={History}
                title="No history yet"
                description="Edits will appear here once this template is changed."
                compact
              />
            ) : (
              <ol className="relative border-l border-border/70 ml-3 space-y-4">
                {versions.map((v) => {
                  const meta = KIND_META[v.change_kind] ?? KIND_META.update;
                  const Icon = meta.icon;
                  const changed = diffs.get(v.id) ?? [];
                  const isExpanded = expandedId === v.id;
                  return (
                    <li key={v.id} className="ml-6 relative">
                      <span
                        className={`absolute -left-[34px] top-1 h-6 w-6 rounded-full bg-card border border-border flex items-center justify-center ${meta.tone}`}
                      >
                        <Icon className="h-3 w-3" />
                      </span>
                      <div className="rounded-lg border border-border bg-card px-3 py-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-semibold text-foreground">
                                v{v.version_number}
                              </span>
                              <span className={`text-xs font-medium ${meta.tone}`}>
                                {meta.label}
                              </span>
                              {!v.is_active && (
                                <span className="text-[10px] uppercase tracking-wide rounded bg-muted px-1.5 py-0.5 text-muted-foreground">
                                  hidden
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-muted-foreground mt-0.5">
                              {formatDistanceToNow(new Date(v.changed_at), { addSuffix: true })}
                              {v.changed_by_name && (
                                <>
                                  {' · '}
                                  <span className="text-foreground/70">{v.changed_by_name}</span>
                                </>
                              )}
                            </div>
                            {changed.length > 0 && (
                              <div className="flex gap-1 flex-wrap mt-1.5">
                                {changed.map((c) => (
                                  <span
                                    key={c}
                                    className="text-[10px] uppercase tracking-wide rounded bg-warning-soft px-1.5 py-0.5 text-warning-foreground"
                                  >
                                    {c}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-2 text-xs"
                              onClick={() => setConfirmRestore(v)}
                              disabled={!template || restore.isPending}
                            >
                              <RotateCcw className="h-3 w-3" /> Restore
                            </Button>
                            <button
                              type="button"
                              onClick={() => setExpandedId(isExpanded ? null : v.id)}
                              className="text-[11px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                            >
                              {isExpanded ? (
                                <>
                                  <EyeOff className="h-3 w-3" /> Hide
                                </>
                              ) : (
                                <>
                                  <Eye className="h-3 w-3" /> Preview
                                </>
                              )}
                            </button>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="mt-3 space-y-2 text-xs">
                            <div>
                              <div className="text-[10px] uppercase font-semibold tracking-wide text-muted-foreground mb-1">
                                Label
                              </div>
                              <div className="text-foreground">{v.label}</div>
                            </div>
                            {v.description && (
                              <div>
                                <div className="text-[10px] uppercase font-semibold tracking-wide text-muted-foreground mb-1">
                                  Description
                                </div>
                                <div className="text-foreground/90">{v.description}</div>
                              </div>
                            )}
                            <div>
                              <div className="text-[10px] uppercase font-semibold tracking-wide text-muted-foreground mb-1">
                                Scope
                              </div>
                              <pre className="whitespace-pre-wrap font-mono text-[11px] rounded border border-border/60 bg-muted/30 px-2 py-1.5 text-foreground/90">
                                {v.scope || '—'}
                              </pre>
                            </div>
                            <div>
                              <div className="text-[10px] uppercase font-semibold tracking-wide text-muted-foreground mb-1">
                                Materials
                              </div>
                              <pre className="whitespace-pre-wrap font-mono text-[11px] rounded border border-border/60 bg-muted/30 px-2 py-1.5 text-foreground/90">
                                {v.materials || '—'}
                              </pre>
                            </div>
                          </div>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog
        open={!!confirmRestore}
        onOpenChange={(v) => !v && setConfirmRestore(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Restore to v{confirmRestore?.version_number}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              The template's label, description, scope, materials, and visibility will be replaced
              with the values from this version. The current state will be saved as a new history
              entry, so you can undo this restore later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={restore.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={restore.isPending}
              onClick={(e) => {
                e.preventDefault();
                if (confirmRestore) handleRestore(confirmRestore);
              }}
            >
              {restore.isPending ? 'Restoring…' : 'Restore'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
