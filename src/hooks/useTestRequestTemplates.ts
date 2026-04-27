import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type DbTestRequestTemplate = Tables<'test_request_templates'>;
export type DbTestRequestTemplateInsert = TablesInsert<'test_request_templates'>;
export type DbTestRequestTemplateUpdate = TablesUpdate<'test_request_templates'>;

const KEY = ['test_request_templates'] as const;

/** Active templates only — used by the Test Request form picker. */
export function useActiveTestRequestTemplates() {
  return useQuery({
    queryKey: [...KEY, 'active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('test_request_templates')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .order('label', { ascending: true });
      if (error) throw error;
      return (data ?? []) as DbTestRequestTemplate[];
    },
  });
}

/** All templates — used by the admin page (active + inactive). */
export function useAllTestRequestTemplates() {
  return useQuery({
    queryKey: [...KEY, 'all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('test_request_templates')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('label', { ascending: true });
      if (error) throw error;
      return (data ?? []) as DbTestRequestTemplate[];
    },
  });
}

export function useCreateTestRequestTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Omit<DbTestRequestTemplateInsert, 'id'>) => {
      const { data, error } = await supabase
        .from('test_request_templates')
        .insert(input)
        .select()
        .single();
      if (error) throw error;
      return data as DbTestRequestTemplate;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateTestRequestTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: { id: string } & DbTestRequestTemplateUpdate) => {
      const { data, error } = await supabase
        .from('test_request_templates')
        .update(patch)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as DbTestRequestTemplate;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteTestRequestTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('test_request_templates').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

/**
 * Reorder by setting sort_order on each row. Sends updates in parallel.
 * Caller passes the new ordered list of ids.
 */
export function useReorderTestRequestTemplates() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (orderedIds: string[]) => {
      // Reset to spaced-out values (10, 20, 30, …) so future inserts can slot in.
      await Promise.all(
        orderedIds.map((id, index) =>
          supabase
            .from('test_request_templates')
            .update({ sort_order: (index + 1) * 10 })
            .eq('id', id),
        ),
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
