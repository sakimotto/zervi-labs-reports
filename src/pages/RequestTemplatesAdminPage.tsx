import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Sparkles,
  Plus,
  Pencil,
  Trash2,
  Save,
  GripVertical,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  ShieldAlert,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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
  FormField,
  FormGrid,
  FormInput,
  FormTextarea,
  StickyFormFooter,
} from '@/components/form/FormPrimitives';
import {
  type DbTestRequestTemplate,
  useAllTestRequestTemplates,
  useCreateTestRequestTemplate,
  useUpdateTestRequestTemplate,
  useDeleteTestRequestTemplate,
  useReorderTestRequestTemplates,
} from '@/hooks/useTestRequestTemplates';
import { useIsAdmin } from '@/hooks/useUserRole';

/* ----------------------------- Schema ------------------------------------- */

const templateSchema = z.object({
  label: z.string().trim().min(1, 'Label is required').max(200, 'Max 200 characters'),
  description: z.string().trim().max(500, 'Max 500 characters').optional(),
  scope: z.string().max(5000, 'Max 5000 characters').optional(),
  materials: z.string().max(5000, 'Max 5000 characters').optional(),
  is_active: z.boolean(),
});
type TemplateFormValues = z.infer<typeof templateSchema>;

const blank = (): TemplateFormValues => ({
  label: '',
  description: '',
  scope: '',
  materials: '',
  is_active: true,
});

const toValues = (t: DbTestRequestTemplate): TemplateFormValues => ({
  label: t.label,
  description: t.description ?? '',
  scope: t.scope ?? '',
  materials: t.materials ?? '',
  is_active: t.is_active,
});

/* ----------------------------- Page --------------------------------------- */

export default function RequestTemplatesAdminPage() {
  const isAdmin = useIsAdmin();
  const { data: templates = [], isLoading } = useAllTestRequestTemplates();
  const reorder = useReorderTestRequestTemplates();
  const del = useDeleteTestRequestTemplate();
  const update = useUpdateTestRequestTemplate();

  const [editing, setEditing] = useState<DbTestRequestTemplate | null>(null);
  const [creating, setCreating] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<DbTestRequestTemplate | null>(null);

  const move = (index: number, direction: -1 | 1) => {
    const next = [...templates];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    reorder.mutate(
      next.map((t) => t.id),
      {
        onSuccess: () => toast.success('Order updated'),
        onError: (e: any) => toast.error(e?.message ?? 'Failed to reorder'),
      },
    );
  };

  const toggleActive = (t: DbTestRequestTemplate) => {
    update.mutate(
      { id: t.id, is_active: !t.is_active },
      {
        onSuccess: () =>
          toast.success(t.is_active ? 'Template hidden' : 'Template enabled'),
        onError: (e: any) => toast.error(e?.message ?? 'Failed to update'),
      },
    );
  };

  if (!isAdmin) {
    return (
      <>
        <PageHeader
          eyebrow="Admin"
          title="Test request templates"
          description="Manage the quick-fill blueprints used in the customer test request form."
        />
        <div className="px-6 py-10">
          <EmptyState
            icon={ShieldAlert}
            title="Admins only"
            description="You need an admin role to manage test request templates."
          />
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="Admin"
        title="Test request templates"
        description="Quick-fill blueprints shown in the customer test request form. Edit, hide, or reorder them here."
        actions={
          <Button onClick={() => setCreating(true)} size="sm">
            <Plus className="h-4 w-4" /> New template
          </Button>
        }
      />

      <div className="px-6 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : templates.length === 0 ? (
          <EmptyState
            icon={Sparkles}
            title="No templates yet"
            description="Create your first blueprint to speed up customer test requests."
            action={
              <Button onClick={() => setCreating(true)}>
                <Plus className="h-4 w-4" /> New template
              </Button>
            }
          />
        ) : (
          <ul className="space-y-2">
            {templates.map((t, i) => (
              <li
                key={t.id}
                className={`group flex items-start gap-3 rounded-lg border bg-card px-4 py-3 transition-colors hover:border-primary/40 ${
                  t.is_active ? 'border-border' : 'border-dashed border-border/60 opacity-70'
                }`}
              >
                <div className="flex flex-col items-center gap-1 pt-0.5">
                  <GripVertical className="h-4 w-4 text-muted-foreground/60" />
                  <div className="flex flex-col gap-0.5">
                    <button
                      type="button"
                      className="rounded hover:bg-muted disabled:opacity-30"
                      onClick={() => move(i, -1)}
                      disabled={i === 0 || reorder.isPending}
                      aria-label="Move up"
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      className="rounded hover:bg-muted disabled:opacity-30"
                      onClick={() => move(i, 1)}
                      disabled={i === templates.length - 1 || reorder.isPending}
                      aria-label="Move down"
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-foreground truncate">
                      {t.label}
                    </h3>
                    {!t.is_active && (
                      <span className="text-[10px] uppercase tracking-wide rounded bg-muted px-1.5 py-0.5 text-muted-foreground">
                        Hidden
                      </span>
                    )}
                  </div>
                  {t.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {t.description}
                    </p>
                  )}
                  <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] text-muted-foreground">
                    <div className="rounded border border-border/60 bg-muted/30 px-2 py-1.5 line-clamp-2 whitespace-pre-line">
                      <span className="text-[10px] uppercase font-semibold tracking-wide text-foreground/60">
                        Scope
                      </span>
                      <div className="line-clamp-2">{t.scope || '—'}</div>
                    </div>
                    <div className="rounded border border-border/60 bg-muted/30 px-2 py-1.5 line-clamp-2 whitespace-pre-line">
                      <span className="text-[10px] uppercase font-semibold tracking-wide text-foreground/60">
                        Materials
                      </span>
                      <div className="line-clamp-2">{t.materials || '—'}</div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    className="p-2 rounded hover:bg-muted text-muted-foreground"
                    onClick={() => toggleActive(t)}
                    title={t.is_active ? 'Hide from form' : 'Show in form'}
                  >
                    {t.is_active ? (
                      <Eye className="h-4 w-4" />
                    ) : (
                      <EyeOff className="h-4 w-4" />
                    )}
                  </button>
                  <button
                    type="button"
                    className="p-2 rounded hover:bg-muted text-muted-foreground"
                    onClick={() => setEditing(t)}
                    title="Edit"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className="p-2 rounded hover:bg-destructive/10 text-destructive"
                    onClick={() => setConfirmDelete(t)}
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <TemplateDialog
        open={creating}
        onOpenChange={setCreating}
        template={null}
      />
      <TemplateDialog
        open={!!editing}
        onOpenChange={(v) => !v && setEditing(null)}
        template={editing}
      />

      <AlertDialog open={!!confirmDelete} onOpenChange={(v) => !v && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete template?</AlertDialogTitle>
            <AlertDialogDescription>
              "{confirmDelete?.label}" will be removed permanently. Existing requests are unaffected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={del.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={del.isPending}
              onClick={(e) => {
                e.preventDefault();
                if (!confirmDelete) return;
                del.mutate(confirmDelete.id, {
                  onSuccess: () => {
                    toast.success('Template deleted');
                    setConfirmDelete(null);
                  },
                  onError: (err: any) =>
                    toast.error(err?.message ?? 'Failed to delete'),
                });
              }}
            >
              {del.isPending ? 'Deleting…' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

/* ----------------------------- Dialog ------------------------------------- */

function TemplateDialog({
  open,
  onOpenChange,
  template,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  template: DbTestRequestTemplate | null;
}) {
  const isEdit = !!template;
  const create = useCreateTestRequestTemplate();
  const update = useUpdateTestRequestTemplate();

  const form = useForm<TemplateFormValues>({
    resolver: zodResolver(templateSchema),
    defaultValues: blank(),
    mode: 'onBlur',
  });
  const { register, handleSubmit, reset, setValue, watch, formState } = form;
  const errors = formState.errors;
  const isActive = watch('is_active');

  useEffect(() => {
    if (!open) return;
    reset(template ? toValues(template) : blank());
  }, [open, template, reset]);

  const onSubmit = handleSubmit(async (data) => {
    const payload = {
      label: data.label.trim(),
      description: data.description?.trim() || null,
      scope: data.scope ?? '',
      materials: data.materials ?? '',
      is_active: data.is_active,
    };
    try {
      if (isEdit && template) {
        await update.mutateAsync({ id: template.id, ...payload });
        toast.success('Template updated');
      } else {
        await create.mutateAsync({
          ...payload,
          // Append at end. Real spacing happens on next reorder.
          sort_order: 9999,
        });
        toast.success('Template created');
      }
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to save');
    }
  });

  const busy = create.isPending || update.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="px-6 pt-6 pb-3">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-primary" />
            {isEdit ? `Edit ${template?.label}` : 'New request template'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} noValidate>
          <div className="px-6 py-4 space-y-4">
            <FormGrid cols={2}>
              <FormField label="Label" required error={errors.label?.message} span="full">
                <FormInput
                  autoFocus
                  maxLength={200}
                  {...register('label')}
                  error={!!errors.label}
                  placeholder="e.g. Automotive interior fabric"
                />
              </FormField>
              <FormField
                label="Short description"
                error={errors.description?.message}
                span="full"
                hint="Shown under the label in the picker"
              >
                <FormInput
                  maxLength={500}
                  {...register('description')}
                  error={!!errors.description}
                  placeholder="OEM trim/seating qualification suite"
                />
              </FormField>
              <FormField
                label="Scope"
                error={errors.scope?.message}
                span="full"
                hint="Standards / properties / methods. One per line."
              >
                <FormTextarea
                  rows={8}
                  maxLength={5000}
                  {...register('scope')}
                  error={!!errors.scope}
                  className="font-mono text-xs"
                />
              </FormField>
              <FormField
                label="Materials / samples"
                error={errors.materials?.message}
                span="full"
                hint="What the customer should send in"
              >
                <FormTextarea
                  rows={4}
                  maxLength={5000}
                  {...register('materials')}
                  error={!!errors.materials}
                  className="font-mono text-xs"
                />
              </FormField>
            </FormGrid>

            <div className="flex items-center justify-between rounded-md border border-border bg-muted/30 px-3 py-2.5">
              <div>
                <div className="text-sm font-medium text-foreground">Active</div>
                <div className="text-xs text-muted-foreground">
                  Inactive templates stay in the database but don't appear in the form picker.
                </div>
              </div>
              <Switch
                checked={isActive}
                onCheckedChange={(v) => setValue('is_active', v, { shouldDirty: true })}
              />
            </div>
          </div>

          <StickyFormFooter align="end">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={busy}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy}>
              <Save className="h-4 w-4" />
              {busy ? 'Saving…' : isEdit ? 'Save changes' : 'Create template'}
            </Button>
          </StickyFormFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
