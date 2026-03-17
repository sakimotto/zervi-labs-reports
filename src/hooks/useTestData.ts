import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

export type DbTestItem = Tables<'test_items'>;
export type DbTestRequirement = Tables<'test_requirements'>;
export type DbTestResult = Tables<'test_results'>;

export function useTestItems() {
  return useQuery({
    queryKey: ['test-items'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('test_items')
        .select('*')
        .eq('is_active', true)
        .order('display_order');
      if (error) throw error;
      return data as DbTestItem[];
    },
  });
}

export function useTestRequirements(oemBrand?: string) {
  return useQuery({
    queryKey: ['test-requirements', oemBrand],
    queryFn: async () => {
      let query = supabase
        .from('test_requirements')
        .select('*')
        .eq('is_active', true);
      if (oemBrand) query = query.eq('oem_brand', oemBrand);
      const { data, error } = await query;
      if (error) throw error;
      return data as DbTestRequirement[];
    },
  });
}

export function useTestResults(sampleId: string | null) {
  return useQuery({
    queryKey: ['test-results', sampleId],
    enabled: !!sampleId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('test_results')
        .select('*')
        .eq('sample_id', sampleId!);
      if (error) throw error;
      return data as DbTestResult[];
    },
  });
}

export function useUpsertTestResult() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (result: Partial<DbTestResult> & { sample_id: string; test_item_id: number }) => {
      // Check if result exists
      const { data: existing } = await supabase
        .from('test_results')
        .select('id')
        .eq('sample_id', result.sample_id)
        .eq('test_item_id', result.test_item_id)
        .eq('direction', result.direction ?? '')
        .maybeSingle();

      if (existing) {
        const { data, error } = await supabase
          .from('test_results')
          .update(result)
          .eq('id', existing.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('test_results')
          .insert(result)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ['test-results', vars.sample_id] }),
  });
}

export function autoJudge(value: number | null, req?: DbTestRequirement): 'OK' | 'NG' | 'Pending' {
  if (value === null || !req) return 'Pending';
  if (req.min_value !== null && value < req.min_value) return 'NG';
  if (req.max_value !== null && value > req.max_value) return 'NG';
  return 'OK';
}
