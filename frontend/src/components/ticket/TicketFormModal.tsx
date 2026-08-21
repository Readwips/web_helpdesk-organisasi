import { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import { Ticket, Category, Subcategory, Department, Technician } from '../../types';
import { ticketService, masterService } from '../../services';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

interface TicketFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticket?: Ticket | null;
  onSuccess: () => void;
  categories: Category[];
  departments: Department[];
  technicians: Technician[];
}

export default function TicketFormModal({ 
  isOpen, onClose, ticket, onSuccess, categories, departments, technicians 
}: TicketFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const { user } = useAuthStore();
  const isITSupport = user?.role === 'IT_SUPPORT';
  
  const isEdit = !!ticket;

  const [formData, setFormData] = useState<Partial<Ticket>>({
    requesterName: '',
    departmentId: departments[0]?.id || 1,
    categoryId: categories[0]?.id || 1,
    subcategoryId: undefined,
    issue: '',
    description: '',
    priority: 'MEDIUM',
    technicianId: undefined,
  });

  useEffect(() => {
    if (ticket) {
      setFormData({
        requesterName: ticket.requesterName,
        departmentId: ticket.departmentId,
        categoryId: ticket.categoryId,
        subcategoryId: ticket.subcategoryId,
        issue: ticket.issue,
        description: ticket.description || '',
        priority: ticket.priority,
        technicianId: ticket.technicianId,
        status: ticket.status,
      });
      fetchSubcategories(ticket.categoryId);
    } else {
      setFormData({
        requesterName: '',
        departmentId: departments[0]?.id || 1,
        categoryId: categories[0]?.id || 1,
        subcategoryId: undefined,
        issue: '',
        description: '',
        priority: 'MEDIUM',
        technicianId: undefined,
      });
      if (categories[0]) {
        fetchSubcategories(categories[0].id);
      }
    }
  }, [ticket, categories, departments, isOpen]);

  const fetchSubcategories = async (categoryId: number) => {
    try {
      const res = await masterService.getSubcategories(categoryId);
      setSubcategories(res.data.data);
    } catch (error) {
      console.error('Failed to fetch subcategories', error);
    }
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const catId = Number(e.target.value);
    setFormData({ ...formData, categoryId: catId, subcategoryId: undefined });
    fetchSubcategories(catId);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (isEdit && ticket) {
        await ticketService.update(ticket.id, formData);
        toast.success('Tiket berhasil diupdate');
      } else {
        await ticketService.create(formData);
        toast.success('Tiket berhasil dibuat');
      }
      onSuccess();
      onClose();
    } catch (error) {
      toast.error('Gagal menyimpan tiket');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Update Tiket' : 'Buat Tiket Baru'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {!isEdit && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Nama Pemohon (Requester)</label>
              <input
                required
                type="text"
                className="input"
                value={formData.requesterName || ''}
                onChange={e => setFormData({ ...formData, requesterName: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Departemen</label>
              <select
                required
                className="select"
                value={formData.departmentId || ''}
                onChange={e => setFormData({ ...formData, departmentId: Number(e.target.value) })}
              >
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Kategori</label>
            <select
              required
              className="select"
              value={formData.categoryId || ''}
              onChange={handleCategoryChange}
            >
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Subkategori</label>
            <select
              className="select"
              value={formData.subcategoryId || ''}
              onChange={e => setFormData({ ...formData, subcategoryId: Number(e.target.value) || undefined })}
            >
              <option value="">Pilih Subkategori (Opsional)</option>
              {subcategories.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Keluhan Utama</label>
          <input
            required
            type="text"
            className="input"
            value={formData.issue || ''}
            onChange={e => setFormData({ ...formData, issue: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Deskripsi Detail</label>
          <textarea
            className="input min-h-[100px]"
            value={formData.description || ''}
            onChange={e => setFormData({ ...formData, description: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Prioritas</label>
            <select
              required
              className="select"
              value={formData.priority || 'MEDIUM'}
              onChange={e => setFormData({ ...formData, priority: e.target.value as any })}
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </select>
          </div>

          {/* Only show technician assign for Admin/Manager — IT_SUPPORT is auto-assigned */}
          {!isITSupport ? (
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Assign ke Teknisi</label>
              <select
                className="select"
                value={formData.technicianId || ''}
                onChange={e => setFormData({ ...formData, technicianId: Number(e.target.value) || undefined })}
              >
                <option value="">Belum Diassign</option>
                {technicians.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Assign ke Teknisi</label>
              <div className="flex items-center gap-2 h-[42px] px-3 rounded-lg" style={{ background: 'var(--muted)', border: '1px solid var(--border)' }}>
                <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>👤</span>
                <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                  Otomatis — akun Anda
                </span>
              </div>
            </div>
          )}
        </div>

        {isEdit && (
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Status Tiket</label>
            <select
              required
              className="select"
              value={formData.status || 'OPEN'}
              onChange={e => setFormData({ ...formData, status: e.target.value as any })}
            >
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="PENDING">Pending</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t border-dark-border mt-6">
          <button type="button" onClick={onClose} className="btn-secondary">Batal</button>
          <button type="submit" disabled={isSubmitting} className="btn-primary">
            {isSubmitting ? 'Menyimpan...' : 'Simpan Tiket'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
