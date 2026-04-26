ALTER TABLE public.copilot_conversations
  ADD COLUMN IF NOT EXISTS mode text NOT NULL DEFAULT 'general';

CREATE INDEX IF NOT EXISTS idx_copilot_conv_mode
  ON public.copilot_conversations (user_id, mode, last_message_at DESC);