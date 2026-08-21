import { useState, useEffect } from 'react';
import {
  FileDown, Calendar, ShieldCheck, ShieldAlert,
  Clock, BarChart2, Ticket, TrendingUp, RefreshCw, CheckCircle2
} from 'lucide-react';
import { reportService } from '../services';
import toast from 'react-hot-toast';

interface ReportSummary {
  period: { from: string | null; to: string | null };
  totalTickets: number;
  openTickets: number;
  resolvedTickets: number;
  slaMet: number;
  slaBreached: number;
  slaCompliance: number;
  avgResolutionTime: number;
}

function StatCard({ label, value, suffix = '', icon: Icon, color }: {
  label: string; value: number | string; suffix?: string;
  icon: any; color: string;
}) {
  return (
    <div className="card p-5 flex items-center gap-4">
      <div className={`p-3 rounded-xl flex-shrink-0 ${color}`}>
        <Icon size={22} />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold text-foreground">{value}<span className="text-base text-muted-foreground ml-1">{suffix}</span></p>
      </div>
    </div>
  );
}

export default function LaporanPage() {
  const today = new Date().toISOString().slice(0, 10);
  const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);

  const [dateFrom, setDateFrom] = useState(firstDayOfMonth);
  const [dateTo, setDateTo] = useState(today);
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const fetchSummary = async () => {
    setIsLoading(true);
    try {
      const res = await reportService.getSummary({ dateFrom, dateTo });
      setSummary(res.data.data);
    } catch {
      toast.error('Gagal memuat ringkasan laporan');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchSummary(); }, []);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const res = await reportService.exportExcel({ dateFrom, dateTo });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `laporan-tiket-${dateFrom}-sd-${dateTo}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success('File Excel berhasil diunduh!');
    } catch {
      toast.error('Gagal mengekspor laporan');
    } finally {
      setIsExporting(false);
    }
  };

  // Quick date range presets
  const setPreset = (preset: 'today' | '7d' | '30d' | 'thisMonth' | 'lastMonth' | 'all') => {
    const now = new Date();
    const fmt = (d: Date) => d.toISOString().slice(0, 10);
    if (preset === 'today') {
      setDateFrom(fmt(now)); setDateTo(fmt(now));
    } else if (preset === '7d') {
      const d = new Date(now); d.setDate(d.getDate() - 7);
      setDateFrom(fmt(d)); setDateTo(fmt(now));
    } else if (preset === '30d') {
      const d = new Date(now); d.setDate(d.getDate() - 30);
      setDateFrom(fmt(d)); setDateTo(fmt(now));
    } else if (preset === 'thisMonth') {
      setDateFrom(fmt(new Date(now.getFullYear(), now.getMonth(), 1)));
      setDateTo(fmt(now));
    } else if (preset === 'lastMonth') {
      const first = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const last = new Date(now.getFullYear(), now.getMonth(), 0);
      setDateFrom(fmt(first)); setDateTo(fmt(last));
    } else {
      setDateFrom(''); setDateTo('');
    }
  };

  const complianceColor = (v: number) =>
    v >= 90 ? 'text-emerald-400' : v >= 70 ? 'text-amber-400' : 'text-red-400';

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Laporan</h1>
          <p className="text-sm text-muted-foreground mt-1">Ringkasan & ekspor data tiket berdasarkan periode</p>
        </div>
      </div>

      {/* ── Filter Card ── */}
      <div className="card p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-end gap-4">
          <div className="flex-1">
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Dari Tanggal</label>
            <div className="relative">
              <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="date"
                className="input pl-9 text-sm"
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
              />
            </div>
          </div>
          <div className="flex-1">
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Sampai Tanggal</label>
            <div className="relative">
              <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="date"
                className="input pl-9 text-sm"
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
              />
            </div>
          </div>
          <button onClick={fetchSummary} disabled={isLoading} className="btn-primary flex-shrink-0">
            {isLoading ? <RefreshCw size={16} className="animate-spin" /> : <BarChart2 size={16} />}
            Tampilkan
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="btn-secondary flex-shrink-0 border-emerald-600/30 text-emerald-400 hover:bg-emerald-600/10"
          >
            {isExporting
              ? <RefreshCw size={16} className="animate-spin" />
              : <FileDown size={16} />
            }
            Export Excel
          </button>
        </div>

        {/* Quick presets */}
        <div className="flex flex-wrap gap-2">
          <span className="text-xs text-muted-foreground self-center">Cepat:</span>
          {[
            { label: 'Hari Ini', v: 'today' },
            { label: '7 Hari', v: '7d' },
            { label: '30 Hari', v: '30d' },
            { label: 'Bulan Ini', v: 'thisMonth' },
            { label: 'Bulan Lalu', v: 'lastMonth' },
            { label: 'Semua Data', v: 'all' },
          ].map(p => (
            <button
              key={p.v}
              onClick={() => setPreset(p.v as any)}
              className="px-3 py-1 text-xs rounded-md bg-dark-bg border border-dark-border text-muted-foreground hover:text-foreground hover:border-primary-600/50 transition-colors"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Summary KPI ── */}
      {isLoading ? (
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {Array(4).fill(0).map((_, i) => <div key={i} className="card h-24 skeleton" />)}
        </div>
      ) : summary && (
        <>
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard label="Total Tiket" value={summary.totalTickets} icon={Ticket} color="bg-primary-500/15 text-primary" />
            <StatCard label="Tiket Selesai" value={summary.resolvedTickets} icon={CheckCircle2} color="bg-emerald-500/15 text-emerald-400" />
            <StatCard label="SLA Terpenuhi" value={summary.slaMet} icon={ShieldCheck} color="bg-blue-500/15 text-blue-400" />
            <StatCard label="SLA Dilanggar" value={summary.slaBreached} icon={ShieldAlert} color="bg-red-500/15 text-red-400" />
          </div>

          {/* Detail card */}
          <div className="card p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-base font-semibold text-foreground">Ringkasan Periode</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {summary.period.from && summary.period.to
                    ? `${summary.period.from} s/d ${summary.period.to}`
                    : 'Semua data'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Volume */}
              <div className="space-y-4">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Volume Tiket</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total Masuk</span>
                    <span className="text-foreground font-bold">{summary.totalTickets}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Masih Terbuka</span>
                    <span className="text-amber-400 font-bold">{summary.openTickets}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Diselesaikan</span>
                    <span className="text-emerald-400 font-bold">{summary.resolvedTickets}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Tingkat Penyelesaian</span>
                    <span className="text-foreground font-bold">
                      {summary.totalTickets > 0
                        ? Math.round((summary.resolvedTickets / summary.totalTickets) * 100)
                        : 0}%
                    </span>
                  </div>
                </div>
              </div>

              {/* SLA */}
              <div className="space-y-4">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Kepatuhan SLA</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">SLA Terpenuhi</span>
                    <span className="text-emerald-400 font-bold">{summary.slaMet}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">SLA Dilanggar</span>
                    <span className="text-red-400 font-bold">{summary.slaBreached}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Compliance Rate</span>
                    <span className={`font-bold text-lg ${complianceColor(summary.slaCompliance)}`}>
                      {summary.slaCompliance}%
                    </span>
                  </div>
                </div>

                {/* Compliance bar */}
                <div className="w-full bg-dark-bg rounded-full h-2 overflow-hidden">
                  <div
                    className="h-2 rounded-full transition-all duration-700"
                    style={{
                      width: `${summary.slaCompliance}%`,
                      backgroundColor: summary.slaCompliance >= 90 ? '#10b981' : summary.slaCompliance >= 70 ? '#eab308' : '#ef4444',
                    }}
                  />
                </div>
              </div>

              {/* Performance */}
              <div className="space-y-4">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Performa</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Rata-rata Resolusi</span>
                    <span className="text-foreground font-bold">{summary.avgResolutionTime} Jam</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Status Compliance</span>
                    <span className={`font-semibold text-sm ${complianceColor(summary.slaCompliance)}`}>
                      {summary.slaCompliance >= 90 ? '✅ Baik' : summary.slaCompliance >= 70 ? '⚠️ Perlu Perhatian' : '🔴 Buruk'}
                    </span>
                  </div>
                </div>

                {/* Export action */}
                <button
                  onClick={handleExport}
                  disabled={isExporting}
                  className="w-full mt-2 btn-secondary border-emerald-600/30 text-emerald-400 hover:bg-emerald-600/10 justify-center"
                >
                  {isExporting
                    ? <><RefreshCw size={14} className="animate-spin" /> Mengekspor...</>
                    : <><FileDown size={14} /> Ekspor Periode Ini ke Excel</>
                  }
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
