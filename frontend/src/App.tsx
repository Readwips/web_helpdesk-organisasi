import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/authStore';
import Layout from './components/layout/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import KelolaTiketPage from './pages/KelolaTiketPage';
import DataTiketPage from './pages/DataTiketPage';
import SlaPage from './pages/SlaPage';
import AnalisisPage from './pages/AnalisisPage';
import ImportPage from './pages/ImportPage';
import LaporanPage from './pages/LaporanPage';
import PlaceholderPage from './components/ui/PlaceholderPage';
import PengaturanPage from './pages/PengaturanPage';
import ManajemenAkunPage from './pages/ManajemenAkunPage';
import ManajemenPegawaiPage from './pages/ManajemenPegawaiPage';
import PortalPage from './pages/PortalPage';
import { PERMISSIONS, hasPermission } from './utils/permissions';
import { authService } from './services';


// Route guard
function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore();
  if (isLoading) return null;
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore();
  if (isLoading) return null;
  return isAuthenticated ? <Navigate to="/" replace /> : <>{children}</>;
}

// Guard for pages with role restrictions — redirects to / if no access
function RoleRoute({ children, roles }: { children: React.ReactNode; roles: string[] }) {
  const { user } = useAuthStore();
  return hasPermission(user?.role, roles as any)
    ? <>{children}</>
    : <Navigate to="/" replace />;
}

export default function App() {
  const { login, logout } = useAuthStore();
  useEffect(() => {
    authService.getMe().then((response) => login(response.data.data.user, response.data.data.csrfToken)).catch(logout);
  }, [login, logout]);
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: 'var(--card)',
            color: 'var(--foreground)',
            border: '1px solid var(--border)',
            borderRadius: '10px',
            fontSize: '14px',
          },
          success: { iconTheme: { primary: '#10b981', secondary: 'var(--card)' } },
          error: { iconTheme: { primary: '#ef4444', secondary: 'var(--card)' } },
        }}
      />

      <Routes>
        {/* Public routes */}
        <Route path="/login" element={
          <PublicRoute><LoginPage /></PublicRoute>
        } />

        {/* Public portal — no login needed */}
        <Route path="/portal" element={<PortalPage />} />

        {/* Private routes */}
        <Route element={
          <PrivateRoute><Layout /></PrivateRoute>
        }>
          <Route index element={<DashboardPage />} />

          <Route path="/tiket" element={
            <RoleRoute roles={PERMISSIONS.PAGE_KELOLA_TIKET as unknown as string[]}>
              <KelolaTiketPage />
            </RoleRoute>
          } />

          <Route path="/data-tiket" element={
            <RoleRoute roles={PERMISSIONS.PAGE_DATA_TIKET as unknown as string[]}>
              <DataTiketPage />
            </RoleRoute>
          } />

          <Route path="/analisis" element={
            <RoleRoute roles={PERMISSIONS.PAGE_ANALISIS as unknown as string[]}>
              <AnalisisPage />
            </RoleRoute>
          } />

          <Route path="/sla" element={<RoleRoute roles={PERMISSIONS.PAGE_SLA as unknown as string[]}><SlaPage /></RoleRoute>} />

          <Route path="/import" element={
            <RoleRoute roles={PERMISSIONS.PAGE_IMPORT as unknown as string[]}>
              <ImportPage />
            </RoleRoute>
          } />

          <Route path="/laporan" element={
            <RoleRoute roles={PERMISSIONS.PAGE_LAPORAN as unknown as string[]}>
              <LaporanPage />
            </RoleRoute>
          } />

          <Route path="/pengaturan" element={<PengaturanPage />} />

          <Route path="/manajemen-akun" element={
            <RoleRoute roles={PERMISSIONS.PAGE_MANAJEMEN_AKUN as unknown as string[]}>
              <ManajemenAkunPage />
            </RoleRoute>
          } />

          <Route path="/manajemen-pegawai" element={
            <RoleRoute roles={['ADMIN']}>
              <ManajemenPegawaiPage />
            </RoleRoute>
          } />
        </Route>

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
