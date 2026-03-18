import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useStandards() {
  return useQuery({
    queryKey: ['standards'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('standards')
        .select('*')
        .order('code');
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateStandard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (s: { code: string; version?: string; title?: string; organization?: string; document_url?: string }) => {
      const { data, error } = await supabase.from('standards').insert(s).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['standards'] }),
  });
}

export function useDeleteStandard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('standards').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['standards'] }),
  });
}

export function useOemSpecifications() {
  return useQuery({
    queryKey: ['oem-specifications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('oem_specifications')
        .select('*')
        .order('oem_brand, spec_code');
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateOemSpecification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (s: { oem_brand: string; spec_code: string; version?: string; title?: string; region?: string }) => {
      const { data, error } = await supabase.from('oem_specifications').insert(s).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['oem-specifications'] }),
  });
}

export function useDeleteOemSpecification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('oem_specifications').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['oem-specifications'] }),
  });
}

export function useConditioningProfiles() {
  return useQuery({
    queryKey: ['conditioning-profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('conditioning_profiles')
        .select('*')
        .order('name');
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateConditioningProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: { name: string; temperature_c?: number; humidity_percent?: number; duration_hours?: number; description?: string }) => {
      const { data, error } = await supabase.from('conditioning_profiles').insert(p).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['conditioning-profiles'] }),
  });
}

export function useDeleteConditioningProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('conditioning_profiles').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['conditioning-profiles'] }),
  });
}
