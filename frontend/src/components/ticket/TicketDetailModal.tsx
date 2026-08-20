import Modal from '../ui/Modal';
import { Ticket } from '../../types';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

interface TicketDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticket: Ticket | null;
}

const statusClass: Record<string, string> = {
  OPEN: 'badge-open', IN_PROGRESS: 'badge-in-progress',
  PENDING: 'badge-pending', RESOLVED: 'badge-resolved', CLOSED: 'badge-closed',
};

const priorityClass: Record<string, string> = {
  CRITICAL: 'priority-critical', HIGH: 'priority-high',
  MEDIUM: 'priority-medium', LOW: 'priority-low',
};

const slaClass: Record<string, string> = {
  MET: 'sla-met', BREACHED: 'sla-breached', PENDING: 'sla-pending',
};

export default function TicketDetailModal({ isOpen, onClose, ticket }: TicketDetailModalProps) {
  if (!ticket) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Detail Tiket - ${ticket.ticketId}`} maxWidth="max-w-3xl">
      <div className="space-y-6">
        {/* Header Badges */}
        <div className="flex flex-wrap gap-2">
          <span className={statusClass[ticket.status]}>{ticket.status}</span>
          <span className={priorityClass[ticket.priority]}>{ticket.priority}</span>
          <span className={slaClass[ticket.slaStatus]}>SLA: {ticket.slaStatus}</span>
        </div>

        {/* Issue & Description */}
        <div>
          <h3 className="text-lg font-bold text-white mb-2">{ticket.issue}</h3>
          <div className="p-4 bg-dark-bg border border-dark-border rounded-lg text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
            {ticket.description || 'Tidak ada deskripsi detail.'}
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="card p-4 space-y-3">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Informasi Pemohon</h4>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500">Nama</span>
              <span className="text-slate-200 font-medium">{ticket.requesterName}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500">Departemen</span>
              <span className="text-slate-200">{ticket.department?.name}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500">Lokasi / Ruangan</span>
              <span className="text-slate-200">{ticket.location || <span className="text-slate-600 italic">Tidak dicantumkan</span>}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500">Tanggal Dibuat</span>
              <span className="text-slate-200">{format(new Date(ticket.createdAt), 'dd MMM yyyy, HH:mm', { locale: localeId })}</span>
            </div>
          </div>

          <div className="card p-4 space-y-3">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Kategori & Penugasan</h4>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500">Kategori</span>
              <span className="text-slate-200">{ticket.category?.name}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500">Subkategori</span>
              <span className="text-slate-200">{ticket.subcategory?.name || '-'}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500">Teknisi (Assignee)</span>
              <span className="text-slate-200 font-medium">{ticket.technician?.name || 'Belum Diassign'}</span>
            </div>
          </div>
        </div>

        {/* Resolution Notes (if any) */}
        {(ticket.resolutionNotes || ticket.resolvedAt) && (
          <div className="card p-4 border-l-4 border-l-emerald-500">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Penyelesaian</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Diselesaikan Pada</span>
                <span className="text-slate-200">
                  {ticket.resolvedAt ? format(new Date(ticket.resolvedAt), 'dd MMM yyyy, HH:mm', { locale: localeId }) : '-'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Waktu Resolusi</span>
                <span className="text-slate-200">{ticket.resolutionTime ? `${ticket.resolutionTime.toFixed(1)} Jam` : '-'}</span>
              </div>
              <div className="mt-2 pt-2 border-t border-dark-border">
                <span className="block text-slate-500 mb-1">Catatan Resolusi:</span>
                <p className="text-slate-300">{ticket.resolutionNotes || '-'}</p>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="flex justify-end pt-4 border-t border-dark-border mt-6">
        <button type="button" onClick={onClose} className="btn-secondary">Tutup</button>
      </div>
    </Modal>
  );
}
