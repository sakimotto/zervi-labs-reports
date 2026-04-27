import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// ============================================================
// Detail / overview
// ============================================================
export function useTestProgramDetail(id: string | null) {
  return useQuery({
    queryKey: ['test-program-detail', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('test_programs')
        .select(`
          *,
          test_program_items(id, display_order, test_item_id, test_items(id, name, category, unit, direction_required, multiple_samples, sample_count, equipment_required)),
          program_supplier_links(id, supplier_id, is_preferred, notes, suppliers(id, name, supplier_type, status)),
          program_sku_patterns(id, pattern, match_type, priority, description),
          program_material_type_tags(id, material_type),
          material_test_programs(id, material_id, materials(id, name, material_type, material_code))
        `)
        .eq('id', id!)
        .single();
      if (error) throw error;
      return data;
    },
  });
}

// ============================================================
// Versions
// ============================================================
export function useProgramVersions(programId: string | null) {
  return useQuery({
    queryKey: ['program-versions', programId],
    enabled: !!programId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('program_versions')
        .select('*')
        .eq('program_id', programId!)
        .order('version_number', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useSnapshotProgramVersion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ programId, notes }: { programId: string; notes?: string }) => {
      const { data, error } = await supabase.rpc('snapshot_program_version', {
        _program_id: programId,
        _change_notes: notes ?? null,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['program-versions', vars.programId] });
      qc.invalidateQueries({ queryKey: ['test-program-detail', vars.programId] });
    },
  });
}

// ============================================================
// Approvals
// ============================================================
export function useProgramApprovals(programId: string | null) {
  return useQuery({
    queryKey: ['program-approvals', programId],
    enabled: !!programId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('program_approvals')
        .select('*')
        .eq('program_id', programId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

type ApprovalAction = 'submitted' | 'approved' | 'rejected' | 'withdrawn' | 'revised';

export function useLogProgramApproval() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      programId: string;
      versionNumber: number;
      action: ApprovalAction;
      actorName?: string;
      signature?: string;
      comments?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from('program_approvals').insert({
        program_id: params.programId,
        version_number: params.versionNumber,
        action: params.action,
        actor_user_id: user?.id ?? null,
        actor_name: params.actorName ?? user?.email ?? null,
        signature: params.signature ?? null,
        comments: params.comments ?? null,
      });
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['program-approvals', vars.programId] });
    },
  });
}

// Lifecycle transition (encapsulates: edit status + log approval + snapshot if approved)
export function useTransitionProgramStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      programId: string;
      toStatus: 'Draft' | 'In Review' | 'Approved' | 'Active' | 'Superseded' | 'Archived';
      versionNumber: number;
      comments?: string;
      signature?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const userEmail = user?.email ?? null;

      // Build status-specific updates
      const updates: Record<string, unknown> = { status: params.toStatus };
      if (params.toStatus === 'In Review') {
        updates.submitted_at = new Date().toISOString();
        updates.requested_by = user?.id ?? null;
        updates.requested_by_name = userEmail;
      }
      if (params.toStatus === 'Approved' || params.toStatus === 'Active') {
        updates.approved_at = new Date().toISOString();
        updates.approver_user_id = user?.id ?? null;
        updates.approver_name = userEmail;
        updates.approval_signature = params.signature ?? userEmail;
      }

      const { error: updErr } = await supabase
        .from('test_programs')
        .update(updates)
        .eq('id', params.programId);
      if (updErr) throw updErr;

      // Log approval action
      const actionMap: Record<string, ApprovalAction> = {
        'In Review': 'submitted',
        'Approved': 'approved',
        'Active': 'approved',
        'Draft': 'withdrawn',
        'Superseded': 'revised',
        'Archived': 'withdrawn',
      };
      await supabase.from('program_approvals').insert({
        program_id: params.programId,
        version_number: params.versionNumber,
        action: actionMap[params.toStatus] ?? 'revised',
        actor_user_id: user?.id ?? null,
        actor_name: userEmail,
        signature: params.signature ?? null,
        comments: params.comments ?? null,
      });

      // Snapshot when approved
      if (params.toStatus === 'Approved' || params.toStatus === 'Active') {
        await supabase.rpc('snapshot_program_version', {
          _program_id: params.programId,
          _change_notes: params.comments ?? `Approved as v${params.versionNumber}`,
        });
      }
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['test-program-detail', vars.programId] });
      qc.invalidateQueries({ queryKey: ['program-approvals', vars.programId] });
      qc.invalidateQueries({ queryKey: ['program-versions', vars.programId] });
      qc.invalidateQueries({ queryKey: ['test-programs'] });
    },
  });
}

// Create new version (clone current, bump version_number, reset to Draft)
export function useCreateNewVersion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ programId }: { programId: string }) => {
      // Snapshot current first
      await supabase.rpc('snapshot_program_version', {
        _program_id: programId,
        _change_notes: 'Version closed for revision',
      });

      // Bump version_number, reset status to Draft, clear approval fields, unlock
      const { data: prog } = await supabase
        .from('test_programs')
        .select('version_number')
        .eq('id', programId)
        .single();

      const nextVersion = (prog?.version_number ?? 1) + 1;

      const { error } = await supabase
        .from('test_programs')
        .update({
          version_number: nextVersion,
          status: 'Draft',
          is_locked: false,
          approved_at: null,
          approver_user_id: null,
          approver_name: null,
          approval_signature: null,
          submitted_at: null,
        })
        .eq('id', programId);
      if (error) throw error;
      return nextVersion;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['test-program-detail', vars.programId] });
      qc.invalidateQueries({ queryKey: ['program-versions', vars.programId] });
      qc.invalidateQueries({ queryKey: ['test-programs'] });
    },
  });
}

// ============================================================
// Audit trail
// ============================================================
export function useProgramAudit(programId: string | null) {
  return useQuery({
    queryKey: ['program-audit', programId],
    enabled: !!programId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('program_audit')
        .select('*')
        .eq('program_id', programId!)
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return data;
    },
  });
}

// ============================================================
// Supplier links
// ============================================================
export function useUpsertSupplierLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { programId: string; supplierId: string; isPreferred?: boolean; notes?: string }) => {
      const { error } = await supabase
        .from('program_supplier_links')
        .upsert(
          {
            program_id: params.programId,
            supplier_id: params.supplierId,
            is_preferred: params.isPreferred ?? false,
            notes: params.notes ?? null,
          },
          { onConflict: 'program_id,supplier_id' },
        );
      if (error) throw error;
    },
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ['test-program-detail', vars.programId] }),
  });
}

export function useDeleteSupplierLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, programId: _programId }: { id: string; programId: string }) => {
      const { error } = await supabase.from('program_supplier_links').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ['test-program-detail', vars.programId] }),
  });
}

// ============================================================
// SKU patterns
// ============================================================
export function useUpsertSkuPattern() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      programId: string;
      pattern: string;
      matchType: 'exact' | 'prefix' | 'glob' | 'regex';
      priority?: number;
      description?: string;
    }) => {
      const { error } = await supabase.from('program_sku_patterns').insert({
        program_id: params.programId,
        pattern: params.pattern,
        match_type: params.matchType,
        priority: params.priority ?? 100,
        description: params.description ?? null,
      });
      if (error) throw error;
    },
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ['test-program-detail', vars.programId] }),
  });
}

export function useDeleteSkuPattern() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, programId: _programId }: { id: string; programId: string }) => {
      const { error } = await supabase.from('program_sku_patterns').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ['test-program-detail', vars.programId] }),
  });
}

// ============================================================
// Material-type tags
// ============================================================
export function useAddMaterialTypeTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ programId, materialType }: { programId: string; materialType: string }) => {
      const { error } = await supabase
        .from('program_material_type_tags')
        .insert({ program_id: programId, material_type: materialType });
      if (error) throw error;
    },
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ['test-program-detail', vars.programId] }),
  });
}

export function useDeleteMaterialTypeTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, programId: _programId }: { id: string; programId: string }) => {
      const { error } = await supabase.from('program_material_type_tags').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ['test-program-detail', vars.programId] }),
  });
}

// ============================================================
// Material links (uses existing material_test_programs table)
// ============================================================
export function useAddMaterialLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ programId, materialId }: { programId: string; materialId: string }) => {
      const { error } = await supabase
        .from('material_test_programs')
        .insert({ program_id: programId, material_id: materialId });
      if (error) throw error;
    },
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ['test-program-detail', vars.programId] }),
  });
}

export function useDeleteMaterialLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, programId: _programId }: { id: string; programId: string }) => {
      const { error } = await supabase.from('material_test_programs').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ['test-program-detail', vars.programId] }),
  });
}

// ============================================================
// Intake matching (used by request/sample forms)
// ============================================================
export function useMatchProgramsForIntake(params: {
  sku?: string | null;
  materialType?: string | null;
  materialId?: string | null;
  supplierId?: string | null;
  enabled?: boolean;
}) {
  const enabled = params.enabled ?? !!(params.sku || params.materialType || params.materialId || params.supplierId);
  return useQuery({
    queryKey: ['match-programs', params.sku, params.materialType, params.materialId, params.supplierId],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('match_programs_for_intake', {
        _sku: params.sku ?? null,
        _material_type: params.materialType ?? null,
        _material_id: params.materialId ?? null,
        _supplier_id: params.supplierId ?? null,
      });
      if (error) throw error;
      return data ?? [];
    },
  });
}

// ============================================================
// Clone program (deep clone all linked tables, fresh code, status=Draft, parent_program_id set)
// ============================================================
export function useCloneProgram() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ programId, newName }: { programId: string; newName: string }) => {
      const { data: src, error: srcErr } = await supabase
        .from('test_programs')
        .select('*')
        .eq('id', programId)
        .single();
      if (srcErr) throw srcErr;

      const { data: newProg, error: newErr } = await supabase
        .from('test_programs')
        .insert({
          name: newName,
          description: src.description,
          material_type: src.material_type,
          report_title: src.report_title,
          report_header_notes: src.report_header_notes,
          report_footer_notes: src.report_footer_notes,
          report_columns: src.report_columns,
          show_signatures: src.show_signatures,
          signature_roles: src.signature_roles,
          category: src.category,
          purpose: src.purpose,
          scope_notes: src.scope_notes,
          intended_use: src.intended_use,
          parent_program_id: programId,
          status: 'Draft',
          version_number: 1,
        })
        .select()
        .single();
      if (newErr) throw newErr;

      // Copy items
      const { data: items } = await supabase
        .from('test_program_items')
        .select('test_item_id, display_order')
        .eq('program_id', programId);
      if (items && items.length) {
        await supabase.from('test_program_items').insert(
          items.map(i => ({ program_id: newProg.id, test_item_id: i.test_item_id, display_order: i.display_order })),
        );
      }
      return newProg;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['test-programs'] }),
  });
}

// ============================================================
// Share token (regenerates a public token for read-only sharing)
// ============================================================
export function useGenerateShareToken() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ programId }: { programId: string }) => {
      const token = crypto.randomUUID().replace(/-/g, '');
      const { error } = await supabase
        .from('test_programs')
        .update({ share_token: token })
        .eq('id', programId);
      if (error) throw error;
      return token;
    },
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ['test-program-detail', vars.programId] }),
  });
}
