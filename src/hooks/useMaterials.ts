import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type DbMaterial = Tables<'materials'>;
export type DbMaterialInsert = TablesInsert<'materials'>;
export type DbMaterialUpdate = TablesUpdate<'materials'>;
export type DbMaterialCertification = Tables<'material_certifications'>;
export type DbMaterialVersion = Tables<'material_versions'>;
export type DbMaterialAudit = Tables<'material_audit'>;

// ---------- Materials ----------
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

export function useMaterial(id: string | null) {
  return useQuery({
    queryKey: ['materials', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('materials')
        .select('*, test_programs(id, name)')
        .eq('id', id!)
        .single();
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateMaterial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (mat: Partial<DbMaterialInsert> & { name: string }) => {
      const { data, error } = await supabase.from('materials').insert(mat as DbMaterialInsert).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['materials'] }),
  });
}

export function useUpdateMaterial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<DbMaterialUpdate>) => {
      const { data, error } = await supabase.from('materials').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['materials'] });
      qc.invalidateQueries({ queryKey: ['materials', data.id] });
    },
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

// ---------- Material Suppliers ----------
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

// ---------- Certifications ----------
export function useMaterialCertifications(materialId: string | null) {
  return useQuery({
    queryKey: ['material-certifications', materialId],
    enabled: !!materialId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('material_certifications')
        .select('*')
        .eq('material_id', materialId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as DbMaterialCertification[];
    },
  });
}

export function useAddMaterialCertification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (cert: TablesInsert<'material_certifications'>) => {
      const { data, error } = await supabase.from('material_certifications').insert(cert).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ['material-certifications', vars.material_id] }),
  });
}

export function useDeleteMaterialCertification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, materialId }: { id: string; materialId: string }) => {
      const { error } = await supabase.from('material_certifications').delete().eq('id', id);
      if (error) throw error;
      return materialId;
    },
    onSuccess: (materialId) => qc.invalidateQueries({ queryKey: ['material-certifications', materialId] }),
  });
}

// ---------- Versions ----------
export function useMaterialVersions(materialId: string | null) {
  return useQuery({
    queryKey: ['material-versions', materialId],
    enabled: !!materialId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('material_versions')
        .select('*')
        .eq('material_id', materialId!)
        .order('version_number', { ascending: false });
      if (error) throw error;
      return data as DbMaterialVersion[];
    },
  });
}

export function useCreateMaterialVersion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ materialId, changeNotes, preparedBy }: { materialId: string; changeNotes?: string; preparedBy?: string }) => {
      const { data: existing } = await supabase
        .from('material_versions')
        .select('version_number')
        .eq('material_id', materialId)
        .order('version_number', { ascending: false })
        .limit(1);
      const nextVersion = existing && existing.length > 0 ? existing[0].version_number + 1 : 1;
      const { data: matSnap } = await supabase.from('materials').select('*').eq('id', materialId).single();

      const { data, error } = await supabase
        .from('material_versions')
        .insert({
          material_id: materialId,
          version_number: nextVersion,
          status: 'Draft',
          change_notes: changeNotes,
          prepared_by: preparedBy,
          snapshot: matSnap as never,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ['material-versions', vars.materialId] }),
  });
}

export function useApproveMaterialVersion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ versionId, materialId, approvedBy }: { versionId: string; materialId: string; approvedBy: string }) => {
      // Mark previous Active as Superseded
      await supabase
        .from('material_versions')
        .update({ status: 'Superseded', superseded_by: versionId })
        .eq('material_id', materialId)
        .eq('status', 'Active');
      // Approve target
      const { data, error } = await supabase
        .from('material_versions')
        .update({
          status: 'Active',
          approved_by: approvedBy,
          approved_at: new Date().toISOString(),
          effective_date: new Date().toISOString().slice(0, 10),
        })
        .eq('id', versionId)
        .select()
        .single();
      if (error) throw error;
      // Bump material's current_version + approval_status
      await supabase
        .from('materials')
        .update({ current_version: data.version_number, approval_status: 'Approved', status: 'Active' })
        .eq('id', materialId);
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['material-versions', vars.materialId] });
      qc.invalidateQueries({ queryKey: ['materials', vars.materialId] });
      qc.invalidateQueries({ queryKey: ['materials'] });
    },
  });
}

// ---------- Recommended Test Programs (M2M) ----------
export function useMaterialTestPrograms(materialId: string | null) {
  return useQuery({
    queryKey: ['material-test-programs', materialId],
    enabled: !!materialId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('material_test_programs')
        .select('*, test_programs(id, name, description)')
        .eq('material_id', materialId!)
        .order('priority');
      if (error) throw error;
      return data;
    },
  });
}

export function useAddMaterialTestProgram() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (link: { material_id: string; program_id: string; priority?: number; notes?: string }) => {
      const { data, error } = await supabase.from('material_test_programs').insert(link).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ['material-test-programs', vars.material_id] }),
  });
}

export function useRemoveMaterialTestProgram() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, materialId }: { id: string; materialId: string }) => {
      const { error } = await supabase.from('material_test_programs').delete().eq('id', id);
      if (error) throw error;
      return materialId;
    },
    onSuccess: (materialId) => qc.invalidateQueries({ queryKey: ['material-test-programs', materialId] }),
  });
}

// ---------- Test History ----------
export function useMaterialTestHistory(materialId: string | null) {
  return useQuery({
    queryKey: ['material-test-history', materialId],
    enabled: !!materialId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('samples')
        .select('id, sample_id, customer_name, overall_judgment, status, created_at')
        .eq('material_id', materialId!)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });
}

// ---------- Audit ----------
export function useMaterialAudit(materialId: string | null) {
  return useQuery({
    queryKey: ['material-audit', materialId],
    enabled: !!materialId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('material_audit')
        .select('*')
        .eq('material_id', materialId!)
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data as DbMaterialAudit[];
    },
  });
}
