import { AlertCircle, Inbox } from 'lucide-react';

interface AsyncStateProps {
  type: 'empty' | 'error';
  title: string;
  description: string;
  onRetry?: () => void;
}

export default function AsyncState({ type, title, description, onRetry }: AsyncStateProps) {
  const Icon = type === 'error' ? AlertCircle : Inbox;
  return (
    <div className="card p-10 text-center" role={type === 'error' ? 'alert' : 'status'} aria-live="polite">
      <Icon className="mx-auto mb-3 text-muted-foreground" aria-hidden="true" />
      <h2 className="font-semibold text-foreground">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      {onRetry && <button className="btn-primary mt-4" onClick={onRetry}>Coba Lagi</button>}
    </div>
  );
}
