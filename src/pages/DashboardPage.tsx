import { useSamples } from '@/hooks/useSamples';
import { useSuppliers } from '@/hooks/useSuppliers';
import { useCustomers } from '@/hooks/useCustomers';
import { useTestItems } from '@/hooks/useTestData';
import { useSOPs } from '@/hooks/useSOPs';
import { useAllTestRequests } from '@/hooks/useTestRequests';
import { useTasks } from '@/hooks/useTasks';
import { useCalendarEvents } from '@/hooks/useCalendarEvents';
import {
  FlaskConical, TestTubes, Truck, Users, BookOpen, AlertTriangle, Clock, CheckCircle2,
  Loader2, ArrowUpRight, ClipboardList, PackageOpen, CalendarRange, CheckSquare, Sparkles,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { StatusBadge } from '@/components/lms/StatusBadge';
import { JudgmentDot } from '@/components/lms/JudgmentDot';
import { PageHeader, PageBody } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/card';
import { format, parseISO, isBefore, startOfDay, addDays } from 'date-fns';

export default function DashboardPage() {
  const { data: samples = [], isLoading: samplesLoading } = useSamples();
  const { data: suppliers = [] } = useSuppliers();
  const { data: customers = [] } = useCustomers();
  const { data: testItems = [] } = useTestItems();
  const { data: sops = [] } = useSOPs();
  const { data: requests = [] } = useAllTestRequests();
  const { data: openTasks = [] } = useTasks({ status: ['todo', 'in_progress', 'blocked'] });
  const today = startOfDay(new Date());
  const weekAhead = addDays(today, 7);
  const { data: weekEvents = [] } = useCalendarEvents({ from: today, to: weekAhead });

  const pending = samples.filter(s => s.status === 'Pending');
  const inProgress = samples.filter(s => s.status === 'In Progress');
  const completed = samples.filter(s => s.status === 'Completed');
  const urgent = samples.filter(s => s.priority === 'Urgent' || s.priority === 'Critical');

  const newRequests = requests.filter((r: any) => r.status === 'Requested' || r.status === 'Quoted').slice(0, 6);
  const awaitingSamples = samples.filter(s => !s.received_date && s.status === 'Pending').slice(0, 6);
  const plannedSoon = samples
    .filter(s => s.test_date && s.status !== 'Completed')
    .sort((a, b) => (a.test_date! < b.test_date! ? -1 : 1))
    .slice(0, 6);
  const myUrgentTasks = openTasks
    .filter(t => t.priority === 'Urgent' || t.priority === 'High' || (t.due_date && isBefore(parseISO(t.due_date), addDays(today, 2))))
    .slice(0, 6);

  if (samplesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const todayStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div className="flex flex-col">
      <PageHeader
        eyebrow={todayStr}
        title="Lab Manager Dashboard"
        description="Live snapshot of incoming work, open tasks, planned tests, and urgent escalations."
        actions={
          <div className="flex items-center gap-2">
            <Link to="/tasks" className="text-xs px-3 py-2 rounded-md bg-muted hover:bg-card border inline-flex items-center gap-1.5">
              <CheckSquare className="h-3.5 w-3.5" /> Open Tasks
            </Link>
            <Link to="/planning" className="text-xs px-3 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-1.5">
              <CalendarRange className="h-3.5 w-3.5" /> Planning
            </Link>
          </div>
        }
      />

      <PageBody className="space-y-5 max-w-[1700px]">
        {/* Top stats — manager view */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          <StatCard icon={ClipboardList} label="New Requests" value={newRequests.length} variant="warning" href="/customers" />
          <StatCard icon={PackageOpen} label="Awaiting Samples" value={awaitingSamples.length} variant="warning" href="/tests" />
          <StatCard icon={CalendarRange} label="Planned (7d)" value={weekEvents.length} variant="primary" href="/planning" />
          <StatCard icon={CheckSquare} label="Open Tasks" value={openTasks.length} variant="primary" href="/tasks" />
          <StatCard icon={Clock} label="In Progress" value={inProgress.length} href="/tests" />
          <StatCard icon={CheckCircle2} label="Completed" value={completed.length} variant="success" href="/tests" />
          <StatCard icon={AlertTriangle} label="Urgent Samples" value={urgent.length} variant="destructive" href="/tests" />
        </div>

        {/* Manager work board: 4 columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <WorkColumn
            title="Incoming Requests"
            icon={ClipboardList}
            tone="warning"
            href="/customers"
            empty="No new requests"
          >
            {newRequests.map((r: any) => (
              <Link key={r.id} to={`/customers/${r.customer_id}`} className="block p-2 rounded hover:bg-muted/60 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-medium">{r.request_number}</span>
                  <StatusBadge status={r.priority || 'Normal'} type="priority" />
                </div>
                <div className="text-xs text-muted-foreground truncate">{r.description || 'New request'}</div>
                {r.due_date && (
                  <div className="text-[10px] text-muted-foreground mt-0.5">Due {format(parseISO(r.due_date), 'MMM d')}</div>
                )}
              </Link>
            ))}
          </WorkColumn>

          <WorkColumn
            title="Awaiting Samples"
            icon={PackageOpen}
            tone="warning"
            href="/tests"
            empty="All samples received"
          >
            {awaitingSamples.map(s => (
              <Link key={s.id} to={`/tests/${s.id}`} className="block p-2 rounded hover:bg-muted/60 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-medium">{s.sample_id}</span>
                  <StatusBadge status={s.priority || 'Normal'} type="priority" />
                </div>
                <div className="text-xs text-muted-foreground truncate">{s.product_name}</div>
              </Link>
            ))}
          </WorkColumn>

          <WorkColumn
            title="Planned Tests"
            icon={CalendarRange}
            tone="primary"
            href="/planning"
            empty="No planned tests"
          >
            {plannedSoon.map(s => (
              <Link key={s.id} to={`/tests/${s.id}`} className="block p-2 rounded hover:bg-muted/60 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-medium">{s.sample_id}</span>
                  <span className="text-[10px] text-muted-foreground">{s.test_date && format(parseISO(s.test_date), 'MMM d')}</span>
                </div>
                <div className="text-xs text-muted-foreground truncate">{s.product_name}</div>
              </Link>
            ))}
          </WorkColumn>

          <WorkColumn
            title="Priority Tasks"
            icon={CheckSquare}
            tone="destructive"
            href="/tasks"
            empty="Nothing urgent"
          >
            {myUrgentTasks.map(t => {
              const overdue = t.due_date && isBefore(parseISO(t.due_date), today);
              return (
                <Link key={t.id} to="/tasks" className="block p-2 rounded hover:bg-muted/60 text-sm">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-medium truncate flex items-center gap-1">
                      {t.ai_suggested && <Sparkles className="h-3 w-3 text-primary shrink-0" />}
                      {t.title}
                    </span>
                    <StatusBadge status={t.priority} type="priority" />
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="text-[10px] text-muted-foreground font-mono">{t.task_number}</span>
                    {t.due_date && (
                      <span className={`text-[10px] ${overdue ? 'text-destructive font-semibold' : 'text-muted-foreground'}`}>
                        {format(parseISO(t.due_date), 'MMM d')}
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </WorkColumn>
        </div>

        {/* Bottom: status breakdown + quick links */}
        <div className="grid lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2 p-4 bg-gradient-card hover-lift">
            <div className="text-sm font-semibold mb-3">This Week's Schedule</div>
            <div className="space-y-1 max-h-72 overflow-y-auto">
              {weekEvents.slice(0, 12).map(ev => (
                <div key={ev.id} className="flex items-center gap-3 p-2 rounded-md hover-tint transition-colors text-sm">
                  <span className="h-2 w-2 rounded-full shrink-0 ring-2 ring-background" style={{ background: ev.color || 'hsl(var(--muted-foreground))' }} />
                  <span className="text-xs font-mono text-muted-foreground w-16">{format(parseISO(ev.starts_at), 'EEE d')}</span>
                  <span className="flex-1 truncate">{ev.title}</span>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{ev.kind.replace('_', ' ')}</span>
                </div>
              ))}
              {weekEvents.length === 0 && (
                <div className="text-center text-sm text-muted-foreground py-8">Nothing scheduled this week.</div>
              )}
            </div>
          </Card>

          <div className="space-y-4">
            <Card className="p-4 bg-gradient-card hover-lift">
              <div className="text-sm font-semibold mb-3">Quick Access</div>
              <div className="space-y-1">
                <QuickLink icon={TestTubes} label="Test Methods" count={testItems.length} href="/test-methods" />
                <QuickLink icon={BookOpen} label="SOPs" count={sops?.length || 0} href="/sops" />
                <QuickLink icon={Truck} label="Suppliers" count={suppliers.length} href="/suppliers" />
                <QuickLink icon={Users} label="Customers" count={customers.length} href="/customers" />
              </div>
            </Card>

            <Card className="p-4 bg-gradient-card hover-lift">
              <div className="text-sm font-semibold mb-3">Sample Status</div>
              <div className="space-y-3">
                <BarItem label="Pending" value={pending.length} total={samples.length} className="bg-warning" />
                <BarItem label="In Progress" value={inProgress.length} total={samples.length} className="bg-primary" />
                <BarItem label="Completed" value={completed.length} total={samples.length} className="bg-success" />
              </div>
            </Card>
          </div>
        </div>
      </PageBody>
    </div>
  );
}

function WorkColumn({ title, icon: Icon, tone, href, empty, children }: {
  title: string; icon: any; tone: string; href: string; empty: string; children: React.ReactNode;
}) {
  const toneMap: Record<string, string> = {
    primary: 'text-primary',
    warning: 'text-warning',
    destructive: 'text-destructive',
    success: 'text-success',
  };
  const accentMap: Record<string, string> = {
    primary: 'accent-top-primary',
    warning: 'accent-top-warning',
    destructive: 'accent-top-destructive',
    success: 'accent-top-success',
  };
  const items = Array.isArray(children) ? children : [children];
  return (
    <Card className={`p-3 flex flex-col bg-gradient-card hover-lift ${accentMap[tone] || ''}`}>
      <div className="flex items-center justify-between mb-2 px-1 pt-1">
        <div className={`flex items-center gap-1.5 text-sm font-semibold ${toneMap[tone] || ''}`}>
          <Icon className="h-3.5 w-3.5" />
          {title}
        </div>
        <Link to={href} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
          <ArrowUpRight className="h-3 w-3" />
        </Link>
      </div>
      <div className="space-y-1 flex-1">
        {items.length > 0 && items.some(Boolean) ? children : (
          <div className="text-xs text-muted-foreground text-center py-6">{empty}</div>
        )}
      </div>
    </Card>
  );
}

function StatCard({ icon: Icon, label, value, variant, href }: {
  icon: any; label: string; value: number; variant?: string; href: string;
}) {
  const colorMap: Record<string, string> = {
    primary: 'text-primary',
    success: 'text-success',
    warning: 'text-warning',
    destructive: 'text-destructive',
  };
  const ringMap: Record<string, string> = {
    primary: 'bg-primary-soft text-primary ring-1 ring-primary/20',
    success: 'bg-success-soft text-success ring-1 ring-success/20',
    warning: 'bg-warning-soft text-warning ring-1 ring-warning/25',
    destructive: 'bg-destructive/10 text-destructive ring-1 ring-destructive/20',
  };
  const accentMap: Record<string, string> = {
    primary: 'accent-top-primary',
    success: 'accent-top-success',
    warning: 'accent-top-warning',
    destructive: 'accent-top-destructive',
  };
  return (
    <Link
      to={href}
      className={`group bg-gradient-card rounded-lg shadow-card hover-lift border border-border/80 p-3 relative overflow-hidden ${variant ? accentMap[variant] || '' : ''}`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className={`h-7 w-7 rounded-md flex items-center justify-center transition-transform group-hover:scale-105 ${variant ? ringMap[variant] : 'bg-muted text-muted-foreground ring-1 ring-border'}`}>
          <Icon className="h-3.5 w-3.5" />
        </div>
        <ArrowUpRight className="h-3 w-3 text-muted-foreground/0 group-hover:text-muted-foreground transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </div>
      <div className={`text-xl font-bold tabular-nums leading-none ${variant ? colorMap[variant] || '' : ''}`}>{value}</div>
      <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mt-1">{label}</div>
    </Link>
  );
}

function QuickLink({ icon: Icon, label, count, href }: { icon: any; label: string; count: number; href: string }) {
  return (
    <Link to={href} className="flex items-center gap-2 p-2 -mx-1 rounded-md hover:bg-muted/60 transition-colors text-sm group">
      <Icon className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
      <span className="flex-1">{label}</span>
      <span className="text-xs font-mono text-muted-foreground tabular-nums">{count}</span>
    </Link>
  );
}

function BarItem({ label, value, total, className }: { label: string; value: number; total: number; className: string }) {
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1.5">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono font-medium tabular-nums">{value}</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${className}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
