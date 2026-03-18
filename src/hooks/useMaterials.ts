import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useMaterials() {
  return useQuery({
    queryKey: ['materials'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('materials')
        .select('*, test_programs(id, name)')
        .order('name');
      if (error) throw error;
      return data;
    },
  });
}

export function useMaterialSuppliers(materialId: string | null) {
  return useQuery({
    queryKey: ['material-suppliers', materialId],
    enabled: !!materialId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('material_suppliers')
        .select('*, suppliers(id, name)')
        .eq('material_id', materialId!);
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateMaterial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (mat: { name: string; material_type?: string; weight_gsm?: number; width_cm?: number; composition?: string; color?: string; finish?: string; default_test_program_id?: string; notes?: string }) => {
      const { data, error } = await supabase.from('materials').insert(mat).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['materials'] }),
  });
}

export function useUpdateMaterial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: unknown }) => {
      const { data, error } = await supabase.from('materials').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['materials'] }),
  });
}

export function useDeleteMaterial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('materials').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['materials'] }),
  });
}

export function useAddMaterialSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (link: { material_id: string; supplier_id: string; grade?: string; unit_price?: number; notes?: string }) => {
      const { data, error } = await supabase.from('material_suppliers').insert(link).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ['material-suppliers', vars.material_id] }),
  });
}

export function useRemoveMaterialSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, materialId }: { id: string; materialId: string }) => {
      const { error } = await supabase.from('material_suppliers').delete().eq('id', id);
      if (error) throw error;
      return materialId;
    },
    onSuccess: (materialId) => qc.invalidateQueries({ queryKey: ['material-suppliers', materialId] }),
  });
}
