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

// Route guard
function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? <Navigate to="/" replace /> : <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1e293b',
            color: '#e2e8f0',
            border: '1px solid #334155',
            borderRadius: '10px',
          },
          success: { iconTheme: { primary: '#10b981', secondary: '#1e293b' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#1e293b' } },
        }}
      />

      <Routes>
        {/* Public routes */}
        <Route path="/login" element={
          <PublicRoute><LoginPage /></PublicRoute>
        } />

        {/* Private routes */}
        <Route element={
          <PrivateRoute><Layout /></PrivateRoute>
        }>
          <Route index element={<DashboardPage />} />

          <Route path="/tiket" element={<KelolaTiketPage />} />

          <Route path="/data-tiket" element={<DataTiketPage />} />

          <Route path="/analisis" element={<AnalisisPage />} />

          <Route path="/sla" element={<SlaPage />} />

          <Route path="/import" element={<ImportPage />} />

          <Route path="/laporan" element={<LaporanPage />} />

          <Route path="/pengaturan" element={
            <PlaceholderPage
              title="Pengaturan"
              description="Manajemen profil dan akun pengguna."
              phase="Phase 6 — Polish"
            />
          } />
        </Route>

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
