import { Construction } from 'lucide-react';

interface PlaceholderProps {
  title: string;
  description: string;
  phase: string;
}

export default function PlaceholderPage({ title, description, phase }: PlaceholderProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
      <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
        <Construction size={32} className="text-amber-400" />
      </div>
      <div className="text-center">
        <h2 className="text-xl font-bold text-white">{title}</h2>
        <p className="text-slate-400 mt-2 max-w-md">{description}</p>
        <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-full text-amber-400 text-sm">
          <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse-slow" />
          {phase}
        </div>
      </div>
    </div>
  );
}
