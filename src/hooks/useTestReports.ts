import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type DbTestReport = Tables<'test_reports'>;
export type DbTestReportInsert = TablesInsert<'test_reports'>;
export type DbTestReportUpdate = TablesUpdate<'test_reports'>;

export const REPORT_STATUSES = ['Draft', 'Issued', 'Sent', 'Acknowledged', 'Revoked'] as const;

export function useCustomerReports(customerId: string | null) {
  return useQuery({
    queryKey: ['customer_reports', customerId],
    enabled: !!customerId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('test_reports')
        .select('*, samples(sample_id, product_name), customer_test_requests(request_number)')
        .eq('customer_id', customerId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useReportsForRequest(requestId: string | null) {
  return useQuery({
    queryKey: ['reports_for_request', requestId],
    enabled: !!requestId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('test_reports')
        .select('*')
        .eq('test_request_id', requestId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (report: Omit<DbTestReportInsert, 'report_number'> & { report_number?: string }) => {
      const payload = { ...report };
      if (!payload.report_number) delete (payload as any).report_number;
      const { data, error } = await supabase
        .from('test_reports')
        .insert(payload as DbTestReportInsert)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data: any) => {
      qc.invalidateQueries({ queryKey: ['customer_reports', data?.customer_id] });
      qc.invalidateQueries({ queryKey: ['reports_for_request', data?.test_request_id] });
    },
  });
}

export function useUpdateReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<DbTestReportUpdate>) => {
      const { data, error } = await supabase
        .from('test_reports')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data: any) => {
      qc.invalidateQueries({ queryKey: ['customer_reports', data?.customer_id] });
      qc.invalidateQueries({ queryKey: ['reports_for_request', data?.test_request_id] });
    },
  });
}

export function useDeleteReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('test_reports').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customer_reports'] }),
  });
}
