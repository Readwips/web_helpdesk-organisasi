import Modal from './Modal';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  isPending?: boolean;
  destructive?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export default function ConfirmDialog({ isOpen, title, description, confirmLabel = 'Konfirmasi', isPending = false, destructive = false, onConfirm, onClose }: ConfirmDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={isPending ? () => undefined : onClose} title={title} maxWidth="max-w-md" closeOnOverlay={!isPending}>
      <p className="text-sm text-muted-foreground">{description}</p>
      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button className="btn-secondary justify-center" onClick={onClose} disabled={isPending}>Batal</button>
        <button className={`${destructive ? 'btn-danger' : 'btn-primary'} justify-center`} onClick={onConfirm} disabled={isPending} aria-busy={isPending}>
          {isPending ? 'Memproses...' : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
