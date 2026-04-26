
-- Lab Copilot: Agentic AI conversations + audit trail

CREATE TABLE public.copilot_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL DEFAULT 'New conversation',
  context_type TEXT, -- 'sample' | 'customer' | 'supplier' | 'material' | 'general'
  context_id UUID,
  context_label TEXT,
  pinned BOOLEAN NOT NULL DEFAULT false,
  archived BOOLEAN NOT NULL DEFAULT false,
  message_count INT NOT NULL DEFAULT 0,
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_copilot_conv_user ON public.copilot_conversations(user_id, last_message_at DESC);

CREATE TABLE public.copilot_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.copilot_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL, -- 'system' | 'user' | 'assistant' | 'tool'
  content TEXT,
  tool_calls JSONB, -- array of tool calls when assistant requests
  tool_call_id TEXT, -- for role='tool' replies
  tool_name TEXT,
  tokens_in INT,
  tokens_out INT,
  model TEXT,
  finish_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_copilot_msg_conv ON public.copilot_messages(conversation_id, created_at);

-- Audit log of every tool the agent invoked (for transparency + future autonomy)
CREATE TABLE public.copilot_action_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.copilot_conversations(id) ON DELETE SET NULL,
  user_id UUID NOT NULL,
  tool_name TEXT NOT NULL,
  arguments JSONB NOT NULL DEFAULT '{}'::jsonb,
  result_summary TEXT,
  status TEXT NOT NULL DEFAULT 'completed', -- 'completed' | 'failed' | 'proposed' | 'approved' | 'rejected'
  error TEXT,
  duration_ms INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_copilot_action_user ON public.copilot_action_log(user_id, created_at DESC);

-- Enable RLS
ALTER TABLE public.copilot_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.copilot_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.copilot_action_log ENABLE ROW LEVEL SECURITY;

-- Policies: users see only their own conversations; admins see all
CREATE POLICY "Users view own conversations" ON public.copilot_conversations
  FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Users insert own conversations" ON public.copilot_conversations
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own conversations" ON public.copilot_conversations
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own conversations" ON public.copilot_conversations
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users view messages in own convs" ON public.copilot_messages
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.copilot_conversations c WHERE c.id = conversation_id AND (c.user_id = auth.uid() OR public.has_role(auth.uid(),'admin')))
  );
CREATE POLICY "Users insert messages in own convs" ON public.copilot_messages
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.copilot_conversations c WHERE c.id = conversation_id AND c.user_id = auth.uid())
  );

CREATE POLICY "Users view own actions" ON public.copilot_action_log
  FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Users insert own actions" ON public.copilot_action_log
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Trigger: keep conversation timestamps + count fresh
CREATE OR REPLACE FUNCTION public.bump_conversation_on_message()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  UPDATE public.copilot_conversations
    SET last_message_at = now(),
        message_count = message_count + 1,
        updated_at = now()
    WHERE id = NEW.conversation_id;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_bump_conv AFTER INSERT ON public.copilot_messages
FOR EACH ROW EXECUTE FUNCTION public.bump_conversation_on_message();

CREATE TRIGGER trg_copilot_conv_updated BEFORE UPDATE ON public.copilot_conversations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
