-- Per-user, per-mode starter prompt overrides for Lab Copilot
CREATE TABLE public.copilot_starter_overrides (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  mode TEXT NOT NULL,
  starters JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, mode)
);

ALTER TABLE public.copilot_starter_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own starter overrides"
  ON public.copilot_starter_overrides
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own starter overrides"
  ON public.copilot_starter_overrides
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own starter overrides"
  ON public.copilot_starter_overrides
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own starter overrides"
  ON public.copilot_starter_overrides
  FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX idx_copilot_starter_overrides_user
  ON public.copilot_starter_overrides (user_id);

CREATE TRIGGER update_copilot_starter_overrides_updated_at
  BEFORE UPDATE ON public.copilot_starter_overrides
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();