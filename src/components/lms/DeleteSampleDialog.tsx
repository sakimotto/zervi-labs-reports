import { useDeleteSample } from '@/hooks/useSamples';
import { toast } from 'sonner';

interface DeleteSampleDialogProps {
  sampleId: string;
  sampleLabel: string;
  onClose: () => void;
  onDeleted: () => void;
}

export function DeleteSampleDialog({ sampleId, sampleLabel, onClose, onDeleted }: DeleteSampleDialogProps) {
  const deleteSample = useDeleteSample();

  const handleDelete = async () => {
    try {
      await deleteSample.mutateAsync(sampleId);
      toast.success(`Sample ${sampleLabel} deleted`);
      onDeleted();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card rounded-lg shadow-elevated p-6 max-w-sm w-full mx-4">
        <h3 className="text-sm font-semibold mb-2">Delete Sample</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Are you sure you want to delete <span className="font-mono font-medium text-foreground">{sampleLabel}</span>? This action cannot be undone.
        </p>
        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="h-8 px-3 text-xs font-medium bg-muted text-muted-foreground rounded-md hover:bg-muted/80 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={deleteSample.isPending}
            className="h-8 px-3 text-xs font-medium bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 transition-colors disabled:opacity-50"
          >
            {deleteSample.isPending ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
