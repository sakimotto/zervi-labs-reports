import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type EventKind = 'test_job' | 'request_due' | 'calibration' | 'manual' | 'meeting';

export interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  kind: EventKind;
  starts_at: string;
  ends_at: string | null;
  all_day: boolean;
  color: string | null;
  location: string | null;
  owner_team_id: string | null;
  owner_user_id: string | null;
  sample_id: string | null;
  test_request_id: string | null;
  equipment_id: string | null;
  task_id: string | null;
  source: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  team?: { id: string; name: string; color: string } | null;
  sample?: { id: string; sample_id: string; product_name: string } | null;
}

export function useCalendarEvents(range?: { from: Date; to: Date }, kinds?: EventKind[]) {
  return useQuery({
    queryKey: ['calendar_events', range?.from?.toISOString(), range?.to?.toISOString(), kinds],
    queryFn: async () => {
      let q = supabase
        .from('calendar_events')
        .select(`
          *,
          team:lab_teams!calendar_events_owner_team_id_fkey(id, name, color),
          sample:samples(id, sample_id, product_name)
        `)
        .order('starts_at', { ascending: true });

      if (range) {
        q = q.gte('starts_at', range.from.toISOString()).lte('starts_at', range.to.toISOString());
      }
      if (kinds?.length) q = q.in('kind', kinds);

      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as unknown as CalendarEvent[];
    },
  });
}

export function useCreateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<CalendarEvent>) => {
      const { data: userRes } = await supabase.auth.getUser();
      const payload: any = {
        title: input.title,
        description: input.description || null,
        kind: input.kind || 'manual',
        starts_at: input.starts_at,
        ends_at: input.ends_at || null,
        all_day: input.all_day ?? true,
        color: input.color || null,
        location: input.location || null,
        owner_team_id: input.owner_team_id || null,
        owner_user_id: input.owner_user_id || null,
        sample_id: input.sample_id || null,
        test_request_id: input.test_request_id || null,
        equipment_id: input.equipment_id || null,
        task_id: input.task_id || null,
        source: 'manual',
        created_by: userRes.user?.id || null,
      };
      const { data, error } = await supabase.from('calendar_events').insert(payload).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['calendar_events'] });
      toast.success('Event added');
    },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useUpdateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<CalendarEvent> }) => {
      const { data, error } = await supabase.from('calendar_events').update(patch).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['calendar_events'] }),
    onError: (e: any) => toast.error(e.message),
  });
}

export function useDeleteEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('calendar_events').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['calendar_events'] });
      toast.success('Event deleted');
    },
    onError: (e: any) => toast.error(e.message),
  });
}
