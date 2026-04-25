import { useState, useEffect } from 'react';
import { useSOPs, useCreateSOP, useUpdateSOP, useDeleteSOP, useSOPVersions, useCreateSOPVersion } from '@/hooks/useSOPs';
import { useTestItems } from '@/hooks/useTestData';
import { Search, Plus, Trash2, Pencil, Eye, Clock, FileText, Loader2, ChevronDown, ChevronRight } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

const STATUS_OPTIONS = ['Draft', 'Under Review', 'Approved', 'Archived'];

export default function SOPsPage() {
  const { data: sops = [], isLoading } = useSOPs();
  const { data: testItems = [] } = useTestItems();
  const createSOP = useCreateSOP();
  const deleteSOP = useDeleteSOP();
  const [search, setSearch] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [newForm, setNewForm] = useState({
    title: '', test_item_id: '' as string, content: '', equipment_settings: '',
    safety_notes: '', prepared_by: '',
  });

  const filtered = (sops as any[]).filter((s: any) =>
    s.title.toLowerCase().includes(search.toLowerCase()) ||
    (s.test_items?.name || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async () => {
    if (!newForm.title.trim()) { toast.error('Title is required'); return; }
    try {
      await createSOP.mutateAsync({
        sop: {
          title: newForm.title,
          test_item_id: newForm.test_item_id ? parseInt(newForm.test_item_id) : null,
        },
        version: {
          version_number: 1,
          content: newForm.content,
          equipment_settings: newForm.equipment_settings || null,
          safety_notes: newForm.safety_notes || null,
          prepared_by: newForm.prepared_by || null,
        },
      });
      setShowNew(false);
      setNewForm({ title: '', test_item_id: '', content: '', equipment_settings: '', safety_notes: '', prepared_by: '' });
      toast.success('SOP created');
    } catch (e: any) { toast.error(e.message); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this SOP and all versions?')) return;
    try {
      await deleteSOP.mutateAsync(id);
      toast.success('SOP deleted');
    } catch (e: any) { toast.error(e.message); }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'Draft': return 'bg-muted text-muted-foreground';
      case 'Under Review': return 'bg-warning/10 text-warning';
      case 'Approved': return 'bg-success/10 text-success';
      case 'Archived': return 'bg-muted text-muted-foreground opacity-60';
      default: return 'bg-muted';
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Standard Operating Procedures</h1>
          <p className="text-sm text-muted-foreground">{sops.length} SOPs — Testing machine setup & procedures</p>
        </div>
        <button onClick={() => setShowNew(true)}
          className="h-9 px-3 flex items-center gap-1.5 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
          <Plus className="h-3.5 w-3.5" /> New SOP
        </button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <input type="text" placeholder="Search SOPs..." value={search} onChange={e => setSearch(e.target.value)}
          className="w-full h-9 pl-8 pr-3 text-sm bg-card border rounded-md shadow-card focus:outline-none focus:ring-2 focus:ring-primary/50" />
      </div>

      {showNew && (
        <div className="bg-card rounded-lg shadow-card p-4 border-2 border-primary/20">
          <div className="text-sm font-semibold mb-3">New SOP</div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <Field label="Title *" value={newForm.title} onChange={v => setNewForm(p => ({ ...p, title: v }))} />
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Linked Test Method</label>
              <select value={newForm.test_item_id} onChange={e => setNewForm(p => ({ ...p, test_item_id: e.target.value }))}
                className="w-full h-9 px-3 text-sm bg-background border rounded-md">
                <option value="">None</option>
                {testItems.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <Field label="Prepared By" value={newForm.prepared_by} onChange={v => setNewForm(p => ({ ...p, prepared_by: v }))} />
            <Field label="Equipment Settings" value={newForm.equipment_settings} onChange={v => setNewForm(p => ({ ...p, equipment_settings: v }))} />
          </div>
          <div className="mb-3">
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Procedure Content</label>
            <textarea value={newForm.content} onChange={e => setNewForm(p => ({ ...p, content: e.target.value }))}
              rows={6} className="w-full px-3 py-2 text-sm bg-background border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50" />
          </div>
          <div className="mb-3">
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Safety Notes</label>
            <textarea value={newForm.safety_notes} onChange={e => setNewForm(p => ({ ...p, safety_notes: e.target.value }))}
              rows={3} className="w-full px-3 py-2 text-sm bg-background border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50" />
          </div>
          <div className="flex gap-2">
            <button onClick={handleCreate} disabled={createSOP.isPending} className="h-8 px-3 text-xs font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50">
              {createSOP.isPending ? 'Creating...' : 'Create SOP'}
            </button>
            <button onClick={() => setShowNew(false)} className="h-8 px-3 text-xs font-medium text-muted-foreground hover:bg-muted rounded-md">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : filtered.length === 0 ? (
          <div className="bg-card rounded-lg shadow-card px-4 py-8 text-center text-muted-foreground text-sm">No SOPs found</div>
        ) : (
          filtered.map((sop: any) => (
            <SOPCard
              key={sop.id}
              sop={sop}
              expanded={expandedId === sop.id}
              onToggle={() => setExpandedId(expandedId === sop.id ? null : sop.id)}
              onDelete={() => handleDelete(sop.id)}
              statusColor={statusColor}
            />
          ))
        )}
      </div>
    </div>
  );
}

function SOPCard({ sop, expanded, onToggle, onDelete, statusColor }: {
  sop: any; expanded: boolean; onToggle: () => void; onDelete: () => void; statusColor: (s: string) => string;
}) {
  const { data: versions = [], isLoading } = useSOPVersions(expanded ? sop.id : null);
  const createVersion = useCreateSOPVersion();
  const [showNewVersion, setShowNewVersion] = useState(false);
  const [versionForm, setVersionForm] = useState({ content: '', equipment_settings: '', safety_notes: '', prepared_by: '', change_notes: '' });

  const handleNewVersion = async () => {
    try {
      await createVersion.mutateAsync({
        sop_id: sop.id,
        version_number: sop.current_version + 1,
        content: versionForm.content,
        equipment_settings: versionForm.equipment_settings || null,
        safety_notes: versionForm.safety_notes || null,
        prepared_by: versionForm.prepared_by || null,
        change_notes: versionForm.change_notes || null,
      });
      setShowNewVersion(false);
      setVersionForm({ content: '', equipment_settings: '', safety_notes: '', prepared_by: '', change_notes: '' });
      toast.success('New version created');
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="bg-card rounded-lg shadow-card overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/30 transition-colors" onClick={onToggle}>
        {expanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
        <FileText className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium flex-1">{sop.title}</span>
        {sop.test_items?.name && <span className="text-xs text-muted-foreground">{sop.test_items.name}</span>}
        <span className={`text-xs px-1.5 py-0.5 rounded-sm font-medium ${statusColor(sop.status)}`}>{sop.status}</span>
        <span className="text-xs text-muted-foreground">v{sop.current_version}</span>
        <button onClick={e => { e.stopPropagation(); onDelete(); }} className="p-1 text-destructive hover:bg-destructive/10 rounded">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {expanded && (
        <div className="border-t px-4 py-3 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Version History</span>
            <button onClick={() => setShowNewVersion(true)} className="h-7 px-2 flex items-center gap-1 text-xs font-medium bg-primary text-primary-foreground rounded hover:bg-primary/90">
              <Plus className="h-3 w-3" /> New Version
            </button>
          </div>

          {showNewVersion && (
            <div className="bg-muted/30 rounded-md p-3 space-y-2">
              <div className="text-xs font-semibold">Version {sop.current_version + 1}</div>
              <textarea value={versionForm.content} onChange={e => setVersionForm(p => ({ ...p, content: e.target.value }))}
                placeholder="Procedure content..." rows={4} className="w-full px-3 py-2 text-sm bg-background border rounded-md" />
              <div className="grid grid-cols-2 gap-2">
                <input value={versionForm.equipment_settings} onChange={e => setVersionForm(p => ({ ...p, equipment_settings: e.target.value }))}
                  placeholder="Equipment settings" className="h-8 px-2 text-sm bg-background border rounded-sm" />
                <input value={versionForm.prepared_by} onChange={e => setVersionForm(p => ({ ...p, prepared_by: e.target.value }))}
                  placeholder="Prepared by" className="h-8 px-2 text-sm bg-background border rounded-sm" />
              </div>
              <textarea value={versionForm.change_notes} onChange={e => setVersionForm(p => ({ ...p, change_notes: e.target.value }))}
                placeholder="Change notes..." rows={2} className="w-full px-3 py-2 text-sm bg-background border rounded-md" />
              <div className="flex gap-2">
                <button onClick={handleNewVersion} disabled={createVersion.isPending} className="h-7 px-2 text-xs font-medium bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50">Save Version</button>
                <button onClick={() => setShowNewVersion(false)} className="h-7 px-2 text-xs text-muted-foreground hover:bg-muted rounded">Cancel</button>
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="flex justify-center py-4"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>
          ) : versions.length === 0 ? (
            <div className="text-sm text-muted-foreground py-2">No versions yet</div>
          ) : (
            <div className="space-y-2">
              {versions.map(v => (
                <div key={v.id} className="bg-muted/20 rounded-md p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs font-semibold">Version {v.version_number}</span>
                    {v.prepared_by && <span className="text-xs text-muted-foreground">by {v.prepared_by}</span>}
                    <span className="text-xs text-muted-foreground ml-auto">{new Date(v.created_at).toLocaleDateString()}</span>
                  </div>
                  {v.change_notes && <div className="text-xs text-muted-foreground mb-2 italic">{v.change_notes}</div>}
                  <div className="text-sm whitespace-pre-wrap">{v.content}</div>
                  {v.equipment_settings && (
                    <div className="mt-2">
                      <span className="text-xs font-semibold text-muted-foreground">Equipment: </span>
                      <span className="text-sm">{v.equipment_settings}</span>
                    </div>
                  )}
                  {v.safety_notes && (
                    <div className="mt-1">
                      <span className="text-xs font-semibold text-muted-foreground">Safety: </span>
                      <span className="text-sm">{v.safety_notes}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">{label}</label>
      <input type="text" value={value} onChange={e => onChange(e.target.value)}
        className="w-full h-9 px-3 text-sm bg-background border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50" />
    </div>
  );
}
