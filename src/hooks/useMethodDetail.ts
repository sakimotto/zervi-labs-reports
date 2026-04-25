import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type DbTestItem = Tables<'test_items'>;
export type DbMethodVersion = Tables<'method_versions'>;
export type DbMethodStandard = Tables<'method_standards'>;
export type DbMethodEquipment = Tables<'method_equipment'>;
export type DbMethodDirection = Tables<'method_directions'>;
export type DbMethodConditioning = Tables<'method_conditioning'>;
export type DbMethodProcedureStep = Tables<'method_procedure_steps'>;
export type DbMethodParameter = Tables<'method_parameters'>;
export type DbMethodCalculation = Tables<'method_calculations'>;
export type DbMethodAcceptance = Tables<'method_acceptance'>;
export type DbMethodAudit = Tables<'method_audit'>;

const RELATION_TABLES = [
  'method_versions',
  'method_standards',
  'method_equipment',
  'method_directions',
  'method_conditioning',
  'method_procedure_steps',
  'method_parameters',
  'method_calculations',
  'method_acceptance',
  'method_audit',
] as const;
type RelationTable = (typeof RELATION_TABLES)[number];

function relationKey(table: RelationTable, testItemId: number) {
  return [table, testItemId] as const;
}

export function useMethod(testItemId: number | null) {
  return useQuery({
    queryKey: ['test-item', testItemId],
    enabled: testItemId !== null,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('test_items')
        .select('*')
        .eq('id', testItemId!)
        .single();
      if (error) throw error;
      return data;
    },
  });
}

export function useUpdateMethod() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: number; patch: TablesUpdate<'test_items'> }) => {
      const { data, error } = await supabase
        .from('test_items')
        .update(patch)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;

      // log audit
      const { data: user } = await supabase.auth.getUser();
      await supabase.from('method_audit').insert({
        test_item_id: id,
        action: 'update',
        changed_by: user.user?.id,
        changed_by_name: user.user?.email ?? null,
        details: patch as any,
      });

      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['test-item', vars.id] });
      qc.invalidateQueries({ queryKey: ['test-items'] });
      qc.invalidateQueries({ queryKey: relationKey('method_audit', vars.id) });
    },
  });
}

function makeListHook<T extends RelationTable>(table: T, orderBy?: string) {
  return (testItemId: number | null) =>
    useQuery({
      queryKey: relationKey(table, testItemId ?? -1),
      enabled: testItemId !== null,
      queryFn: async () => {
        let q = supabase.from(table).select('*').eq('test_item_id', testItemId!);
        if (orderBy) q = q.order(orderBy);
        const { data, error } = await q;
        if (error) throw error;
        return data as Tables<T>[];
      },
    });
}

export const useMethodVersions = makeListHook('method_versions', 'version_number');
export const useMethodStandards = makeListHook('method_standards', 'display_order');
export const useMethodEquipment = makeListHook('method_equipment', 'display_order');
export const useMethodDirections = makeListHook('method_directions');
export const useMethodConditioning = makeListHook('method_conditioning');
export const useMethodProcedureSteps = makeListHook('method_procedure_steps', 'step_number');
export const useMethodParameters = makeListHook('method_parameters', 'display_order');
export const useMethodCalculations = makeListHook('method_calculations', 'display_order');
export const useMethodAcceptance = makeListHook('method_acceptance', 'display_order');

export function useMethodAudit(testItemId: number | null) {
  return useQuery({
    queryKey: relationKey('method_audit', testItemId ?? -1),
    enabled: testItemId !== null,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('method_audit')
        .select('*')
        .eq('test_item_id', testItemId!)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as DbMethodAudit[];
    },
  });
}

export function useInsertRelation<T extends RelationTable>(table: T) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (row: TablesInsert<T>) => {
      const { data, error } = await (supabase.from(table) as any).insert(row).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars: any) => {
      qc.invalidateQueries({ queryKey: relationKey(table, vars.test_item_id) });
    },
  });
}

export function useUpdateRelation<T extends RelationTable>(table: T) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch, testItemId }: { id: string; patch: any; testItemId: number }) => {
      const { data, error } = await (supabase.from(table) as any).update(patch).eq('id', id).select().single();
      if (error) throw error;
      return { data, testItemId };
    },
    onSuccess: ({ testItemId }) => {
      qc.invalidateQueries({ queryKey: relationKey(table, testItemId) });
    },
  });
}

export function useDeleteRelation<T extends RelationTable>(table: T) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, testItemId }: { id: string; testItemId: number }) => {
      const { error } = await (supabase.from(table) as any).delete().eq('id', id);
      if (error) throw error;
      return testItemId;
    },
    onSuccess: (testItemId) => {
      qc.invalidateQueries({ queryKey: relationKey(table, testItemId) });
    },
  });
}

export async function createMethodVersion(testItemId: number, changeNotes?: string) {
  // get current method
  const { data: method, error: mErr } = await supabase
    .from('test_items').select('*').eq('id', testItemId).single();
  if (mErr) throw mErr;

  // get max version number
  const { data: versions } = await supabase
    .from('method_versions')
    .select('version_number')
    .eq('test_item_id', testItemId)
    .order('version_number', { ascending: false })
    .limit(1);

  const nextVersion = ((versions?.[0]?.version_number ?? 0) as number) + 1;

  const { data: user } = await supabase.auth.getUser();

  const { data, error } = await supabase.from('method_versions').insert({
    test_item_id: testItemId,
    version_number: nextVersion,
    status: 'Draft',
    change_notes: changeNotes ?? null,
    snapshot: method as any,
    prepared_by: user.user?.email ?? null,
  }).select().single();
  if (error) throw error;

  // bump version on test_item
  await supabase.from('test_items').update({ version: nextVersion }).eq('id', testItemId);

  await supabase.from('method_audit').insert({
    test_item_id: testItemId,
    action: 'version_created',
    changed_by: user.user?.id,
    changed_by_name: user.user?.email ?? null,
    details: { version_number: nextVersion, change_notes: changeNotes },
  });

  return data;
}
