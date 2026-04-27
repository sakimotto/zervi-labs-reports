import { useState, useMemo } from 'react';
import { useCalendarEvents, useCreateEvent, useUpdateEvent, useDeleteEvent, type CalendarEvent, type EventKind } from '@/hooks/useCalendarEvents';
import { useLabTeams } from '@/hooks/useTasks';
import { PageHeader, PageBody } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, addMonths, subMonths,
  isSameMonth, isSameDay, parseISO, isToday,
} from 'date-fns';
import { ChevronLeft, ChevronRight, Plus, FlaskConical, Cpu, ClipboardList, Calendar as CalIcon, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { AskAIButton, getPlanningAIActions } from '@/components/copilot/AskAIButton';

const KIND_META: Record<EventKind, { label: string; color: string; icon: any }> = {
  test_job:    { label: 'Test job',     color: '#3B82F6', icon: FlaskConical },
  request_due: { label: 'Request due',  color: '#F59E0B', icon: ClipboardList },
  calibration: { label: 'Calibration',  color: '#A855F7', icon: Cpu },
  manual:      { label: 'Task / Note',  color: '#6B7280', icon: CalIcon },
  meeting:     { label: 'Meeting',      color: '#10B981', icon: CalIcon },
};

export default function PlanningPage() {
  const [cursor, setCursor] = useState(new Date());
  const [activeKinds, setActiveKinds] = useState<EventKind[]>(['test_job', 'request_due', 'calibration', 'manual', 'meeting']);
  const [editing, setEditing] = useState<CalendarEvent | null>(null);
  const [open, setOpen] = useState(false);
  const [defaultDate, setDefaultDate] = useState<Date | null>(null);

  // Pull events for visible month (with a week of padding either side)
  const range = useMemo(() => {
    const from = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 });
    const to = endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 });
    return { from, to };
  }, [cursor]);

  const { data: events = [] } = useCalendarEvents(range, activeKinds);

  const days = useMemo(() => {
    const out: Date[] = [];
    let d = range.from;
    while (d <= range.to) { out.push(d); d = addDays(d, 1); }
    return out;
  }, [range]);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    events.forEach(e => {
      const k = format(parseISO(e.starts_at), 'yyyy-MM-dd');
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(e);
    });
    return map;
  }, [events]);

  const upcoming = useMemo(() => events
    .filter(e => parseISO(e.starts_at) >= new Date(new Date().setHours(0, 0, 0, 0)))
    .slice(0, 8), [events]);

  return (
    <div className="flex flex-col">
      <PageHeader
        eyebrow={format(cursor, 'MMMM yyyy')}
        title="Planning Calendar"
        description="Live schedule of test jobs, request deadlines, calibrations, and team events."
        actions={
          <div className="flex items-center gap-2">
            <AskAIButton
              context={{ type: 'planning', id: format(cursor, 'yyyy-MM'), label: format(cursor, 'MMMM yyyy') }}
              actions={getPlanningAIActions(format(cursor, 'MMMM yyyy'))}
            />
            <Button onClick={() => { setDefaultDate(new Date()); setEditing(null); setOpen(true); }} className="gap-1.5">
              <Plus className="h-4 w-4" /> Add event
            </Button>
          </div>
        }
      />

      <PageBody className="space-y-4 max-w-[1700px]">
        {/* Filter chips */}
        <div className="flex items-center gap-2 flex-wrap">
          {(Object.keys(KIND_META) as EventKind[]).map(kind => {
            const active = activeKinds.includes(kind);
            const meta = KIND_META[kind];
            return (
              <button
                key={kind}
                onClick={() => setActiveKinds(a => a.includes(kind) ? a.filter(k => k !== kind) : [...a, kind])}
                className={cn(
                  'inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md border transition-colors',
                  active ? 'bg-card shadow-sm' : 'bg-muted/40 text-muted-foreground'
                )}
              >
                <span className="h-2 w-2 rounded-full" style={{ background: meta.color }} />
                {meta.label}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">
          <Card className="overflow-hidden">
            {/* Calendar header */}
            <div className="flex items-center justify-between px-4 py-3 border-b bg-card-muted">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => setCursor(c => subMonths(c, 1))}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="text-sm font-semibold w-32 text-center">{format(cursor, 'MMMM yyyy')}</div>
                <Button variant="ghost" size="icon" onClick={() => setCursor(c => addMonths(c, 1))}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <Button variant="outline" size="sm" onClick={() => setCursor(new Date())}>Today</Button>
            </div>

            {/* Weekday headers */}
            <div className="grid grid-cols-7 border-b text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
                <div key={d} className="px-2 py-2 text-center">{d}</div>
              ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7">
              {days.map(d => {
                const dayKey = format(d, 'yyyy-MM-dd');
                const dayEvents = eventsByDay.get(dayKey) || [];
                const inMonth = isSameMonth(d, cursor);
                return (
                  <div
                    key={dayKey}
                    className={cn(
                      'min-h-[110px] border-r border-b p-1.5 group cursor-pointer hover:bg-primary-soft/20 transition-colors',
                      !inMonth && 'bg-muted/30',
                    )}
                    onClick={() => { setDefaultDate(d); setEditing(null); setOpen(true); }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={cn(
                        'text-xs font-medium tabular-nums',
                        !inMonth && 'text-muted-foreground/60',
                        isToday(d) && 'h-5 w-5 rounded-full bg-primary text-primary-foreground inline-flex items-center justify-center text-[10px]',
                      )}>{format(d, 'd')}</span>
                      {dayEvents.length > 0 && <span className="text-[9px] text-muted-foreground tabular-nums">{dayEvents.length}</span>}
                    </div>
                    <div className="space-y-1">
                      {dayEvents.slice(0, 3).map(ev => {
                        const meta = KIND_META[ev.kind];
                        return (
                          <button
                            key={ev.id}
                            onClick={(e) => { e.stopPropagation(); setEditing(ev); setOpen(true); }}
                            className="w-full text-left text-[10px] px-1.5 py-0.5 rounded truncate font-medium hover:opacity-80"
                            style={{ background: `${meta.color}20`, color: meta.color }}
                            title={ev.title}
                          >
                            {ev.title}
                          </button>
                        );
                      })}
                      {dayEvents.length > 3 && (
                        <div className="text-[10px] text-muted-foreground px-1.5">+{dayEvents.length - 3} more</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Upcoming sidebar */}
          <Card className="p-4 h-fit">
            <div className="text-sm font-semibold mb-3">Upcoming</div>
            <div className="space-y-2">
              {upcoming.map(ev => {
                const meta = KIND_META[ev.kind];
                const Icon = meta.icon;
                return (
                  <button
                    key={ev.id}
                    onClick={() => { setEditing(ev); setOpen(true); }}
                    className="w-full text-left flex items-start gap-2 p-2 rounded-md hover:bg-muted/60 transition-colors"
                  >
                    <Icon className="h-3.5 w-3.5 mt-0.5 shrink-0" style={{ color: meta.color }} />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-medium truncate">{ev.title}</div>
                      <div className="text-[10px] text-muted-foreground">{format(parseISO(ev.starts_at), 'EEE, MMM d')}</div>
                    </div>
                    {ev.source === 'auto' && <Badge variant="outline" className="text-[9px]">auto</Badge>}
                  </button>
                );
              })}
              {upcoming.length === 0 && (
                <div className="text-xs text-muted-foreground py-6 text-center">No upcoming events</div>
              )}
            </div>
            <div className="mt-4 pt-3 border-t">
              <Link to="/tasks" className="text-xs text-primary hover:underline">Open Tasks board →</Link>
            </div>
          </Card>
        </div>
      </PageBody>

      <EventFormDialog
        open={open}
        onOpenChange={setOpen}
        event={editing}
        defaultDate={defaultDate}
      />
    </div>
  );
}

function EventFormDialog({ open, onOpenChange, event, defaultDate }: {
  open: boolean; onOpenChange: (v: boolean) => void; event: CalendarEvent | null; defaultDate: Date | null;
}) {
  const createMut = useCreateEvent();
  const updateMut = useUpdateEvent();
  const deleteMut = useDeleteEvent();
  const { data: teams = [] } = useLabTeams();

  const [form, setForm] = useState<Partial<CalendarEvent>>({});

  useMemo(() => {
    if (open) {
      if (event) setForm(event);
      else setForm({
        title: '',
        kind: 'manual',
        all_day: true,
        starts_at: (defaultDate || new Date()).toISOString(),
      });
    }
  }, [open, event, defaultDate]);

  const handleSave = async () => {
    if (!form.title?.trim() || !form.starts_at) return;
    if (event) await updateMut.mutateAsync({ id: event.id, patch: form });
    else await createMut.mutateAsync(form);
    onOpenChange(false);
  };

  const dateValue = form.starts_at ? format(parseISO(form.starts_at), 'yyyy-MM-dd') : '';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{event ? 'Edit event' : 'New event'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div>
            <Label>Title *</Label>
            <Input value={form.title || ''} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Type</Label>
              <Select value={form.kind} onValueChange={v => setForm(f => ({ ...f, kind: v as EventKind }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(KIND_META) as EventKind[]).map(k => (
                    <SelectItem key={k} value={k}>{KIND_META[k].label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Date</Label>
              <Input
                type="date"
                value={dateValue}
                onChange={e => {
                  if (!e.target.value) return;
                  const d = new Date(e.target.value + 'T09:00:00');
                  setForm(f => ({ ...f, starts_at: d.toISOString() }));
                }}
              />
            </div>
          </div>
          <div>
            <Label>Owner team</Label>
            <Select value={form.owner_team_id || 'none'} onValueChange={v => setForm(f => ({ ...f, owner_team_id: v === 'none' ? null : v }))}>
              <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— None —</SelectItem>
                {teams.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Description</Label>
            <Textarea rows={2} value={form.description || ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
        </div>
        <DialogFooter className="justify-between">
          <div>
            {event && (
              <Button variant="outline" size="sm" onClick={async () => {
                if (confirm('Delete this event?')) {
                  await deleteMut.mutateAsync(event.id);
                  onOpenChange(false);
                }
              }}>
                <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Delete
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSave}>{event ? 'Save' : 'Create'}</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
