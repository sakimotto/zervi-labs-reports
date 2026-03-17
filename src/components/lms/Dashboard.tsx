import { mockSamples } from '@/data/mockData';
import { SampleRow } from './SampleRow';
import { StatusBadge } from './StatusBadge';
import { FlaskConical, Plus, Search } from 'lucide-react';
import { useState } from 'react';

interface DashboardProps {
  onSelectSample: (id: string) => void;
}

export function Dashboard({ onSelectSample }: DashboardProps) {
  const [filter, setFilter] = useState('');
  
  const pending = mockSamples.filter(s => s.status === 'Pending').length;
  const inProgress = mockSamples.filter(s => s.status === 'In Progress').length;
  const completed = mockSamples.filter(s => s.status === 'Completed').length;

  const filtered = mockSamples.filter(s =>
    s.sampleId.toLowerCase().includes(filter.toLowerCase()) ||
    s.productName.toLowerCase().includes(filter.toLowerCase()) ||
    s.oemBrand.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Top Bar */}
      <header className="h-12 flex items-center justify-between px-4 border-b bg-card shadow-card">
        <div className="flex items-center gap-2">
          <FlaskConical className="h-5 w-5 text-primary" />
          <span className="text-sm font-semibold tracking-tight">ZERVI ASIA LABORATORY</span>
          <span className="text-xs text-muted-foreground ml-1">LMS</span>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <kbd className="px-1.5 py-0.5 bg-muted rounded-sm font-mono text-muted-foreground">N</kbd>
          <span className="text-muted-foreground">New Sample</span>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-5">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 mb-5">
          <StatCard label="Total Samples" value={mockSamples.length} />
          <StatCard label="Pending" value={pending} variant="warning" />
          <StatCard label="In Progress" value={inProgress} variant="primary" />
          <StatCard label="Completed" value={completed} variant="success" />
        </div>

        {/* Search + Actions */}
        <div className="flex items-center gap-3 mb-3">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search samples..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full h-9 pl-8 pr-3 text-sm bg-card border rounded-md shadow-card focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <button className="h-9 px-3 flex items-center gap-1.5 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
            <Plus className="h-3.5 w-3.5" />
            New Sample
          </button>
        </div>

        {/* Table */}
        <div className="bg-card rounded-lg shadow-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Sample ID</th>
                <th className="text-left px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Product</th>
                <th className="text-left px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">OEM</th>
                <th className="text-left px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Type</th>
                <th className="text-left px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Progress</th>
                <th className="text-left px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                <th className="text-left px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Priority</th>
                <th className="text-left px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Judgment</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((sample) => (
                <SampleRow key={sample.id} sample={sample} onClick={() => onSelectSample(sample.id)} />
              ))}
            </tbody>
          </table>
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
