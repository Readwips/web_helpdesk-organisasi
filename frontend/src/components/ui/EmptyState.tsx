import { LucideIcon, Inbox } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: LucideIcon;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export default function EmptyState({
  title = 'Tidak Ada Data',
  description = 'Belum ada data yang tersedia saat ini.',
  icon: Icon = Inbox,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
        <Icon size={28} className="text-muted-foreground" />
      </div>
      <h3 className="text-base font-semibold mb-1" style={{ color: 'var(--foreground)' }}>
        {title}
      </h3>
      <p className="text-sm max-w-xs" style={{ color: 'var(--muted-foreground)' }}>
        {description}
      </p>
      {action && (
        <button
          onClick={action.onClick}
          className="btn-primary mt-5"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
