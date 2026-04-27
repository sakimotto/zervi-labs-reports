import { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Pencil,
  Building2,
  Mail,
  Phone,
  Globe,
  MapPin,
  CreditCard,
  Calendar,
  FlaskConical,
  FileText,
  ShieldCheck,
  ExternalLink,
  Briefcase,
  User,
} from 'lucide-react';
import {
  useCustomer,
  useCustomerSamples,
  useCustomerSpecifications,
} from '@/hooks/useCustomers';
import { PageHeader, PageBody } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { CustomerStatusBadge, CustomerTypeBadge, StarRating } from '@/components/customers/CustomerBadges';
import { CustomerFormDialog } from '@/components/customers/CustomerFormDialog';
import { CustomerTestRequestsTab } from '@/components/customers/CustomerTestRequestsTab';
import { CustomerReportsTab } from '@/components/customers/CustomerReportsTab';
import { EmptyState } from '@/components/data/EmptyState';
import { AskAIButton, getCustomerAIActions } from '@/components/copilot/AskAIButton';

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: customer, isLoading } = useCustomer(id ?? null);
  const [editOpen, setEditOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="p-6">
        <EmptyState
          icon={Building2}
          title="Customer not found"
          description="The customer you’re looking for doesn’t exist or was removed."
          action={
            <Button variant="outline" size="sm" onClick={() => navigate('/customers')}>
              Back to customers
            </Button>
          }
        />
      </div>
    );
  }

  const fullAddress = [customer.address_line, customer.city, customer.state_region, customer.postal_code, customer.country]
    .filter(Boolean)
    .join(', ');

  return (
    <div className="flex flex-col">
      <PageHeader
        eyebrow={
          <Link to="/customers" className="inline-flex items-center gap-1 hover:text-foreground transition-colors">
            <ArrowLeft className="h-3 w-3" /> Customers
          </Link>
        }
        title={
          <div className="flex items-center gap-3 flex-wrap">
            <span>{customer.name}</span>
            {customer.customer_code && (
              <span className="font-mono text-sm px-2 py-0.5 bg-muted rounded text-muted-foreground border border-border">
                {customer.customer_code}
              </span>
            )}
          </div>
        }
        description={
          <div className="flex items-center gap-2 flex-wrap mt-1">
            <CustomerStatusBadge status={customer.status} />
            <CustomerTypeBadge type={customer.customer_type} />
            {customer.industry && (
              <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                <Briefcase className="h-3 w-3" /> {customer.industry}
              </span>
            )}
            {customer.country && (
              <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                <MapPin className="h-3 w-3" /> {customer.country}
              </span>
            )}
          </div>
        }
        actions={
          <div className="flex items-center gap-2">
            <AskAIButton
              context={{ type: 'customer', id: customer.id, label: customer.name }}
              actions={getCustomerAIActions(customer.name)}
            />
            <Button size="sm" variant="outline" onClick={() => setEditOpen(true)}>
              <Pencil className="h-4 w-4 mr-1" /> Edit
            </Button>
          </div>
        }
      />

      <PageBody>
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="bg-muted/60 p-1 h-auto">
            <TabsTrigger value="overview" className="text-xs px-4">Overview</TabsTrigger>
            <TabsTrigger value="requests" className="text-xs px-4">Test Requests</TabsTrigger>
            <TabsTrigger value="reports" className="text-xs px-4">Reports</TabsTrigger>
            <TabsTrigger value="samples" className="text-xs px-4">Samples</TabsTrigger>
            <TabsTrigger value="specifications" className="text-xs px-4">Specifications</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <InfoCard title="Identity" icon={Building2}>
                <Row label="Type" value={<CustomerTypeBadge type={customer.customer_type} />} />
                <Row label="Code" value={customer.customer_code} mono />
                <Row label="Status" value={<CustomerStatusBadge status={customer.status} />} />
                <Row label="Industry" value={customer.industry} />
                <Row label="Rating" value={<StarRating value={customer.rating} />} />
              </InfoCard>

              <InfoCard title="Contact" icon={Phone}>
                <Row label="Person" value={customer.contact_person} icon={User} />
                <Row label="Email" value={customer.email} icon={Mail} link={customer.email ? `mailto:${customer.email}` : null} />
                <Row label="Secondary" value={customer.secondary_email} icon={Mail} link={customer.secondary_email ? `mailto:${customer.secondary_email}` : null} />
                <Row label="Phone" value={customer.phone} icon={Phone} mono />
                <Row label="Website" value={customer.website} icon={Globe} link={customer.website || null} external />
              </InfoCard>

              <InfoCard title="Address" icon={MapPin}>
                {fullAddress ? (
                  <p className="text-sm text-foreground leading-relaxed">{fullAddress}</p>
                ) : (
                  <p className="text-xs text-muted-foreground italic">No address recorded</p>
                )}
              </InfoCard>

              <InfoCard title="Commercial" icon={CreditCard}>
                <Row label="Tax / VAT ID" value={customer.tax_id} mono />
                <Row label="Payment terms" value={customer.payment_terms} />
                <Row label="Currency" value={customer.currency} />
                <Row
                  label="Credit limit"
                  value={
                    customer.credit_limit != null
                      ? `${customer.currency ?? ''} ${Number(customer.credit_limit).toLocaleString()}`
                      : null
                  }
                />
                <Row label="Account mgr" value={customer.account_manager} icon={User} />
              </InfoCard>

              <InfoCard title="Timeline" icon={Calendar} className="lg:col-span-2">
                <Row label="Created" value={fmt(customer.created_at)} />
                <Row label="Last updated" value={fmt(customer.updated_at)} />
              </InfoCard>

              {customer.notes && (
                <Card className="p-4 lg:col-span-3 shadow-card">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2 mb-2">
                    <ShieldCheck className="h-3.5 w-3.5" /> Notes
                  </h3>
                  <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{customer.notes}</p>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="requests" className="mt-0">
            <CustomerTestRequestsTab customerId={customer.id} customerEmail={customer.email} />
          </TabsContent>

          <TabsContent value="reports" className="mt-0">
            <CustomerReportsTab
              customerId={customer.id}
              customerEmail={customer.email}
              customerName={customer.name}
            />
          </TabsContent>

          <TabsContent value="samples" className="mt-0">
            <SamplesTab customerId={customer.id} />
          </TabsContent>

          <TabsContent value="specifications" className="mt-0">
            <SpecificationsTab customerName={customer.name} />
          </TabsContent>
        </Tabs>
      </PageBody>

      <CustomerFormDialog open={editOpen} onOpenChange={setEditOpen} customer={customer} />
    </div>
  );
}

/* ---------- helpers ---------- */
function fmt(d: string | null | undefined) {
  if (!d) return null;
  try {
    return new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return d;
  }
}

function InfoCard({
  title,
  icon: Icon,
  children,
  className,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={`p-4 shadow-card ${className ?? ''}`}>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2 mb-3">
        <Icon className="h-3.5 w-3.5" /> {title}
      </h3>
      <div className="space-y-2">{children}</div>
    </Card>
  );
}

function Row({
  label,
  value,
  icon: Icon,
  link,
  external,
  mono,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ElementType;
  link?: string | null;
  external?: boolean;
  mono?: boolean;
}) {
  const empty = value == null || value === '';
  return (
    <div className="flex items-start gap-3 text-sm">
      <span className="text-[11px] uppercase tracking-wider text-muted-foreground w-28 shrink-0 pt-0.5">
        {label}
      </span>
      <span className={`min-w-0 flex-1 ${mono ? 'font-mono text-xs' : ''}`}>
        {empty ? (
          <span className="text-muted-foreground italic text-xs">—</span>
        ) : link ? (
          <a
            href={link}
            target={external ? '_blank' : undefined}
            rel={external ? 'noopener noreferrer' : undefined}
            className="text-primary hover:underline inline-flex items-center gap-1 break-all"
          >
            {Icon && <Icon className="h-3 w-3 shrink-0" />} {value}
            {external && <ExternalLink className="h-3 w-3" />}
          </a>
        ) : (
          <span className="inline-flex items-center gap-1.5 break-words">
            {Icon && <Icon className="h-3 w-3 shrink-0 text-muted-foreground" />} {value}
          </span>
        )}
      </span>
    </div>
  );
}

/* ---------- Samples tab ---------- */
function SamplesTab({ customerId }: { customerId: string }) {
  const { data = [], isLoading } = useCustomerSamples(customerId);
  const navigate = useNavigate();
  if (isLoading) return <Skeleton className="h-40 w-full" />;
  if (data.length === 0) {
    return (
      <Card className="shadow-card p-0 overflow-hidden">
        <EmptyState
          icon={FlaskConical}
          title="No samples linked"
          description="When samples are received from this customer they will be listed here. Link a sample by selecting this customer on the intake form."
        />
      </Card>
    );
  }
  return (
    <Card className="shadow-card overflow-hidden p-0">
      <table className="w-full text-sm">
        <thead className="bg-muted/60">
          <tr className="border-b border-border">
            <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Sample ID</th>
            <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Product</th>
            <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
            <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Judgment</th>
            <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Received</th>
          </tr>
        </thead>
        <tbody>
          {data.map((s: any, i: number) => (
            <tr
              key={s.id}
              className={`border-b border-border/60 last:border-b-0 cursor-pointer hover:bg-primary-soft/40 ${i % 2 === 1 ? 'bg-card-muted' : ''}`}
              onClick={() => navigate(`/tests/${s.id}`)}
            >
              <td className="px-4 py-2.5 font-mono text-xs">{s.sample_id}</td>
              <td className="px-4 py-2.5">{s.product_name}</td>
              <td className="px-4 py-2.5 text-xs">{s.status}</td>
              <td className="px-4 py-2.5 text-xs">
                <span
                  className={`px-2 py-0.5 rounded font-semibold ${
                    s.overall_judgment === 'OK'
                      ? 'bg-success-soft text-success'
                      : s.overall_judgment === 'NG'
                        ? 'bg-destructive/10 text-destructive'
                        : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {s.overall_judgment ?? '—'}
                </span>
              </td>
              <td className="px-4 py-2.5 text-xs text-muted-foreground">{fmt(s.received_date) ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

/* ---------- Specifications tab ---------- */
function SpecificationsTab({ customerName }: { customerName: string }) {
  const { data = [], isLoading } = useCustomerSpecifications(customerName);
  if (isLoading) return <Skeleton className="h-40 w-full" />;
  if (!data || data.length === 0) {
    return (
      <Card className="shadow-card p-0 overflow-hidden">
        <EmptyState
          icon={FileText}
          title="No specifications"
          description="OEM specifications matched to this customer (by name) will appear here."
        />
      </Card>
    );
  }
  return (
    <Card className="shadow-card overflow-hidden p-0">
      <table className="w-full text-sm">
        <thead className="bg-muted/60">
          <tr className="border-b border-border">
            <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Code</th>
            <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Name</th>
            <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Version</th>
            <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
          </tr>
        </thead>
        <tbody>
          {data.map((s: any, i: number) => (
            <tr key={s.id} className={`border-b border-border/60 last:border-b-0 ${i % 2 === 1 ? 'bg-card-muted' : ''}`}>
              <td className="px-4 py-2.5 font-mono text-xs">{s.spec_code}</td>
              <td className="px-4 py-2.5">{s.spec_name}</td>
              <td className="px-4 py-2.5 text-xs">{s.version ?? '—'}</td>
              <td className="px-4 py-2.5 text-xs text-muted-foreground">{s.status ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
