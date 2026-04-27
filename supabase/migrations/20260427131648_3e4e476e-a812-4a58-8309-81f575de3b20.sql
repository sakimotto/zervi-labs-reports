ALTER TABLE public.task_attachments
ADD COLUMN IF NOT EXISTS ocr_language text NOT NULL DEFAULT 'auto';