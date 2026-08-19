import { useState } from 'react';
import {
  User, Lock, Shield, Save, Eye, EyeOff, AlertCircle, CheckCircle2,
  Mail, Briefcase, Pencil, X
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { authService } from '../services';
import toast from 'react-hot-toast';

interface FormErrors {
  [key: string]: string;
}

const roleLabel: Record<string, string> = {
  ADMIN: 'Administrator',
  IT_SUPPORT: 'IT Support',
  MANAGER: 'IT Manager',
};

const roleBadgeColor: Record<string, string> = {
  ADMIN: 'bg-red-500/15 text-red-400 border-red-500/30',
  IT_SUPPORT: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  MANAGER: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
};

export default function PengaturanPage() {
  const { user, updateUser } = useAuthStore();

  // Profile edit state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: user?.name || '', email: user?.email || '' });
  const [profileErrors, setProfileErrors] = useState<FormErrors>({});
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Password form state
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [passwordErrors, setPasswordErrors] = useState<FormErrors>({});
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  const validatePasswords = (): boolean => {
    const errors: FormErrors = {};

    if (!passwords.currentPassword) {
      errors.currentPassword = 'Password saat ini wajib diisi';
    }
    if (!passwords.newPassword) {
      errors.newPassword = 'Password baru wajib diisi';
    } else if (passwords.newPassword.length < 8) {
      errors.newPassword = 'Password baru minimal 8 karakter';
    }
    if (!passwords.confirmPassword) {
      errors.confirmPassword = 'Konfirmasi password wajib diisi';
    } else if (passwords.newPassword !== passwords.confirmPassword) {
      errors.confirmPassword = 'Konfirmasi password tidak cocok';
    }
    if (passwords.currentPassword === passwords.newPassword && passwords.newPassword) {
      errors.newPassword = 'Password baru tidak boleh sama dengan password lama';
    }

    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatePasswords()) return;

    setIsSavingPassword(true);
    try {
      await authService.changePassword(passwords.currentPassword, passwords.newPassword);
      toast.success('Password berhasil diubah!');
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordErrors({});
    } catch (error: any) {
      const msg = error?.response?.data?.message || 'Gagal mengubah password';
      toast.error(msg);
      if (msg.toLowerCase().includes('password')) {
        setPasswordErrors({ currentPassword: 'Password saat ini tidak benar' });
      }
    } finally {
      setIsSavingPassword(false);
    }
  };

  const getPasswordStrength = (password: string): { label: string; color: string; width: string } => {
    if (!password) return { label: '', color: '', width: '0%' };
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 2) return { label: 'Lemah', color: 'bg-red-500', width: '33%' };
    if (score <= 3) return { label: 'Sedang', color: 'bg-amber-500', width: '66%' };
    return { label: 'Kuat', color: 'bg-emerald-500', width: '100%' };
  };

  const pwStrength = getPasswordStrength(passwords.newPassword);

  const validateProfile = (): boolean => {
    const errors: FormErrors = {};
    if (!profileForm.name.trim()) errors.name = 'Nama wajib diisi';
    else if (profileForm.name.trim().length < 2) errors.name = 'Nama minimal 2 karakter';
    setProfileErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateProfile()) return;
    setIsSavingProfile(true);
    try {
      const res = await authService.updateProfile(profileForm.name.trim(), profileForm.email.trim());
      updateUser(res.data.data);
      toast.success('Profil berhasil diperbarui!');
      setIsEditingProfile(false);
      setProfileErrors({});
    } catch (error: any) {
      const msg = error?.response?.data?.message || 'Gagal menyimpan profil';
      toast.error(msg);
    } finally {
      setIsSavingProfile(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      {/* Profile Info Card */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 rounded-lg bg-primary/10">
            <User size={18} style={{ color: 'var(--primary)' }} />
          </div>
          <div>
            <h2 className="font-semibold" style={{ color: 'var(--foreground)' }}>Profil Pengguna</h2>
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Informasi akun Anda</p>
          </div>
        </div>

        {/* Avatar & Name display */}
        <div className="flex items-center gap-5 mb-6">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold text-white shadow-lg shrink-0"
            style={{ background: 'var(--primary)' }}
          >
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div>
            <p className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>{user?.name}</p>
            <div className={`mt-1.5 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${roleBadgeColor[user?.role || ''] || ''}`}>
              <Shield size={10} />
              {roleLabel[user?.role || ''] || user?.role}
            </div>
          </div>
        </div>

        {/* Edit Profile Form or Info display */}
        {isEditingProfile ? (
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--foreground)' }}>Nama Lengkap</label>
                <input
                  type="text"
                  className={`input ${profileErrors.name ? 'border-red-500' : ''}`}
                  value={profileForm.name}
                  onChange={(e) => { setProfileForm({ ...profileForm, name: e.target.value }); setProfileErrors({ ...profileErrors, name: '' }); }}
                  placeholder="Nama lengkap"
                />
                {profileErrors.name && (
                  <p className="flex items-center gap-1.5 mt-1.5 text-xs text-red-400">
                    <AlertCircle size={12} /> {profileErrors.name}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--foreground)' }}>Email</label>
                <input
                  type="email"
                  className="input opacity-50 cursor-not-allowed"
                  value={profileForm.email}
                  disabled
                  placeholder="email@contoh.com"
                />
                <p className="text-xs mt-1.5" style={{ color: 'var(--muted-foreground)' }}>Email tidak dapat diubah.</p>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => { setIsEditingProfile(false); setProfileErrors({}); setProfileForm({ name: user?.name || '', email: user?.email || '' }); }}
              >
                <X size={14} /> Batal
              </button>
              <button type="submit" disabled={isSavingProfile} className="btn-primary">
                <Save size={14} />
                {isSavingProfile ? 'Menyimpan...' : 'Simpan Profil'}
              </button>
            </div>
          </form>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Email */}
              <div className="flex items-start gap-3 p-4 rounded-xl border" style={{ borderColor: 'var(--border)', background: 'var(--muted)' }}>
                <div className="p-1.5 rounded-lg" style={{ background: 'var(--accent)' }}>
                  <Mail size={14} style={{ color: 'var(--muted-foreground)' }} />
                </div>
                <div>
                  <p className="text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>Email</p>
                  <p className="text-sm font-semibold mt-0.5" style={{ color: 'var(--foreground)' }}>{user?.email || '-'}</p>
                </div>
              </div>
              {/* Role */}
              <div className="flex items-start gap-3 p-4 rounded-xl border" style={{ borderColor: 'var(--border)', background: 'var(--muted)' }}>
                <div className="p-1.5 rounded-lg" style={{ background: 'var(--accent)' }}>
                  <Briefcase size={14} style={{ color: 'var(--muted-foreground)' }} />
                </div>
                <div>
                  <p className="text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>Role / Jabatan</p>
                  <p className="text-sm font-semibold mt-0.5" style={{ color: 'var(--foreground)' }}>
                    {roleLabel[user?.role || ''] || user?.role}
                  </p>
                </div>
              </div>
            </div>
            <button
              className="btn-secondary mt-4 w-full justify-center"
              onClick={() => { setProfileForm({ name: user?.name || '', email: user?.email || '' }); setIsEditingProfile(true); }}
            >
              <Pencil size={14} /> Edit Nama
            </button>
          </>
        )}
      </div>

      {/* Change Password Card */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 rounded-lg bg-primary/10">
            <Lock size={18} style={{ color: 'var(--primary)' }} />
          </div>
          <div>
            <h2 className="font-semibold" style={{ color: 'var(--foreground)' }}>Ganti Password</h2>
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
              Pastikan password baru minimal 8 karakter dan kombinasi huruf & angka
            </p>
          </div>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-4">
          {/* Current Password */}
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--foreground)' }}>
              Password Saat Ini
            </label>
            <div className="relative">
              <input
                type={showPasswords.current ? 'text' : 'password'}
                className={`input pr-10 ${passwordErrors.currentPassword ? 'border-red-500 focus:ring-red-500' : ''}`}
                value={passwords.currentPassword}
                onChange={(e) => {
                  setPasswords({ ...passwords, currentPassword: e.target.value });
                  if (passwordErrors.currentPassword) {
                    setPasswordErrors({ ...passwordErrors, currentPassword: '' });
                  }
                }}
                placeholder="Masukkan password lama"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: 'var(--muted-foreground)' }}
                onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
              >
                {showPasswords.current ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {passwordErrors.currentPassword && (
              <p className="flex items-center gap-1.5 mt-1.5 text-xs text-red-400">
                <AlertCircle size={12} /> {passwordErrors.currentPassword}
              </p>
            )}
          </div>

          {/* New Password */}
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--foreground)' }}>
              Password Baru
            </label>
            <div className="relative">
              <input
                type={showPasswords.new ? 'text' : 'password'}
                className={`input pr-10 ${passwordErrors.newPassword ? 'border-red-500 focus:ring-red-500' : ''}`}
                value={passwords.newPassword}
                onChange={(e) => {
                  setPasswords({ ...passwords, newPassword: e.target.value });
                  if (passwordErrors.newPassword) {
                    setPasswordErrors({ ...passwordErrors, newPassword: '' });
                  }
                }}
                placeholder="Minimal 8 karakter"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: 'var(--muted-foreground)' }}
                onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
              >
                {showPasswords.new ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {/* Password Strength Indicator */}
            {passwords.newPassword && (
              <div className="mt-2">
                <div className="flex items-center justify-between mb-1">
                  <div className="h-1.5 flex-1 rounded-full overflow-hidden mr-2" style={{ background: 'var(--border)' }}>
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${pwStrength.color}`}
                      style={{ width: pwStrength.width }}
                    />
                  </div>
                  <span className={`text-xs font-medium ${
                    pwStrength.label === 'Kuat' ? 'text-emerald-400' :
                    pwStrength.label === 'Sedang' ? 'text-amber-400' : 'text-red-400'
                  }`}>
                    {pwStrength.label}
                  </span>
                </div>
              </div>
            )}
            {passwordErrors.newPassword && (
              <p className="flex items-center gap-1.5 mt-1.5 text-xs text-red-400">
                <AlertCircle size={12} /> {passwordErrors.newPassword}
              </p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--foreground)' }}>
              Konfirmasi Password Baru
            </label>
            <div className="relative">
              <input
                type={showPasswords.confirm ? 'text' : 'password'}
                className={`input pr-10 ${
                  passwordErrors.confirmPassword ? 'border-red-500 focus:ring-red-500' :
                  passwords.confirmPassword && passwords.newPassword === passwords.confirmPassword
                    ? 'border-emerald-500 focus:ring-emerald-500' : ''
                }`}
                value={passwords.confirmPassword}
                onChange={(e) => {
                  setPasswords({ ...passwords, confirmPassword: e.target.value });
                  if (passwordErrors.confirmPassword) {
                    setPasswordErrors({ ...passwordErrors, confirmPassword: '' });
                  }
                }}
                placeholder="Ulangi password baru"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: 'var(--muted-foreground)' }}
                onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
              >
                {showPasswords.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {/* Match indicator */}
            {passwords.confirmPassword && (
              passwords.newPassword === passwords.confirmPassword ? (
                <p className="flex items-center gap-1.5 mt-1.5 text-xs text-emerald-400">
                  <CheckCircle2 size={12} /> Password cocok
                </p>
              ) : (
                <p className="flex items-center gap-1.5 mt-1.5 text-xs text-red-400">
                  <AlertCircle size={12} /> {passwordErrors.confirmPassword || 'Password tidak cocok'}
                </p>
              )
            )}
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSavingPassword}
              className="btn-primary"
            >
              <Save size={14} />
              {isSavingPassword ? 'Menyimpan...' : 'Simpan Password'}
            </button>
          </div>
        </form>
      </div>

      {/* System Info Card */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <Shield size={18} style={{ color: 'var(--primary)' }} />
          </div>
          <div>
            <h2 className="font-semibold" style={{ color: 'var(--foreground)' }}>Informasi Sistem</h2>
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Versi aplikasi dan informasi teknis</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { label: 'Aplikasi', value: 'Helpdesk v1.0.0' },
            { label: 'Environment', value: 'Production' },
            { label: 'Framework', value: 'React + Vite' },
            { label: 'Backend', value: 'Node.js + Express' },
            { label: 'Database', value: 'PostgreSQL' },
            { label: 'ORM', value: 'Prisma' },
          ].map((item) => (
            <div key={item.label} className="p-3 rounded-xl border" style={{ borderColor: 'var(--border)', background: 'var(--muted)' }}>
              <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{item.label}</p>
              <p className="text-sm font-semibold mt-0.5" style={{ color: 'var(--foreground)' }}>{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
