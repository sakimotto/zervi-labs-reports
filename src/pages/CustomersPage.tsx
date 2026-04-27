import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Pencil,
  Trash2,
  Users,
  ExternalLink,
  MapPin,
  Mail,
  Phone as PhoneIcon,
  Building2,
  CheckCircle2,
  AlertCircle,
  Briefcase,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  useCustomers,
  useDeleteCustomer,
  CUSTOMER_TYPES,
  CUSTOMER_STATUSES,
  type DbCustomer,
} from '@/hooks/useCustomers';
import { PageHeader, PageBody } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

import { DataTable, RowActions, type Column } from '@/components/data/DataTable';
import { FilterBar } from '@/components/data/FilterBar';
import { EmptyState, TableSkeleton } from '@/components/data/EmptyState';
import { CustomerFormDialog } from '@/components/customers/CustomerFormDialog';
import { CustomerStatusBadge, CustomerTypeBadge, StarRating } from '@/components/customers/CustomerBadges';

export default function CustomersPage() {
  const navigate = useNavigate();
  const { data: customers = [], isLoading } = useCustomers();
  const deleteCustomer = useDeleteCustomer();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<DbCustomer | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return customers.filter((c) => {
      if (statusFilter !== 'all' && c.status !== statusFilter) return false;
      if (typeFilter !== 'all' && c.customer_type !== typeFilter) return false;
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        (c.customer_code ?? '').toLowerCase().includes(q) ||
        (c.contact_person ?? '').toLowerCase().includes(q) ||
        (c.email ?? '').toLowerCase().includes(q) ||
        (c.country ?? '').toLowerCase().includes(q) ||
        (c.city ?? '').toLowerCase().includes(q) ||
        (c.industry ?? '').toLowerCase().includes(q)
      );
    });
  }, [customers, search, statusFilter, typeFilter]);

  const kpis = useMemo(() => {
    const active = customers.filter((c) => c.status === 'Active').length;
    const oem = customers.filter((c) => c.customer_type === 'OEM').length;
    const prospect = customers.filter((c) => c.status === 'Prospect').length;
    const countries = new Set(customers.map((c) => c.country).filter(Boolean)).size;
    return { total: customers.length, active, oem, prospect, countries };
  }, [customers]);

  const handleEdit = (c: DbCustomer) => {
    setEditing(c);
    setDialogOpen(true);
  };

  const handleNew = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const handleDelete = async (c: DbCustomer) => {
    if (!confirm(`Delete customer "${c.name}"? This cannot be undone.`)) return;
    try {
      await deleteCustomer.mutateAsync(c.id);
      toast.success('Customer deleted');
    } catch (e: any) {
      toast.error(e.message ?? 'Failed to delete');
    }
  };

  const columns: Column<DbCustomer>[] = [
    {
      key: 'name',
      header: 'Customer',
      sortValue: (r) => r.name,
      cell: (c) => (
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-foreground truncate">{c.name}</span>
            {c.customer_code && (
              <span className="font-mono text-[10px] px-1.5 py-0.5 bg-muted rounded text-muted-foreground border border-border">
                {c.customer_code}
              </span>
            )}
          </div>
          {c.contact_person && (
            <div className="text-xs text-muted-foreground mt-0.5 truncate">{c.contact_person}</div>
          )}
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      sortValue: (r) => r.customer_type ?? '',
      hideBelow: 'md',
      cell: (c) => <CustomerTypeBadge type={c.customer_type} />,
    },
    {
      key: 'industry',
      header: 'Industry',
      sortValue: (r) => r.industry ?? '',
      hideBelow: 'lg',
      cell: (c) =>
        c.industry ? (
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <Briefcase className="h-3 w-3" />
            {c.industry}
          </span>
        ) : (
          <span className="text-muted-foreground text-xs">—</span>
        ),
    },
    {
      key: 'location',
      header: 'Location',
      sortValue: (r) => `${r.country ?? ''} ${r.city ?? ''}`,
      hideBelow: 'lg',
      cell: (c) => {
        const parts = [c.city, c.country].filter(Boolean);
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
      cell: (c) => (
        <div className="space-y-0.5 text-xs">
          {c.email && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Mail className="h-3 w-3" />
              <span className="truncate max-w-[180px]">{c.email}</span>
            </div>
          )}
          {c.phone && (
            <div className="flex items-center gap-1.5 text-muted-foreground font-mono">
              <PhoneIcon className="h-3 w-3" /> {c.phone}
            </div>
          )}
          {!c.email && !c.phone && <span className="text-muted-foreground">—</span>}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortValue: (r) => r.status ?? '',
      cell: (c) => <CustomerStatusBadge status={c.status} />,
    },
    {
      key: 'rating',
      header: 'Rating',
      sortValue: (r) => r.rating ?? 0,
      align: 'center',
      hideBelow: 'md',
      cell: (c) => <StarRating value={c.rating} />,
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      width: '110px',
      cell: (c) => (
        <RowActions>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={() => navigate(`/customers/${c.id}`)}
            title="Open"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </Button>
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleEdit(c)} title="Edit">
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-destructive hover:text-destructive"
            onClick={() => handleDelete(c)}
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
        title="Customers"
        description="OEM brands, clients and distributors — contacts, commercial terms and linked samples."
        actions={
          <Button size="sm" className="h-9" onClick={handleNew}>
            <Plus className="h-4 w-4 mr-1" /> Add Customer
          </Button>
        }
      />

      <PageBody className="space-y-4">
        {/* KPI strip */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <KpiCard label="Total" value={kpis.total} icon={Users} />
          <KpiCard label="Active" value={kpis.active} icon={CheckCircle2} tone="success" />
          <KpiCard label="OEM" value={kpis.oem} icon={Building2} tone="primary" />
          <KpiCard label="Prospects" value={kpis.prospect} icon={AlertCircle} tone="warning" />
          <KpiCard label="Countries" value={kpis.countries} icon={MapPin} />
        </div>

        <FilterBar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search by name, code, contact, email, city, country, industry…"
          summary={`${filtered.length} of ${customers.length} customers`}
          filters={[
            {
              key: 'status',
              label: 'Status',
              value: statusFilter,
              onChange: setStatusFilter,
              options: [
                { value: 'all', label: 'All' },
                ...CUSTOMER_STATUSES.map((s) => ({ value: s, label: s })),
              ],
            },
            {
              key: 'type',
              label: 'Type',
              value: typeFilter,
              onChange: setTypeFilter,
              options: [
                { value: 'all', label: 'All' },
                ...CUSTOMER_TYPES.map((t) => ({ value: t, label: t })),
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
            onRowClick={(c) => navigate(`/customers/${c.id}`)}
            emptyState={
              <EmptyState
                icon={Users}
                title={customers.length === 0 ? 'No customers yet' : 'No matches'}
                description={
                  customers.length === 0
                    ? 'Add your first OEM, client or distributor to start linking samples.'
                    : 'Try adjusting your filters or search.'
                }
                action={
                  customers.length === 0 && (
                    <Button size="sm" onClick={handleNew}>
                      <Plus className="h-4 w-4 mr-1" /> Add Customer
                    </Button>
                  )
                }
              />
            }
          />
        )}
      </PageBody>

      <CustomerFormDialog
        open={dialogOpen}
        onOpenChange={(o) => {
          setDialogOpen(o);
          if (!o) setEditing(null);
        }}
        customer={editing}
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
