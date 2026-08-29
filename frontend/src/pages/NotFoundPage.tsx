import { useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  useEffect(() => {
    document.title = 'Halaman Tidak Ditemukan | IT Helpdesk';
  }, []);
  return <main className="flex min-h-screen items-center justify-center bg-background p-6 text-center"><div><p className="text-sm font-semibold text-primary">404</p><h1 className="mt-2 text-3xl font-bold text-foreground">Halaman tidak ditemukan</h1><p className="mt-2 text-muted-foreground">Alamat yang Anda buka tidak tersedia atau telah dipindahkan.</p><Link to="/" className="btn-primary mt-6">Kembali ke Dashboard</Link></div></main>;
}
