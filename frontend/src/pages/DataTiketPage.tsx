import { useEffect, useState, useCallback } from 'react';
import {
  Search, Filter, Download, ChevronLeft, ChevronRight,
  Eye, Calendar
} from 'lucide-react';
import { ticketService, masterService } from '../services';
import { Ticket, TicketFilters, Category, Department, Pagination } from '../types';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import toast from 'react-hot-toast';
import TicketDetailModal from '../components/ticket/TicketDetailModal';

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

export default function DataTiketPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [filters, setFilters] = useState<TicketFilters>({ page: 1, limit: 10 });
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Modals state
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Master data for filters
  const [categories, setCategories] = useState<Category[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const fetchMasterData = async () => {
    try {
      const [catRes, deptRes] = await Promise.all([
        masterService.getCategories(),
        masterService.getDepartments()
      ]);
      setCategories(catRes.data.data);
      setDepartments(deptRes.data.data);
    } catch (error) {
      console.error('Error fetching master data', error);
    }
  };

  const fetchTickets = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await ticketService.getAll(filters);
      setTickets(res.data.data);
      if (res.data.pagination) setPagination(res.data.pagination);
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
    // Debounce search
    const timer = setTimeout(() => {
      fetchTickets();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchTickets]);

  const handleFilterChange = (key: keyof TicketFilters, value: any) => {
    setFilters((prev: TicketFilters) => ({ ...prev, [key]: value, page: 1 }));
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setFilters((prev: TicketFilters) => ({ ...prev, page: newPage }));
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const { page, limit, ...exportFilters } = filters;
      const res = await ticketService.export(exportFilters);
      
      const blob = new Blob([res.data]);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `data-tiket-${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      
      toast.success('Data tiket berhasil diekspor!');
    } catch (error) {
      toast.error('Gagal mengekspor data tiket');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Data Tiket</h1>
          <p className="text-sm text-muted-foreground mt-1">Seluruh riwayat tiket IT Support</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`btn-secondary ${showFilters ? 'bg-primary-600/20 text-primary border-primary-600/30' : ''}`}
          >
            <Filter size={16} /> Filter
          </button>
          <button 
            onClick={handleExport}
            disabled={isExporting}
            className="btn-secondary"
          >
            {isExporting ? <span className="animate-spin text-lg block w-4 h-4 rounded-full border-2 border-slate-400 border-t-white"></span> : <Download size={16} />}
            Export
          </button>
        </div>
      </div>

      {/* Filters Section */}
      {showFilters && (
        <div className="card p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 animate-slide-in">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Pencarian</label>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="ID Tiket, Issue, Requester..."
                className="input pl-9 text-sm"
                value={filters.search || ''}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Status</label>
            <select
              className="select text-sm"
              value={filters.status || ''}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="">Semua Status</option>
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="PENDING">Pending</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Prioritas</label>
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
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Kategori</label>
            <select
              className="select text-sm"
              value={filters.category || ''}
              onChange={(e) => handleFilterChange('category', e.target.value)}
            >
              <option value="">Semua Kategori</option>
              {categories.map((c: Category) => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          </div>
        </div>
      )}

      {/* Data Table */}
      <div className="card flex flex-col">
        <div className="table-wrapper flex-1">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Tgl Dibuat</th>
                <th>Keluhan</th>
                <th>Requester</th>
                <th>Status</th>
                <th>Prioritas</th>
                <th>SLA</th>
                <th className="text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i}>
                    {Array(8).fill(0).map((_, j) => (
                      <td key={j}><div className="h-4 skeleton rounded-full w-3/4"></div></td>
                    ))}
                  </tr>
                ))
              ) : tickets.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-muted-foreground">
                    Tidak ada data tiket ditemukan.
                  </td>
                </tr>
              ) : (
                tickets.map((ticket: Ticket) => (
                  <tr key={ticket.id}>
                    <td className="font-mono text-xs text-primary">{ticket.ticketId}</td>
                    <td className="text-xs">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={12} className="text-muted-foreground" />
                        {format(new Date(ticket.createdAt), 'dd MMM yyyy', { locale: localeId })}
                      </div>
                    </td>
                    <td className="max-w-[200px]">
                      <div className="truncate font-medium text-foreground" title={ticket.issue}>{ticket.issue}</div>
                      <div className="text-[10px] text-muted-foreground truncate">{ticket.category?.name}</div>
                    </td>
                    <td>
                      <div className="text-sm text-foreground">{ticket.requesterName}</div>
                      <div className="text-[10px] text-muted-foreground">{ticket.department?.name}</div>
                      {ticket.location && (
                        <div className="text-[10px] text-muted-foreground flex items-center gap-0.5 mt-0.5">
                          📍 {ticket.location}
                        </div>
                      )}
                    </td>
                    <td><span className={statusClass[ticket.status]}>{ticket.status}</span></td>
                    <td><span className={priorityClass[ticket.priority]}>{ticket.priority}</span></td>
                    <td><span className={slaClass[ticket.slaStatus]}>{ticket.slaStatus}</span></td>
                    <td>
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded transition-colors" 
                          title="Lihat Detail"
                          onClick={() => {
                            setSelectedTicket(ticket);
                            setIsDetailOpen(true);
                          }}
                        >
                          <Eye size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="px-6 py-4 border-t border-dark-border flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Menampilkan <span className="text-foreground font-medium">{(pagination.page - 1) * pagination.limit + (tickets.length > 0 ? 1 : 0)}</span> - <span className="text-foreground font-medium">{(pagination.page - 1) * pagination.limit + tickets.length}</span> dari <span className="text-foreground font-medium">{pagination.total}</span> data
          </div>
          <div className="flex items-center gap-2">
            <button 
              className="btn-secondary px-2 py-1" 
              disabled={pagination.page <= 1}
              onClick={() => handlePageChange(pagination.page - 1)}
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm font-medium text-foreground px-2">
              Halaman {pagination.page} dari {pagination.totalPages}
            </span>
            <button 
              className="btn-secondary px-2 py-1"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => handlePageChange(pagination.page + 1)}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      <TicketDetailModal 
        isOpen={isDetailOpen} 
        onClose={() => setIsDetailOpen(false)} 
        ticket={selectedTicket} 
      />
    </div>
  );
}
