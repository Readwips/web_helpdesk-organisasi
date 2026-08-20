import { useState, useEffect } from 'react';
import { publicService } from '../services';
import toast from 'react-hot-toast';
import { CheckCircle, ArrowLeft, Ticket, AlertCircle, User, Building2, ChevronRight } from 'lucide-react';

interface Employee {
  id: number;
  employeeCode: string;
  name: string;
  department: string;
  position?: string;
}

interface Category {
  id: number;
  name: string;
  subcategories: { id: number; name: string }[];
}

type Step = 'verify' | 'form' | 'success';

export default function PortalPage() {
  const [step, setStep] = useState<Step>('verify');
  const [employeeCode, setEmployeeCode] = useState('');
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [ticketResult, setTicketResult] = useState<{ ticketId: string; issue: string } | null>(null);

  const [form, setForm] = useState({
    categoryId: '',
    subcategoryId: '',
    issue: '',
    description: '',
    priority: 'MEDIUM',
    location: '',
  });

  const [subcategories, setSubcategories] = useState<{ id: number; name: string }[]>([]);

  useEffect(() => {
    publicService.getCategories().then(res => setCategories(res.data.data)).catch(() => {});
  }, []);

  const handleCategoryChange = (catId: string) => {
    setForm(f => ({ ...f, categoryId: catId, subcategoryId: '' }));
    const cat = categories.find(c => c.id === parseInt(catId));
    setSubcategories(cat?.subcategories || []);
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeCode.trim()) return;
    setIsLoading(true);
    try {
      const res = await publicService.verifyEmployee(employeeCode.trim());
      setEmployee(res.data.data);
      setStep('form');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Nomor pegawai tidak ditemukan');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.categoryId || !form.issue) {
      toast.error('Harap isi semua field yang wajib diisi');
      return;
    }
    setIsLoading(true);
    try {
      const res = await publicService.createTicket({
        employeeCode: employee!.employeeCode,
        categoryId: parseInt(form.categoryId),
        subcategoryId: form.subcategoryId ? parseInt(form.subcategoryId) : undefined,
        issue: form.issue,
        description: form.description || undefined,
        priority: form.priority,
        location: form.location || undefined,
      });
      setTicketResult(res.data.data);
      setStep('success');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal membuat tiket');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setStep('verify');
    setEmployee(null);
    setEmployeeCode('');
    setTicketResult(null);
    setForm({ categoryId: '', subcategoryId: '', issue: '', description: '', priority: 'MEDIUM', location: '' });
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--background)' }}>
      {/* Header */}
      <header className="border-b px-6 py-4 flex items-center justify-between" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'var(--primary)' }}>
            <Ticket size={18} className="text-white" />
          </div>
          <div>
            <h1 className="font-bold text-sm" style={{ color: 'var(--foreground)' }}>Portal Helpdesk IT</h1>
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Buat tiket keluhan Anda</p>
          </div>
        </div>
        <a
          href="/login"
          className="text-xs flex items-center gap-1"
          style={{ color: 'var(--muted-foreground)' }}
        >
          Login Staff IT →
        </a>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-lg">

          {/* Step indicator */}
          <div className="flex items-center justify-center gap-3 mb-8">
            {(['verify', 'form', 'success'] as Step[]).map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                  style={{
                    background: step === s || (s === 'verify' && step !== 'verify') ? 'var(--primary)' : 'var(--muted)',
                    color: step === s || (s === 'verify' && step !== 'verify') ? 'white' : 'var(--muted-foreground)',
                  }}
                >
                  {i + 1}
                </div>
                <span className="text-xs hidden sm:inline" style={{ color: step === s ? 'var(--foreground)' : 'var(--muted-foreground)' }}>
                  {s === 'verify' ? 'Verifikasi' : s === 'form' ? 'Isi Tiket' : 'Selesai'}
                </span>
                {i < 2 && <ChevronRight size={14} style={{ color: 'var(--muted-foreground)' }} />}
              </div>
            ))}
          </div>

          {/* STEP 1 — Verify */}
          {step === 'verify' && (
            <div className="card p-8 animate-fade-in">
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--primary)/20', border: '2px solid var(--primary)' }}>
                  <User size={28} style={{ color: 'var(--primary)' }} />
                </div>
                <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>Masukkan Nomor Pegawai</h2>
                <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                  Masukkan nomor pegawai Anda untuk verifikasi identitas sebelum membuat tiket.
                </p>
              </div>
              <form onSubmit={handleVerify} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>
                    Nomor Pegawai
                  </label>
                  <input
                    type="text"
                    className="input text-center text-2xl font-bold tracking-widest"
                    placeholder="001"
                    value={employeeCode}
                    onChange={e => setEmployeeCode(e.target.value)}
                    maxLength={10}
                    required
                    autoFocus
                  />
                  <p className="text-xs mt-1.5 text-center" style={{ color: 'var(--muted-foreground)' }}>
                    Contoh: 001, 002, 007
                  </p>
                </div>
                <button
                  type="submit"
                  className="btn-primary w-full justify-center py-3"
                  disabled={isLoading}
                >
                  {isLoading ? 'Memverifikasi...' : 'Verifikasi & Lanjutkan →'}
                </button>
              </form>
            </div>
          )}

          {/* STEP 2 — Form Tiket */}
          {step === 'form' && employee && (
            <div className="animate-fade-in space-y-4">
              {/* Employee Info Card */}
              <div className="card p-4 flex items-center gap-3" style={{ borderColor: 'var(--primary)', borderWidth: 1 }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0" style={{ background: 'var(--primary)' }}>
                  {employee.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>{employee.name}</p>
                  <p className="text-xs flex items-center gap-1" style={{ color: 'var(--muted-foreground)' }}>
                    <Building2 size={11} /> {employee.department} {employee.position && `· ${employee.position}`}
                  </p>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full font-mono" style={{ background: 'var(--primary)/10', color: 'var(--primary)' }}>
                  #{employee.employeeCode}
                </span>
                <button onClick={() => setStep('verify')} className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                  <ArrowLeft size={14} />
                </button>
              </div>

              {/* Ticket Form */}
              <div className="card p-6">
                <h2 className="text-base font-bold mb-5" style={{ color: 'var(--foreground)' }}>Detail Keluhan</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--foreground)' }}>Kategori *</label>
                      <select
                        className="select"
                        value={form.categoryId}
                        onChange={e => handleCategoryChange(e.target.value)}
                        required
                      >
                        <option value="">Pilih Kategori</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--foreground)' }}>Subkategori</label>
                      <select
                        className="select"
                        value={form.subcategoryId}
                        onChange={e => setForm(f => ({ ...f, subcategoryId: e.target.value }))}
                        disabled={subcategories.length === 0}
                      >
                        <option value="">Pilih Subkategori (Opsional)</option>
                        {subcategories.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--foreground)' }}>Keluhan Utama *</label>
                    <input
                      type="text"
                      className="input"
                      placeholder="Contoh: WiFi tidak bisa konek di lantai 2"
                      value={form.issue}
                      onChange={e => setForm(f => ({ ...f, issue: e.target.value }))}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--foreground)' }}>Deskripsi Detail</label>
                    <textarea
                      className="input min-h-[90px]"
                      placeholder="Jelaskan masalah Anda secara lebih rinci..."
                      value={form.description}
                      onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--foreground)' }}>Prioritas</label>
                      <select className="select" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                        <option value="LOW">🟢 Low — Tidak mendesak</option>
                        <option value="MEDIUM">🟡 Medium — Perlu ditangani</option>
                        <option value="HIGH">🟠 High — Mengganggu kerja</option>
                        <option value="CRITICAL">🔴 Critical — Sangat mendesak</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--foreground)' }}>Lokasi / Ruangan</label>
                      <input
                        type="text"
                        className="input"
                        placeholder="Contoh: Gedung A Lt. 2"
                        value={form.location}
                        onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex gap-3">
                    <button type="button" className="btn-secondary flex-1 justify-center" onClick={() => setStep('verify')}>
                      Kembali
                    </button>
                    <button type="submit" className="btn-primary flex-1 justify-center py-3" disabled={isLoading}>
                      {isLoading ? 'Mengirim...' : '📨 Kirim Tiket'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* STEP 3 — Success */}
          {step === 'success' && ticketResult && (
            <div className="card p-8 text-center animate-fade-in">
              <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5" style={{ background: 'rgba(34,197,94,0.15)' }}>
                <CheckCircle size={40} className="text-green-500" />
              </div>
              <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>Tiket Berhasil Dibuat!</h2>
              <p className="text-sm mb-6" style={{ color: 'var(--muted-foreground)' }}>
                Tim IT Support akan segera menangani keluhan Anda.
              </p>

              <div className="rounded-xl p-5 mb-6 text-left space-y-2" style={{ background: 'var(--muted)' }}>
                <div className="flex justify-between items-center">
                  <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Nomor Tiket</span>
                  <span className="font-bold font-mono" style={{ color: 'var(--primary)', fontSize: '1.1rem' }}>{ticketResult.ticketId}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Keluhan</span>
                  <span className="text-sm font-medium text-right max-w-[60%]" style={{ color: 'var(--foreground)' }}>{ticketResult.issue}</span>
                </div>
              </div>

              <div className="flex items-start gap-2 p-3 rounded-lg mb-6" style={{ background: 'var(--muted)', border: '1px solid var(--border)' }}>
                <AlertCircle size={15} className="text-amber-400 mt-0.5 shrink-0" />
                <p className="text-xs text-left" style={{ color: 'var(--muted-foreground)' }}>
                  Catat nomor tiket di atas sebagai referensi saat menghubungi tim IT Support.
                </p>
              </div>

              <button onClick={handleReset} className="btn-primary w-full justify-center">
                Buat Tiket Baru
              </button>
            </div>
          )}
        </div>
      </main>

      <footer className="text-center py-4 text-xs" style={{ color: 'var(--muted-foreground)' }}>
        IT Helpdesk System © {new Date().getFullYear()}
      </footer>
    </div>
  );
}
