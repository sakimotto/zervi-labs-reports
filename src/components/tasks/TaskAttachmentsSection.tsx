import { useRef, useState, useMemo } from 'react';
import {
  useTaskAttachments,
  useUploadTaskAttachment,
  useDeleteTaskAttachment,
  useRetryAttachmentOcr,
  useUpdateAttachmentLanguage,
  downloadTaskAttachment,
  OCR_LANGUAGE_OPTIONS,
  type TaskAttachment,
  type OcrStatus,
  type OcrLanguage,
} from '@/hooks/useTaskAttachments';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu';
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
  Search,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ScanText,
  Copy,
  Languages,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { toast } from 'sonner';

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

function highlight(text: string, query: string) {
  if (!query.trim()) return text;
  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
  return parts.map((p, i) =>
    p.toLowerCase() === query.toLowerCase() ? (
      <mark key={i} className="bg-warning/30 text-foreground rounded px-0.5">
        {p}
      </mark>
    ) : (
      <span key={i}>{p}</span>
    ),
  );
}

function snippet(text: string, query: string, ctx = 60) {
  if (!query.trim()) return text.slice(0, 220);
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text.slice(0, 220);
  const start = Math.max(0, idx - ctx);
  const end = Math.min(text.length, idx + query.length + ctx);
  return (start > 0 ? '…' : '') + text.slice(start, end) + (end < text.length ? '…' : '');
}

export function TaskAttachmentsSection({ taskId }: { taskId: string }) {
  const { data: attachments = [], isLoading } = useTaskAttachments(taskId);
  const uploadMut = useUploadTaskAttachment();
  const deleteMut = useDeleteTaskAttachment();
  const retryMut = useRetryAttachmentOcr();
  const langMut = useUpdateAttachmentLanguage();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    for (const file of Array.from(files)) {
      await uploadMut.mutateAsync({ taskId, file });
    }
    if (inputRef.current) inputRef.current.value = '';
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return attachments;
    return attachments.filter(
      (a) =>
        a.file_name.toLowerCase().includes(q) ||
        (a.ocr_text || '').toLowerCase().includes(q),
    );
  }, [attachments, search]);

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
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

      {/* Search bar (only when there are attachments) */}
      {attachments.length > 0 && (
        <div className="relative mb-2">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search file names and extracted text…"
            className="h-8 pl-8 text-sm bg-muted/30 border-muted/60"
          />
          {search && (
            <div className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">
              {filtered.length} match{filtered.length === 1 ? '' : 'es'}
            </div>
          )}
        </div>
      )}

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
          attachments.length === 0 && 'cursor-pointer',
        )}
      >
        {attachments.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <Upload className="h-5 w-5 mx-auto text-muted-foreground/60 mb-2" />
            <div className="text-sm text-muted-foreground">
              {dragOver ? 'Drop files to upload' : 'Drag & drop files, or click to browse'}
            </div>
            <div className="text-[11px] text-muted-foreground/70 mt-1">
              PDFs & images get OCR'd automatically — text becomes searchable
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-4 py-6 text-center text-sm text-muted-foreground">
            No attachments match "{search}"
          </div>
        ) : (
          <ul className="divide-y divide-border/50">
            {isLoading && (
              <li className="px-3 py-3 text-sm text-muted-foreground">Loading…</li>
            )}
            {filtered.map((a) => (
              <AttachmentRow
                key={a.id}
                att={a}
                query={search}
                expanded={expanded.has(a.id)}
                onToggleExpand={() => toggleExpand(a.id)}
                onDownload={() => downloadTaskAttachment(a)}
                onRetry={(language) => retryMut.mutate({ att: a, language })}
                onChangeLanguage={(language) => langMut.mutate({ att: a, language })}
                onDelete={() => {
                  if (confirm(`Remove ${a.file_name}?`)) deleteMut.mutate(a);
                }}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function OcrBadge({ status, error }: { status: OcrStatus; error?: string | null }) {
  const map: Record<
    OcrStatus,
    { label: string; icon: any; className: string; spin?: boolean }
  > = {
    pending: {
      label: 'Queued',
      icon: Loader2,
      className: 'text-muted-foreground bg-muted',
      spin: true,
    },
    processing: {
      label: 'Extracting…',
      icon: Loader2,
      className: 'text-primary bg-primary-soft/60',
      spin: true,
    },
    completed: {
      label: 'Searchable',
      icon: CheckCircle2,
      className: 'text-success bg-success/10',
    },
    failed: {
      label: 'OCR failed',
      icon: AlertCircle,
      className: 'text-destructive bg-destructive/10',
    },
    skipped: {
      label: 'No OCR',
      icon: ScanText,
      className: 'text-muted-foreground bg-muted/60',
    },
  };
  const cfg = map[status] || map.pending;
  const Icon = cfg.icon;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 h-5 px-1.5 rounded text-[10px] font-medium',
        cfg.className,
      )}
      title={error || cfg.label}
    >
      <Icon className={cn('h-2.5 w-2.5', cfg.spin && 'animate-spin')} />
      {cfg.label}
    </span>
  );
}

function AttachmentRow({
  att,
  query,
  expanded,
  onToggleExpand,
  onDownload,
  onRetry,
  onDelete,
}: {
  att: TaskAttachment;
  query: string;
  expanded: boolean;
  onToggleExpand: () => void;
  onDownload: () => void;
  onRetry: () => void;
  onDelete: () => void;
}) {
  const Icon = fileIcon(att.mime_type, att.file_name);
  const hasText = !!(att.ocr_text && att.ocr_text.length > 0);
  const showSnippet = !!query.trim() && hasText &&
    att.ocr_text!.toLowerCase().includes(query.toLowerCase()) &&
    !att.file_name.toLowerCase().includes(query.toLowerCase());

  return (
    <li className="group">
      <div className="flex items-center gap-3 px-3 py-2.5 hover:bg-background/60 transition-colors">
        <div className="h-9 w-9 rounded-md bg-background border border-border/60 flex items-center justify-center shrink-0">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <button onClick={onDownload} className="flex-1 min-w-0 text-left" title="Download">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium truncate group-hover:text-primary transition-colors">
              {highlight(att.file_name, query)}
            </span>
            <OcrBadge status={att.ocr_status} error={att.ocr_error} />
          </div>
          <div className="text-[11px] text-muted-foreground truncate">
            {formatBytes(att.file_size)} · {att.uploaded_by_name || 'Unknown'} ·{' '}
            {formatDistanceToNow(parseISO(att.created_at), { addSuffix: true })}
            {hasText && (
              <>
                {' · '}
                <span className="text-foreground/60">
                  {att.ocr_text!.length.toLocaleString()} chars extracted
                </span>
              </>
            )}
          </div>
        </button>
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          {(hasText || att.ocr_status === 'failed') && (
            <button
              onClick={onToggleExpand}
              className="h-7 w-7 inline-flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              title={expanded ? 'Hide extracted text' : 'Show extracted text'}
            >
              {expanded ? (
                <ChevronDown className="h-3.5 w-3.5" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5" />
              )}
            </button>
          )}
          {att.ocr_status === 'failed' && (
            <button
              onClick={onRetry}
              className="h-7 w-7 inline-flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              title="Retry OCR"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          )}
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
      </div>

      {/* Search snippet (collapsed view) */}
      {showSnippet && !expanded && (
        <div className="px-3 pb-2 -mt-1 ml-12 text-[12px] leading-relaxed text-muted-foreground italic">
          {highlight(snippet(att.ocr_text!, query), query)}
        </div>
      )}

      {/* Expanded extracted-text panel */}
      {expanded && (
        <div className="ml-12 mr-3 mb-3 rounded-md border border-border/60 bg-background overflow-hidden">
          <div className="flex items-center justify-between px-3 h-8 border-b border-border/60 bg-muted/30">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground inline-flex items-center gap-1.5">
              <ScanText className="h-3 w-3" />
              {att.ocr_status === 'failed' ? 'OCR error' : 'Extracted text'}
              {att.ocr_completed_at && att.ocr_status === 'completed' && (
                <span className="text-muted-foreground/70 normal-case font-normal">
                  · {formatDistanceToNow(parseISO(att.ocr_completed_at), { addSuffix: true })}
                </span>
              )}
            </span>
            {hasText && (
              <button
                onClick={() => {
                  navigator.clipboard.writeText(att.ocr_text!);
                  toast.success('Text copied');
                }}
                className="h-6 px-1.5 inline-flex items-center gap-1 rounded text-[10px] text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <Copy className="h-2.5 w-2.5" />
                Copy
              </button>
            )}
          </div>
          <div className="px-3 py-2.5 max-h-64 overflow-y-auto">
            {att.ocr_status === 'failed' ? (
              <div className="text-xs text-destructive whitespace-pre-wrap">
                {att.ocr_error || 'Unknown error'}
              </div>
            ) : hasText ? (
              <pre className="text-[12px] leading-relaxed font-sans whitespace-pre-wrap text-foreground/90">
                {highlight(att.ocr_text!, query)}
              </pre>
            ) : (
              <div className="text-xs text-muted-foreground italic">No text extracted.</div>
            )}
          </div>
        </div>
      )}
    </li>
  );
}
