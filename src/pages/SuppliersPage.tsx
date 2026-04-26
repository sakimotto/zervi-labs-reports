import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Pencil, Trash2, Truck, ExternalLink, MapPin, Mail, Phone as PhoneIcon, Building2, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import {
  useSuppliers,
  useDeleteSupplier,
  SUPPLIER_TYPES,
  SUPPLIER_STATUSES,
  type DbSupplier,
} from '@/hooks/useSuppliers';
import { PageHeader, PageBody } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

import { DataTable, RowActions, type Column } from '@/components/data/DataTable';
import { FilterBar } from '@/components/data/FilterBar';
import { EmptyState, TableSkeleton } from '@/components/data/EmptyState';
import { SupplierFormDialog } from '@/components/suppliers/SupplierFormDialog';
import { SupplierStatusBadge, ApprovalBadge, StarRating } from '@/components/suppliers/SupplierBadges';

export default function SuppliersPage() {
  const navigate = useNavigate();
  const { data: suppliers = [], isLoading } = useSuppliers();
  const deleteSupplier = useDeleteSupplier();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [approvalFilter, setApprovalFilter] = useState<string>('all');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<DbSupplier | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return suppliers.filter((s) => {
      if (statusFilter !== 'all' && s.status !== statusFilter) return false;
      if (typeFilter !== 'all' && s.supplier_type !== typeFilter) return false;
      if (approvalFilter !== 'all' && s.approval_status !== approvalFilter) return false;
      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) ||
        (s.supplier_code ?? '').toLowerCase().includes(q) ||
        (s.contact_person ?? '').toLowerCase().includes(q) ||
        (s.email ?? '').toLowerCase().includes(q) ||
        (s.country ?? '').toLowerCase().includes(q) ||
        (s.city ?? '').toLowerCase().includes(q)
      );
    });
  }, [suppliers, search, statusFilter, typeFilter, approvalFilter]);

  const kpis = useMemo(() => {
    const active = suppliers.filter((s) => s.status === 'Active').length;
    const approved = suppliers.filter((s) => s.approval_status === 'Approved').length;
    const pending = suppliers.filter((s) => s.approval_status === 'Pending').length;
    const countries = new Set(suppliers.map((s) => s.country).filter(Boolean)).size;
    return { total: suppliers.length, active, approved, pending, countries };
  }, [suppliers]);

  const handleEdit = (s: DbSupplier) => {
    setEditing(s);
    setDialogOpen(true);
  };

  const handleNew = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const handleDelete = async (s: DbSupplier) => {
    if (!confirm(`Delete supplier "${s.name}"? This cannot be undone.`)) return;
    try {
      await deleteSupplier.mutateAsync(s.id);
      toast.success('Supplier deleted');
    } catch (e: any) {
      toast.error(e.message ?? 'Failed to delete');
    }
  };

  const columns: Column<DbSupplier>[] = [
    {
      key: 'name',
      header: 'Supplier',
      sortValue: (r) => r.name,
      cell: (s) => (
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-foreground truncate">{s.name}</span>
            {s.supplier_code && (
              <span className="font-mono text-[10px] px-1.5 py-0.5 bg-muted rounded text-muted-foreground border border-border">
                {s.supplier_code}
              </span>
            )}
          </div>
          {s.contact_person && (
            <div className="text-xs text-muted-foreground mt-0.5 truncate">
              {s.contact_person}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'supplier_type',
      header: 'Type',
      sortValue: (r) => r.supplier_type ?? '',
      hideBelow: 'md',
      cell: (s) => (
        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <Building2 className="h-3 w-3" />
          {s.supplier_type ?? '—'}
        </span>
      ),
    },
    {
      key: 'location',
      header: 'Location',
      sortValue: (r) => `${r.country ?? ''} ${r.city ?? ''}`,
      hideBelow: 'lg',
      cell: (s) => {
        const parts = [s.city, s.country].filter(Boolean);
        return parts.length ? (
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" /> {parts.join(', ')}
          </span>
        ) : (
          <span className="text-muted-foreground text-xs">—</span>
        );
      },
    },
    {
      key: 'contact',
      header: 'Contact',
      hideBelow: 'lg',
      cell: (s) => (
        <div className="space-y-0.5 text-xs">
          {s.email && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Mail className="h-3 w-3" />
              <span className="truncate max-w-[180px]">{s.email}</span>
            </div>
          )}
          {s.phone && (
            <div className="flex items-center gap-1.5 text-muted-foreground font-mono">
              <PhoneIcon className="h-3 w-3" /> {s.phone}
            </div>
          )}
          {!s.email && !s.phone && <span className="text-muted-foreground">—</span>}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortValue: (r) => r.status ?? '',
      cell: (s) => (
        <div className="flex flex-col items-start gap-1">
          <SupplierStatusBadge status={s.status} />
          <ApprovalBadge status={s.approval_status} />
        </div>
      ),
    },
    {
      key: 'rating',
      header: 'Rating',
      sortValue: (r) => r.rating ?? 0,
      align: 'center',
      hideBelow: 'md',
      cell: (s) => <StarRating value={s.rating} />,
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      width: '110px',
      cell: (s) => (
        <RowActions>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={() => navigate(`/suppliers/${s.id}`)}
            title="Open"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </Button>
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleEdit(s)} title="Edit">
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-destructive hover:text-destructive"
            onClick={() => handleDelete(s)}
            title="Delete"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </RowActions>
      ),
    },
  ];

  return (
    <div className="flex flex-col">
      <PageHeader
        eyebrow="Directory"
        title="Suppliers"
        description="Master vendor list — contacts, approval state, commercial terms, and document trail."
        actions={
          <Button size="sm" className="h-9" onClick={handleNew}>
            <Plus className="h-4 w-4 mr-1" /> Add Supplier
          </Button>
        }
      />

      <PageBody className="space-y-4">
        {/* KPI strip */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <KpiCard label="Total" value={kpis.total} icon={Truck} />
          <KpiCard label="Active" value={kpis.active} icon={CheckCircle2} tone="success" />
          <KpiCard label="Approved" value={kpis.approved} icon={CheckCircle2} tone="primary" />
          <KpiCard label="Pending approval" value={kpis.pending} icon={AlertCircle} tone="warning" />
          <KpiCard label="Countries" value={kpis.countries} icon={MapPin} />
        </div>

        <FilterBar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search by name, code, contact, email, city, country…"
          summary={`${filtered.length} of ${suppliers.length} suppliers`}
          filters={[
            {
              key: 'status',
              label: 'Status',
              value: statusFilter,
              onChange: setStatusFilter,
              options: [
                { value: 'all', label: 'All' },
                ...SUPPLIER_STATUSES.map((s) => ({ value: s, label: s })),
              ],
            },
            {
              key: 'type',
              label: 'Type',
              value: typeFilter,
              onChange: setTypeFilter,
              options: [
                { value: 'all', label: 'All' },
                ...SUPPLIER_TYPES.map((s) => ({ value: s, label: s })),
              ],
            },
            {
              key: 'approval',
              label: 'Approval',
              value: approvalFilter,
              onChange: setApprovalFilter,
              options: [
                { value: 'all', label: 'All' },
                { value: 'Approved', label: 'Approved' },
                { value: 'Pending', label: 'Pending' },
                { value: 'Rejected', label: 'Rejected' },
              ],
            },
          ]}
        />

        {isLoading ? (
          <TableSkeleton columns={6} rows={6} />
        ) : (
          <DataTable
            data={filtered}
            columns={columns}
            rowKey={(r) => r.id}
            defaultSort={{ key: 'name', direction: 'asc' }}
            onRowClick={(s) => navigate(`/suppliers/${s.id}`)}
            emptyState={
              <EmptyState
                icon={Truck}
                title={suppliers.length === 0 ? 'No suppliers yet' : 'No matches'}
                description={
                  suppliers.length === 0
                    ? 'Add your first supplier to start tracking materials, samples and documents.'
                    : 'Try adjusting your filters or search.'
                }
                action={
                  suppliers.length === 0 && (
                    <Button size="sm" onClick={handleNew}>
                      <Plus className="h-4 w-4 mr-1" /> Add Supplier
                    </Button>
                  )
                }
              />
            }
          />
        )}
      </PageBody>

      <SupplierFormDialog
        open={dialogOpen}
        onOpenChange={(o) => {
          setDialogOpen(o);
          if (!o) setEditing(null);
        }}
        supplier={editing}
      />
    </div>
  );
}

function KpiCard({
  label,
  value,
  icon: Icon,
  tone = 'default',
}: {
  label: string;
  value: number | string;
  icon: React.ElementType;
  tone?: 'default' | 'success' | 'warning' | 'primary';
}) {
  const toneCls =
    tone === 'success'
      ? 'bg-success-soft text-success'
      : tone === 'warning'
        ? 'bg-warning-soft text-warning'
        : tone === 'primary'
          ? 'bg-primary-soft text-primary'
          : 'bg-muted text-muted-foreground';
  return (
    <Card className="p-4 flex items-center gap-3 shadow-card">
      <div className={`h-10 w-10 rounded-lg inline-flex items-center justify-center ${toneCls}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <div className="text-2xl font-semibold leading-none tracking-tight">{value}</div>
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground mt-1">{label}</div>
      </div>
    </Card>
  );
}

