import { useSamples } from '@/hooks/useSamples';
import { useSuppliers } from '@/hooks/useSuppliers';
import { useCustomers } from '@/hooks/useCustomers';
import { useTestItems } from '@/hooks/useTestData';
import { useSOPs } from '@/hooks/useSOPs';
import { FlaskConical, TestTubes, Truck, Users, BookOpen, AlertTriangle, Clock, CheckCircle2, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { StatusBadge } from '@/components/lms/StatusBadge';
import { JudgmentDot } from '@/components/lms/JudgmentDot';

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

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Zervi Asia Laboratory Management System</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <StatCard icon={FlaskConical} label="Total Tests" value={samples.length} href="/tests" />
        <StatCard icon={Clock} label="Pending" value={pending.length} variant="warning" href="/tests" />
        <StatCard icon={TestTubes} label="In Progress" value={inProgress.length} variant="primary" href="/tests" />
        <StatCard icon={CheckCircle2} label="Completed" value={completed.length} variant="success" href="/tests" />
        <StatCard icon={Truck} label="Suppliers" value={suppliers.length} href="/suppliers" />
        <StatCard icon={Users} label="Customers" value={customers.length} href="/customers" />
      </div>

      {/* Urgent alerts */}
      {urgent.length > 0 && (
        <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-warning" />
            <span className="text-sm font-semibold">Urgent / Critical Samples</span>
          </div>
          <div className="space-y-1">
            {urgent.map(s => (
                <Link
                key={s.id}
                to={`/tests/${s.id}`}
                className="flex items-center gap-3 text-sm p-2 rounded hover:bg-warning/10 transition-colors"
              >
                <span className="font-mono text-xs font-medium">{s.sample_id}</span>
                <span className="text-muted-foreground">{s.product_name}</span>
                <StatusBadge status={s.priority || 'Normal'} type="priority" />
                <StatusBadge status={s.status || 'Pending'} />
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent samples */}
        <div className="lg:col-span-2 bg-card rounded-lg shadow-card">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <span className="text-sm font-semibold">Recent Samples</span>
            <Link to="/tests" className="text-xs text-primary hover:underline">View all →</Link>
          </div>
          <div className="divide-y">
            {recent.map(s => (
              <Link
                key={s.id}
                to={`/samples/${s.id}`}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/30 transition-colors text-sm"
              >
                <span className="font-mono text-xs font-medium w-36">{s.sample_id}</span>
                <span className="flex-1 truncate">{s.product_name}</span>
                <span className="text-xs text-muted-foreground">{s.oem_brand || '—'}</span>
                <StatusBadge status={s.status || 'Pending'} />
                <JudgmentDot judgment={s.overall_judgment || 'Pending'} />
              </Link>
            ))}
            {recent.length === 0 && (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">No samples yet</div>
            )}
          </div>
        </div>

        {/* Quick stats sidebar */}
        <div className="space-y-4">
          <div className="bg-card rounded-lg shadow-card p-4">
            <div className="text-sm font-semibold mb-3">Quick Access</div>
            <div className="space-y-2">
              <QuickLink icon={TestTubes} label="Test Methods" count={testItems.length} href="/test-methods" />
              <QuickLink icon={BookOpen} label="SOPs" count={sops?.length || 0} href="/sops" />
              <QuickLink icon={Truck} label="Suppliers" count={suppliers.length} href="/suppliers" />
              <QuickLink icon={Users} label="Customers" count={customers.length} href="/customers" />
            </div>
          </div>

          <div className="bg-card rounded-lg shadow-card p-4">
            <div className="text-sm font-semibold mb-3">Sample Status Breakdown</div>
            <div className="space-y-2">
              <BarItem label="Pending" value={pending.length} total={samples.length} className="bg-warning" />
              <BarItem label="In Progress" value={inProgress.length} total={samples.length} className="bg-primary" />
              <BarItem label="Completed" value={completed.length} total={samples.length} className="bg-success" />
            </div>
          </div>
        </div>
      </div>
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
  return (
    <Link to={href} className="bg-card rounded-lg shadow-card p-3 hover:shadow-elevated transition-shadow">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      </div>
      <div className={`text-2xl font-bold tabular-nums ${variant ? colorMap[variant] || '' : ''}`}>{value}</div>
    </Link>
  );
}

function QuickLink({ icon: Icon, label, count, href }: { icon: any; label: string; count: number; href: string }) {
  return (
    <Link to={href} className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/50 transition-colors text-sm">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <span className="flex-1">{label}</span>
      <span className="text-xs font-mono text-muted-foreground">{count}</span>
    </Link>
  );
}

function BarItem({ label, value, total, className }: { label: string; value: number; total: number; className: string }) {
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono font-medium">{value}</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${className}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
