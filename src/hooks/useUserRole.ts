import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type AppRole = 'admin' | 'lab_tech' | 'viewer';

export function useUserRoles() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['user_roles', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user!.id);
      if (error) throw error;
      return (data ?? []).map(r => r.role as AppRole);
    },
  });
}

export function useIsAdmin() {
  const { data: roles = [] } = useUserRoles();
  return roles.includes('admin');
}
