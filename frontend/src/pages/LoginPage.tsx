import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MonitorDot, Eye, EyeOff, LogIn, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { authService } from '../services';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await authService.login(email, password);
      const { user, token } = res.data.data;
      login(user, token);
      toast.success(`Selamat datang, ${user.name}!`);
      navigate('/');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Login gagal. Periksa email dan password Anda.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const demoLogin = (demoEmail: string, demoPassword: string) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
  };

  return (
    <div className="min-h-screen bg-dark-bg flex">
      {/* Left: Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-950 via-primary-900 to-slate-900 flex-col justify-between p-12">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-500 flex items-center justify-center shadow-glow">
            <MonitorDot size={22} className="text-foreground" />
          </div>
          <div>
            <h1 className="text-foreground font-bold text-lg leading-tight">Helpdesk</h1>
            <p className="text-primary-300 text-xs">Ticket Analysis System</p>
          </div>
        </div>

        {/* Center Content */}
        <div className="space-y-6">
          <div>
            <h2 className="text-4xl font-bold text-foreground leading-tight">
              Monitor, Analyze &<br />
              <span className="text-gradient">Manage SLA</span>
            </h2>
            <p className="mt-4 text-primary-200/70 text-lg leading-relaxed">
              Platform analitik Helpdesk untuk memantau performa tim, mengelola tiket, 
              dan menganalisis tren masalah secara real-time.
            </p>
          </div>

          {/* Feature highlights */}
          <div className="space-y-3">
            {[
              '📊 Dashboard KPI real-time',
              '⏱️ Monitoring SLA otomatis',
              '📈 Analisis tren masalah',
              '📋 Import & Export data',
            ].map((feat) => (
              <div key={feat} className="flex items-center gap-3 text-primary-200">
                <div className="w-1.5 h-1.5 rounded-full bg-primary-400" />
                <span className="text-sm">{feat}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p className="text-primary/50 text-xs">
          Helpdesk Ticket Analysis © 2026 · Portfolio Project
        </p>
      </div>

      {/* Right: Login Form */}
      <div className="flex-1 flex flex-col justify-center px-8 py-12 lg:px-16">
        {/* Mobile logo */}
        <div className="flex items-center gap-3 mb-10 lg:hidden">
          <div className="w-9 h-9 rounded-lg bg-primary-600 flex items-center justify-center">
            <MonitorDot size={20} className="text-foreground" />
          </div>
          <h1 className="text-foreground font-bold">Helpdesk Ticket Analysis</h1>
        </div>

        <div className="max-w-md w-full mx-auto">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-foreground">Masuk</h2>
            <p className="text-muted-foreground mt-2">Masukkan kredensial akun Anda</p>
          </div>



          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@ithelpdesk.id"
                className="input"
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password"
                  className="input pr-10"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full justify-center py-2.5 text-base"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <LogIn size={18} />
              )}
              {isLoading ? 'Masuk...' : 'Masuk'}
            </button>
          </form>

          {/* Portal link for employees */}
          <div className="mt-6 pt-5 border-t" style={{ borderColor: 'var(--border)' }}>
            <p className="text-center text-xs mb-3" style={{ color: 'var(--muted-foreground)' }}>
              Bukan staff IT? Buat tiket keluhan Anda di sini:
            </p>
            <a
              href="/portal"
              className="btn-secondary w-full justify-center py-2.5 text-sm block text-center"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              🎫 Portal Tiket untuk Pegawai
            </a>
          </div>


        </div>
      </div>
    </div>
  );
}
