import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type DbSample = Tables<'samples'>;
export type DbSampleInsert = TablesInsert<'samples'>;

export function useSamples() {
  return useQuery({
    queryKey: ['samples'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('samples')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as DbSample[];
    },
  });
}

export function useSample(id: string | null) {
  return useQuery({
    queryKey: ['samples', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('samples')
        .select('*')
        .eq('id', id!)
        .single();
      if (error) throw error;
      return data as DbSample;
    },
  });
}

export function useCreateSample() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (sample: DbSampleInsert) => {
      const { data, error } = await supabase
        .from('samples')
        .insert(sample)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['samples'] }),
  });
}

export function useUpdateSample() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<TablesUpdate<'samples'>>) => {
      const { data, error } = await supabase
        .from('samples')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['samples'] });
      qc.invalidateQueries({ queryKey: ['samples', data.id] });
    },
  });
}

export function useDeleteSample() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('samples').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['samples'] }),
  });
}

export interface CreateSamplesFromRequestArgs {
  request: {
    id: string;
    customer_id: string | null;
    request_number: string;
    materials_description?: string | null;
    priority?: string | null;
    requested_date?: string | null;
    contact_person?: string | null;
  };
  count: number;
  productNamePrefix: string;
  testProgramId?: string | null;
  testItemIds?: number[]; // resolved from program (or manually picked)
  baseFields?: Partial<Pick<DbSampleInsert,
    'composition' | 'color' | 'fabric_type' | 'base_type' | 'supplier_name' |
    'application' | 'oem_brand' | 'batch_number' | 'material_id' | 'supplier_id' | 'oem_specification_id'
  >>;
  markRequestInProgress?: boolean;
}

/**
 * Bulk-create samples linked to a customer test request.
 * - Reserves a contiguous range of ZV-TR-YYYY-NNNN IDs
 * - Links each sample to customer + request + (optional) test program
 * - Inserts sample_test_items for every test item in the program
 * - Optionally promotes the request from "Requested/Approved" to "In Progress"
 */
export function useCreateSamplesFromRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: CreateSamplesFromRequestArgs) => {
      const { request, count, productNamePrefix, testProgramId, testItemIds = [], baseFields = {}, markRequestInProgress } = args;
      if (count < 1) throw new Error('Count must be at least 1');
      if (count > 50) throw new Error('Cannot create more than 50 samples at once');

      // Reserve a contiguous block of sample IDs based on the latest sample for the year
      const year = new Date().getFullYear();
      const { data: latest, error: latestErr } = await supabase
        .from('samples')
        .select('sample_id')
        .like('sample_id', `ZV-TR-${year}-%`)
        .order('sample_id', { ascending: false })
        .limit(1);
      if (latestErr) throw latestErr;

      const startNum = latest?.[0]
        ? parseInt(latest[0].sample_id.split('-').pop() || '0', 10) + 1
        : 1;

      const today = new Date().toISOString().slice(0, 10);
      const priorityMap: Record<string, 'Normal' | 'Urgent' | 'Critical'> = {
        Low: 'Normal', Normal: 'Normal', High: 'Urgent', Urgent: 'Critical',
      };
      const samplePriority = priorityMap[request.priority ?? 'Normal'] ?? 'Normal';

      const rows: DbSampleInsert[] = Array.from({ length: count }, (_, i) => {
        const seq = String(startNum + i).padStart(4, '0');
        const suffix = count > 1 ? ` (${i + 1}/${count})` : '';
        return {
          sample_id: `ZV-TR-${year}-${seq}`,
          product_name: `${productNamePrefix}${suffix}`,
          customer_id: request.customer_id,
          test_request_id: request.id,
          test_program_id: testProgramId ?? null,
          received_date: today,
          requested_by: request.contact_person ?? null,
          priority: samplePriority,
          status: 'Pending',
          overall_judgment: 'Pending',
          ...baseFields,
        } as DbSampleInsert;
      });

      const { data: created, error: insertErr } = await supabase
        .from('samples')
        .insert(rows)
        .select('id, sample_id');
      if (insertErr) throw insertErr;

      // Wire test items to each new sample (for judgment tracking + report rendering)
      if (created && testItemIds.length > 0) {
        const links = created.flatMap((s) =>
          testItemIds.map((tid, idx) => ({
            sample_id: s.id,
            test_item_id: tid,
            display_order: idx,
            include_in_report: true,
          })),
        );
        if (links.length > 0) {
          const { error: linkErr } = await supabase.from('sample_test_items').insert(links);
          if (linkErr) throw linkErr;
        }
      }

      if (markRequestInProgress) {
        await supabase
          .from('customer_test_requests')
          .update({ status: 'In Progress' })
          .eq('id', request.id)
          .in('status', ['Requested', 'Quoted', 'Approved']);
      }

      return created ?? [];
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['samples'] });
      qc.invalidateQueries({ queryKey: ['request_samples', vars.request.id] });
      qc.invalidateQueries({ queryKey: ['customer_test_requests', vars.request.customer_id] });
      qc.invalidateQueries({ queryKey: ['test_requests'] });
    },
  });
}

export function useNextSampleId() {
  return useQuery({
    queryKey: ['next-sample-id'],
    queryFn: async () => {
      const year = new Date().getFullYear();
      const { data } = await supabase
        .from('samples')
        .select('sample_id')
        .like('sample_id', `ZV-TR-${year}-%`)
        .order('sample_id', { ascending: false })
        .limit(1);
      
      const lastNum = data?.[0]
        ? parseInt(data[0].sample_id.split('-').pop() || '0', 10)
        : 0;
      return `ZV-TR-${year}-${String(lastNum + 1).padStart(4, '0')}`;
    },
  });
}
