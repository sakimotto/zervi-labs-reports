import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert } from '@/integrations/supabase/types';

export type DbSOP = Tables<'sops'>;
export type DbSOPInsert = TablesInsert<'sops'>;
export type DbSOPVersion = Tables<'sop_versions'>;
export type DbSOPVersionInsert = TablesInsert<'sop_versions'>;

export function useSOPs() {
  return useQuery({
    queryKey: ['sops'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sops')
        .select('*, test_items(name)')
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useSOP(id: string | null) {
  return useQuery({
    queryKey: ['sops', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sops')
        .select('*, test_items(name)')
        .eq('id', id!)
        .single();
      if (error) throw error;
      return data;
    },
  });
}

export function useSOPVersions(sopId: string | null) {
  return useQuery({
    queryKey: ['sop-versions', sopId],
    enabled: !!sopId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sop_versions')
        .select('*')
        .eq('sop_id', sopId!)
        .order('version_number', { ascending: false });
      if (error) throw error;
      return data as DbSOPVersion[];
    },
  });
}

export function useCreateSOP() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ sop, version }: { sop: DbSOPInsert; version: Omit<DbSOPVersionInsert, 'sop_id'> }) => {
      const { data: sopData, error: sopError } = await supabase
        .from('sops')
        .insert(sop)
        .select()
        .single();
      if (sopError) throw sopError;

      const { error: verError } = await supabase
        .from('sop_versions')
        .insert({ ...version, sop_id: sopData.id });
      if (verError) throw verError;

      return sopData;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sops'] }),
  });
}

export function useUpdateSOP() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<DbSOP> & { id: string }) => {
      const { data, error } = await supabase.from('sops').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['sops'] });
      qc.invalidateQueries({ queryKey: ['sops', data.id] });
    },
  });
}

export function useCreateSOPVersion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (version: DbSOPVersionInsert) => {
      const { data, error } = await supabase.from('sop_versions').insert(version).select().single();
      if (error) throw error;
      // Update parent SOP current_version
      await supabase.from('sops').update({ current_version: data.version_number }).eq('id', version.sop_id);
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['sop-versions', vars.sop_id] });
      qc.invalidateQueries({ queryKey: ['sops'] });
    },
  });
}

export function useDeleteSOP() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('sops').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sops'] }),
  });
}
