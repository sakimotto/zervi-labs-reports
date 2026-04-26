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
        .select('*, customers(name, customer_code)')
        .order('requested_date', { ascending: false });
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
