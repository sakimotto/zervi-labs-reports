import { useRef, useState } from 'react';
import {
  useTaskAttachments,
  useUploadTaskAttachment,
  useDeleteTaskAttachment,
  downloadTaskAttachment,
  type TaskAttachment,
} from '@/hooks/useTaskAttachments';
import { Button } from '@/components/ui/button';
import {
  Paperclip,
  Upload,
  Download,
  Trash2,
  FileText,
  FileImage,
  FileSpreadsheet,
  File as FileIcon,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow, parseISO } from 'date-fns';

function formatBytes(bytes: number) {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function fileIcon(mime: string | null, name: string) {
  const m = (mime || '').toLowerCase();
  const n = name.toLowerCase();
  if (m.startsWith('image/')) return FileImage;
  if (m === 'application/pdf' || n.endsWith('.pdf')) return FileText;
  if (m.includes('sheet') || n.endsWith('.xlsx') || n.endsWith('.csv')) return FileSpreadsheet;
  if (m.startsWith('text/') || n.endsWith('.txt') || n.endsWith('.md')) return FileText;
  return FileIcon;
}

export function TaskAttachmentsSection({ taskId }: { taskId: string }) {
  const { data: attachments = [], isLoading } = useTaskAttachments(taskId);
  const uploadMut = useUploadTaskAttachment();
  const deleteMut = useDeleteTaskAttachment();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    for (const file of Array.from(files)) {
      await uploadMut.mutateAsync({ taskId, file });
    }
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground inline-flex items-center gap-1.5">
          <Paperclip className="h-3 w-3" />
          Attachments
          {attachments.length > 0 && (
            <span className="text-[10px] font-mono bg-muted px-1.5 rounded">
              {attachments.length}
            </span>
          )}
        </label>
        <Button
          size="sm"
          variant="outline"
          className="h-7 gap-1.5 text-xs"
          onClick={() => inputRef.current?.click()}
          disabled={uploadMut.isPending}
        >
          {uploadMut.isPending ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Upload className="h-3 w-3" />
          )}
          Upload
        </Button>
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {/* Drop zone (always visible, doubles as empty state) */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => attachments.length === 0 && inputRef.current?.click()}
        className={cn(
          'rounded-lg border border-dashed transition-all',
          dragOver
            ? 'border-primary bg-primary-soft/30'
            : 'border-border/60 bg-muted/20 hover:border-border',
          attachments.length === 0 && 'cursor-pointer'
        )}
      >
        {attachments.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <Upload className="h-5 w-5 mx-auto text-muted-foreground/60 mb-2" />
            <div className="text-sm text-muted-foreground">
              {dragOver ? 'Drop files to upload' : 'Drag & drop files, or click to browse'}
            </div>
            <div className="text-[11px] text-muted-foreground/70 mt-1">
              PDFs, images, test reports — up to 25 MB each
            </div>
          </div>
        ) : (
          <ul className="divide-y divide-border/50">
            {isLoading && (
              <li className="px-3 py-3 text-sm text-muted-foreground">Loading…</li>
            )}
            {attachments.map((a) => (
              <AttachmentRow
                key={a.id}
                att={a}
                onDownload={() => downloadTaskAttachment(a)}
                onDelete={() => {
                  if (confirm(`Remove ${a.file_name}?`)) deleteMut.mutate(a);
                }}
              />
            ))}
          </ul>
        )}
      </div>

      {attachments.length > 0 && dragOver && (
        <div className="text-[11px] text-primary mt-2 text-center">Drop to upload</div>
      )}
    </div>
  );
}

function AttachmentRow({
  att,
  onDownload,
  onDelete,
}: {
  att: TaskAttachment;
  onDownload: () => void;
  onDelete: () => void;
}) {
  const Icon = fileIcon(att.mime_type, att.file_name);
  return (
    <li className="group flex items-center gap-3 px-3 py-2.5 hover:bg-background/60 transition-colors">
      <div className="h-9 w-9 rounded-md bg-background border border-border/60 flex items-center justify-center shrink-0">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <button
        onClick={onDownload}
        className="flex-1 min-w-0 text-left"
        title="Download"
      >
        <div className="text-sm font-medium truncate group-hover:text-primary transition-colors">
          {att.file_name}
        </div>
        <div className="text-[11px] text-muted-foreground truncate">
          {formatBytes(att.file_size)} · {att.uploaded_by_name || 'Unknown'} ·{' '}
          {formatDistanceToNow(parseISO(att.created_at), { addSuffix: true })}
        </div>
      </button>
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onDownload}
          className="h-7 w-7 inline-flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          title="Download"
        >
          <Download className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={onDelete}
          className="h-7 w-7 inline-flex items-center justify-center rounded-md hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-colors"
          title="Remove"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </li>
  );
}
