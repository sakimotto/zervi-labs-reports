
DROP POLICY IF EXISTS "Authenticated update own program drafts" ON public.program_drafts;
CREATE POLICY "Authenticated update own program drafts"
  ON public.program_drafts FOR UPDATE TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

REVOKE ALL ON FUNCTION public.apply_program_draft(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.apply_program_draft(UUID) TO authenticated;
