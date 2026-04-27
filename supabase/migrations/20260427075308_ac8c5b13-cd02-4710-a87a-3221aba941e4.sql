
-- =====================================================
-- TASKS & PLANNING MODULE
-- =====================================================

-- ---------- Teams ----------
CREATE TABLE IF NOT EXISTS public.lab_teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  color TEXT DEFAULT '#3B82F6',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.lab_teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read teams" ON public.lab_teams
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage teams" ON public.lab_teams
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_lab_teams_updated
  BEFORE UPDATE ON public.lab_teams
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------- Team membership ----------
CREATE TABLE IF NOT EXISTS public.lab_team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.lab_teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role_in_team TEXT DEFAULT 'member',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (team_id, user_id)
);

ALTER TABLE public.lab_team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read team members" ON public.lab_team_members
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage team members" ON public.lab_team_members
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ---------- Tasks ----------
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_number TEXT UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'manual', -- lab_work | triage | calibration | maintenance | manual | ai_suggested
  status TEXT NOT NULL DEFAULT 'todo', -- todo | in_progress | blocked | done | cancelled
  priority TEXT NOT NULL DEFAULT 'Normal', -- Low | Normal | High | Urgent
  assignee_user_id UUID,
  assignee_team_id UUID REFERENCES public.lab_teams(id) ON DELETE SET NULL,
  due_date DATE,
  planned_date DATE,
  estimated_hours NUMERIC,
  -- entity links
  sample_id UUID REFERENCES public.samples(id) ON DELETE CASCADE,
  test_request_id UUID REFERENCES public.customer_test_requests(id) ON DELETE CASCADE,
  sample_test_item_id UUID,
  equipment_id UUID REFERENCES public.equipment(id) ON DELETE CASCADE,
  calibration_id UUID,
  -- meta
  created_by UUID,
  completed_at TIMESTAMPTZ,
  ai_suggested BOOLEAN NOT NULL DEFAULT false,
  ai_rationale TEXT,
  tags TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tasks_status ON public.tasks(status);
CREATE INDEX idx_tasks_assignee_user ON public.tasks(assignee_user_id);
CREATE INDEX idx_tasks_assignee_team ON public.tasks(assignee_team_id);
CREATE INDEX idx_tasks_due ON public.tasks(due_date);
CREATE INDEX idx_tasks_planned ON public.tasks(planned_date);
CREATE INDEX idx_tasks_sample ON public.tasks(sample_id);
CREATE INDEX idx_tasks_request ON public.tasks(test_request_id);
CREATE INDEX idx_tasks_equipment ON public.tasks(equipment_id);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read tasks" ON public.tasks
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Lab techs insert tasks" ON public.tasks
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'lab_tech')
  );
CREATE POLICY "Lab techs update tasks" ON public.tasks
  FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'lab_tech')
  );
CREATE POLICY "Admins delete tasks" ON public.tasks
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_tasks_updated
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Validation
CREATE OR REPLACE FUNCTION public.validate_task()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.status NOT IN ('todo','in_progress','blocked','done','cancelled') THEN
    RAISE EXCEPTION 'Invalid task status: %', NEW.status;
  END IF;
  IF NEW.priority NOT IN ('Low','Normal','High','Urgent') THEN
    RAISE EXCEPTION 'Invalid task priority: %', NEW.priority;
  END IF;
  IF NEW.type NOT IN ('lab_work','triage','calibration','maintenance','manual','ai_suggested') THEN
    RAISE EXCEPTION 'Invalid task type: %', NEW.type;
  END IF;
  IF NEW.status = 'done' AND NEW.completed_at IS NULL THEN
    NEW.completed_at := now();
  END IF;
  IF NEW.status <> 'done' THEN
    NEW.completed_at := NULL;
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_tasks_validate
  BEFORE INSERT OR UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.validate_task();

-- Auto task number TSK-YYYY-NNNN
CREATE OR REPLACE FUNCTION public.generate_task_number()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
DECLARE v_year TEXT := to_char(now(),'YYYY'); v_count INT;
BEGIN
  IF NEW.task_number IS NULL OR NEW.task_number = '' THEN
    SELECT COUNT(*)+1 INTO v_count FROM public.tasks
      WHERE task_number LIKE 'TSK-' || v_year || '-%';
    NEW.task_number := 'TSK-' || v_year || '-' || lpad(v_count::text,4,'0');
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_tasks_number
  BEFORE INSERT ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.generate_task_number();

-- ---------- Task comments ----------
CREATE TABLE IF NOT EXISTS public.task_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  author_user_id UUID,
  author_name TEXT,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_task_comments_task ON public.task_comments(task_id);

ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read comments" ON public.task_comments
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated insert comments" ON public.task_comments
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authors or admins delete comments" ON public.task_comments
  FOR DELETE TO authenticated
  USING (author_user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- ---------- Calendar events ----------
CREATE TABLE IF NOT EXISTS public.calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  kind TEXT NOT NULL DEFAULT 'manual', -- test_job | request_due | calibration | manual | meeting
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ,
  all_day BOOLEAN NOT NULL DEFAULT false,
  color TEXT,
  location TEXT,
  owner_team_id UUID REFERENCES public.lab_teams(id) ON DELETE SET NULL,
  owner_user_id UUID,
  -- entity links
  sample_id UUID REFERENCES public.samples(id) ON DELETE CASCADE,
  test_request_id UUID REFERENCES public.customer_test_requests(id) ON DELETE CASCADE,
  equipment_id UUID REFERENCES public.equipment(id) ON DELETE CASCADE,
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
  source TEXT DEFAULT 'manual', -- manual | auto
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_events_starts ON public.calendar_events(starts_at);
CREATE INDEX idx_events_kind ON public.calendar_events(kind);
CREATE INDEX idx_events_team ON public.calendar_events(owner_team_id);
CREATE INDEX idx_events_sample ON public.calendar_events(sample_id);
CREATE INDEX idx_events_request ON public.calendar_events(test_request_id);
CREATE INDEX idx_events_equipment ON public.calendar_events(equipment_id);

ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read events" ON public.calendar_events
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Lab techs insert events" ON public.calendar_events
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'lab_tech'));
CREATE POLICY "Lab techs update events" ON public.calendar_events
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'lab_tech'));
CREATE POLICY "Admins delete events" ON public.calendar_events
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_events_updated
  BEFORE UPDATE ON public.calendar_events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- AUTO TRIGGERS
-- =====================================================

-- New customer test request -> triage task + calendar event for due_date
CREATE OR REPLACE FUNCTION public.auto_task_from_request()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_team UUID;
BEGIN
  SELECT id INTO v_team FROM public.lab_teams WHERE slug = 'front-office' LIMIT 1;

  INSERT INTO public.tasks (title, type, priority, status, assignee_team_id, test_request_id, due_date, description)
  VALUES (
    'Review request ' || NEW.request_number,
    'triage',
    COALESCE(NEW.priority, 'Normal'),
    'todo',
    v_team,
    NEW.id,
    COALESCE(NEW.due_date, CURRENT_DATE + 2),
    'Auto-generated from new customer test request. Review scope, confirm samples, and assign to a lab team.'
  );

  IF NEW.due_date IS NOT NULL THEN
    INSERT INTO public.calendar_events (title, kind, starts_at, all_day, color, test_request_id, source, owner_team_id)
    VALUES (
      'Due: ' || NEW.request_number,
      'request_due',
      NEW.due_date::timestamptz,
      true,
      '#F59E0B',
      NEW.id,
      'auto',
      v_team
    );
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_request_auto_task
  AFTER INSERT ON public.customer_test_requests
  FOR EACH ROW EXECUTE FUNCTION public.auto_task_from_request();

-- Sample with test_date -> calendar event (test_job)
CREATE OR REPLACE FUNCTION public.auto_event_from_sample()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.test_date IS NOT NULL THEN
    -- Remove auto event if test_date changed
    IF TG_OP = 'UPDATE' AND OLD.test_date IS DISTINCT FROM NEW.test_date THEN
      DELETE FROM public.calendar_events
        WHERE sample_id = NEW.id AND source = 'auto' AND kind = 'test_job';
    END IF;

    INSERT INTO public.calendar_events (title, kind, starts_at, all_day, color, sample_id, source)
    SELECT
      'Test: ' || NEW.sample_id || ' — ' || NEW.product_name,
      'test_job',
      NEW.test_date::timestamptz,
      true,
      '#3B82F6',
      NEW.id,
      'auto'
    WHERE NOT EXISTS (
      SELECT 1 FROM public.calendar_events
        WHERE sample_id = NEW.id AND source = 'auto' AND kind = 'test_job'
          AND starts_at::date = NEW.test_date
    );
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_sample_auto_event
  AFTER INSERT OR UPDATE OF test_date ON public.samples
  FOR EACH ROW EXECUTE FUNCTION public.auto_event_from_sample();

-- Equipment calibration due -> calibration task + event
CREATE OR REPLACE FUNCTION public.auto_task_from_calibration()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_team UUID;
BEGIN
  SELECT id INTO v_team FROM public.lab_teams WHERE slug = 'metrology' LIMIT 1;

  IF NEW.next_calibration_due IS NOT NULL AND
     (TG_OP = 'INSERT' OR OLD.next_calibration_due IS DISTINCT FROM NEW.next_calibration_due) THEN

    -- Cleanup old open auto-task for this equipment
    DELETE FROM public.tasks
      WHERE equipment_id = NEW.id AND type = 'calibration' AND status = 'todo';
    DELETE FROM public.calendar_events
      WHERE equipment_id = NEW.id AND kind = 'calibration' AND source = 'auto';

    INSERT INTO public.tasks (title, type, priority, status, assignee_team_id, equipment_id, due_date, description)
    VALUES (
      'Calibrate ' || NEW.name,
      'calibration',
      CASE WHEN NEW.next_calibration_due < CURRENT_DATE THEN 'Urgent'
           WHEN NEW.next_calibration_due <= CURRENT_DATE + 14 THEN 'High'
           ELSE 'Normal' END,
      'todo',
      v_team,
      NEW.id,
      NEW.next_calibration_due,
      'Auto-generated calibration task. Schedule, perform, and record results.'
    );

    INSERT INTO public.calendar_events (title, kind, starts_at, all_day, color, equipment_id, source, owner_team_id)
    VALUES (
      'Calibration: ' || NEW.name,
      'calibration',
      NEW.next_calibration_due::timestamptz,
      true,
      '#A855F7',
      NEW.id,
      'auto',
      v_team
    );
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_equipment_auto_calibration_task
  AFTER INSERT OR UPDATE OF next_calibration_due ON public.equipment
  FOR EACH ROW EXECUTE FUNCTION public.auto_task_from_calibration();

-- =====================================================
-- SEED TEAMS
-- =====================================================
INSERT INTO public.lab_teams (name, slug, color, description) VALUES
  ('Front Office', 'front-office', '#0EA5E9', 'Customer requests, intake, quoting'),
  ('Physical Testing', 'physical', '#10B981', 'Tensile, tear, abrasion, weight'),
  ('Chemistry', 'chemistry', '#F59E0B', 'Composition, fastness, chemical resistance'),
  ('Flammability & Safety', 'safety', '#EF4444', 'FMVSS 302, flame retardancy, VOC'),
  ('Metrology', 'metrology', '#A855F7', 'Equipment calibration & maintenance')
ON CONFLICT (slug) DO NOTHING;
