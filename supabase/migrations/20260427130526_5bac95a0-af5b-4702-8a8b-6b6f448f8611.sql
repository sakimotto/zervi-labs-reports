-- Task attachments table
CREATE TABLE public.task_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL DEFAULT 0,
  mime_type TEXT,
  uploaded_by UUID,
  uploaded_by_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_task_attachments_task_id ON public.task_attachments(task_id);

ALTER TABLE public.task_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view task attachments"
ON public.task_attachments FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated can insert task attachments"
ON public.task_attachments FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated can delete task attachments"
ON public.task_attachments FOR DELETE
TO authenticated
USING (true);

-- Storage bucket (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('task-attachments', 'task-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies — files keyed under {task_id}/{filename}
CREATE POLICY "Authenticated can read task attachment files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'task-attachments');

CREATE POLICY "Authenticated can upload task attachment files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'task-attachments');

CREATE POLICY "Authenticated can delete task attachment files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'task-attachments');