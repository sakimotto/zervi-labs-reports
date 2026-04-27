import { useDeleteSample } from '@/hooks/useSamples';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

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
      toast.success(`Test ${sampleLabel} deleted`);
      onDeleted();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete');
    }
  };

  return (
    <AlertDialog open onOpenChange={(o) => !o && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete test?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete{' '}
            <span className="font-mono font-medium text-foreground">{sampleLabel}</span>? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteSample.isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteSample.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleteSample.isPending ? 'Deleting…' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
