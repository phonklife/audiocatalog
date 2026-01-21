import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { AudioUploadForm } from './AudioUploadForm';

interface UploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function UploadDialog({ open, onOpenChange, onSuccess }: UploadDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogTitle>Upload Audio Track</DialogTitle>
        <AudioUploadForm
          onSuccess={() => {
            onSuccess?.();
            onOpenChange(false);
          }}
          onClose={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
