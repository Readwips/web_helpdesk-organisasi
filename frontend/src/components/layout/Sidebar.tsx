import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Ticket, Database, BarChart3,
  ShieldCheck, Upload, FileText, Settings, LogOut,
  MonitorDot, ChevronRight
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { authService } from '../../services';
import toast from 'react-hot-toast';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { to: '/tiket', label: 'Kelola Tiket', icon: Ticket },
  { to: '/data-tiket', label: 'Data Tiket', icon: Database },
  { to: '/analisis', label: 'Analisis', icon: BarChart3 },
  { to: '/sla', label: 'Kepatuhan SLA', icon: ShieldCheck },
  { to: '/import', label: 'Import Data', icon: Upload },
  { to: '/laporan', label: 'Laporan', icon: FileText },
  { to: '/pengaturan', label: 'Pengaturan', icon: Settings },
];

const roleLabel: Record<string, string> = {
  ADMIN: 'Administrator',
  IT_SUPPORT: 'IT Support',
  MANAGER: 'IT Manager',
};

export default function Sidebar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch { /* ignore */ }
    logout();
    navigate('/login');
    toast.success('Berhasil logout');
  };

  return (
    <aside className="w-64 min-h-screen bg-sidebar flex flex-col border-r border-dark-border">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-dark-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary-600 flex items-center justify-center shadow-glow">
            <MonitorDot size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white leading-tight">Helpdesk</h1>
            <p className="text-xs text-slate-500 leading-tight">Ticket Analysis</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className="px-3 mb-2 text-xs font-semibold text-slate-600 uppercase tracking-wider">
          Menu
        </p>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.exact}
            className={({ isActive }) =>
              `sidebar-item ${isActive ? 'active' : ''}`
            }
          >
            <item.icon size={16} />
            <span className="flex-1">{item.label}</span>
            <ChevronRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
          </NavLink>
        ))}
      </nav>

      {/* User Info */}
      <div className="px-3 py-4 border-t border-dark-border">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-dark-surface">
          <div className="w-8 h-8 rounded-full bg-primary-600/30 flex items-center justify-center">
            <span className="text-sm font-bold text-primary-400">
              {user?.name?.charAt(0) || 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.name}</p>
            <p className="text-xs text-slate-500 truncate">
              {roleLabel[user?.role || ''] || user?.role}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="p-1.5 rounded-md hover:bg-red-500/20 hover:text-red-400 text-slate-500 transition-colors"
            title="Logout"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  );
}
