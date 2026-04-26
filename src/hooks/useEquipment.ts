import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

// ============ EQUIPMENT ============
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

export function useCreateEquipment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (eq: TablesInsert<'equipment'>) => {
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
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['equipment'] });
      qc.invalidateQueries({ queryKey: ['equipment', vars.id] });
      qc.invalidateQueries({ queryKey: ['equipment-audit', vars.id] });
    },
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

// ============ CALIBRATION ============
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

export function useAddCalibration() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (record: TablesInsert<'calibration_records'>) => {
      const { data, error } = await supabase.from('calibration_records').insert(record).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['calibration-records', vars.equipment_id] });
      qc.invalidateQueries({ queryKey: ['equipment', vars.equipment_id] });
      qc.invalidateQueries({ queryKey: ['equipment'] });
      qc.invalidateQueries({ queryKey: ['equipment-audit', vars.equipment_id] });
    },
  });
}

export function useUpdateCalibration() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, equipment_id, ...updates }: { id: string; equipment_id: string } & Partial<TablesUpdate<'calibration_records'>>) => {
      const { data, error } = await supabase.from('calibration_records').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['calibration-records', vars.equipment_id] });
      qc.invalidateQueries({ queryKey: ['equipment', vars.equipment_id] });
      qc.invalidateQueries({ queryKey: ['equipment'] });
    },
  });
}

export function useDeleteCalibration() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, equipment_id }: { id: string; equipment_id: string }) => {
      const { error } = await supabase.from('calibration_records').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['calibration-records', vars.equipment_id] });
      qc.invalidateQueries({ queryKey: ['equipment-audit', vars.equipment_id] });
    },
  });
}

// ============ MAINTENANCE ============
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

export function useAddMaintenanceLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (log: TablesInsert<'maintenance_logs'>) => {
      const { data, error } = await supabase.from('maintenance_logs').insert(log).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['maintenance-logs', vars.equipment_id] });
      qc.invalidateQueries({ queryKey: ['equipment-audit', vars.equipment_id] });
    },
  });
}

export function useUpdateMaintenanceLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, equipment_id, ...updates }: { id: string; equipment_id: string } & Partial<TablesUpdate<'maintenance_logs'>>) => {
      const { data, error } = await supabase.from('maintenance_logs').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ['maintenance-logs', vars.equipment_id] }),
  });
}

export function useDeleteMaintenanceLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, equipment_id }: { id: string; equipment_id: string }) => {
      const { error } = await supabase.from('maintenance_logs').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['maintenance-logs', vars.equipment_id] });
      qc.invalidateQueries({ queryKey: ['equipment-audit', vars.equipment_id] });
    },
  });
}

// ============ AUDIT ============
export function useEquipmentAudit(equipmentId: string | null) {
  return useQuery({
    queryKey: ['equipment-audit', equipmentId],
    enabled: !!equipmentId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('equipment_audit')
        .select('*')
        .eq('equipment_id', equipmentId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

// ============ LINKED METHODS ============
export function useEquipmentLinkedMethods(equipmentId: string | null) {
  return useQuery({
    queryKey: ['equipment-linked-methods', equipmentId],
    enabled: !!equipmentId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('method_equipment')
        .select('id, is_mandatory, calibration_required, model_required, notes, test_item_id, test_items:test_items(id, code, name, category)')
        .eq('equipment_id', equipmentId!);
      if (error) throw error;
      return data;
    },
  });
}
