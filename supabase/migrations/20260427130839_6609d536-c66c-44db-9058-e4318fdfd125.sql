ALTER TABLE public.task_attachments
  ADD COLUMN IF NOT EXISTS ocr_text TEXT,
  ADD COLUMN IF NOT EXISTS ocr_status TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS ocr_error TEXT,
  ADD COLUMN IF NOT EXISTS ocr_completed_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_task_attachments_ocr_fts
  ON public.task_attachments
  USING GIN (to_tsvector('simple', coalesce(ocr_text, '')));