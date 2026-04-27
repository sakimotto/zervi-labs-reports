import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type TaskStatus = 'todo' | 'in_progress' | 'blocked' | 'done' | 'cancelled';
export type TaskType = 'lab_work' | 'triage' | 'calibration' | 'maintenance' | 'manual' | 'ai_suggested';
export type TaskPriority = 'Low' | 'Normal' | 'High' | 'Urgent';

export interface Task {
  id: string;
  task_number: string;
  title: string;
  description: string | null;
  type: TaskType;
  status: TaskStatus;
  priority: TaskPriority;
  assignee_user_id: string | null;
  assignee_team_id: string | null;
  due_date: string | null;
  planned_date: string | null;
  estimated_hours: number | null;
  sample_id: string | null;
  test_request_id: string | null;
  sample_test_item_id: string | null;
  equipment_id: string | null;
  calibration_id: string | null;
  created_by: string | null;
  completed_at: string | null;
  ai_suggested: boolean;
  ai_rationale: string | null;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
  // joined
  team?: { id: string; name: string; color: string; slug: string } | null;
  sample?: { id: string; sample_id: string; product_name: string } | null;
  test_request?: { id: string; request_number: string } | null;
  equipment?: { id: string; name: string } | null;
}

export interface TaskFilters {
  status?: TaskStatus[];
  type?: TaskType[];
  priority?: TaskPriority[];
  team_id?: string;
  assignee_user_id?: string;
  due_before?: string;
  search?: string;
}

export function useTasks(filters: TaskFilters = {}) {
  return useQuery({
    queryKey: ['tasks', filters],
    queryFn: async () => {
      let q = supabase
        .from('tasks')
        .select(`
          *,
          team:lab_teams!tasks_assignee_team_id_fkey(id, name, color, slug),
          sample:samples(id, sample_id, product_name),
          test_request:customer_test_requests(id, request_number),
          equipment(id, name)
        `)
        .order('priority', { ascending: false })
        .order('due_date', { ascending: true, nullsFirst: false });

      if (filters.status?.length) q = q.in('status', filters.status);
      if (filters.type?.length) q = q.in('type', filters.type);
      if (filters.priority?.length) q = q.in('priority', filters.priority);
      if (filters.team_id) q = q.eq('assignee_team_id', filters.team_id);
      if (filters.assignee_user_id) q = q.eq('assignee_user_id', filters.assignee_user_id);
      if (filters.due_before) q = q.lte('due_date', filters.due_before);
      if (filters.search) q = q.ilike('title', `%${filters.search}%`);

      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as unknown as Task[];
    },
  });
}

export function useTask(id?: string) {
  return useQuery({
    queryKey: ['task', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          team:lab_teams!tasks_assignee_team_id_fkey(id, name, color, slug),
          sample:samples(id, sample_id, product_name),
          test_request:customer_test_requests(id, request_number),
          equipment(id, name)
        `)
        .eq('id', id!)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as Task | null;
    },
  });
}

export function useTaskComments(taskId?: string) {
  return useQuery({
    queryKey: ['task_comments', taskId],
    enabled: !!taskId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_comments')
        .select('*')
        .eq('task_id', taskId!)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<Task>) => {
      const { data: userRes } = await supabase.auth.getUser();
      const payload: any = {
        title: input.title,
        description: input.description || null,
        type: input.type || 'manual',
        status: input.status || 'todo',
        priority: input.priority || 'Normal',
        assignee_user_id: input.assignee_user_id || null,
        assignee_team_id: input.assignee_team_id || null,
        due_date: input.due_date || null,
        planned_date: input.planned_date || null,
        estimated_hours: input.estimated_hours || null,
        sample_id: input.sample_id || null,
        test_request_id: input.test_request_id || null,
        equipment_id: input.equipment_id || null,
        ai_suggested: input.ai_suggested || false,
        ai_rationale: input.ai_rationale || null,
        tags: input.tags || null,
        created_by: userRes.user?.id || null,
      };
      const { data, error } = await supabase.from('tasks').insert(payload).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Task created');
    },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Task> }) => {
      const { team, sample, test_request, equipment, ...clean } = patch as any;
      const { data, error } = await supabase.from('tasks').update(clean).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      qc.invalidateQueries({ queryKey: ['task', vars.id] });
    },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('tasks').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Task deleted');
    },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useAddTaskComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ task_id, body }: { task_id: string; body: string }) => {
      const { data: userRes } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('task_comments')
        .insert({
          task_id,
          body,
          author_user_id: userRes.user?.id || null,
          author_name: userRes.user?.email || null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: ['task_comments', vars.task_id] }),
  });
}

export function useLabTeams() {
  return useQuery({
    queryKey: ['lab_teams'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lab_teams')
        .select('*')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data || [];
    },
  });
}
