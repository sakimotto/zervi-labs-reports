import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type DbCustomer = Tables<'customers'>;
export type DbCustomerInsert = TablesInsert<'customers'>;
export type DbCustomerUpdate = TablesUpdate<'customers'>;

export const CUSTOMER_TYPES = ['OEM', 'Client', 'Distributor', 'Internal', 'Other'] as const;
export const CUSTOMER_STATUSES = ['Active', 'Prospect', 'On Hold', 'Inactive'] as const;

export function useCustomers() {
  return useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('name');
      if (error) throw error;
      return data as DbCustomer[];
    },
  });
}

export function useCustomer(id: string | null) {
  return useQuery({
    queryKey: ['customers', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase.from('customers').select('*').eq('id', id!).single();
      if (error) throw error;
      return data as DbCustomer;
    },
  });
}

export function useCreateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (customer: DbCustomerInsert) => {
      const { data, error } = await supabase.from('customers').insert(customer).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customers'] }),
  });
}

export function useUpdateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<DbCustomerUpdate>) => {
      const { data, error } = await supabase.from('customers').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['customers'] });
      qc.invalidateQueries({ queryKey: ['customers', vars.id] });
    },
  });
}

export function useDeleteCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('customers').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customers'] }),
  });
}

// ---------------- Samples linked to a customer ----------------
export function useCustomerSamples(customerId: string | null) {
  return useQuery({
    queryKey: ['customer_samples', customerId],
    enabled: !!customerId,
    queryFn: async () => {
      // Samples linked either via customer_id FK or via the legacy oem_brand text field
      const { data: viaFk, error } = await supabase
        .from('samples')
        .select('id, sample_id, status, overall_judgment, received_date, product_name, oem_brand')
        .eq('customer_id', customerId!)
        .order('received_date', { ascending: false })
        .limit(200);
      if (error) throw error;
      return viaFk;
    },
  });
}

// ---------------- OEM specifications linked via customer name ----------------
export function useCustomerSpecifications(customerName: string | null) {
  return useQuery({
    queryKey: ['customer_specifications', customerName],
    enabled: !!customerName,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('oem_specifications')
        .select('id, spec_code, spec_name, version, status, oem_brand')
        .eq('oem_brand', customerName!)
        .order('spec_code');
      if (error) {
        // table may not exist in all installs; swallow gracefully
        if ((error as any).code === '42P01') return [];
        throw error;
      }
      return data ?? [];
    },
  });
}
