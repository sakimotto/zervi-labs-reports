import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type DbTestRequest = Tables<'customer_test_requests'>;
export type DbTestRequestInsert = TablesInsert<'customer_test_requests'>;
export type DbTestRequestUpdate = TablesUpdate<'customer_test_requests'>;

export const REQUEST_STATUSES = [
  'Requested',
  'Quoted',
  'Approved',
  'In Progress',
  'Completed',
  'Reported',
  'Cancelled',
] as const;
export const REQUEST_PRIORITIES = ['Low', 'Normal', 'High', 'Urgent'] as const;

export const REQUEST_TYPES = [
  { value: 'customer', label: 'Customer (CTR)', description: 'External customer-commissioned testing' },
  { value: 'supplier', label: 'Supplier sample', description: 'Material submitted by a supplier for evaluation' },
  { value: 'incoming_goods', label: 'Incoming goods', description: 'Routine inspection of a received batch' },
  { value: 'internal_qa', label: 'Internal QA', description: 'In-house verification or re-test' },
  { value: 'production_issue', label: 'Production issue', description: 'Investigation triggered by a production problem' },
  { value: 'rd_trial', label: 'R&D trial', description: 'Development or experimental testing' },
] as const;

export type RequestType = typeof REQUEST_TYPES[number]['value'];

export function useCustomerTestRequests(customerId: string | null) {
  return useQuery({
    queryKey: ['customer_test_requests', customerId],
    enabled: !!customerId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customer_test_requests')
        .select('*')
        .eq('customer_id', customerId!)
        .order('requested_date', { ascending: false });
      if (error) throw error;
      return data as DbTestRequest[];
    },
  });
}

export function useAllTestRequests() {
  return useQuery({
    queryKey: ['test_requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customer_test_requests')
        .select('*, customers(name, customer_code), suppliers(name, supplier_code)')
        .order('requested_date', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useTestRequest(id: string | null) {
  return useQuery({
    queryKey: ['test_requests', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customer_test_requests')
        .select('*, customers(id, name, customer_code), suppliers(id, name, supplier_code), test_programs(id, name)')
        .eq('id', id!)
        .single();
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateTestRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (req: Omit<DbTestRequestInsert, 'request_number'> & { request_number?: string }) => {
      const payload = { ...req };
      if (!payload.request_number) delete (payload as any).request_number;
      const { data, error } = await supabase
        .from('customer_test_requests')
        .insert(payload as DbTestRequestInsert)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_d, vars: any) => {
      qc.invalidateQueries({ queryKey: ['customer_test_requests', vars.customer_id] });
      qc.invalidateQueries({ queryKey: ['test_requests'] });
    },
  });
}

export function useUpdateTestRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<DbTestRequestUpdate>) => {
      const { data, error } = await supabase
        .from('customer_test_requests')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data: any) => {
      qc.invalidateQueries({ queryKey: ['customer_test_requests', data?.customer_id] });
      qc.invalidateQueries({ queryKey: ['test_requests'] });
      qc.invalidateQueries({ queryKey: ['test_requests', data?.id] });
    },
  });
}

export function useDeleteTestRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('customer_test_requests').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customer_test_requests'] });
      qc.invalidateQueries({ queryKey: ['test_requests'] });
    },
  });
}

// Samples linked to a test request
export function useRequestSamples(requestId: string | null) {
  return useQuery({
    queryKey: ['request_samples', requestId],
    enabled: !!requestId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('samples')
        .select('id, sample_id, product_name, status, overall_judgment, received_date')
        .eq('test_request_id', requestId!)
        .order('received_date', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

// ---- Methods linked to a request -------------------------------------------------
export function useRequestMethods(requestId: string | null) {
  return useQuery({
    queryKey: ['request_methods', requestId],
    enabled: !!requestId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('test_request_methods')
        .select('*, test_items(id, name, category, unit, direction_required)')
        .eq('request_id', requestId!)
        .order('display_order');
      if (error) throw error;
      return data;
    },
  });
}

export function useAddRequestMethods() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ requestId, testItemIds }: { requestId: string; testItemIds: number[] }) => {
      if (testItemIds.length === 0) return [];
      const rows = testItemIds.map((tid, i) => ({
        request_id: requestId,
        test_item_id: tid,
        display_order: i,
      }));
      const { data, error } = await supabase
        .from('test_request_methods')
        .upsert(rows, { onConflict: 'request_id,test_item_id,direction', ignoreDuplicates: true })
        .select();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ['request_methods', vars.requestId] }),
  });
}

export function useRemoveRequestMethod() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string; requestId: string }) => {
      const { error } = await supabase.from('test_request_methods').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ['request_methods', vars.requestId] }),
  });
}

// ---- Materials linked to a request ----------------------------------------------
export function useRequestMaterials(requestId: string | null) {
  return useQuery({
    queryKey: ['request_materials', requestId],
    enabled: !!requestId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('test_request_materials')
        .select('*, materials(id, name, material_code, material_type)')
        .eq('request_id', requestId!)
        .order('display_order');
      if (error) throw error;
      return data;
    },
  });
}

export function useAddRequestMaterials() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ requestId, materialIds }: { requestId: string; materialIds: string[] }) => {
      if (materialIds.length === 0) return [];
      const rows = materialIds.map((mid, i) => ({
        request_id: requestId,
        material_id: mid,
        display_order: i,
      }));
      const { data, error } = await supabase
        .from('test_request_materials')
        .upsert(rows, { onConflict: 'request_id,material_id', ignoreDuplicates: true })
        .select();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ['request_materials', vars.requestId] }),
  });
}

export function useRemoveRequestMaterial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string; requestId: string }) => {
      const { error } = await supabase.from('test_request_materials').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ['request_materials', vars.requestId] }),
  });
}
