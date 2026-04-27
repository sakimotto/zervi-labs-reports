import { useState, useEffect } from 'react';
import { useCreateTask, useUpdateTask, useLabTeams, type Task, type TaskPriority, type TaskType, type TaskStatus } from '@/hooks/useTasks';
import { useSamples } from '@/hooks/useSamples';
import { useAllTestRequests as useTestRequests } from '@/hooks/useTestRequests';
import { useEquipment } from '@/hooks/useEquipment';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  task?: Task | null;
  defaults?: Partial<Task>;
}

const TYPES: TaskType[] = ['manual', 'lab_work', 'triage', 'calibration', 'maintenance', 'ai_suggested'];
const PRIORITIES: TaskPriority[] = ['Low', 'Normal', 'High', 'Urgent'];
const STATUSES: TaskStatus[] = ['todo', 'in_progress', 'blocked', 'done', 'cancelled'];

export function TaskFormDialog({ open, onOpenChange, task, defaults }: Props) {
  const createMut = useCreateTask();
  const updateMut = useUpdateTask();
  const { data: teams = [] } = useLabTeams();
  const { data: samples = [] } = useSamples();
  const { data: requests = [] } = useTestRequests();
  const { data: equipment = [] } = useEquipment();

  const [form, setForm] = useState<Partial<Task>>({
    title: '',
    description: '',
    type: 'manual',
    status: 'todo',
    priority: 'Normal',
  });

  useEffect(() => {
    if (open) {
      if (task) setForm(task);
      else setForm({ title: '', description: '', type: 'manual', status: 'todo', priority: 'Normal', ...defaults });
    }
  }, [open, task, defaults]);

  const handleSubmit = async () => {
    if (!form.title?.trim()) return;
    if (task) {
      await updateMut.mutateAsync({ id: task.id, patch: form });
    } else {
      await createMut.mutateAsync(form);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {form.ai_suggested && <Sparkles className="h-4 w-4 text-primary" />}
            {task ? `Edit ${task.task_number}` : 'New task'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <Label>Title *</Label>
            <Input value={form.title || ''} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="What needs to be done?" />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea value={form.description || ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Type</Label>
              <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v as TaskType }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v as TaskStatus }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{s.replace('_', ' ')}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Priority</Label>
              <Select value={form.priority} onValueChange={v => setForm(f => ({ ...f, priority: v as TaskPriority }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PRIORITIES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Assign to team</Label>
              <Select value={form.assignee_team_id || 'none'} onValueChange={v => setForm(f => ({ ...f, assignee_team_id: v === 'none' ? null : v }))}>
                <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Unassigned —</SelectItem>
                  {teams.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Due date</Label>
              <Input type="date" value={form.due_date || ''} onChange={e => setForm(f => ({ ...f, due_date: e.target.value || null }))} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Planned date</Label>
              <Input type="date" value={form.planned_date || ''} onChange={e => setForm(f => ({ ...f, planned_date: e.target.value || null }))} />
            </div>
            <div>
              <Label>Estimated hours</Label>
              <Input type="number" step="0.5" value={form.estimated_hours ?? ''} onChange={e => setForm(f => ({ ...f, estimated_hours: e.target.value ? Number(e.target.value) : null }))} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Linked sample</Label>
              <Select value={form.sample_id || 'none'} onValueChange={v => setForm(f => ({ ...f, sample_id: v === 'none' ? null : v }))}>
                <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">—</SelectItem>
                  {samples.slice(0, 100).map(s => <SelectItem key={s.id} value={s.id}>{s.sample_id}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Linked request</Label>
              <Select value={form.test_request_id || 'none'} onValueChange={v => setForm(f => ({ ...f, test_request_id: v === 'none' ? null : v }))}>
                <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">—</SelectItem>
                  {requests.map((r: any) => <SelectItem key={r.id} value={r.id}>{r.request_number}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Linked equipment</Label>
              <Select value={form.equipment_id || 'none'} onValueChange={v => setForm(f => ({ ...f, equipment_id: v === 'none' ? null : v }))}>
                <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">—</SelectItem>
                  {equipment.map((e: any) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!form.title?.trim() || createMut.isPending || updateMut.isPending}>
            {task ? 'Save' : 'Create task'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
