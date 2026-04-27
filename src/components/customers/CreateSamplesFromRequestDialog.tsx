import { useEffect, useMemo, useState } from 'react';
import { Beaker, Sparkles, FlaskConical } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FormSection, FormGrid, FormField, FormInput, FormTextarea } from '@/components/form/FormPrimitives';
import { useCreateSamplesFromRequest } from '@/hooks/useSamples';
import { useTestPrograms } from '@/hooks/useTestPrograms';
import type { DbTestRequest } from '@/hooks/useTestRequests';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  request: DbTestRequest;
  onCreated?: (sampleIds: { id: string; sample_id: string }[]) => void;
}

export function CreateSamplesFromRequestDialog({ open, onOpenChange, request, onCreated }: Props) {
  const { data: programs = [], isLoading: loadingPrograms } = useTestPrograms();
  const create = useCreateSamplesFromRequest();

  const [count, setCount] = useState(1);
  const [productName, setProductName] = useState('');
  const [programId, setProgramId] = useState<string>('none');
  const [composition, setComposition] = useState('');
  const [color, setColor] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [batchNumber, setBatchNumber] = useState('');
  const [oemBrand, setOemBrand] = useState('');
  const [promote, setPromote] = useState(true);

  // Derive a sensible default product name from the request
  useEffect(() => {
    if (!open) return;
    const seed =
      request.materials_description?.split('\n')[0]?.slice(0, 60) ||
      request.description?.split('\n')[0]?.slice(0, 60) ||
      `Sample for ${request.request_number}`;
    setProductName(seed);
    setCount(1);
    setProgramId('none');
    setComposition('');
    setColor('');
    setSupplierName('');
    setBatchNumber('');
    setOemBrand('');
    setPromote(true);
  }, [open, request]);

  const selectedProgram = useMemo(
    () => programs.find((p: any) => p.id === programId) ?? null,
    [programs, programId],
  );

  const programItemIds = useMemo<number[]>(() => {
    if (!selectedProgram) return [];
    const items = (selectedProgram as any).test_program_items ?? [];
    return items
      .slice()
      .sort((a: any, b: any) => (a.display_order ?? 0) - (b.display_order ?? 0))
      .map((i: any) => i.test_item_id as number);
  }, [selectedProgram]);

  const onSubmit = async () => {
    if (!productName.trim()) {
      toast.error('Product name is required');
      return;
    }
    if (!request.customer_id) {
      toast.error('Request has no customer linked');
      return;
    }
    try {
      const created = await create.mutateAsync({
        request: {
          id: request.id,
          customer_id: request.customer_id,
          request_number: request.request_number,
          materials_description: request.materials_description,
          priority: request.priority,
          requested_date: request.requested_date,
          contact_person: request.contact_person,
        },
        count,
        productNamePrefix: productName.trim(),
        testProgramId: programId === 'none' ? null : programId,
        testItemIds: programItemIds,
        baseFields: {
          composition: composition.trim() || undefined,
          color: color.trim() || undefined,
          supplier_name: supplierName.trim() || undefined,
          batch_number: batchNumber.trim() || undefined,
          oem_brand: oemBrand.trim() || undefined,
        },
        markRequestInProgress: promote,
      });
      const itemMsg = programItemIds.length ? ` with ${programItemIds.length} test items each` : '';
      toast.success(`Created ${created.length} sample${created.length === 1 ? '' : 's'}${itemMsg}`);
      onCreated?.(created);
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message ?? 'Failed to create samples');
    }
  };

  const busy = create.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Generate samples from {request.request_number}
          </DialogTitle>
          <DialogDescription>
            Auto-creates one or more samples linked to this request and customer, optionally
            seeded with a test program so the lab can start working immediately.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <FormSection title="Sample basics" icon={Beaker} bare>
            <FormGrid cols={3}>
              <FormField label="Number of samples" required>
                <FormInput
                  type="number"
                  min={1}
                  max={50}
                  value={count}
                  onChange={(e) => setCount(Math.max(1, Math.min(50, Number(e.target.value) || 1)))}
                />
              </FormField>
              <FormField label="Product name" required span={2}>
                <FormInput
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="e.g. Black PVC 320gsm"
                />
              </FormField>
            </FormGrid>
            <FormGrid cols={3}>
              <FormField label="Composition">
                <FormInput value={composition} onChange={(e) => setComposition(e.target.value)} placeholder="100% PES" />
              </FormField>
              <FormField label="Color">
                <FormInput value={color} onChange={(e) => setColor(e.target.value)} placeholder="Black" />
              </FormField>
              <FormField label="Batch / lot">
                <FormInput value={batchNumber} onChange={(e) => setBatchNumber(e.target.value)} />
              </FormField>
              <FormField label="Supplier">
                <FormInput value={supplierName} onChange={(e) => setSupplierName(e.target.value)} />
              </FormField>
              <FormField label="OEM / brand">
                <FormInput value={oemBrand} onChange={(e) => setOemBrand(e.target.value)} />
              </FormField>
            </FormGrid>
          </FormSection>

          <FormSection title="Test program" icon={FlaskConical} bare>
            <FormGrid cols={1}>
              <FormField
                label="Apply program"
                hint="Each created sample will be linked to the program and pre-loaded with its test items."
              >
                <Select value={programId} onValueChange={setProgramId} disabled={loadingPrograms}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder={loadingPrograms ? 'Loading…' : 'No program (manual)'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No program (assign later)</SelectItem>
                    {programs.map((p: any) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                        {p.material_type ? ` · ${p.material_type}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
            </FormGrid>

            {selectedProgram && (
              <div className="rounded-md border border-border bg-card-muted p-3 mt-2">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Tests to be created per sample
                  </div>
                  <Badge variant="secondary">{programItemIds.length} items</Badge>
                </div>
                {programItemIds.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    This program has no test items configured yet.
                  </p>
                ) : (
                  <ScrollArea className="max-h-32">
                    <ul className="text-xs space-y-1 pr-2">
                      {((selectedProgram as any).test_program_items ?? [])
                        .slice()
                        .sort((a: any, b: any) => (a.display_order ?? 0) - (b.display_order ?? 0))
                        .map((it: any) => (
                          <li key={it.id} className="flex items-center justify-between gap-2">
                            <span>{it.test_items?.name ?? `Test #${it.test_item_id}`}</span>
                            <span className="text-muted-foreground">
                              {it.test_items?.category}
                              {it.test_items?.unit ? ` · ${it.test_items.unit}` : ''}
                            </span>
                          </li>
                        ))}
                    </ul>
                  </ScrollArea>
                )}
              </div>
            )}
          </FormSection>

          {request.scope && (
            <FormSection title="Requested scope (read-only)" bare>
              <FormTextarea readOnly rows={2} value={request.scope} className="bg-muted/40" />
            </FormSection>
          )}

          <div className="flex items-center justify-between rounded-md border border-border bg-card-muted px-3 py-2">
            <div>
              <div className="text-sm font-medium">Move request to “In Progress”</div>
              <div className="text-xs text-muted-foreground">
                Only applies if the request is currently Requested, Quoted or Approved.
              </div>
            </div>
            <Switch checked={promote} onCheckedChange={setPromote} />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
            <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={busy}>
              Cancel
            </Button>
            <Button onClick={onSubmit} disabled={busy}>
              <Sparkles className="h-4 w-4 mr-1" />
              {busy ? 'Creating…' : `Create ${count} sample${count === 1 ? '' : 's'}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
