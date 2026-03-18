import { useSamples } from '@/hooks/useSamples';
import { SampleRow } from './SampleRow';
import { FlaskConical, Plus, Search, Loader2 } from 'lucide-react';
import { useState } from 'react';

interface DashboardProps {
  onSelectSample: (id: string) => void;
  onNewSample: () => void;
}

export function Dashboard({ onSelectSample, onNewSample }: DashboardProps) {
  const [filter, setFilter] = useState('');
  const { data: samples = [], isLoading } = useSamples();

  const pending = samples.filter(s => s.status === 'Pending').length;
  const inProgress = samples.filter(s => s.status === 'In Progress').length;
  const completed = samples.filter(s => s.status === 'Completed').length;

  const filtered = samples.filter(s =>
    s.sample_id.toLowerCase().includes(filter.toLowerCase()) ||
    s.product_name.toLowerCase().includes(filter.toLowerCase()) ||
    (s.oem_brand || '').toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">

      <div className="max-w-7xl mx-auto px-4 py-5">
        <div className="grid grid-cols-4 gap-3 mb-5">
          <StatCard label="Total Tests" value={samples.length} />
          <StatCard label="Pending" value={pending} variant="warning" />
          <StatCard label="In Progress" value={inProgress} variant="primary" />
          <StatCard label="Completed" value={completed} variant="success" />
        </div>

        <div className="flex items-center gap-3 mb-3">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search tests..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full h-9 pl-8 pr-3 text-sm bg-card border rounded-md shadow-card focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <button
            onClick={onNewSample}
            className="h-9 px-3 flex items-center gap-1.5 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            New Test
          </button>
        </div>

        <div className="bg-card rounded-lg shadow-card overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Test ID</th>
                  <th className="text-left px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Product</th>
                  <th className="text-left px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">OEM</th>
                  <th className="text-left px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Type</th>
                  <th className="text-left px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                  <th className="text-left px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Priority</th>
                  <th className="text-left px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Judgment</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((sample) => (
                  <SampleRow key={sample.id} sample={sample} onClick={() => onSelectSample(sample.id)} />
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-3 py-8 text-center text-muted-foreground">
                      No tests found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, variant }: { label: string; value: number; variant?: string }) {
  const colorMap: Record<string, string> = {
    primary: 'text-primary',
    success: 'text-success',
    warning: 'text-warning',
  };
  return (
    <div className="bg-card rounded-lg shadow-card p-3">
      <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">{label}</div>
      <div className={`text-2xl font-bold tabular-nums ${variant ? colorMap[variant] || '' : ''}`}>{value}</div>
    </div>
  );
}
