import { useState, useEffect, useMemo } from 'react';
import {
  useCreateTask,
  useUpdateTask,
  useDeleteTask,
  useLabTeams,
  useTaskComments,
  useAddTaskComment,
  type Task,
  type TaskPriority,
  type TaskType,
  type TaskStatus,
} from '@/hooks/useTasks';
import { useSamples } from '@/hooks/useSamples';
import { useAllTestRequests as useTestRequests } from '@/hooks/useTestRequests';
import { useEquipment } from '@/hooks/useEquipment';
import { Sheet, SheetContent, SheetPortal, SheetOverlay } from '@/components/ui/sheet';
import * as SheetPrimitive from '@radix-ui/react-dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Sparkles,
  X,
  Trash2,
  Calendar as CalendarIcon,
  Clock,
  Users,
  Flag,
  Tag,
  Link2,
  FlaskConical,
  ClipboardList,
  Cpu,
  Wrench,
  MessageSquare,
  Activity,
  CheckCircle2,
  Circle,
  CircleDot,
  Ban,
  ChevronRight,
  Copy,
  ExternalLink,
} from 'lucide-react';
import { AskAIButton, getTaskAIActions } from '@/components/copilot/AskAIButton';
import { Paperclip } from 'lucide-react';
import { TaskAttachmentsSection } from './TaskAttachmentsSection';
import { useTaskAttachments } from '@/hooks/useTaskAttachments';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  task?: Task | null;
  defaults?: Partial<Task>;
}

const TYPES: { value: TaskType; label: string; icon: any }[] = [
  { value: 'manual', label: 'Manual', icon: Clock },
  { value: 'lab_work', label: 'Lab work', icon: FlaskConical },
  { value: 'triage', label: 'Triage', icon: ClipboardList },
  { value: 'calibration', label: 'Calibration', icon: Cpu },
  { value: 'maintenance', label: 'Maintenance', icon: Wrench },
  { value: 'ai_suggested', label: 'AI suggested', icon: Sparkles },
];

const STATUSES: { value: TaskStatus; label: string; icon: any; tone: string }[] = [
  { value: 'todo', label: 'To do', icon: Circle, tone: 'text-muted-foreground' },
  { value: 'in_progress', label: 'In progress', icon: CircleDot, tone: 'text-primary' },
  { value: 'blocked', label: 'Blocked', icon: Ban, tone: 'text-warning' },
  { value: 'done', label: 'Done', icon: CheckCircle2, tone: 'text-success' },
  { value: 'cancelled', label: 'Cancelled', icon: X, tone: 'text-muted-foreground' },
];

const PRIORITIES: { value: TaskPriority; label: string; tone: string; dot: string }[] = [
  { value: 'Low', label: 'Low', tone: 'text-muted-foreground', dot: 'bg-muted-foreground/40' },
  { value: 'Normal', label: 'Normal', tone: 'text-primary', dot: 'bg-primary' },
  { value: 'High', label: 'High', tone: 'text-warning', dot: 'bg-warning' },
  { value: 'Urgent', label: 'Urgent', tone: 'text-destructive', dot: 'bg-destructive' },
];

export function TaskFormDialog({ open, onOpenChange, task, defaults }: Props) {
  const createMut = useCreateTask();
  const updateMut = useUpdateTask();
  const deleteMut = useDeleteTask();
  const { data: teams = [] } = useLabTeams();
  const { data: samples = [] } = useSamples();
  const { data: requests = [] } = useTestRequests();
  const { data: equipment = [] } = useEquipment();
  const { data: comments = [] } = useTaskComments(task?.id);
  const addComment = useAddTaskComment();

  const [form, setForm] = useState<Partial<Task>>({
    title: '',
    description: '',
    type: 'manual',
    status: 'todo',
    priority: 'Normal',
  });
  const [commentText, setCommentText] = useState('');
  const [activeTab, setActiveTab] = useState<'comments' | 'attachments' | 'activity'>('comments');
  const { data: attachments = [] } = useTaskAttachments(task?.id);

  useEffect(() => {
    if (open) {
      if (task) setForm(task);
      else
        setForm({
          title: '',
          description: '',
          type: 'manual',
          status: 'todo',
          priority: 'Normal',
          ...defaults,
        });
      setCommentText('');
      setActiveTab('comments');
    }
  }, [open, task, defaults]);

  // Auto-save on update (debounced via blur), instant create on first save
  const handleSubmit = async () => {
    if (!form.title?.trim()) return;
    if (task) {
      await updateMut.mutateAsync({ id: task.id, patch: form });
      toast.success('Task saved');
    } else {
      await createMut.mutateAsync(form);
    }
    onOpenChange(false);
  };

  const handleDelete = async () => {
    if (!task) return;
    if (!confirm(`Delete ${task.task_number}?`)) return;
    await deleteMut.mutateAsync(task.id);
    onOpenChange(false);
  };

  const handleQuickUpdate = async (patch: Partial<Task>) => {
    setForm(f => ({ ...f, ...patch }));
    if (task) {
      await updateMut.mutateAsync({ id: task.id, patch });
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim() || !task) return;
    await addComment.mutateAsync({ task_id: task.id, body: commentText.trim() });
    setCommentText('');
  };

  const currentStatus = STATUSES.find(s => s.value === form.status) || STATUSES[0];
  const currentPriority = PRIORITIES.find(p => p.value === form.priority) || PRIORITIES[1];
  const currentType = TYPES.find(t => t.value === form.type) || TYPES[0];
  const team = teams.find(t => t.id === form.assignee_team_id);

  const linkedSample = samples.find(s => s.id === form.sample_id);
  const linkedRequest = requests.find((r: any) => r.id === form.test_request_id);
  const linkedEquipment = equipment.find((e: any) => e.id === form.equipment_id);

  const activity = useMemo(() => {
    if (!task) return [];
    const items: { ts: string; label: string; icon: any }[] = [
      { ts: task.created_at, label: 'Task created', icon: Sparkles },
    ];
    if (task.completed_at) items.push({ ts: task.completed_at, label: 'Marked complete', icon: CheckCircle2 });
    if (task.updated_at && task.updated_at !== task.created_at)
      items.push({ ts: task.updated_at, label: 'Last updated', icon: Activity });
    return items.sort((a, b) => (a.ts < b.ts ? 1 : -1));
  }, [task]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetPortal>
        <SheetOverlay className="bg-foreground/20 backdrop-blur-sm" />
        <SheetPrimitive.Content
          className={cn(
            'fixed inset-y-0 right-0 z-50 flex h-full w-full max-w-[1100px] flex-col bg-background shadow-2xl',
            'border-l data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right',
            'data-[state=open]:duration-300 data-[state=closed]:duration-200'
          )}
        >
          {/* TOP BAR */}
          <div className="flex items-center justify-between gap-2 px-5 h-12 border-b bg-muted/30 shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <button
                onClick={() => onOpenChange(false)}
                className="h-7 w-7 inline-flex items-center justify-center rounded-md hover:bg-muted transition-colors"
                title="Close"
              >
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>
              <div className="text-xs font-mono text-muted-foreground">
                {task ? task.task_number : 'New task'}
              </div>
              {task?.ai_suggested && (
                <Badge variant="outline" className="h-5 text-[10px] gap-1 bg-primary-soft/50 border-primary/20 text-primary">
                  <Sparkles className="h-2.5 w-2.5" /> AI
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-1">
              {task && (
                <>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(task.task_number);
                      toast.success('Task ID copied');
                    }}
                    className="h-7 px-2 inline-flex items-center gap-1.5 rounded-md hover:bg-muted text-xs text-muted-foreground transition-colors"
                  >
                    <Copy className="h-3 w-3" /> Copy ID
                  </button>
                  <AskAIButton
                    context={{ type: 'task', id: task.id, label: task.title }}
                    actions={getTaskAIActions(task.title)}
                  />
                  <button
                    onClick={handleDelete}
                    className="h-7 w-7 inline-flex items-center justify-center rounded-md hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </>
              )}
              <Separator orientation="vertical" className="h-5 mx-1" />
              <SheetPrimitive.Close className="h-7 w-7 inline-flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground transition-colors">
                <X className="h-4 w-4" />
              </SheetPrimitive.Close>
            </div>
          </div>

          {/* BODY: two columns */}
          <div className="flex-1 flex min-h-0">
            {/* MAIN CONTENT */}
            <div className="flex-1 overflow-y-auto">
              <div className="max-w-3xl mx-auto px-10 py-8 space-y-6">
                {/* Title */}
                <input
                  autoFocus={!task}
                  value={form.title || ''}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  onBlur={() => task && form.title?.trim() && updateMut.mutate({ id: task.id, patch: { title: form.title } })}
                  placeholder="Task title"
                  className="w-full text-3xl font-bold bg-transparent border-0 outline-none placeholder:text-muted-foreground/40 leading-tight"
                />

                {/* Quick property strip */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <PropertyChip
                    icon={currentStatus.icon}
                    label={currentStatus.label}
                    tone={currentStatus.tone}
                    onClick={() => {}}
                  >
                    <Select value={form.status} onValueChange={v => handleQuickUpdate({ status: v as TaskStatus })}>
                      <SelectTrigger className="absolute inset-0 opacity-0 cursor-pointer">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUSES.map(s => {
                          const Icon = s.icon;
                          return (
                            <SelectItem key={s.value} value={s.value}>
                              <span className="inline-flex items-center gap-2">
                                <Icon className={cn('h-3.5 w-3.5', s.tone)} />
                                {s.label}
                              </span>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </PropertyChip>

                  <PropertyChip
                    icon={Flag}
                    label={currentPriority.label}
                    tone={currentPriority.tone}
                  >
                    <Select value={form.priority} onValueChange={v => handleQuickUpdate({ priority: v as TaskPriority })}>
                      <SelectTrigger className="absolute inset-0 opacity-0 cursor-pointer"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {PRIORITIES.map(p => (
                          <SelectItem key={p.value} value={p.value}>
                            <span className="inline-flex items-center gap-2">
                              <span className={cn('h-2 w-2 rounded-full', p.dot)} />
                              {p.label}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </PropertyChip>

                  <PropertyChip icon={currentType.icon} label={currentType.label}>
                    <Select value={form.type} onValueChange={v => handleQuickUpdate({ type: v as TaskType })}>
                      <SelectTrigger className="absolute inset-0 opacity-0 cursor-pointer"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {TYPES.map(t => {
                          const Icon = t.icon;
                          return (
                            <SelectItem key={t.value} value={t.value}>
                              <span className="inline-flex items-center gap-2">
                                <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                                {t.label}
                              </span>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </PropertyChip>

                  {form.due_date && (
                    <span className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-xs bg-muted/60 text-foreground">
                      <CalendarIcon className="h-3 w-3" />
                      Due {format(parseISO(form.due_date), 'MMM d')}
                    </span>
                  )}
                </div>

                {/* AI rationale callout */}
                {form.ai_rationale && (
                  <div className="rounded-lg border border-primary/20 bg-primary-soft/30 px-4 py-3">
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-primary mb-1">
                      <Sparkles className="h-3 w-3" /> AI rationale
                    </div>
                    <div className="text-sm text-foreground/80 leading-relaxed">{form.ai_rationale}</div>
                  </div>
                )}

                {/* Description */}
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">
                    Description
                  </label>
                  <Textarea
                    value={form.description || ''}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    onBlur={() => task && updateMut.mutate({ id: task.id, patch: { description: form.description } })}
                    rows={5}
                    placeholder="Add more detail, context, acceptance criteria..."
                    className="resize-none border-muted/60 focus-visible:border-primary/40 bg-muted/20"
                  />
                </div>

                {/* Linked resources */}
                {(linkedSample || linkedRequest || linkedEquipment) && (
                  <div>
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">
                      Linked records
                    </label>
                    <div className="space-y-1.5">
                      {linkedSample && (
                        <LinkedRow
                          icon={FlaskConical}
                          label={linkedSample.sample_id}
                          sublabel={linkedSample.product_name}
                          href={`/samples`}
                        />
                      )}
                      {linkedRequest && (
                        <LinkedRow
                          icon={ClipboardList}
                          label={(linkedRequest as any).request_number}
                          sublabel="Customer test request"
                          href={`/customers`}
                        />
                      )}
                      {linkedEquipment && (
                        <LinkedRow
                          icon={Cpu}
                          label={(linkedEquipment as any).name}
                          sublabel="Equipment"
                          href={`/equipment/${(linkedEquipment as any).id}`}
                        />
                      )}
                    </div>
                  </div>
                )}

                {task && (
                  <>
                    <Separator />

                    {/* Tabs: Comments / Activity */}
                    <div>
                      <div className="flex items-center gap-1 border-b mb-4">
                        <TabBtn
                          active={activeTab === 'comments'}
                          onClick={() => setActiveTab('comments')}
                          icon={MessageSquare}
                          label="Comments"
                          count={comments.length}
                        />
                        <TabBtn
                          active={activeTab === 'attachments'}
                          onClick={() => setActiveTab('attachments')}
                          icon={Paperclip}
                          label="Attachments"
                          count={attachments.length}
                        />
                        <TabBtn
                          active={activeTab === 'activity'}
                          onClick={() => setActiveTab('activity')}
                          icon={Activity}
                          label="Activity"
                          count={activity.length}
                        />
                      </div>

                      {activeTab === 'attachments' && (
                        <TaskAttachmentsSection taskId={task.id} />
                      )}


                      {activeTab === 'comments' && (
                        <div className="space-y-3">
                          {comments.length === 0 && (
                            <div className="text-sm text-muted-foreground italic py-2">
                              No comments yet. Start the discussion.
                            </div>
                          )}
                          {comments.map((c: any) => (
                            <div key={c.id} className="flex gap-3">
                              <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold shrink-0">
                                {(c.author_name || 'U').slice(0, 1).toUpperCase()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-baseline gap-2 mb-0.5">
                                  <span className="text-sm font-medium">{c.author_name || 'Unknown'}</span>
                                  <span className="text-[11px] text-muted-foreground">
                                    {formatDistanceToNow(parseISO(c.created_at), { addSuffix: true })}
                                  </span>
                                </div>
                                <div className="text-sm text-foreground/90 whitespace-pre-wrap">{c.body}</div>
                              </div>
                            </div>
                          ))}

                          <div className="flex gap-3 pt-2">
                            <div className="h-8 w-8 rounded-full bg-muted shrink-0" />
                            <div className="flex-1">
                              <Textarea
                                value={commentText}
                                onChange={e => setCommentText(e.target.value)}
                                placeholder="Add a comment..."
                                rows={2}
                                className="resize-none text-sm"
                                onKeyDown={e => {
                                  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                                    e.preventDefault();
                                    handleAddComment();
                                  }
                                }}
                              />
                              <div className="flex items-center justify-between mt-1.5">
                                <span className="text-[11px] text-muted-foreground">⌘ + Enter to send</span>
                                <Button
                                  size="sm"
                                  onClick={handleAddComment}
                                  disabled={!commentText.trim() || addComment.isPending}
                                >
                                  Comment
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {activeTab === 'activity' && (
                        <div className="space-y-3">
                          {activity.map((a, i) => {
                            const Icon = a.icon;
                            return (
                              <div key={i} className="flex items-center gap-3 text-sm">
                                <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                                  <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                                </div>
                                <span className="text-foreground/80">{a.label}</span>
                                <span className="text-[11px] text-muted-foreground ml-auto">
                                  {formatDistanceToNow(parseISO(a.ts), { addSuffix: true })}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* PROPERTIES SIDEBAR */}
            <aside className="w-[320px] border-l bg-muted/20 overflow-y-auto shrink-0">
              <div className="p-5 space-y-5">
                <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Properties
                </div>

                <PropertyRow icon={CircleDot} label="Status">
                  <Select value={form.status} onValueChange={v => handleQuickUpdate({ status: v as TaskStatus })}>
                    <SelectTrigger className="h-8 border-transparent hover:border-border bg-transparent hover:bg-background"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUSES.map(s => {
                        const Icon = s.icon;
                        return (
                          <SelectItem key={s.value} value={s.value}>
                            <span className="inline-flex items-center gap-2">
                              <Icon className={cn('h-3.5 w-3.5', s.tone)} />
                              {s.label}
                            </span>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </PropertyRow>

                <PropertyRow icon={Flag} label="Priority">
                  <Select value={form.priority} onValueChange={v => handleQuickUpdate({ priority: v as TaskPriority })}>
                    <SelectTrigger className="h-8 border-transparent hover:border-border bg-transparent hover:bg-background"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PRIORITIES.map(p => (
                        <SelectItem key={p.value} value={p.value}>
                          <span className="inline-flex items-center gap-2">
                            <span className={cn('h-2 w-2 rounded-full', p.dot)} />
                            {p.label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </PropertyRow>

                <PropertyRow icon={Tag} label="Type">
                  <Select value={form.type} onValueChange={v => handleQuickUpdate({ type: v as TaskType })}>
                    <SelectTrigger className="h-8 border-transparent hover:border-border bg-transparent hover:bg-background"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TYPES.map(t => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </PropertyRow>

                <PropertyRow icon={Users} label="Team">
                  <Select
                    value={form.assignee_team_id || 'none'}
                    onValueChange={v => handleQuickUpdate({ assignee_team_id: v === 'none' ? null : v })}
                  >
                    <SelectTrigger className="h-8 border-transparent hover:border-border bg-transparent hover:bg-background">
                      {team ? (
                        <span className="inline-flex items-center gap-1.5 text-sm">
                          <span className="h-2 w-2 rounded-full" style={{ background: team.color }} />
                          {team.name}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">Unassigned</span>
                      )}
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">— Unassigned —</SelectItem>
                      {teams.map(t => (
                        <SelectItem key={t.id} value={t.id}>
                          <span className="inline-flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full" style={{ background: t.color }} />
                            {t.name}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </PropertyRow>

                <PropertyRow icon={CalendarIcon} label="Due date">
                  <Input
                    type="date"
                    value={form.due_date || ''}
                    onChange={e => handleQuickUpdate({ due_date: e.target.value || null })}
                    className="h-8 border-transparent hover:border-border bg-transparent hover:bg-background"
                  />
                </PropertyRow>

                <PropertyRow icon={CalendarIcon} label="Planned">
                  <Input
                    type="date"
                    value={form.planned_date || ''}
                    onChange={e => handleQuickUpdate({ planned_date: e.target.value || null })}
                    className="h-8 border-transparent hover:border-border bg-transparent hover:bg-background"
                  />
                </PropertyRow>

                <PropertyRow icon={Clock} label="Estimate (h)">
                  <Input
                    type="number"
                    step="0.5"
                    value={form.estimated_hours ?? ''}
                    onChange={e =>
                      setForm(f => ({ ...f, estimated_hours: e.target.value ? Number(e.target.value) : null }))
                    }
                    onBlur={() =>
                      task && updateMut.mutate({ id: task.id, patch: { estimated_hours: form.estimated_hours } })
                    }
                    placeholder="—"
                    className="h-8 border-transparent hover:border-border bg-transparent hover:bg-background"
                  />
                </PropertyRow>

                <Separator />

                <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Links
                </div>

                <PropertyRow icon={FlaskConical} label="Sample">
                  <Select
                    value={form.sample_id || 'none'}
                    onValueChange={v => handleQuickUpdate({ sample_id: v === 'none' ? null : v })}
                  >
                    <SelectTrigger className="h-8 border-transparent hover:border-border bg-transparent hover:bg-background">
                      <SelectValue placeholder="—" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">—</SelectItem>
                      {samples.slice(0, 100).map(s => (
                        <SelectItem key={s.id} value={s.id}>{s.sample_id}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </PropertyRow>

                <PropertyRow icon={ClipboardList} label="Request">
                  <Select
                    value={form.test_request_id || 'none'}
                    onValueChange={v => handleQuickUpdate({ test_request_id: v === 'none' ? null : v })}
                  >
                    <SelectTrigger className="h-8 border-transparent hover:border-border bg-transparent hover:bg-background">
                      <SelectValue placeholder="—" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">—</SelectItem>
                      {requests.map((r: any) => (
                        <SelectItem key={r.id} value={r.id}>{r.request_number}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </PropertyRow>

                <PropertyRow icon={Cpu} label="Equipment">
                  <Select
                    value={form.equipment_id || 'none'}
                    onValueChange={v => handleQuickUpdate({ equipment_id: v === 'none' ? null : v })}
                  >
                    <SelectTrigger className="h-8 border-transparent hover:border-border bg-transparent hover:bg-background">
                      <SelectValue placeholder="—" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">—</SelectItem>
                      {equipment.map((e: any) => (
                        <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </PropertyRow>

                {task && (
                  <>
                    <Separator />
                    <div className="space-y-1 text-[11px] text-muted-foreground">
                      <div>Created {formatDistanceToNow(parseISO(task.created_at), { addSuffix: true })}</div>
                      <div>Updated {formatDistanceToNow(parseISO(task.updated_at), { addSuffix: true })}</div>
                      {task.completed_at && (
                        <div className="text-success">
                          Completed {formatDistanceToNow(parseISO(task.completed_at), { addSuffix: true })}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </aside>
          </div>

          {/* FOOTER (only for new tasks) */}
          {!task && (
            <div className="flex justify-end gap-2 px-5 h-14 border-t bg-muted/30 items-center shrink-0">
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button
                onClick={handleSubmit}
                disabled={!form.title?.trim() || createMut.isPending}
              >
                Create task
              </Button>
            </div>
          )}
        </SheetPrimitive.Content>
      </SheetPortal>
    </Sheet>
  );
}

/* --- Subcomponents --- */

function PropertyChip({
  icon: Icon,
  label,
  tone,
  children,
}: {
  icon: any;
  label: string;
  tone?: string;
  children?: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <div className="relative inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-xs font-medium bg-muted/60 hover:bg-muted transition-colors cursor-pointer">
      <Icon className={cn('h-3 w-3', tone || 'text-muted-foreground')} />
      <span className={cn(tone)}>{label}</span>
      {children}
    </div>
  );
}

function PropertyRow({
  icon: Icon,
  label,
  children,
}: {
  icon: any;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[110px_1fr] items-center gap-2">
      <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

function TabBtn({
  active,
  onClick,
  icon: Icon,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  icon: any;
  label: string;
  count?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 px-3 h-9 text-sm border-b-2 -mb-px transition-colors',
        active
          ? 'border-primary text-foreground font-medium'
          : 'border-transparent text-muted-foreground hover:text-foreground'
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
      {count != null && count > 0 && (
        <span className="text-[10px] font-mono bg-muted px-1.5 rounded">{count}</span>
      )}
    </button>
  );
}

function LinkedRow({
  icon: Icon,
  label,
  sublabel,
  href,
}: {
  icon: any;
  label: string;
  sublabel: string;
  href: string;
}) {
  return (
    <a
      href={href}
      className="flex items-center gap-3 px-3 py-2 rounded-md border border-border/60 bg-background hover:border-primary/40 hover:bg-primary-soft/20 transition-all group"
    >
      <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center shrink-0">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium truncate">{label}</div>
        <div className="text-[11px] text-muted-foreground truncate">{sublabel}</div>
      </div>
      <ExternalLink className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
    </a>
  );
}
