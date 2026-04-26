import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type DbSupplier = Tables<'suppliers'>;
export type DbSupplierInsert = TablesInsert<'suppliers'>;
export type DbSupplierUpdate = TablesUpdate<'suppliers'>;
export type DbSupplierDocument = Tables<'supplier_documents'>;
export type DbSupplierDocumentInsert = TablesInsert<'supplier_documents'>;

export const SUPPLIER_TYPES = ['Manufacturer', 'Distributor', 'Trader', 'Service Provider', 'Other'] as const;
export const SUPPLIER_STATUSES = ['Active', 'On Hold', 'Inactive', 'Blacklisted'] as const;
export const APPROVAL_STATUSES = ['Pending', 'Approved', 'Rejected'] as const;

export function useSuppliers() {
  return useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .order('name');
      if (error) throw error;
      return data as DbSupplier[];
    },
  });
}

export function useSupplier(id: string | null) {
  return useQuery({
    queryKey: ['suppliers', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase.from('suppliers').select('*').eq('id', id!).single();
      if (error) throw error;
      return data as DbSupplier;
    },
  });
}

export function useCreateSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (supplier: DbSupplierInsert) => {
      const { data, error } = await supabase.from('suppliers').insert(supplier).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['suppliers'] }),
  });
}

export function useUpdateSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<DbSupplierUpdate>) => {
      const { data, error } = await supabase.from('suppliers').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['suppliers'] });
      qc.invalidateQueries({ queryKey: ['suppliers', vars.id] });
    },
  });
}

export function useDeleteSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('suppliers').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['suppliers'] }),
  });
}

// ---------------- Supplier documents ----------------
export function useSupplierDocuments(supplierId: string | null) {
  return useQuery({
    queryKey: ['supplier_documents', supplierId],
    enabled: !!supplierId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('supplier_documents')
        .select('*')
        .eq('supplier_id', supplierId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as DbSupplierDocument[];
    },
  });
}

export function useCreateSupplierDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (doc: DbSupplierDocumentInsert) => {
      const { data, error } = await supabase.from('supplier_documents').insert(doc).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_d, vars) =>
      qc.invalidateQueries({ queryKey: ['supplier_documents', vars.supplier_id] }),
  });
}

export function useDeleteSupplierDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string; supplier_id: string }) => {
      const { error } = await supabase.from('supplier_documents').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_d, vars) =>
      qc.invalidateQueries({ queryKey: ['supplier_documents', vars.supplier_id] }),
  });
}

// ---------------- Materials linked to a supplier ----------------
export function useSupplierMaterials(supplierId: string | null) {
  return useQuery({
    queryKey: ['supplier_materials', supplierId],
    enabled: !!supplierId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('material_suppliers')
        .select('id, grade, unit_price, notes, materials(id, name, material_type, status, material_code)')
        .eq('supplier_id', supplierId!);
      if (error) throw error;
      return data;
    },
  });
}

// ---------------- Samples sourced from supplier ----------------
export function useSupplierSamples(supplierId: string | null) {
  return useQuery({
    queryKey: ['supplier_samples', supplierId],
    enabled: !!supplierId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('samples')
        .select('id, sample_id, status, overall_judgment, received_date, product_name')
        .eq('supplier_id', supplierId!)
        .order('received_date', { ascending: false })
        .limit(200);
      if (error) throw error;
      return data;
    },
  });
}
