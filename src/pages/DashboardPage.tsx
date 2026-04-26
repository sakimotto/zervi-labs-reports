import { useSamples } from '@/hooks/useSamples';
import { useSuppliers } from '@/hooks/useSuppliers';
import { useCustomers } from '@/hooks/useCustomers';
import { useTestItems } from '@/hooks/useTestData';
import { useSOPs } from '@/hooks/useSOPs';
import { FlaskConical, TestTubes, Truck, Users, BookOpen, AlertTriangle, Clock, CheckCircle2, Loader2, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { StatusBadge } from '@/components/lms/StatusBadge';
import { JudgmentDot } from '@/components/lms/JudgmentDot';
import { PageHeader, PageBody } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/card';

export default function DashboardPage() {
  const { data: samples = [], isLoading: samplesLoading } = useSamples();
  const { data: suppliers = [] } = useSuppliers();
  const { data: customers = [] } = useCustomers();
  const { data: testItems = [] } = useTestItems();
  const { data: sops = [] } = useSOPs();

  const pending = samples.filter(s => s.status === 'Pending');
  const inProgress = samples.filter(s => s.status === 'In Progress');
  const completed = samples.filter(s => s.status === 'Completed');
  const urgent = samples.filter(s => s.priority === 'Urgent' || s.priority === 'Critical');
  const recent = samples.slice(0, 8);

  if (samplesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div className="flex flex-col">
      <PageHeader
        eyebrow={today}
        title="Laboratory Dashboard"
        description="Live snapshot of sample workflow, urgent items, and lab activity across Zervi Asia."
      />

      <PageBody className="space-y-6 max-w-[1600px]">
        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard icon={FlaskConical} label="Total Tests" value={samples.length} href="/tests" />
          <StatCard icon={Clock} label="Pending" value={pending.length} variant="warning" href="/tests" />
          <StatCard icon={TestTubes} label="In Progress" value={inProgress.length} variant="primary" href="/tests" />
          <StatCard icon={CheckCircle2} label="Completed" value={completed.length} variant="success" href="/tests" />
          <StatCard icon={Truck} label="Suppliers" value={suppliers.length} href="/suppliers" />
          <StatCard icon={Users} label="Customers" value={customers.length} href="/customers" />
        </div>

        {/* Urgent alerts */}
        {urgent.length > 0 && (
          <Card className="bg-warning-soft border-warning/30 p-4 shadow-card">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <span className="text-sm font-semibold text-warning">Urgent / Critical Samples</span>
              <span className="text-xs text-muted-foreground">· {urgent.length} item{urgent.length > 1 ? 's' : ''}</span>
            </div>
            <div className="space-y-1">
              {urgent.map(s => (
                <Link
                  key={s.id}
                  to={`/tests/${s.id}`}
                  className="flex items-center gap-3 text-sm p-2 rounded hover:bg-card transition-colors"
                >
                  <span className="font-mono text-xs font-medium">{s.sample_id}</span>
                  <span className="text-muted-foreground flex-1 truncate">{s.product_name}</span>
                  <StatusBadge status={s.priority || 'Normal'} type="priority" />
                  <StatusBadge status={s.status || 'Pending'} />
                </Link>
              ))}
            </div>
          </Card>
        )}

        <div className="grid lg:grid-cols-3 gap-4">
          {/* Recent samples */}
          <Card className="lg:col-span-2 p-0 overflow-hidden shadow-card">
            <div className="flex items-center justify-between px-4 py-3 border-b bg-card-muted">
              <div>
                <div className="text-sm font-semibold">Recent Samples</div>
                <div className="text-xs text-muted-foreground">Latest intakes across the lab</div>
              </div>
              <Link to="/tests" className="text-xs text-primary hover:underline flex items-center gap-1">
                View all <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="divide-y divide-border/60">
              {recent.map(s => (
                <Link
                  key={s.id}
                  to={`/tests/${s.id}`}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-primary-soft/40 transition-colors text-sm"
                >
                  <span className="font-mono text-xs font-medium w-36 text-muted-foreground">{s.sample_id}</span>
                  <span className="flex-1 truncate text-foreground">{s.product_name}</span>
                  <span className="text-xs text-muted-foreground">{s.oem_brand || '—'}</span>
                  <StatusBadge status={s.status || 'Pending'} />
                  <JudgmentDot judgment={s.overall_judgment || 'Pending'} />
                </Link>
              ))}
              {recent.length === 0 && (
                <div className="px-4 py-12 text-center text-sm text-muted-foreground">No samples yet</div>
              )}
            </div>
          </Card>

          {/* Quick stats sidebar */}
          <div className="space-y-4">
            <Card className="p-4 shadow-card">
              <div className="text-sm font-semibold mb-3">Quick Access</div>
              <div className="space-y-1">
                <QuickLink icon={TestTubes} label="Test Methods" count={testItems.length} href="/test-methods" />
                <QuickLink icon={BookOpen} label="SOPs" count={sops?.length || 0} href="/sops" />
                <QuickLink icon={Truck} label="Suppliers" count={suppliers.length} href="/suppliers" />
                <QuickLink icon={Users} label="Customers" count={customers.length} href="/customers" />
              </div>
            </Card>

            <Card className="p-4 shadow-card">
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

function StatCard({ icon: Icon, label, value, variant, href }: {
  icon: any; label: string; value: number; variant?: string; href: string;
}) {
  const colorMap: Record<string, string> = {
    primary: 'text-primary',
    success: 'text-success',
    warning: 'text-warning',
  };
  const ringMap: Record<string, string> = {
    primary: 'bg-primary-soft text-primary',
    success: 'bg-success-soft text-success',
    warning: 'bg-warning-soft text-warning',
  };
  return (
    <Link
      to={href}
      className="group bg-card rounded-lg shadow-card hover:shadow-elevated hover:border-strong border border-border transition-all p-4 relative overflow-hidden"
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`h-8 w-8 rounded-md flex items-center justify-center ${variant ? ringMap[variant] : 'bg-muted text-muted-foreground'}`}>
          <Icon className="h-4 w-4" />
        </div>
        <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/0 group-hover:text-muted-foreground transition-colors" />
      </div>
      <div className={`text-2xl font-bold tabular-nums leading-none ${variant ? colorMap[variant] || '' : ''}`}>{value}</div>
      <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mt-1.5">{label}</div>
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
