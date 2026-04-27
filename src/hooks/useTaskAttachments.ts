import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type OcrStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'skipped';

export interface TaskAttachment {
  id: string;
  task_id: string;
  storage_path: string;
  file_name: string;
  file_size: number;
  mime_type: string | null;
  uploaded_by: string | null;
  uploaded_by_name: string | null;
  created_at: string;
  ocr_text: string | null;
  ocr_status: OcrStatus;
  ocr_error: string | null;
  ocr_completed_at: string | null;
}

const BUCKET = 'task-attachments';

export function useTaskAttachments(taskId?: string) {
  return useQuery({
    queryKey: ['task_attachments', taskId],
    enabled: !!taskId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_attachments')
        .select('*')
        .eq('task_id', taskId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as TaskAttachment[];
    },
  });
}

export function useUploadTaskAttachment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ taskId, file }: { taskId: string; file: File }) => {
      if (file.size > 25 * 1024 * 1024) {
        throw new Error('File too large (max 25 MB)');
      }
      const { data: userRes } = await supabase.auth.getUser();
      const safeName = file.name.replace(/[^\w.\-]+/g, '_');
      const path = `${taskId}/${Date.now()}_${safeName}`;

      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { contentType: file.type, upsert: false });
      if (upErr) throw upErr;

      const { data, error } = await supabase
        .from('task_attachments')
        .insert({
          task_id: taskId,
          storage_path: path,
          file_name: file.name,
          file_size: file.size,
          mime_type: file.type || null,
          uploaded_by: userRes.user?.id || null,
          uploaded_by_name: userRes.user?.email || null,
        })
        .select()
        .single();
      if (error) throw error;

      // Fire-and-forget OCR. Don't block UI; user sees status badge.
      supabase.functions
        .invoke('ocr-attachment', { body: { attachment_id: data.id } })
        .then(() => qc.invalidateQueries({ queryKey: ['task_attachments', taskId] }))
        .catch((err) => console.warn('OCR invoke failed', err));

      return data;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['task_attachments', vars.taskId] });
      toast.success('Attachment uploaded — extracting text…');
    },
    onError: (e: any) => toast.error(e.message || 'Upload failed'),
  });
}

export function useRetryAttachmentOcr() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (att: TaskAttachment) => {
      await supabase
        .from('task_attachments')
        .update({ ocr_status: 'processing', ocr_error: null })
        .eq('id', att.id);
      qc.invalidateQueries({ queryKey: ['task_attachments', att.task_id] });

      const { error } = await supabase.functions.invoke('ocr-attachment', {
        body: { attachment_id: att.id },
      });
      if (error) throw error;
      return att;
    },
    onSuccess: (att) => {
      qc.invalidateQueries({ queryKey: ['task_attachments', att.task_id] });
      toast.success('Text extracted');
    },
    onError: (e: any) => toast.error(e.message || 'OCR failed'),
  });
}

export function useDeleteTaskAttachment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (att: TaskAttachment) => {
      await supabase.storage.from(BUCKET).remove([att.storage_path]);
      const { error } = await supabase.from('task_attachments').delete().eq('id', att.id);
      if (error) throw error;
      return att;
    },
    onSuccess: (att) => {
      qc.invalidateQueries({ queryKey: ['task_attachments', att.task_id] });
      toast.success('Attachment removed');
    },
    onError: (e: any) => toast.error(e.message),
  });
}

export async function downloadTaskAttachment(att: TaskAttachment) {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(att.storage_path, 60, { download: att.file_name });
  if (error || !data?.signedUrl) {
    toast.error(error?.message || 'Download failed');
    return;
  }
  window.open(data.signedUrl, '_blank');
}
