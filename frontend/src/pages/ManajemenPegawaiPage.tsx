import { useState, useEffect, useRef } from 'react';
import { Users, Plus, Search, Upload, UserCheck, UserX, X, Download } from 'lucide-react';
import { employeeService } from '../services';
import toast from 'react-hot-toast';

interface Employee {
  id: number;
  employeeCode: string;
  name: string;
  department: string;
  position?: string;
  isActive: boolean;
  createdAt: string;
}

const DEPARTMENTS = ['Finance', 'HR', 'Marketing', 'Operations', 'IT', 'Legal', 'Procurement', 'Sales'];

export default function ManajemenPegawaiPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');
  const [showForm, setShowForm] = useState(false);
  const [editEmployee, setEditEmployee] = useState<Employee | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({ employeeCode: '', name: '', department: '', position: '' });

  useEffect(() => { fetchEmployees(); }, [search, filterActive]);

  const fetchEmployees = async () => {
    setIsLoading(true);
    try {
      const params: any = {};
      if (search) params.search = search;
      if (filterActive !== 'all') params.isActive = filterActive === 'active';
      const res = await employeeService.getAll(params);
      setEmployees(res.data.data);
    } catch {
      toast.error('Gagal mengambil data pegawai');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editEmployee) {
        await employeeService.update(editEmployee.id, {
          name: form.name,
          department: form.department,
          position: form.position,
        });
        toast.success('Data pegawai berhasil diperbarui');
      } else {
        await employeeService.create({
          employeeCode: form.employeeCode,
          name: form.name,
          department: form.department,
          position: form.position,
        });
        toast.success('Pegawai berhasil ditambahkan');
      }
      setShowForm(false);
      setEditEmployee(null);
      setForm({ employeeCode: '', name: '', department: '', position: '' });
      fetchEmployees();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menyimpan data');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleActive = async (emp: Employee) => {
    try {
      await employeeService.update(emp.id, { isActive: !emp.isActive });
      toast.success(emp.isActive ? 'Pegawai dinonaktifkan' : 'Pegawai diaktifkan');
      fetchEmployees();
    } catch {
      toast.error('Gagal mengubah status pegawai');
    }
  };

  const openEdit = (emp: Employee) => {
    setEditEmployee(emp);
    setForm({ employeeCode: emp.employeeCode, name: emp.name, department: emp.department, position: emp.position || '' });
    setShowForm(true);
  };

  const handleCsvImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    const lines = text.split('\n').filter(l => l.trim());
    const rows: any[] = [];

    // Skip header row
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
      if (cols.length >= 3) {
        rows.push({ employeeCode: cols[0], name: cols[1], department: cols[2], position: cols[3] || '' });
      }
    }

    if (rows.length === 0) {
      toast.error('File CSV tidak berisi data yang valid');
      return;
    }

    try {
      const res = await employeeService.import(rows);
      toast.success(res.data.message);
      fetchEmployees();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal mengimport data');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const downloadTemplate = () => {
    const csv = 'employeeCode,name,department,position\n001,Contoh Pegawai,Finance,Staff Keuangan\n002,Pegawai Dua,HR,HR Officer';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'template_pegawai.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>Manajemen Pegawai</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
            Kelola data pegawai yang berhak membuat tiket melalui portal
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={downloadTemplate} className="btn-secondary gap-2">
            <Download size={15} /> Template CSV
          </button>
          <button onClick={() => fileInputRef.current?.click()} className="btn-secondary gap-2">
            <Upload size={15} /> Import CSV
          </button>
          <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleCsvImport} />
          <button
            onClick={() => { setEditEmployee(null); setForm({ employeeCode: '', name: '', department: '', position: '' }); setShowForm(true); }}
            className="btn-primary gap-2"
          >
            <Plus size={15} /> Tambah Pegawai
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            className="input pl-9"
            placeholder="Cari nama, nomor pegawai, atau departemen..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'active', 'inactive'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilterActive(f)}
              className={filterActive === f ? 'btn-primary py-2 px-4 text-sm' : 'btn-secondary py-2 px-4 text-sm'}
            >
              {f === 'all' ? 'Semua' : f === 'active' ? 'Aktif' : 'Nonaktif'}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b" style={{ borderColor: 'var(--border)', background: 'var(--muted)' }}>
                <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>No. Pegawai</th>
                <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>Nama</th>
                <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>Departemen</th>
                <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>Jabatan</th>
                <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>Status</th>
                <th className="text-right py-3 px-4 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={6} className="py-16 text-center"><div className="loader mx-auto" /></td></tr>
              ) : employees.length === 0 ? (
                <tr><td colSpan={6} className="py-16 text-center text-sm" style={{ color: 'var(--muted-foreground)' }}>
                  Belum ada data pegawai. Tambah atau import dari CSV.
                </td></tr>
              ) : employees.map(emp => (
                <tr key={emp.id} className="border-b transition-colors hover:bg-white/5" style={{ borderColor: 'var(--border)' }}>
                  <td className="py-3 px-4">
                    <span className="font-mono font-bold text-sm px-2 py-0.5 rounded" style={{ background: 'var(--primary)/10', color: 'var(--primary)' }}>
                      {emp.employeeCode}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-medium text-sm" style={{ color: 'var(--foreground)' }}>{emp.name}</td>
                  <td className="py-3 px-4 text-sm" style={{ color: 'var(--muted-foreground)' }}>{emp.department}</td>
                  <td className="py-3 px-4 text-sm" style={{ color: 'var(--muted-foreground)' }}>{emp.position || '—'}</td>
                  <td className="py-3 px-4">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${emp.isActive ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                      {emp.isActive ? '● Aktif' : '● Nonaktif'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(emp)} className="btn-secondary py-1 px-3 text-xs">Edit</button>
                      <button
                        onClick={() => toggleActive(emp)}
                        className="py-1 px-2 rounded-md text-xs transition-colors"
                        style={{ background: emp.isActive ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)', color: emp.isActive ? 'rgb(239,68,68)' : 'rgb(34,197,94)' }}
                        title={emp.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                      >
                        {emp.isActive ? <UserX size={13} /> : <UserCheck size={13} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {employees.length > 0 && (
          <div className="p-3 text-xs text-center" style={{ color: 'var(--muted-foreground)', borderTop: '1px solid var(--border)' }}>
            Total: {employees.length} pegawai
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="card w-full max-w-md p-6 shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold" style={{ color: 'var(--foreground)' }}>
                {editEmployee ? 'Edit Pegawai' : 'Tambah Pegawai Baru'}
              </h2>
              <button onClick={() => setShowForm(false)} className="p-1 rounded-md hover:bg-muted" style={{ color: 'var(--muted-foreground)' }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--foreground)' }}>
                  Nomor Pegawai {editEmployee && <span className="text-xs opacity-60">(tidak dapat diubah)</span>}
                </label>
                <input
                  type="text"
                  className="input font-mono text-lg text-center tracking-widest"
                  value={editEmployee ? form.employeeCode : form.employeeCode}
                  onChange={e => setForm(f => ({ ...f, employeeCode: e.target.value }))}
                  placeholder="001"
                  required
                  disabled={!!editEmployee}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--foreground)' }}>Nama Lengkap</label>
                <input type="text" className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Nama Pegawai" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--foreground)' }}>Departemen</label>
                  <select className="select" value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} required>
                    <option value="">Pilih...</option>
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--foreground)' }}>Jabatan</label>
                  <input type="text" className="input" value={form.position} onChange={e => setForm(f => ({ ...f, position: e.target.value }))} placeholder="Opsional" />
                </div>
              </div>
              <div className="pt-2 flex gap-3">
                <button type="button" className="btn-secondary flex-1 justify-center" onClick={() => setShowForm(false)}>Batal</button>
                <button type="submit" className="btn-primary flex-1 justify-center" disabled={isSubmitting}>
                  {isSubmitting ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
