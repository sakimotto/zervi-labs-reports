import { useState, useMemo, useEffect } from 'react';
import { useTestPrograms, useCreateTestProgram, useUpdateTestProgram, useDeleteTestProgram, useUpdateTestProgramItems } from '@/hooks/useTestPrograms';
import { useTestItems } from '@/hooks/useTestData';
import { Plus, Trash2, Pencil, Loader2, ChevronDown, ChevronRight, Check, GripVertical } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { PageHeader } from '@/components/layout/PageHeader';

export default function TestProgramsPage() {
  const { data: programs = [], isLoading } = useTestPrograms();
  const { data: allTestItems = [] } = useTestItems();
  const createProgram = useCreateTestProgram();
  const updateProgram = useUpdateTestProgram();
  const deleteProgram = useDeleteTestProgram();
  const updateItems = useUpdateTestProgramItems();
  const [editingMeta, setEditingMeta] = useState<any | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<any | null>(null);

  const [showNew, setShowNew] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingItemsId, setEditingItemsId] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());

  const [newForm, setNewForm] = useState({
    name: '', description: '', material_type: '',
    report_title: '', report_header_notes: '', report_footer_notes: '',
  });
  const [newSelectedItems, setNewSelectedItems] = useState<Set<number>>(new Set());

  const categorizedItems = useMemo(() => {
    const cats = new Map<string, typeof allTestItems>();
    allTestItems.forEach(item => {
      const list = cats.get(item.category) || [];
      list.push(item);
      cats.set(item.category, list);
    });
    return cats;
  }, [allTestItems]);

  const handleCreate = async () => {
    if (!newForm.name.trim()) { toast.error('Name is required'); return; }
    try {
      await createProgram.mutateAsync({
        program: newForm,
        testItemIds: Array.from(newSelectedItems),
      });
      toast.success('Test program created');
      setShowNew(false);
      setNewForm({ name: '', description: '', material_type: '', report_title: '', report_header_notes: '', report_footer_notes: '' });
      setNewSelectedItems(new Set());
    } catch (err: any) { toast.error(err.message); }
  };

  const handleDelete = (program: any) => setConfirmDelete(program);

  const handleSaveMeta = async (id: string, updates: any) => {
    try {
      await updateProgram.mutateAsync({ id, updates });
      toast.success('Program updated');
      setEditingMeta(null);
    } catch (err: any) { toast.error(err.message); }
  };

  const startEditItems = (program: typeof programs[0]) => {
    const existing = new Set((program.test_program_items || []).map((i: any) => i.test_item_id as number));
    setSelectedItems(existing);
    setEditingItemsId(program.id);
  };

  const saveEditItems = async () => {
    if (!editingItemsId) return;
    try {
      await updateItems.mutateAsync({ programId: editingItemsId, testItemIds: Array.from(selectedItems) });
      toast.success('Test methods updated');
      setEditingItemsId(null);
    } catch (err: any) { toast.error(err.message); }
  };

  return (
    <div className="flex flex-col">
      <PageHeader
        eyebrow="Lab Resources"
        title="Test Programs"
        description="Reusable templates defining which tests run + report layout for a material category."
        actions={
          <button onClick={() => setShowNew(true)} className="h-8 px-3 flex items-center gap-1.5 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors shadow-card">
            <Plus className="h-3.5 w-3.5" /> New Program
          </button>
        }
      />

      <div className="px-6 py-5 space-y-4 max-w-5xl">

      {/* New Program Form */}
      {showNew && (
        <div className="bg-card rounded-lg shadow-card p-4 border-2 border-primary/20 space-y-3">
          <div className="text-sm font-semibold">Create Test Program</div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Program Name *" value={newForm.name} onChange={v => setNewForm(p => ({ ...p, name: v }))} />
            <FormField label="Material Type" value={newForm.material_type} onChange={v => setNewForm(p => ({ ...p, material_type: v }))} placeholder="e.g. Poly-Cotton Canvas" />
            <FormField label="Description" value={newForm.description} onChange={v => setNewForm(p => ({ ...p, description: v }))} />
            <FormField label="Report Title" value={newForm.report_title} onChange={v => setNewForm(p => ({ ...p, report_title: v }))} placeholder="e.g. Canvas Tent Material Test Report" />
          </div>

          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mt-2">Select Test Methods</div>
          <TestMethodChecklist categories={categorizedItems} selected={newSelectedItems} onToggle={id => {
            setNewSelectedItems(prev => {
              const next = new Set(prev);
              next.has(id) ? next.delete(id) : next.add(id);
              return next;
            });
          }} />

          <div className="flex gap-2 pt-2">
            <button onClick={handleCreate} disabled={createProgram.isPending} className="h-8 px-3 text-xs font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50">
              {createProgram.isPending ? 'Creating...' : 'Create Program'}
            </button>
            <button onClick={() => setShowNew(false)} className="h-8 px-3 text-xs font-medium text-muted-foreground hover:bg-muted rounded-md">Cancel</button>
          </div>
        </div>
      )}

      {/* Program List */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
      ) : programs.length === 0 ? (
        <div className="bg-card rounded-lg shadow-card p-8 text-center text-muted-foreground text-sm">
          No test programs yet. Create one to define which tests apply to your materials.
        </div>
      ) : (
        <div className="space-y-2">
          {programs.map(program => {
            const items = (program.test_program_items || []) as any[];
            const isExpanded = expandedId === program.id;
            const isEditing = editingItemsId === program.id;

            return (
              <div key={program.id} className="bg-card rounded-lg shadow-card overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : program.id)}>
                  <div className="flex items-center gap-3">
                    {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                    <div>
                      <div className="text-sm font-semibold">{program.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {program.material_type && <span className="mr-3">{program.material_type}</span>}
                        {items.length} test methods
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                    <button onClick={() => isEditing ? saveEditItems() : startEditItems(program)}
                      className="h-7 px-2 text-xs font-medium text-muted-foreground hover:bg-muted rounded transition-colors">
                      {isEditing ? '💾 Save' : '✏️ Edit Methods'}
                    </button>
                    <button onClick={() => setEditingMeta(program)} className="p-1 text-muted-foreground hover:bg-muted rounded" title="Edit metadata">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => handleDelete(program)} className="p-1 text-destructive hover:bg-destructive/10 rounded">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-4 pb-3 border-t">
                    {program.description && <p className="text-xs text-muted-foreground mt-2 mb-2">{program.description}</p>}

                    {isEditing ? (
                      <div className="mt-2">
                        <TestMethodChecklist categories={categorizedItems} selected={selectedItems} onToggle={id => {
                          setSelectedItems(prev => {
                            const next = new Set(prev);
                            next.has(id) ? next.delete(id) : next.add(id);
                            return next;
                          });
                        }} />
                      </div>
                    ) : (
                      <div className="mt-2 space-y-1">
                        {items.length === 0 ? (
                          <p className="text-xs text-muted-foreground italic">No test methods assigned</p>
                        ) : (
                          <div className="grid grid-cols-2 gap-1">
                            {items.map((item: any) => (
                              <div key={item.id} className="flex items-center gap-2 text-xs py-1 px-2 bg-muted/50 rounded">
                                <GripVertical className="h-3 w-3 text-muted-foreground/50" />
                                <span className="font-medium">{item.test_items?.name}</span>
                                <span className="text-muted-foreground">({item.test_items?.category})</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <EditProgramMetaDialog
        program={editingMeta}
        onClose={() => setEditingMeta(null)}
        onSave={handleSaveMeta}
        isPending={updateProgram.isPending}
      />

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete test program?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <span className="font-medium">{confirmDelete?.name}</span> and its method assignments.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={async () => {
              if (!confirmDelete) return;
              try {
                await deleteProgram.mutateAsync(confirmDelete.id);
                toast.success('Deleted');
              } catch (err: any) { toast.error(err.message); }
              setConfirmDelete(null);
            }}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
    </div>
  );
}

function TestMethodChecklist({ categories, selected, onToggle }: {
  categories: Map<string, any[]>;
  selected: Set<number>;
  onToggle: (id: number) => void;
}) {
  return (
    <div className="max-h-64 overflow-y-auto border rounded-md p-2 bg-background space-y-2">
      {Array.from(categories.entries()).map(([cat, items]) => (
        <div key={cat}>
          <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">{cat}</div>
          <div className="grid grid-cols-2 gap-1">
            {items.map(item => (
              <label key={item.id} className={`flex items-center gap-2 text-xs py-1.5 px-2 rounded cursor-pointer transition-colors ${selected.has(item.id) ? 'bg-primary/10 text-primary' : 'hover:bg-muted'}`}>
                <input type="checkbox" checked={selected.has(item.id)} onChange={() => onToggle(item.id)} className="rounded" />
                <span className="font-medium">{item.name}</span>
                {item.unit && <span className="text-muted-foreground">({item.unit})</span>}
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function FormField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">{label}</label>
      <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full h-9 px-3 text-sm bg-background border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50" />
    </div>
  );
}

function EditProgramMetaDialog({ program, onClose, onSave, isPending }: {
  program: any | null; onClose: () => void; onSave: (id: string, updates: any) => void; isPending: boolean;
}) {
  const [form, setForm] = useState({ name: '', description: '', material_type: '', report_title: '', report_header_notes: '', report_footer_notes: '' });
  useEffect(() => {
    if (program) setForm({
      name: program.name || '',
      description: program.description || '',
      material_type: program.material_type || '',
      report_title: program.report_title || '',
      report_header_notes: program.report_header_notes || '',
      report_footer_notes: program.report_footer_notes || '',
    });
  }, [program]);
  if (!program) return null;
  return (
    <Dialog open={!!program} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Program Metadata</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Name *" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} />
          <FormField label="Material Type" value={form.material_type} onChange={v => setForm(f => ({ ...f, material_type: v }))} />
          <FormField label="Description" value={form.description} onChange={v => setForm(f => ({ ...f, description: v }))} />
          <FormField label="Report Title" value={form.report_title} onChange={v => setForm(f => ({ ...f, report_title: v }))} />
          <FormField label="Report Header" value={form.report_header_notes} onChange={v => setForm(f => ({ ...f, report_header_notes: v }))} />
          <FormField label="Report Footer" value={form.report_footer_notes} onChange={v => setForm(f => ({ ...f, report_footer_notes: v }))} />
        </div>
        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button
            size="sm"
            onClick={() => onSave(program.id, {
              name: form.name,
              description: form.description || null,
              material_type: form.material_type || null,
              report_title: form.report_title || null,
              report_header_notes: form.report_header_notes || null,
              report_footer_notes: form.report_footer_notes || null,
            })}
            disabled={!form.name.trim() || isPending}
          >
            {isPending ? 'Saving…' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
