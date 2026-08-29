import { Outlet, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import GlobalSearchModal from '../ui/GlobalSearchModal';

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  '/': { title: 'Dashboard', subtitle: 'Monitoring, Analysis & SLA Management' },
  '/tiket': { title: 'Kelola Tiket', subtitle: 'Manajemen tiket IT Support' },
  '/data-tiket': { title: 'Data Tiket', subtitle: 'Seluruh dataset tiket' },
  '/analisis': { title: 'Analisis', subtitle: 'Analisis keluhan dan teknisi' },
  '/sla': { title: 'Kepatuhan SLA', subtitle: 'Monitoring Service Level Agreement' },
  '/import': { title: 'Import Data', subtitle: 'Upload dan validasi data CSV/Excel' },
  '/laporan': { title: 'Laporan', subtitle: 'Ringkasan dan ekspor laporan' },
  '/pengaturan': { title: 'Pengaturan', subtitle: 'Manajemen akun dan profil' },
  '/manajemen-akun': { title: 'Manajemen Akun', subtitle: 'Kelola akses pengguna' },
  '/manajemen-pegawai': { title: 'Data Pegawai', subtitle: 'Direktori pegawai dan kontak' },
};

export default function Layout() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const getPageInfo = () => {
    const path = location.pathname;
    if (pageTitles[path]) return pageTitles[path];
    const partialMatch = Object.keys(pageTitles).find(key => key !== '/' && path.startsWith(key));
    return partialMatch ? pageTitles[partialMatch] : { title: 'Helpdesk', subtitle: '' };
  };

  const { title, subtitle } = getPageInfo();

  useEffect(() => {
    document.title = `${title} | IT Helpdesk`;
  }, [title]);

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--background)' }}>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar title={title} subtitle={subtitle} onMenuToggle={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
      <GlobalSearchModal />
    </div>
  );
}
