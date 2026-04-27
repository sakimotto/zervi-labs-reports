import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// ============ Standards (full schema) ============
export type StandardFull = {
  id: string;
  code: string;
  version: string | null;
  title: string | null;
  organization: string;
  organization_id: string | null;
  full_designation: string | null;
  revision_suffix: string | null;
  summary: string | null;
  scope_description: string | null;
  document_type: string | null;
  status: string;
  withdrawal_date: string | null;
  superseded_by_id: string | null;
  first_published_year: number | null;
  latest_revision_year: number | null;
  language: string | null;
  normative_references: string | null;
  wiki_notes_md: string | null;
  source_attribution: string | null;
  last_verified_date: string | null;
  document_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export function useStandardsFull() {
  return useQuery({
    queryKey: ['standards-full'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('standards')
        .select('*, standards_organizations(id, code, full_name)')
        .order('code');
      if (error) throw error;
      return data as Array<StandardFull & { standards_organizations: { id: string; code: string; full_name: string } | null }>;
    },
  });
}

export function useStandardDetail(id: string | undefined) {
  return useQuery({
    queryKey: ['standard-detail', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('standards')
        .select('*, standards_organizations(id, code, full_name, country_origin, website_url), superseded_by:superseded_by_id(id, code, full_designation)')
        .eq('id', id!)
        .single();
      if (error) throw error;
      return data;
    },
  });
}

export function useUpdateStandardFull() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<StandardFull> }) => {
      const { data, error } = await supabase.from('standards').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ['standards-full'] });
      qc.invalidateQueries({ queryKey: ['standard-detail', v.id] });
    },
  });
}

export function useCreateStandardFull() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (s: Partial<StandardFull> & { code: string }) => {
      const { data, error } = await supabase.from('standards').insert(s).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['standards-full'] }),
  });
}

// ============ Organizations ============
export type StandardsOrganization = {
  id: string;
  code: string;
  full_name: string;
  abbreviation: string | null;
  country_origin: string | null;
  website_url: string | null;
  technical_committee: string | null;
  subcommittees: string | null;
  numbering_convention: string | null;
  publication_frequency: string | null;
  api_endpoint: string | null;
  subscription_access_details: string | null;
  secretariat_history: string | null;
  notes: string | null;
  is_active: boolean;
};

export function useStandardsOrganizations() {
  return useQuery({
    queryKey: ['standards-organizations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('standards_organizations')
        .select('*')
        .order('code');
      if (error) throw error;
      return data as StandardsOrganization[];
    },
  });
}

export function useCreateOrganization() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (o: Partial<StandardsOrganization> & { code: string; full_name: string }) => {
      const { data, error } = await supabase.from('standards_organizations').insert(o).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['standards-organizations'] }),
  });
}

export function useUpdateOrganization() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<StandardsOrganization> }) => {
      const { data, error } = await supabase.from('standards_organizations').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['standards-organizations'] }),
  });
}

// ============ Categories ============
export type StandardsCategory = {
  id: string;
  code: string;
  name: string;
  parent_id: string | null;
  description: string | null;
  ics_code: string | null;
  display_order: number;
  is_active: boolean;
};

export function useStandardsCategories() {
  return useQuery({
    queryKey: ['standards-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('standards_categories')
        .select('*')
        .order('display_order')
        .order('name');
      if (error) throw error;
      return data as StandardsCategory[];
    },
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (c: Partial<StandardsCategory> & { code: string; name: string }) => {
      const { data, error } = await supabase.from('standards_categories').insert(c).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['standards-categories'] }),
  });
}

// ============ Standard ↔ Categories link ============
export function useStandardCategoryLinks(standardId: string | undefined) {
  return useQuery({
    queryKey: ['standard-categories-links', standardId],
    enabled: !!standardId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('standard_categories')
        .select('id, is_primary, category:category_id(id, code, name)')
        .eq('standard_id', standardId!);
      if (error) throw error;
      return data;
    },
  });
}

// ============ Parameters ============
export type StandardParameter = {
  id: string;
  standard_id: string;
  parameter_name: string;
  description: string | null;
  unit: string | null;
  measurement_method: string | null;
  typical_range_min: number | null;
  typical_range_max: number | null;
  measurement_uncertainty: string | null;
  rating_scale: string | null;
  notes: string | null;
  display_order: number;
};

export function useStandardParameters(standardId?: string) {
  return useQuery({
    queryKey: ['standard-parameters', standardId ?? 'all'],
    queryFn: async () => {
      let q = supabase.from('standard_parameters').select('*').order('display_order');
      if (standardId) q = q.eq('standard_id', standardId);
      const { data, error } = await q;
      if (error) throw error;
      return data as StandardParameter[];
    },
  });
}

export function useCreateParameter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: Partial<StandardParameter> & { standard_id: string; parameter_name: string }) => {
      const { data, error } = await supabase.from('standard_parameters').insert(p).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ['standard-parameters', v.standard_id] });
      qc.invalidateQueries({ queryKey: ['standard-parameters', 'all'] });
    },
  });
}

export function useDeleteParameter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('standard_parameters').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['standard-parameters'] });
    },
  });
}

// ============ Equipment requirements ============
export type StandardEquipmentReq = {
  id: string;
  standard_id: string;
  equipment_id: string | null;
  equipment_type: string;
  manufacturer_examples: string | null;
  required_specifications: string | null;
  specimen_size: string | null;
  test_conditions: string | null;
  calibration_requirements: string | null;
  notes: string | null;
  display_order: number;
};

export function useStandardEquipmentReqs(standardId?: string) {
  return useQuery({
    queryKey: ['standard-equipment-reqs', standardId ?? 'all'],
    queryFn: async () => {
      let q = supabase.from('standard_equipment_requirements').select('*, equipment:equipment_id(id, name, category)').order('display_order');
      if (standardId) q = q.eq('standard_id', standardId);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateEquipmentReq() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (e: Partial<StandardEquipmentReq> & { standard_id: string; equipment_type: string }) => {
      const { data, error } = await supabase.from('standard_equipment_requirements').insert(e).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['standard-equipment-reqs'] }),
  });
}

export function useDeleteEquipmentReq() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('standard_equipment_requirements').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['standard-equipment-reqs'] }),
  });
}

// ============ Wiki revisions ============
export function useStandardWikiRevisions(standardId: string | undefined) {
  return useQuery({
    queryKey: ['standard-wiki-revisions', standardId],
    enabled: !!standardId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('standard_wiki_revisions')
        .select('*')
        .eq('standard_id', standardId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useSaveWikiNotes() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ standardId, content, summary }: { standardId: string; content: string; summary?: string }) => {
      // Update main standard
      const { error: updErr } = await supabase
        .from('standards')
        .update({ wiki_notes_md: content })
        .eq('id', standardId);
      if (updErr) throw updErr;

      // Snapshot revision
      const { data: { user } } = await supabase.auth.getUser();
      const { error: revErr } = await supabase
        .from('standard_wiki_revisions')
        .insert({
          standard_id: standardId,
          content_md: content,
          edit_summary: summary || null,
          edited_by: user?.id ?? null,
          edited_by_name: user?.email ?? null,
        });
      if (revErr) throw revErr;
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ['standard-detail', v.standardId] });
      qc.invalidateQueries({ queryKey: ['standard-wiki-revisions', v.standardId] });
    },
  });
}

// ============ Standard revisions (version history) ============
export function useStandardRevisions(standardId: string | undefined) {
  return useQuery({
    queryKey: ['standard-revisions', standardId],
    enabled: !!standardId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('standard_revisions')
        .select('*')
        .eq('standard_id', standardId!)
        .order('revision_year', { ascending: false, nullsFirst: false });
      if (error) throw error;
      return data;
    },
  });
}

// ============ Linked methods (reverse lookup) ============
export function useStandardLinkedMethods(standardId: string | undefined) {
  return useQuery({
    queryKey: ['standard-linked-methods', standardId],
    enabled: !!standardId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('method_standards')
        .select('id, is_primary, method:test_method_id(id, code, title)')
        .eq('standard_id', standardId!);
      if (error) throw error;
      return data;
    },
  });
}
