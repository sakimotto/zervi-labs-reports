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
