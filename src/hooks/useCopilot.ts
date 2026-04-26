import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

export type CopilotMessage = {
  id?: string;
  role: "user" | "assistant" | "tool" | "system";
  content: string;
  tool_calls?: any;
  created_at?: string;
};

export type CopilotConversation = {
  id: string;
  title: string;
  context_type: string | null;
  context_id: string | null;
  context_label: string | null;
  pinned: boolean;
  archived: boolean;
  message_count: number;
  last_message_at: string;
  created_at: string;
  mode: string;
};

export function useCopilot() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<CopilotConversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<CopilotMessage[]>([]);
  const [sending, setSending] = useState(false);
  const [toolEvents, setToolEvents] = useState<any[]>([]);

  const loadConversations = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("copilot_conversations")
      .select("*")
      .eq("archived", false)
      .order("last_message_at", { ascending: false })
      .limit(50);
    setConversations((data ?? []) as any);
  }, [user]);

  const loadMessages = useCallback(async (id: string) => {
    const { data } = await supabase
      .from("copilot_messages")
      .select("*")
      .eq("conversation_id", id)
      .order("created_at");
    setMessages((data ?? []) as any);
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    if (activeId) loadMessages(activeId);
    else setMessages([]);
  }, [activeId, loadMessages]);

  const newConversation = useCallback(
    async (context?: { type: string; id: string; label?: string }) => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("copilot_conversations")
        .insert({
          user_id: user.id,
          title: "New conversation",
          context_type: context?.type ?? "general",
          context_id: context?.id ?? null,
          context_label: context?.label ?? null,
        })
        .select()
        .single();
      if (error) {
        toast({ title: "Failed", description: error.message, variant: "destructive" });
        return null;
      }
      await loadConversations();
      setActiveId(data.id);
      return data.id as string;
    },
    [user, loadConversations]
  );

  const send = useCallback(
    async (text: string, context?: { type: string; id: string; label?: string }) => {
      if (!text.trim() || sending) return;
      let convId = activeId;
      if (!convId) {
        convId = await newConversation(context);
        if (!convId) return;
      }
      const userMsg: CopilotMessage = { role: "user", content: text };
      setMessages((m) => [...m, userMsg, { role: "assistant", content: "..." }]);
      setSending(true);
      setToolEvents([]);

      try {
        const history = messages
          .filter((m) => m.role === "user" || m.role === "assistant")
          .map((m) => ({ role: m.role, content: m.content }));

        const { data, error } = await supabase.functions.invoke("lab-copilot", {
          body: {
            conversation_id: convId,
            messages: [...history, { role: "user", content: text }],
            context,
          },
        });

        if (error) throw error;
        if (data?.error) throw new Error(data.error);

        setMessages((m) => {
          const next = [...m];
          next[next.length - 1] = {
            role: "assistant",
            content: data.content || "(no response)",
          };
          return next;
        });
        setToolEvents(data.tool_events ?? []);

        // Auto-title first turn
        if (messages.length === 0) {
          const title = text.slice(0, 60);
          await supabase.from("copilot_conversations").update({ title }).eq("id", convId);
          loadConversations();
        }
      } catch (e: any) {
        toast({
          title: "Lab Copilot error",
          description: e.message ?? "Request failed",
          variant: "destructive",
        });
        setMessages((m) => m.slice(0, -1));
      } finally {
        setSending(false);
      }
    },
    [activeId, messages, sending, newConversation, loadConversations]
  );

  const deleteConversation = useCallback(
    async (id: string) => {
      await supabase.from("copilot_conversations").delete().eq("id", id);
      if (activeId === id) setActiveId(null);
      loadConversations();
    },
    [activeId, loadConversations]
  );

  return {
    conversations,
    activeId,
    setActiveId,
    messages,
    sending,
    toolEvents,
    send,
    newConversation,
    deleteConversation,
    refresh: loadConversations,
  };
}
