import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { TablesUpdate } from '@/integrations/supabase/types';

export function useEquipment() {
  return useQuery({
    queryKey: ['equipment'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('equipment')
        .select('*')
        .order('name');
      if (error) throw error;
      return data;
    },
  });
}

export function useEquipmentDetail(id: string | null) {
  return useQuery({
    queryKey: ['equipment', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('equipment')
        .select('*')
        .eq('id', id!)
        .single();
      if (error) throw error;
      return data;
    },
  });
}

export function useCalibrationRecords(equipmentId: string | null) {
  return useQuery({
    queryKey: ['calibration-records', equipmentId],
    enabled: !!equipmentId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('calibration_records')
        .select('*')
        .eq('equipment_id', equipmentId!)
        .order('calibration_date', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useMaintenanceLogs(equipmentId: string | null) {
  return useQuery({
    queryKey: ['maintenance-logs', equipmentId],
    enabled: !!equipmentId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('maintenance_logs')
        .select('*')
        .eq('equipment_id', equipmentId!)
        .order('maintenance_date', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateEquipment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (eq: { name: string; model?: string; serial_number?: string; manufacturer?: string; category?: string; location?: string; assigned_operator?: string; purchase_date?: string; notes?: string }) => {
      const { data, error } = await supabase.from('equipment').insert(eq).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['equipment'] }),
  });
}

export function useUpdateEquipment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<TablesUpdate<'equipment'>>) => {
      const { data, error } = await supabase.from('equipment').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['equipment'] }),
  });
}

export function useDeleteEquipment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('equipment').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['equipment'] }),
  });
}

export function useAddCalibration() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (record: { equipment_id: string; calibration_date: string; next_due_date?: string; performed_by?: string; certificate_number?: string; status?: string; notes?: string }) => {
      const { data, error } = await supabase.from('calibration_records').insert(record).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ['calibration-records', vars.equipment_id] }),
  });
}

export function useAddMaintenanceLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (log: { equipment_id: string; maintenance_date: string; maintenance_type?: string; description?: string; parts_replaced?: string; downtime_hours?: number; performed_by?: string; cost?: number }) => {
      const { data, error } = await supabase.from('maintenance_logs').insert(log).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ['maintenance-logs', vars.equipment_id] }),
  });
}
