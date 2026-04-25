import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useTestPrograms() {
  return useQuery({
    queryKey: ['test-programs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('test_programs')
        .select('*, test_program_items(*, test_items(id, name, category, unit))')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data;
    },
  });
}

export function useTestProgram(id: string | null) {
  return useQuery({
    queryKey: ['test-programs', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('test_programs')
        .select('*, test_program_items(*, test_items(id, name, category, unit, direction_required, multiple_samples, sample_count, equipment_required))')
        .eq('id', id!)
        .single();
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateTestProgram() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ program, testItemIds }: { program: { name: string; description?: string; material_type?: string; report_title?: string; report_header_notes?: string; report_footer_notes?: string }; testItemIds: number[] }) => {
      const { data, error } = await supabase
        .from('test_programs')
        .insert(program)
        .select()
        .single();
      if (error) throw error;

      if (testItemIds.length > 0) {
        const items = testItemIds.map((tid, i) => ({
          program_id: data.id,
          test_item_id: tid,
          display_order: i,
        }));
        const { error: itemsError } = await supabase
          .from('test_program_items')
          .insert(items);
        if (itemsError) throw itemsError;
      }
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['test-programs'] }),
  });
}

export function useUpdateTestProgramItems() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ programId, testItemIds }: { programId: string; testItemIds: number[] }) => {
      // Delete existing
      await supabase.from('test_program_items').delete().eq('program_id', programId);
      // Insert new
      if (testItemIds.length > 0) {
        const items = testItemIds.map((tid, i) => ({
          program_id: programId,
          test_item_id: tid,
          display_order: i,
        }));
        const { error } = await supabase.from('test_program_items').insert(items);
        if (error) throw error;
      }
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['test-programs'] });
      qc.invalidateQueries({ queryKey: ['test-programs', vars.programId] });
    },
  });
}

export function useDeleteTestProgram() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('test_programs').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['test-programs'] }),
  });
}

// Get test items assigned to a specific sample (via program or override)
export function useSampleTestItems(sampleId: string | null, programId?: string | null) {
  return useQuery({
    queryKey: ['sample-test-items', sampleId, programId],
    enabled: !!sampleId,
    queryFn: async () => {
      // Check for per-sample overrides first
      const { data: overrides } = await supabase
        .from('sample_test_items')
        .select('test_item_id, display_order')
        .eq('sample_id', sampleId!)
        .order('display_order');

      if (overrides && overrides.length > 0) {
        return overrides.map(o => o.test_item_id);
      }

      // Fall back to program items
      if (programId) {
        const { data: programItems } = await supabase
          .from('test_program_items')
          .select('test_item_id, display_order')
          .eq('program_id', programId)
          .order('display_order');
        if (programItems) {
          return programItems.map(p => p.test_item_id);
        }
      }

      // No program, no overrides — return null (show all)
      return null;
    },
  });
}

export function useSaveSampleTestItems() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ sampleId, testItemIds }: { sampleId: string; testItemIds: number[] }) => {
      await supabase.from('sample_test_items').delete().eq('sample_id', sampleId);
      if (testItemIds.length > 0) {
        const items = testItemIds.map((tid, i) => ({
          sample_id: sampleId,
          test_item_id: tid,
          display_order: i,
        }));
        const { error } = await supabase.from('sample_test_items').insert(items);
        if (error) throw error;
      }
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['sample-test-items', vars.sampleId] });
    },
  });
}
