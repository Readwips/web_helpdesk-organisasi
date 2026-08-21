import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Ticket, Database, BarChart3,
  ShieldCheck, Upload, FileText, Settings, LogOut,
  MonitorDot, ChevronRight, X, Users
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { authService } from '../../services';
import toast from 'react-hot-toast';
import { PERMISSIONS, hasPermission, UserRole } from '../../utils/permissions';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, exact: true, roles: null },
  { to: '/tiket', label: 'Kelola Tiket', icon: Ticket, roles: PERMISSIONS.PAGE_KELOLA_TIKET },
  { to: '/data-tiket', label: 'Data Tiket', icon: Database, roles: PERMISSIONS.PAGE_DATA_TIKET },
  { to: '/analisis', label: 'Analisis', icon: BarChart3, roles: PERMISSIONS.PAGE_ANALISIS },
  { to: '/sla', label: 'Kepatuhan SLA', icon: ShieldCheck, roles: PERMISSIONS.PAGE_SLA },
  { to: '/import', label: 'Import Data', icon: Upload, roles: PERMISSIONS.PAGE_IMPORT },
  { to: '/laporan', label: 'Laporan', icon: FileText, roles: PERMISSIONS.PAGE_LAPORAN },
  { to: '/pengaturan', label: 'Pengaturan', icon: Settings, roles: PERMISSIONS.PAGE_PENGATURAN },
  { to: '/manajemen-akun', label: 'Manajemen Akun', icon: Users, roles: PERMISSIONS.PAGE_MANAJEMEN_AKUN },
  { to: '/manajemen-pegawai', label: 'Data Pegawai', icon: Users, roles: PERMISSIONS.PAGE_MANAJEMEN_PEGAWAI },
];

const roleLabel: Record<string, string> = {
  ADMIN: 'Administrator',
  IT_SUPPORT: 'IT Support',
  MANAGER: 'IT Manager',
};

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const userRole = user?.role as UserRole;

  // Filter nav items based on user role
  const visibleNavItems = navItems.filter(item =>
    item.roles === null || hasPermission(userRole, item.roles)
  );

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch { /* ignore */ }
    logout();
    navigate('/login');
    toast.success('Berhasil logout');
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed lg:relative inset-y-0 left-0 z-30
          w-64 min-h-screen flex flex-col border-r
          transform transition-transform duration-300 ease-in-out
          lg:translate-x-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
        style={{
          background: 'var(--sidebar)',
          borderColor: 'var(--sidebar-border)',
        }}
      >
        {/* Logo */}
        <div className="px-4 py-5 border-b flex items-center justify-between" style={{ borderColor: 'var(--sidebar-border)' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center shadow-glow" style={{ background: 'var(--primary)' }}>
              <MonitorDot size={20} className="text-foreground" />
            </div>
            <div>
              <h1 className="text-sm font-bold leading-tight" style={{ color: 'var(--sidebar-foreground)' }}>Helpdesk</h1>
              <p className="text-xs leading-tight" style={{ color: 'var(--muted-foreground)' }}>Ticket Analysis</p>
            </div>
          </div>
          {/* Close button (mobile only) */}
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-md transition-colors"
            style={{ color: 'var(--muted-foreground)' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          <p className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>
            Menu
          </p>
          {navItems.map((item) => {
            // Check permission — null means accessible by everyone
            if (item.roles !== null && !hasPermission(userRole, item.roles)) return null;
            const isActive = item.exact
              ? location.pathname === item.to
              : location.pathname.startsWith(item.to);
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.exact}
                onClick={onClose}
                className={`sidebar-item ${isActive ? 'active' : ''}`}
              >
                <item.icon size={16} />
                <span className="flex-1">{item.label}</span>
                {isActive && <ChevronRight size={12} />}
              </NavLink>
            );
          })}
        </nav>

        {/* User Info */}
        <div className="px-3 py-4 border-t" style={{ borderColor: 'var(--sidebar-border)' }}>
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg" style={{ background: 'var(--sidebar-accent)' }}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-foreground" style={{ background: 'var(--primary)' }}>
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: 'var(--sidebar-foreground)' }}>{user?.name}</p>
              <p className="text-xs truncate" style={{ color: 'var(--muted-foreground)' }}>
                {roleLabel[user?.role || ''] || user?.role}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-md hover:bg-red-500/20 hover:text-red-400 transition-colors"
              style={{ color: 'var(--muted-foreground)' }}
              title="Logout"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
