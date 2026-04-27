import { useState, useMemo } from 'react';
import { useTasks, useUpdateTask, useDeleteTask, useLabTeams, type Task, type TaskStatus, type TaskPriority } from '@/hooks/useTasks';
import { PageHeader, PageBody } from '@/components/layout/PageHeader';
import { TaskFormDialog } from '@/components/tasks/TaskFormDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Plus, Search, AlertTriangle, Calendar as CalendarIcon, Clock, Sparkles, Trash2, FlaskConical, ClipboardList, Cpu, Wrench } from 'lucide-react';
import { format, isBefore, parseISO, startOfDay } from 'date-fns';
import { cn } from '@/lib/utils';
import { AskAIButton, getPlanningAIActions } from '@/components/copilot/AskAIButton';

const COLUMNS: { status: TaskStatus; label: string; tone: string }[] = [
  { status: 'todo', label: 'To do', tone: 'bg-muted/50' },
  { status: 'in_progress', label: 'In progress', tone: 'bg-primary-soft/40' },
  { status: 'blocked', label: 'Blocked', tone: 'bg-warning-soft/40' },
  { status: 'done', label: 'Done', tone: 'bg-success-soft/40' },
];

const PRIORITY_TONE: Record<TaskPriority, string> = {
  Low: 'bg-muted text-muted-foreground',
  Normal: 'bg-primary-soft text-primary',
  High: 'bg-warning-soft text-warning',
  Urgent: 'bg-destructive/15 text-destructive',
};

const TYPE_ICON: Record<string, any> = {
  lab_work: FlaskConical,
  triage: ClipboardList,
  calibration: Cpu,
  maintenance: Wrench,
  manual: Clock,
  ai_suggested: Sparkles,
};

export default function TasksPage() {
  const [search, setSearch] = useState('');
  const [teamFilter, setTeamFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [editing, setEditing] = useState<Task | null>(null);
  const [open, setOpen] = useState(false);

  const { data: teams = [] } = useLabTeams();
  const { data: tasks = [], isLoading } = useTasks({
    team_id: teamFilter !== 'all' ? teamFilter : undefined,
    type: typeFilter !== 'all' ? [typeFilter as any] : undefined,
    search: search || undefined,
  });
  const updateMut = useUpdateTask();
  const deleteMut = useDeleteTask();

  const stats = useMemo(() => {
    const today = startOfDay(new Date());
    return {
      total: tasks.length,
      open: tasks.filter(t => t.status !== 'done' && t.status !== 'cancelled').length,
      overdue: tasks.filter(t => t.due_date && t.status !== 'done' && t.status !== 'cancelled' && isBefore(parseISO(t.due_date), today)).length,
      urgent: tasks.filter(t => (t.priority === 'Urgent' || t.priority === 'High') && t.status !== 'done').length,
      ai: tasks.filter(t => t.ai_suggested).length,
    };
  }, [tasks]);

  const grouped = useMemo(() => {
    const g: Record<TaskStatus, Task[]> = { todo: [], in_progress: [], blocked: [], done: [], cancelled: [] };
    tasks.forEach(t => g[t.status]?.push(t));
    return g;
  }, [tasks]);

  return (
    <div className="flex flex-col">
      <PageHeader
        eyebrow="Lab operations"
        title="Tasks"
        description="Plan, assign, and track every job on the lab floor — from request triage to calibration."
        actions={
          <div className="flex items-center gap-2">
            <AskAIButton
              context={{ type: 'planning', id: 'tasks-board', label: 'tasks board' }}
              actions={getPlanningAIActions(format(new Date(), 'MMMM yyyy'))}
              primaryAction={{
                label: 'Plan my week',
                emoji: '📅',
                prompt: 'Build a prioritised plan for the next 7 days. Pull from open tasks, request due dates, scheduled test jobs, and equipment calibrations. Group by day, flag overloaded days, and highlight the top 3 critical items.',
              }}
            />
            <Button onClick={() => { setEditing(null); setOpen(true); }} className="gap-1.5">
              <Plus className="h-4 w-4" /> New task
            </Button>
          </div>
        }
      />

      <PageBody className="space-y-4 max-w-[1600px]">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Stat label="Total" value={stats.total} />
          <Stat label="Open" value={stats.open} tone="primary" />
          <Stat label="Overdue" value={stats.overdue} tone="destructive" />
          <Stat label="Urgent / High" value={stats.urgent} tone="warning" />
          <Stat label="AI suggested" value={stats.ai} tone="primary" icon={Sparkles} />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input className="pl-8 h-9" placeholder="Search tasks..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select value={teamFilter} onValueChange={setTeamFilter}>
            <SelectTrigger className="w-[180px] h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All teams</SelectItem>
              {teams.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[170px] h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="lab_work">Lab work</SelectItem>
              <SelectItem value="triage">Triage</SelectItem>
              <SelectItem value="calibration">Calibration</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
              <SelectItem value="manual">Manual</SelectItem>
              <SelectItem value="ai_suggested">AI suggested</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Tabs defaultValue="board">
          <TabsList>
            <TabsTrigger value="board">Board</TabsTrigger>
            <TabsTrigger value="list">List</TabsTrigger>
          </TabsList>

          <TabsContent value="board" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {COLUMNS.map(col => (
                <div key={col.status} className={cn('rounded-lg border p-2.5', col.tone)}>
                  <div className="flex items-center justify-between mb-2 px-1">
                    <span className="text-xs font-semibold uppercase tracking-wider">{col.label}</span>
                    <span className="text-xs font-mono text-muted-foreground">{grouped[col.status]?.length || 0}</span>
                  </div>
                  <div className="space-y-2 min-h-[60px]">
                    {grouped[col.status]?.map(task => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onClick={() => { setEditing(task); setOpen(true); }}
                        onAdvance={() => updateMut.mutate({ id: task.id, patch: { status: nextStatus(task.status) } })}
                      />
                    ))}
                    {(!grouped[col.status] || grouped[col.status].length === 0) && (
                      <div className="text-center text-xs text-muted-foreground py-6">Nothing here</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="list" className="mt-4">
            <Card className="overflow-hidden">
              {isLoading ? (
                <div className="p-12 text-center text-sm text-muted-foreground">Loading...</div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/40">
                      <th className="text-left px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Task</th>
                      <th className="text-left px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Type</th>
                      <th className="text-left px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Team</th>
                      <th className="text-left px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Priority</th>
                      <th className="text-left px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                      <th className="text-left px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Due</th>
                      <th className="text-left px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.map(t => {
                      const Icon = TYPE_ICON[t.type] || Clock;
                      const overdue = t.due_date && t.status !== 'done' && t.status !== 'cancelled' && isBefore(parseISO(t.due_date), startOfDay(new Date()));
                      return (
                        <tr key={t.id} className="border-b hover:bg-muted/30 cursor-pointer" onClick={() => { setEditing(t); setOpen(true); }}>
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-2">
                              {t.ai_suggested && <Sparkles className="h-3 w-3 text-primary shrink-0" />}
                              <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                              <div className="min-w-0">
                                <div className="font-medium truncate">{t.title}</div>
                                <div className="text-[11px] font-mono text-muted-foreground">{t.task_number}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-2 text-xs text-muted-foreground capitalize">{t.type.replace('_', ' ')}</td>
                          <td className="px-3 py-2">
                            {t.team ? (
                              <span className="inline-flex items-center gap-1.5 text-xs">
                                <span className="h-2 w-2 rounded-full" style={{ background: t.team.color }} />
                                {t.team.name}
                              </span>
                            ) : <span className="text-xs text-muted-foreground">—</span>}
                          </td>
                          <td className="px-3 py-2">
                            <Badge variant="outline" className={cn('text-[10px]', PRIORITY_TONE[t.priority])}>{t.priority}</Badge>
                          </td>
                          <td className="px-3 py-2 text-xs capitalize">{t.status.replace('_', ' ')}</td>
                          <td className={cn('px-3 py-2 text-xs', overdue && 'text-destructive font-medium')}>
                            {t.due_date ? format(parseISO(t.due_date), 'MMM d') : '—'}
                          </td>
                          <td className="px-3 py-2 text-right">
                            <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); if (confirm('Delete this task?')) deleteMut.mutate(t.id); }}>
                              <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                    {tasks.length === 0 && (
                      <tr><td colSpan={7} className="text-center text-sm text-muted-foreground py-12">No tasks match your filters.</td></tr>
                    )}
                  </tbody>
                </table>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </PageBody>

      <TaskFormDialog open={open} onOpenChange={setOpen} task={editing} />
    </div>
  );
}

function nextStatus(s: TaskStatus): TaskStatus {
  if (s === 'todo') return 'in_progress';
  if (s === 'in_progress') return 'done';
  if (s === 'blocked') return 'in_progress';
  return s;
}

function TaskCard({ task, onClick, onAdvance }: { task: Task; onClick: () => void; onAdvance: () => void }) {
  const Icon = TYPE_ICON[task.type] || Clock;
  const overdue = task.due_date && task.status !== 'done' && isBefore(parseISO(task.due_date), startOfDay(new Date()));
  return (
    <div onClick={onClick} className="bg-card rounded-md border shadow-sm p-2.5 cursor-pointer hover:shadow-elevated hover:border-strong transition-all">
      <div className="flex items-start gap-2 mb-1.5">
        {task.ai_suggested && <Sparkles className="h-3 w-3 text-primary shrink-0 mt-0.5" />}
        <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
        <div className="text-sm font-medium leading-snug flex-1 min-w-0">{task.title}</div>
      </div>
      <div className="flex items-center gap-1.5 flex-wrap">
        <Badge variant="outline" className={cn('text-[10px]', PRIORITY_TONE[task.priority])}>{task.priority}</Badge>
        {task.team && (
          <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: task.team.color }} /> {task.team.name}
          </span>
        )}
        {task.due_date && (
          <span className={cn('text-[10px] inline-flex items-center gap-1', overdue ? 'text-destructive font-medium' : 'text-muted-foreground')}>
            {overdue && <AlertTriangle className="h-2.5 w-2.5" />}
            {format(parseISO(task.due_date), 'MMM d')}
          </span>
        )}
      </div>
      <div className="text-[10px] font-mono text-muted-foreground mt-1.5 flex items-center justify-between">
        <span>{task.task_number}</span>
        {task.status !== 'done' && (
          <button onClick={(e) => { e.stopPropagation(); onAdvance(); }} className="text-primary hover:underline">
            Advance →
          </button>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, tone, icon: Icon }: { label: string; value: number; tone?: string; icon?: any }) {
  const colors: Record<string, string> = {
    primary: 'text-primary',
    warning: 'text-warning',
    destructive: 'text-destructive',
    success: 'text-success',
  };
  return (
    <Card className="p-3">
      <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
        {label}
        {Icon && <Icon className="h-3 w-3 text-primary" />}
      </div>
      <div className={cn('text-2xl font-bold tabular-nums', tone && colors[tone])}>{value}</div>
    </Card>
  );
}
