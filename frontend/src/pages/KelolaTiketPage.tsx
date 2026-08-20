import { useEffect, useState, useCallback } from 'react';
import {
  Search, Plus, Filter, Edit, Trash2, ShieldAlert
} from 'lucide-react';
import { ticketService, masterService } from '../services';
import { Ticket, TicketFilters, Category, Department, Technician } from '../types';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import toast from 'react-hot-toast';
import TicketDetailModal from '../components/ticket/TicketDetailModal';
import TicketFormModal from '../components/ticket/TicketFormModal';
import EmptyState from '../components/ui/EmptyState';
import { useAuthStore } from '../store/authStore';
import { PERMISSIONS, hasPermission } from '../utils/permissions';

const statusClass: Record<string, string> = {
  OPEN: 'badge-open', IN_PROGRESS: 'badge-in-progress',
  PENDING: 'badge-pending', RESOLVED: 'badge-resolved', CLOSED: 'badge-closed',
};

const priorityClass: Record<string, string> = {
  CRITICAL: 'priority-critical', HIGH: 'priority-high',
  MEDIUM: 'priority-medium', LOW: 'priority-low',
};

export default function KelolaTiketPage() {
  const { user } = useAuthStore();
  const canCreate = hasPermission(user?.role, PERMISSIONS.ACTION_CREATE_TICKET);
  const canEdit   = hasPermission(user?.role, PERMISSIONS.ACTION_EDIT_TICKET);
  const canDelete = hasPermission(user?.role, PERMISSIONS.ACTION_DELETE_TICKET);

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filters, setFilters] = useState<TicketFilters>({ page: 1, limit: 12, status: 'OPEN,IN_PROGRESS,PENDING' });
  const [isLoading, setIsLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  // Modals state
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  
  // Master data
  const [categories, setCategories] = useState<Category[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  
  const fetchMasterData = async () => {
    try {
      const [catRes, deptRes, techRes] = await Promise.all([
        masterService.getCategories(),
        masterService.getDepartments(),
        masterService.getTechnicians()
      ]);
      setCategories(catRes.data.data);
      setDepartments(deptRes.data.data);
      setTechnicians(techRes.data.data);
    } catch (error) {
      console.error('Error fetching master data', error);
    }
  };

  const fetchTickets = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await ticketService.getAll(filters);
      setTickets(res.data.data);
    } catch (error) {
      toast.error('Gagal mengambil data tiket');
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchMasterData();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTickets();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchTickets]);

  const handleFilterChange = (key: keyof TicketFilters, value: any) => {
    setFilters((prev: TicketFilters) => ({ ...prev, [key]: value, page: 1 }));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Kelola Tiket</h1>
          <p className="text-sm text-slate-400 mt-1">Manajemen operasional tiket aktif</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`btn-secondary ${showFilters ? 'bg-primary-600/20 text-primary-400 border-primary-600/30' : ''}`}
          >
            <Filter size={16} /> Filter
          </button>
          {canCreate && (
            <button 
              className="btn-primary"
              onClick={() => {
                setSelectedTicket(null);
                setIsFormOpen(true);
              }}
            >
              <Plus size={16} /> Buat Tiket
            </button>
          )}
        </div>
      </div>

      {showFilters && (
        <div className="card p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 animate-slide-in">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Pencarian</label>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Cari ID, Issue..."
                className="input pl-9 text-sm"
                value={filters.search || ''}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Status Tiket Aktif</label>
            <select
              className="select text-sm"
              value={filters.status || ''}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="OPEN,IN_PROGRESS,PENDING">Semua Tiket Aktif</option>
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="PENDING">Pending</option>
              <option value="RESOLVED,CLOSED">Selesai (Resolved/Closed)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Prioritas</label>
            <select
              className="select text-sm"
              value={filters.priority || ''}
              onChange={(e) => handleFilterChange('priority', e.target.value)}
            >
              <option value="">Semua Prioritas</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>
        </div>
      )}

      {/* Ticket Grid View */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
        {isLoading ? (
          Array(8).fill(0).map((_, i) => (
            <div key={i} className="card p-5 h-48 skeleton" />
          ))
        ) : tickets.length === 0 ? (
          <div className="col-span-full">
            <EmptyState
              title="Tidak Ada Tiket Aktif"
              description="Semua tiket sudah selesai atau belum ada tiket yang dibuat. Buat tiket baru untuk memulai."
              icon={ShieldAlert}
              action={{ label: '+ Buat Tiket', onClick: () => { setSelectedTicket(null); setIsFormOpen(true); } }}
            />
          </div>
        ) : (
          tickets.map((ticket: Ticket) => (
            <div key={ticket.id} className="card p-5 hover:border-primary-500/50 transition-colors flex flex-col">
              <div className="flex justify-between items-start mb-3">
                <span className="font-mono text-sm text-primary-400 font-medium">
                  {ticket.ticketId}
                </span>
                <span className={statusClass[ticket.status]}>{ticket.status}</span>
              </div>
              
              <h3 
                className="font-medium mb-1 line-clamp-2 text-sm cursor-pointer hover:text-primary-400 transition-colors" 
                style={{ color: 'var(--foreground)' }}
                title={ticket.issue}
                onClick={() => {
                  setSelectedTicket(ticket);
                  setIsDetailOpen(true);
                }}
              >
                {ticket.issue}
              </h3>
              <div className="text-xs mb-4 flex-1" style={{ color: 'var(--muted-foreground)' }}>
                {ticket.category?.name}
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between items-center text-xs">
                  <span style={{ color: 'var(--muted-foreground)' }}>Requester</span>
                  <span style={{ color: 'var(--foreground)' }}>{ticket.requesterName}</span>
                </div>
                {ticket.location && (
                  <div className="flex justify-between items-center text-xs">
                    <span style={{ color: 'var(--muted-foreground)' }}>Lokasi</span>
                    <span style={{ color: 'var(--foreground)' }}>📍 {ticket.location}</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-xs">
                  <span style={{ color: 'var(--muted-foreground)' }}>Prioritas</span>
                  <span className={priorityClass[ticket.priority]}>{ticket.priority}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span style={{ color: 'var(--muted-foreground)' }}>Dibuat</span>
                  <span style={{ color: 'var(--foreground)' }}>{format(new Date(ticket.createdAt), 'dd MMM yy HH:mm')}</span>
                </div>
              </div>

              <div className="pt-3 border-t flex gap-2" style={{ borderColor: 'var(--border)' }}>
                {canEdit && (
                  <button 
                    className="flex-1 btn-primary py-1.5 text-xs justify-center"
                    onClick={() => {
                      setSelectedTicket(ticket);
                      setIsFormOpen(true);
                    }}
                  >
                    <Edit size={14} /> Update
                  </button>
                )}
                {canDelete && (
                  <button 
                    className="btn-secondary px-2 py-1.5" 
                    title="Hapus Tiket"
                    onClick={async () => {
                      if (window.confirm('Yakin ingin menghapus tiket ini?')) {
                        try {
                          await ticketService.delete(ticket.id);
                          toast.success('Tiket berhasil dihapus');
                          fetchTickets();
                        } catch (e) {
                          toast.error('Gagal menghapus tiket');
                        }
                      }
                    }}
                  >
                    <Trash2 size={14} className="text-red-400" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <TicketDetailModal 
        isOpen={isDetailOpen} 
        onClose={() => setIsDetailOpen(false)} 
        ticket={selectedTicket} 
      />

      <TicketFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        ticket={selectedTicket}
        onSuccess={fetchTickets}
        categories={categories}
        departments={departments}
        technicians={technicians}
      />
    </div>
  );
}
