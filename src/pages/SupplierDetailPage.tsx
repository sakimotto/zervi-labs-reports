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
  Hash,
  Calendar,
  Package,
  FlaskConical,
  FileText,
  Plus,
  Trash2,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  useSupplier,
  useSupplierDocuments,
  useSupplierMaterials,
  useSupplierSamples,
  useCreateSupplierDocument,
  useDeleteSupplierDocument,
} from '@/hooks/useSuppliers';
import { PageHeader, PageBody } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { FormGrid, FormField, FormInput, FormTextarea, StickyFormFooter } from '@/components/form/FormPrimitives';
import { SupplierStatusBadge, ApprovalBadge, StarRating } from '@/components/suppliers/SupplierBadges';
import { SupplierFormDialog } from '@/components/suppliers/SupplierFormDialog';
import { EmptyState } from '@/components/data/EmptyState';

export default function SupplierDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: supplier, isLoading } = useSupplier(id ?? null);
  const [editOpen, setEditOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!supplier) {
    return (
      <div className="p-6">
        <EmptyState
          icon={Building2}
          title="Supplier not found"
          description="The supplier you’re looking for doesn’t exist or was removed."
          action={
            <Button variant="outline" size="sm" onClick={() => navigate('/suppliers')}>
              Back to suppliers
            </Button>
          }
        />
      </div>
    );
  }

  const fullAddress = [supplier.address_line, supplier.city, supplier.state_region, supplier.postal_code, supplier.country]
    .filter(Boolean)
    .join(', ');

  return (
    <div className="flex flex-col">
      <PageHeader
        eyebrow={
          <Link to="/suppliers" className="inline-flex items-center gap-1 hover:text-foreground transition-colors">
            <ArrowLeft className="h-3 w-3" /> Suppliers
          </Link>
        }
        title={
          <div className="flex items-center gap-3 flex-wrap">
            <span>{supplier.name}</span>
            {supplier.supplier_code && (
              <span className="font-mono text-sm px-2 py-0.5 bg-muted rounded text-muted-foreground border border-border">
                {supplier.supplier_code}
              </span>
            )}
          </div>
        }
        description={
          <div className="flex items-center gap-2 flex-wrap mt-1">
            <SupplierStatusBadge status={supplier.status} />
            <ApprovalBadge status={supplier.approval_status} />
            <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
              <Building2 className="h-3 w-3" /> {supplier.supplier_type}
            </span>
            {supplier.country && (
              <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                <MapPin className="h-3 w-3" /> {supplier.country}
              </span>
            )}
          </div>
        }
        actions={
          <Button size="sm" variant="outline" onClick={() => setEditOpen(true)}>
            <Pencil className="h-4 w-4 mr-1" /> Edit
          </Button>
        }
      />

      <PageBody>
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="bg-muted/60 p-1 h-auto">
            <TabsTrigger value="overview" className="text-xs px-4">Overview</TabsTrigger>
            <TabsTrigger value="materials" className="text-xs px-4">Materials supplied</TabsTrigger>
            <TabsTrigger value="samples" className="text-xs px-4">Samples received</TabsTrigger>
            <TabsTrigger value="documents" className="text-xs px-4">Documents & certifications</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <InfoCard title="Identity" icon={Building2}>
                <Row label="Type" value={supplier.supplier_type} />
                <Row label="Code" value={supplier.supplier_code} mono />
                <Row label="Status" value={<SupplierStatusBadge status={supplier.status} />} />
                <Row label="Approval" value={<ApprovalBadge status={supplier.approval_status} />} />
                <Row label="Rating" value={<StarRating value={supplier.rating} />} />
              </InfoCard>

              <InfoCard title="Contact" icon={Phone}>
                <Row label="Person" value={supplier.contact_person} />
                <Row label="Email" value={supplier.email} icon={Mail} link={supplier.email ? `mailto:${supplier.email}` : null} />
                <Row label="Secondary email" value={supplier.secondary_email} icon={Mail} link={supplier.secondary_email ? `mailto:${supplier.secondary_email}` : null} />
                <Row label="Phone" value={supplier.phone} icon={Phone} mono />
                <Row label="Website" value={supplier.website} icon={Globe} link={supplier.website || null} external />
              </InfoCard>

              <InfoCard title="Address" icon={MapPin}>
                {fullAddress ? (
                  <p className="text-sm text-foreground leading-relaxed">{fullAddress}</p>
                ) : (
                  <p className="text-xs text-muted-foreground italic">No address recorded</p>
                )}
              </InfoCard>

              <InfoCard title="Commercial" icon={CreditCard}>
                <Row label="Tax / VAT ID" value={supplier.tax_id} mono />
                <Row label="Payment terms" value={supplier.payment_terms} />
                <Row label="Currency" value={supplier.currency} />
              </InfoCard>

              <InfoCard title="Timeline" icon={Calendar} className="lg:col-span-2">
                <Row label="Created" value={fmt(supplier.created_at)} />
                <Row label="Last updated" value={fmt(supplier.updated_at)} />
                {supplier.approved_at && <Row label="Approved at" value={fmt(supplier.approved_at)} />}
              </InfoCard>

              {supplier.notes && (
                <Card className="p-4 lg:col-span-3 shadow-card">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2 mb-2">
                    <ShieldCheck className="h-3.5 w-3.5" /> Notes
                  </h3>
                  <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{supplier.notes}</p>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="materials" className="mt-0">
            <MaterialsTab supplierId={supplier.id} />
          </TabsContent>

          <TabsContent value="samples" className="mt-0">
            <SamplesTab supplierId={supplier.id} />
          </TabsContent>

          <TabsContent value="documents" className="mt-0">
            <DocumentsTab supplierId={supplier.id} />
          </TabsContent>
        </Tabs>
      </PageBody>

      <SupplierFormDialog open={editOpen} onOpenChange={setEditOpen} supplier={supplier} />
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

/* ---------- Materials tab ---------- */
function MaterialsTab({ supplierId }: { supplierId: string }) {
  const { data = [], isLoading } = useSupplierMaterials(supplierId);
  const navigate = useNavigate();
  if (isLoading) return <Skeleton className="h-40 w-full" />;
  if (data.length === 0) {
    return (
      <Card className="shadow-card p-0 overflow-hidden">
        <EmptyState
          icon={Package}
          title="No materials linked"
          description="Materials sourced from this supplier will appear here. Link them from the Materials module."
        />
      </Card>
    );
  }
  return (
    <Card className="shadow-card overflow-hidden p-0">
      <table className="w-full text-sm">
        <thead className="bg-muted/60">
          <tr className="border-b border-border">
            <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Material</th>
            <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Type</th>
            <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Grade</th>
            <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Unit price</th>
            <th className="w-10"></th>
          </tr>
        </thead>
        <tbody>
          {data.map((row: any, i: number) => {
            const m = row.materials;
            return (
              <tr
                key={row.id}
                className={`border-b border-border/60 last:border-b-0 cursor-pointer hover:bg-primary-soft/40 ${i % 2 === 1 ? 'bg-card-muted' : ''}`}
                onClick={() => m && navigate(`/materials/${m.id}`)}
              >
                <td className="px-4 py-2.5">
                  <div className="font-medium">{m?.name ?? '—'}</div>
                  {m?.material_code && (
                    <div className="font-mono text-[10px] text-muted-foreground">{m.material_code}</div>
                  )}
                </td>
                <td className="px-4 py-2.5 text-xs text-muted-foreground">{m?.material_type ?? '—'}</td>
                <td className="px-4 py-2.5 text-xs">{row.grade ?? '—'}</td>
                <td className="px-4 py-2.5 text-xs text-right font-mono">{row.unit_price != null ? row.unit_price : '—'}</td>
                <td className="px-2">
                  <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Card>
  );
}

/* ---------- Samples tab ---------- */
function SamplesTab({ supplierId }: { supplierId: string }) {
  const { data = [], isLoading } = useSupplierSamples(supplierId);
  const navigate = useNavigate();
  if (isLoading) return <Skeleton className="h-40 w-full" />;
  if (data.length === 0) {
    return (
      <Card className="shadow-card p-0 overflow-hidden">
        <EmptyState
          icon={FlaskConical}
          title="No samples received"
          description="Samples sourced from this supplier will be listed here once received."
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

/* ---------- Documents tab ---------- */
function DocumentsTab({ supplierId }: { supplierId: string }) {
  const { data = [], isLoading } = useSupplierDocuments(supplierId);
  const create = useCreateSupplierDocument();
  const del = useDeleteSupplierDocument();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    document_type: '',
    document_number: '',
    issuer: '',
    valid_from: '',
    valid_to: '',
    document_url: '',
    notes: '',
  });

  const today = new Date().toISOString().slice(0, 10);

  const submit = async () => {
    if (!form.document_type.trim()) {
      toast.error('Document type is required');
      return;
    }
    try {
      await create.mutateAsync({
        supplier_id: supplierId,
        document_type: form.document_type.trim(),
        document_number: form.document_number.trim() || null,
        issuer: form.issuer.trim() || null,
        valid_from: form.valid_from || null,
        valid_to: form.valid_to || null,
        document_url: form.document_url.trim() || null,
        notes: form.notes.trim() || null,
      });
      toast.success('Document added');
      setOpen(false);
      setForm({ document_type: '', document_number: '', issuer: '', valid_from: '', valid_to: '', document_url: '', notes: '' });
    } catch (e: any) {
      toast.error(e.message ?? 'Failed to add document');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this document?')) return;
    try {
      await del.mutateAsync({ id, supplier_id: supplierId });
      toast.success('Document removed');
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" /> Add Document
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New supplier document</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <FormGrid cols={2}>
                <FormField label="Document type" required span="full">
                  <FormInput
                    value={form.document_type}
                    onChange={(e) => setForm((p) => ({ ...p, document_type: e.target.value }))}
                    placeholder="ISO 9001 / OEKO-TEX / NDA / W-9 …"
                    autoFocus
                  />
                </FormField>
                <FormField label="Document #">
                  <FormInput value={form.document_number} onChange={(e) => setForm((p) => ({ ...p, document_number: e.target.value }))} />
                </FormField>
                <FormField label="Issuer">
                  <FormInput value={form.issuer} onChange={(e) => setForm((p) => ({ ...p, issuer: e.target.value }))} />
                </FormField>
                <FormField label="Valid from">
                  <FormInput type="date" value={form.valid_from} onChange={(e) => setForm((p) => ({ ...p, valid_from: e.target.value }))} />
                </FormField>
                <FormField label="Valid to">
                  <FormInput type="date" value={form.valid_to} onChange={(e) => setForm((p) => ({ ...p, valid_to: e.target.value }))} />
                </FormField>
                <FormField label="Document URL" span="full" hint="Link to PDF or document store">
                  <FormInput type="url" value={form.document_url} onChange={(e) => setForm((p) => ({ ...p, document_url: e.target.value }))} placeholder="https://…" />
                </FormField>
                <FormField label="Notes" span="full">
                  <FormTextarea rows={3} value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} />
                </FormField>
              </FormGrid>
              <StickyFormFooter align="end">
                <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={submit} disabled={create.isPending}>
                  {create.isPending ? 'Adding…' : 'Add document'}
                </Button>
              </StickyFormFooter>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : data.length === 0 ? (
        <Card className="shadow-card p-0 overflow-hidden">
          <EmptyState
            icon={FileText}
            title="No documents yet"
            description="Track certifications, NDAs, audit reports and other documents linked to this supplier."
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {data.map((doc) => {
            const expired = doc.valid_to && doc.valid_to < today;
            const expiringSoon =
              doc.valid_to && !expired && doc.valid_to <= new Date(Date.now() + 60 * 86400000).toISOString().slice(0, 10);
            return (
              <Card key={doc.id} className="p-4 shadow-card">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-semibold text-foreground truncate">{doc.document_type}</h4>
                      {expired && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-destructive/10 text-destructive border border-destructive/30">
                          EXPIRED
                        </span>
                      )}
                      {expiringSoon && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-warning-soft text-warning border border-warning/30">
                          EXPIRING SOON
                        </span>
                      )}
                    </div>
                    {doc.document_number && (
                      <div className="text-xs text-muted-foreground mt-0.5 inline-flex items-center gap-1">
                        <Hash className="h-3 w-3" /> {doc.document_number}
                      </div>
                    )}
                  </div>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDelete(doc.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="mt-3 space-y-1.5 text-xs">
                  {doc.issuer && (
                    <div className="text-muted-foreground">Issuer: <span className="text-foreground">{doc.issuer}</span></div>
                  )}
                  {(doc.valid_from || doc.valid_to) && (
                    <div className="text-muted-foreground inline-flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {fmt(doc.valid_from) ?? '—'} → {fmt(doc.valid_to) ?? 'no expiry'}
                    </div>
                  )}
                  {doc.document_url && (
                    <a
                      href={doc.document_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline inline-flex items-center gap-1"
                    >
                      <ExternalLink className="h-3 w-3" /> Open document
                    </a>
                  )}
                  {doc.notes && <p className="text-muted-foreground italic mt-1">{doc.notes}</p>}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
