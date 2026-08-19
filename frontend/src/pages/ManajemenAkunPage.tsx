import { useState, useEffect } from 'react';
import { 
  Users, Activity, Shield, UserPlus, 
  Search, Filter, ChevronLeft, ChevronRight, X 
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { userService } from '../services';
import toast from 'react-hot-toast';
import { User, ActivityLog } from '../types';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/id';

dayjs.extend(relativeTime);
dayjs.locale('id');

const roleLabel: Record<string, string> = {
  ADMIN: 'Administrator',
  IT_SUPPORT: 'IT Support',
  MANAGER: 'IT Manager',
};

const actionColor: Record<string, string> = {
  LOGIN: 'text-blue-500 bg-blue-500/10',
  LOGOUT: 'text-slate-500 bg-slate-500/10',
  CREATE_TICKET: 'text-emerald-500 bg-emerald-500/10',
  UPDATE_TICKET: 'text-amber-500 bg-amber-500/10',
  DELETE_TICKET: 'text-red-500 bg-red-500/10',
  IMPORT_DATA: 'text-purple-500 bg-purple-500/10',
  CHANGE_PASSWORD: 'text-rose-500 bg-rose-500/10',
  UPDATE_PROFILE: 'text-indigo-500 bg-indigo-500/10',
  CREATE_USER: 'text-teal-500 bg-teal-500/10',
  UPDATE_USER: 'text-cyan-500 bg-cyan-500/10',
};

export default function ManajemenAkunPage() {
  const { user: currentUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'daftar' | 'log'>('daftar');
  
  // Data states
  const [users, setUsers] = useState<User[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Log filters & pagination
  const [logFilterUser, setLogFilterUser] = useState<number | 'all'>('all');
  const [logFilterAction, setLogFilterAction] = useState<string>('');
  const [logPage, setLogPage] = useState(1);
  const [logTotalPages, setLogTotalPages] = useState(1);

  // New User Form State
  const [showNewUserForm, setShowNewUserForm] = useState(false);
  const [newUserForm, setNewUserForm] = useState({ name: '', email: '', password: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit Technician Name state
  const [editTechUser, setEditTechUser] = useState<User | null>(null);
  const [editTechName, setEditTechName] = useState('');
  const [isEditingTech, setIsEditingTech] = useState(false);

  useEffect(() => {
    if (activeTab === 'daftar') {
      fetchUsers();
    } else {
      fetchLogs();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'log') {
      fetchLogs();
    }
  }, [logFilterUser, logFilterAction, logPage]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await userService.getAll();
      setUsers(res.data.data);
    } catch (error) {
      toast.error('Gagal mengambil data akun');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const res = await userService.getActivity(logFilterUser, {
        page: logPage,
        limit: 20,
        action: logFilterAction || undefined,
      });
      setLogs(res.data.data);
      setLogTotalPages(res.data.pagination.totalPages);
    } catch (error) {
      toast.error('Gagal mengambil data log aktivitas');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserForm.name || !newUserForm.email || !newUserForm.password) {
      toast.error('Mohon isi semua field');
      return;
    }
    
    setIsSubmitting(true);
    try {
      await userService.create(newUserForm);
      toast.success('Akun IT Support berhasil dibuat');
      setShowNewUserForm(false);
      setNewUserForm({ name: '', email: '', password: '' });
      fetchUsers();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Gagal membuat akun');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateTechnicianName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTechUser || !editTechName.trim()) return;
    setIsEditingTech(true);
    try {
      await userService.update(editTechUser.id, { technicianName: editTechName.trim() });
      toast.success('Nama teknisi berhasil diperbarui');
      setEditTechUser(null);
      fetchUsers();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Gagal memperbarui nama teknisi');
    } finally {
      setIsEditingTech(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--foreground)' }}>
            Manajemen Akun
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
            Kelola akun IT Support dan pantau aktivitas sistem
          </p>
        </div>
        
        {currentUser?.role === 'ADMIN' && activeTab === 'daftar' && (
          <button 
            className="btn-primary"
            onClick={() => setShowNewUserForm(true)}
          >
            <UserPlus size={16} />
            Tambah Akun
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b" style={{ borderColor: 'var(--border)' }}>
        <button
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'daftar'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
          style={activeTab === 'daftar' ? { color: 'var(--primary)', borderColor: 'var(--primary)' } : { color: 'var(--muted-foreground)' }}
          onClick={() => setActiveTab('daftar')}
        >
          <div className="flex items-center gap-2">
            <Users size={16} />
            Daftar Akun
          </div>
        </button>
        <button
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'log'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
          style={activeTab === 'log' ? { color: 'var(--primary)', borderColor: 'var(--primary)' } : { color: 'var(--muted-foreground)' }}
          onClick={() => setActiveTab('log')}
        >
          <div className="flex items-center gap-2">
            <Activity size={16} />
            Log Aktivitas
          </div>
        </button>
      </div>

      {/* Tab Content: Daftar Akun */}
      {activeTab === 'daftar' && (
        <div className="space-y-4">
          {isLoading ? (
            <div className="card p-8 flex justify-center"><div className="loader"></div></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {users.map(u => (
                <div key={u.id} className="card p-5 hover:border-primary/50 transition-colors">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{ background: 'var(--primary)' }}>
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-semibold" style={{ color: 'var(--foreground)' }}>{u.name}</h3>
                        <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{u.email}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm" style={{ color: 'var(--muted-foreground)' }}>
                    <div className="flex justify-between items-center py-1 border-b" style={{ borderColor: 'var(--border)' }}>
                      <span>Role</span>
                      <span className="font-medium px-2 py-0.5 rounded-full text-xs bg-blue-500/10 text-blue-500">
                        {roleLabel[u.role] || u.role}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b" style={{ borderColor: 'var(--border)' }}>
                      <span>Nama Teknisi</span>
                      <span className="font-medium" style={{ color: 'var(--foreground)' }}>
                        {(u as any).technicianName || <span className="italic text-xs opacity-50">Belum diset</span>}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b" style={{ borderColor: 'var(--border)' }}>
                      <span>Total Login</span>
                      <span className="font-medium" style={{ color: 'var(--foreground)' }}>{u._count?.activityLogs || 0}x</span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span>Bergabung</span>
                      <span className="font-medium" style={{ color: 'var(--foreground)' }}>{dayjs(u.createdAt).format('DD MMM YYYY')}</span>
                    </div>
                  </div>

                  <div className="mt-5 flex gap-2">
                    {currentUser?.role === 'ADMIN' && (
                      <button
                        className="btn-secondary py-1.5 text-xs justify-center"
                        style={{ flex: 1 }}
                        onClick={() => { setEditTechUser(u); setEditTechName((u as any).technicianName || u.name); }}
                      >
                        ✏️ Edit Teknisi
                      </button>
                    )}
                    <button 
                      className="btn-secondary py-1.5 text-xs justify-center"
                      style={{ flex: 1 }}
                      onClick={() => {
                        setLogFilterUser(u.id);
                        setActiveTab('log');
                      }}
                    >
                      <Activity size={14} /> Lihat Log
                    </button>
                  </div>
                </div>
              ))}
              {users.length === 0 && (
                <div className="col-span-full card p-8 text-center text-muted-foreground">
                  Belum ada akun IT Support.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tab Content: Log Aktivitas */}
      {activeTab === 'log' && (
        <div className="card">
          <div className="p-4 border-b flex flex-col md:flex-row gap-4 justify-between items-center bg-muted/30" style={{ borderColor: 'var(--border)' }}>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="flex items-center gap-2">
                <Filter size={16} className="text-muted-foreground" />
                <select 
                  className="input py-1.5 text-sm"
                  value={logFilterUser}
                  onChange={(e) => { setLogFilterUser(e.target.value === 'all' ? 'all' : parseInt(e.target.value)); setLogPage(1); }}
                >
                  <option value="all">Semua User</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>
              
              <select
                className="input py-1.5 text-sm"
                value={logFilterAction}
                onChange={(e) => { setLogFilterAction(e.target.value); setLogPage(1); }}
              >
                <option value="">Semua Aksi</option>
                <option value="LOGIN">Login</option>
                <option value="CREATE_TICKET">Buat Tiket</option>
                <option value="UPDATE_TICKET">Update Tiket</option>
                <option value="IMPORT_DATA">Import Data</option>
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                className="p-1.5 rounded-md hover:bg-muted disabled:opacity-50"
                disabled={logPage === 1}
                onClick={() => setLogPage(p => Math.max(1, p - 1))}
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-sm font-medium">Halaman {logPage} dari {logTotalPages || 1}</span>
              <button 
                className="p-1.5 rounded-md hover:bg-muted disabled:opacity-50"
                disabled={logPage >= logTotalPages}
                onClick={() => setLogPage(p => Math.min(logTotalPages, p + 1))}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          <div className="p-0">
            {isLoading ? (
              <div className="p-8 flex justify-center"><div className="loader"></div></div>
            ) : logs.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground flex flex-col items-center">
                <Activity size={32} className="mb-2 opacity-20" />
                <p>Tidak ada aktivitas ditemukan</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs uppercase bg-muted/50 border-b" style={{ color: 'var(--muted-foreground)', borderColor: 'var(--border)' }}>
                    <tr>
                      <th className="px-4 py-3">Waktu</th>
                      <th className="px-4 py-3">Pengguna</th>
                      <th className="px-4 py-3">Aksi</th>
                      <th className="px-4 py-3">Deskripsi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr key={log.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors" style={{ borderColor: 'var(--border)' }}>
                        <td className="px-4 py-3 whitespace-nowrap" style={{ color: 'var(--muted-foreground)' }}>
                          {dayjs(log.createdAt).format('DD MMM, HH:mm')}
                        </td>
                        <td className="px-4 py-3 font-medium" style={{ color: 'var(--foreground)' }}>
                          {log.user?.name || 'Sistem'}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 text-[10px] font-bold tracking-wider uppercase rounded-md ${actionColor[log.action] || 'bg-muted text-muted-foreground'}`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="px-4 py-3" style={{ color: 'var(--foreground)' }}>
                          {log.description}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Tambah User */}
      {showNewUserForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="card w-full max-w-md p-6 shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold" style={{ color: 'var(--foreground)' }}>Tambah IT Support</h2>
              <button 
                onClick={() => setShowNewUserForm(false)}
                className="p-1 rounded-md hover:bg-muted text-muted-foreground"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--foreground)' }}>Nama Lengkap</label>
                <input 
                  type="text" 
                  className="input" 
                  value={newUserForm.name}
                  onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })}
                  placeholder="Contoh: Budi Santoso"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--foreground)' }}>Email</label>
                <input 
                  type="email" 
                  className="input" 
                  value={newUserForm.email}
                  onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                  placeholder="email@ithelpdesk.id"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--foreground)' }}>Password</label>
                <input 
                  type="password" 
                  className="input" 
                  value={newUserForm.password}
                  onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                  placeholder="Minimal 8 karakter"
                  required
                  minLength={8}
                />
              </div>
              
              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  className="btn-secondary flex-1 justify-center"
                  onClick={() => setShowNewUserForm(false)}
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  className="btn-primary flex-1 justify-center"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Menyimpan...' : 'Buat Akun'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit Nama Teknisi */}
      {editTechUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="card w-full max-w-sm p-6 shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold" style={{ color: 'var(--foreground)' }}>Edit Nama Teknisi</h2>
              <button 
                onClick={() => setEditTechUser(null)}
                className="p-1 rounded-md hover:bg-muted"
                style={{ color: 'var(--muted-foreground)' }}
              >
                <X size={20} />
              </button>
            </div>

            <p className="text-sm mb-4" style={{ color: 'var(--muted-foreground)' }}>
              Mengubah nama teknisi untuk akun: <strong style={{ color: 'var(--foreground)' }}>{editTechUser.name}</strong>
            </p>

            <form onSubmit={handleUpdateTechnicianName} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--foreground)' }}>Nama Teknisi Baru</label>
                <input 
                  type="text" 
                  className="input" 
                  value={editTechName}
                  onChange={(e) => setEditTechName(e.target.value)}
                  placeholder="Contoh: Andi Pratama"
                  required
                />
              </div>
              
              <div className="pt-2 flex gap-3">
                <button 
                  type="button" 
                  className="btn-secondary flex-1 justify-center"
                  onClick={() => setEditTechUser(null)}
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  className="btn-primary flex-1 justify-center"
                  disabled={isEditingTech}
                >
                  {isEditingTech ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
