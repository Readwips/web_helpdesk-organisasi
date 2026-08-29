import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/authStore';
import Layout from './components/layout/Layout';
import LoginPage from './pages/LoginPage';
import { PERMISSIONS, hasPermission } from './utils/permissions';
import { authService } from './services';

const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const KelolaTiketPage = lazy(() => import('./pages/KelolaTiketPage'));
const DataTiketPage = lazy(() => import('./pages/DataTiketPage'));
const SlaPage = lazy(() => import('./pages/SlaPage'));
const AnalisisPage = lazy(() => import('./pages/AnalisisPage'));
const ImportPage = lazy(() => import('./pages/ImportPage'));
const LaporanPage = lazy(() => import('./pages/LaporanPage'));
const PengaturanPage = lazy(() => import('./pages/PengaturanPage'));
const ManajemenAkunPage = lazy(() => import('./pages/ManajemenAkunPage'));
const ManajemenPegawaiPage = lazy(() => import('./pages/ManajemenPegawaiPage'));
const PortalPage = lazy(() => import('./pages/PortalPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

function FullscreenLoading({ label = 'Memuat aplikasi...' }: { label?: string }) {
  return <div className="flex min-h-screen items-center justify-center bg-background" role="status" aria-live="polite"><div className="text-center"><div className="loader mx-auto mb-3" /><span className="text-sm text-muted-foreground">{label}</span></div></div>;
}

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore();
  if (isLoading) return <FullscreenLoading label="Memeriksa sesi..." />;
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore();
  if (isLoading) return <FullscreenLoading label="Memeriksa sesi..." />;
  return isAuthenticated ? <Navigate to="/" replace /> : <>{children}</>;
}

function RoleRoute({ children, roles }: { children: React.ReactNode; roles: string[] }) {
  const { user } = useAuthStore();
  return hasPermission(user?.role, roles as never) ? <>{children}</> : <Navigate to="/" replace />;
}

export default function App() {
  const { login, logout } = useAuthStore();
  useEffect(() => {
    authService.getMe().then((response) => login(response.data.data.user, response.data.data.csrfToken)).catch(logout);
  }, [login, logout]);

  return (
    <BrowserRouter>
      <Toaster position="top-right" toastOptions={{ duration: 3000, style: { background: 'var(--card)', color: 'var(--foreground)', border: '1px solid var(--border)', borderRadius: '10px', fontSize: '14px' } }} />
      <Suspense fallback={<FullscreenLoading />}>
        <Routes>
          <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/portal" element={<PortalPage />} />
          <Route element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route index element={<DashboardPage />} />
            <Route path="/tiket" element={<RoleRoute roles={PERMISSIONS.PAGE_KELOLA_TIKET as unknown as string[]}><KelolaTiketPage /></RoleRoute>} />
            <Route path="/data-tiket" element={<RoleRoute roles={PERMISSIONS.PAGE_DATA_TIKET as unknown as string[]}><DataTiketPage /></RoleRoute>} />
            <Route path="/analisis" element={<RoleRoute roles={PERMISSIONS.PAGE_ANALISIS as unknown as string[]}><AnalisisPage /></RoleRoute>} />
            <Route path="/sla" element={<RoleRoute roles={PERMISSIONS.PAGE_SLA as unknown as string[]}><SlaPage /></RoleRoute>} />
            <Route path="/import" element={<RoleRoute roles={PERMISSIONS.PAGE_IMPORT as unknown as string[]}><ImportPage /></RoleRoute>} />
            <Route path="/laporan" element={<RoleRoute roles={PERMISSIONS.PAGE_LAPORAN as unknown as string[]}><LaporanPage /></RoleRoute>} />
            <Route path="/pengaturan" element={<PengaturanPage />} />
            <Route path="/manajemen-akun" element={<RoleRoute roles={PERMISSIONS.PAGE_MANAJEMEN_AKUN as unknown as string[]}><ManajemenAkunPage /></RoleRoute>} />
            <Route path="/manajemen-pegawai" element={<RoleRoute roles={['ADMIN']}><ManajemenPegawaiPage /></RoleRoute>} />
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
