
-- Tasks: keep history when parent equipment/sample is deleted
ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_equipment_id_fkey;
ALTER TABLE public.tasks
  ADD CONSTRAINT tasks_equipment_id_fkey
  FOREIGN KEY (equipment_id) REFERENCES public.equipment(id) ON DELETE SET NULL;

ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_sample_id_fkey;
ALTER TABLE public.tasks
  ADD CONSTRAINT tasks_sample_id_fkey
  FOREIGN KEY (sample_id) REFERENCES public.samples(id) ON DELETE SET NULL;

ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_test_request_id_fkey;
ALTER TABLE public.tasks
  ADD CONSTRAINT tasks_test_request_id_fkey
  FOREIGN KEY (test_request_id) REFERENCES public.customer_test_requests(id) ON DELETE SET NULL;

-- Calendar events: same — keep the event but drop the dead reference
ALTER TABLE public.calendar_events DROP CONSTRAINT IF EXISTS calendar_events_equipment_id_fkey;
ALTER TABLE public.calendar_events
  ADD CONSTRAINT calendar_events_equipment_id_fkey
  FOREIGN KEY (equipment_id) REFERENCES public.equipment(id) ON DELETE SET NULL;

ALTER TABLE public.calendar_events DROP CONSTRAINT IF EXISTS calendar_events_sample_id_fkey;
ALTER TABLE public.calendar_events
  ADD CONSTRAINT calendar_events_sample_id_fkey
  FOREIGN KEY (sample_id) REFERENCES public.samples(id) ON DELETE SET NULL;

ALTER TABLE public.calendar_events DROP CONSTRAINT IF EXISTS calendar_events_test_request_id_fkey;
ALTER TABLE public.calendar_events
  ADD CONSTRAINT calendar_events_test_request_id_fkey
  FOREIGN KEY (test_request_id) REFERENCES public.customer_test_requests(id) ON DELETE SET NULL;

ALTER TABLE public.calendar_events DROP CONSTRAINT IF EXISTS calendar_events_task_id_fkey;
ALTER TABLE public.calendar_events
  ADD CONSTRAINT calendar_events_task_id_fkey
  FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON DELETE SET NULL;

-- Add missing indexes on FK columns flagged earlier (slow joins -> fast joins)
CREATE INDEX IF NOT EXISTS idx_calendar_events_task ON public.calendar_events(task_id);
CREATE INDEX IF NOT EXISTS idx_calibration_records_equipment ON public.calibration_records(equipment_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_logs_equipment ON public.maintenance_logs(equipment_id);
CREATE INDEX IF NOT EXISTS idx_samples_material ON public.samples(material_id);
CREATE INDEX IF NOT EXISTS idx_samples_supplier ON public.samples(supplier_id);
CREATE INDEX IF NOT EXISTS idx_samples_test_program ON public.samples(test_program_id);
CREATE INDEX IF NOT EXISTS idx_samples_oem_spec ON public.samples(oem_specification_id);
CREATE INDEX IF NOT EXISTS idx_test_results_equipment ON public.test_results(equipment_id);
CREATE INDEX IF NOT EXISTS idx_test_results_sop_version ON public.test_results(sop_version_id);
CREATE INDEX IF NOT EXISTS idx_test_results_calibration ON public.test_results(calibration_record_id);
CREATE INDEX IF NOT EXISTS idx_test_results_conditioning ON public.test_results(conditioning_profile_id);
CREATE INDEX IF NOT EXISTS idx_method_standards_standard ON public.method_standards(standard_id);
CREATE INDEX IF NOT EXISTS idx_method_equipment_equipment ON public.method_equipment(equipment_id);
CREATE INDEX IF NOT EXISTS idx_method_conditioning_profile ON public.method_conditioning(conditioning_profile_id);
CREATE INDEX IF NOT EXISTS idx_method_versions_superseded ON public.method_versions(superseded_by);
CREATE INDEX IF NOT EXISTS idx_material_versions_superseded ON public.material_versions(superseded_by);
CREATE INDEX IF NOT EXISTS idx_test_items_standard ON public.test_items(standard_id);
CREATE INDEX IF NOT EXISTS idx_test_programs_oem_spec ON public.test_programs(oem_specification_id);
CREATE INDEX IF NOT EXISTS idx_test_program_items_conditioning ON public.test_program_items(conditioning_profile_id);
CREATE INDEX IF NOT EXISTS idx_test_requirements_oem_spec ON public.test_requirements(oem_specification_id);
CREATE INDEX IF NOT EXISTS idx_sop_versions_sop ON public.sop_versions(sop_id);
CREATE INDEX IF NOT EXISTS idx_sops_test_item ON public.sops(test_item_id);
CREATE INDEX IF NOT EXISTS idx_materials_default_program ON public.materials(default_test_program_id);
CREATE INDEX IF NOT EXISTS idx_copilot_action_log_conversation ON public.copilot_action_log(conversation_id);
