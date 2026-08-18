import { useEffect, useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend
} from 'recharts';
import {
  Ticket, TrendingUp, Users, Clock,
  BarChart2, AlertCircle, CheckCircle2, Activity
} from 'lucide-react';
import { analyticsService } from '../services';
import {
  KpiData, TrendData, CategoryData,
  TopIssueData, DepartmentData, TechnicianData
} from '../types';
import toast from 'react-hot-toast';

// ─── Color palette ────────────────────────────────────────────────────────────
const PIE_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-dark-card border border-dark-border rounded-lg px-4 py-3 shadow-xl text-sm">
      <p className="font-semibold text-white mb-2">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color || p.fill }}>
          {p.name}: <span className="font-bold">{p.value}</span>
        </p>
      ))}
    </div>
  );
};

// ─── Small KPI card ───────────────────────────────────────────────────────────
function KpiCard({ label, value, suffix = '', sub, icon: Icon, accent }: {
  label: string; value: number | string; suffix?: string;
  sub?: string; icon: any; accent: string;
}) {
  return (
    <div className="card p-5">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-xs text-slate-400 mb-1">{label}</p>
          <p className="text-3xl font-bold text-white">
            {value}<span className="text-xl text-slate-400 ml-0.5">{suffix}</span>
          </p>
          {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
        </div>
        <div className={`p-3 rounded-xl ${accent}`}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}

// ─── Period selector ──────────────────────────────────────────────────────────
function PeriodSelector({ value, onChange }: { value: string; onChange: (v: 'day' | 'week' | 'month') => void }) {
  const opts = [
    { v: 'day', label: '30 Hari' },
    { v: 'week', label: '12 Minggu' },
    { v: 'month', label: '12 Bulan' },
  ] as const;
  return (
    <div className="flex bg-dark-bg rounded-lg p-1 gap-1">
      {opts.map(o => (
        <button
          key={o.v}
          onClick={() => onChange(o.v)}
          className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
            value === o.v
              ? 'bg-primary-600 text-white'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AnalisisPage() {
  const [kpi, setKpi] = useState<KpiData | null>(null);
  const [trend, setTrend] = useState<TrendData[]>([]);
  const [trendPeriod, setTrendPeriod] = useState<'day' | 'week' | 'month'>('month');
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [topIssues, setTopIssues] = useState<TopIssueData[]>([]);
  const [departments, setDepartments] = useState<DepartmentData[]>([]);
  const [technicians, setTechnicians] = useState<TechnicianData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTrendLoading, setIsTrendLoading] = useState(false);

  const fetchBase = async () => {
    setIsLoading(true);
    try {
      const [kpiRes, catRes, issueRes, deptRes, techRes] = await Promise.all([
        analyticsService.getKpi(),
        analyticsService.getCategories(),
        analyticsService.getTopIssues(8),
        analyticsService.getDepartments(),
        analyticsService.getTechnicians(),
      ]);
      setKpi(kpiRes.data.data);
      setCategories(catRes.data.data);
      setTopIssues(issueRes.data.data);
      setDepartments(deptRes.data.data);
      setTechnicians(techRes.data.data);
    } catch {
      toast.error('Gagal memuat data analisis');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTrend = async () => {
    setIsTrendLoading(true);
    try {
      const res = await analyticsService.getTrend(trendPeriod);
      setTrend(res.data.data);
    } catch {
      toast.error('Gagal memuat trend');
    } finally {
      setIsTrendLoading(false);
    }
  };

  useEffect(() => { fetchBase(); }, []);
  useEffect(() => { fetchTrend(); }, [trendPeriod]);

  // ── Format trend x-axis labels
  const formatTrendLabel = (d: string) => {
    if (trendPeriod === 'month') {
      const [y, m] = d.split('-');
      const months = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
      return months[parseInt(m) - 1] || d;
    }
    if (trendPeriod === 'week') return d.slice(5);
    return d.slice(5);
  };

  const complianceColor = kpi
    ? kpi.slaCompliance >= 90 ? '#10b981' : kpi.slaCompliance >= 70 ? '#eab308' : '#ef4444'
    : '#6b7280';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Analisis</h1>
        <p className="text-sm text-slate-400 mt-1">
          Data mendalam tentang performa IT Helpdesk
        </p>
      </div>

      {/* ── KPI Cards ── */}
      {isLoading ? (
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {Array(4).fill(0).map((_, i) => <div key={i} className="card h-28 skeleton" />)}
        </div>
      ) : kpi && (
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <KpiCard
            label="Total Tiket" value={kpi.totalTickets}
            sub="Semua waktu" icon={Ticket}
            accent="bg-primary-500/15 text-primary-400"
          />
          <KpiCard
            label="Tiket Aktif" value={kpi.openTickets}
            sub="Open + In Progress + Pending" icon={Activity}
            accent="bg-amber-500/15 text-amber-400"
          />
          <KpiCard
            label="SLA Compliance" value={kpi.slaCompliance} suffix="%"
            sub={`${kpi.slaMet} Met · ${kpi.slaBreached} Breached`}
            icon={CheckCircle2}
            accent={`${kpi.slaCompliance >= 90 ? 'bg-emerald-500/15 text-emerald-400' : kpi.slaCompliance >= 70 ? 'bg-amber-500/15 text-amber-400' : 'bg-red-500/15 text-red-400'}`}
          />
          <KpiCard
            label="Avg Resolusi" value={kpi.avgResolutionTime} suffix=" Jam"
            sub="Dari tiket yang diselesaikan" icon={Clock}
            accent="bg-blue-500/15 text-blue-400"
          />
        </div>
      )}

      {/* ── Trend Chart ── */}
      <div className="card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <h2 className="text-base font-semibold text-white">Tren Tiket Masuk & Selesai</h2>
            <p className="text-xs text-slate-500 mt-0.5">Volume tiket dari waktu ke waktu</p>
          </div>
          <PeriodSelector value={trendPeriod} onChange={setTrendPeriod} />
        </div>
        {isTrendLoading ? (
          <div className="h-56 skeleton rounded-xl" />
        ) : (
          <ResponsiveContainer width="100%" height={230}>
            <AreaChart data={trend}>
              <defs>
                <linearGradient id="totalGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="resolvedGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis
                dataKey="date"
                tickFormatter={formatTrendLabel}
                tick={{ fill: '#94a3b8', fontSize: 11 }}
              />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 12 }} />
              <Area
                type="monotone" dataKey="total" name="Tiket Masuk"
                stroke="#6366f1" fill="url(#totalGrad)" strokeWidth={2}
              />
              <Area
                type="monotone" dataKey="resolved" name="Diselesaikan"
                stroke="#10b981" fill="url(#resolvedGrad)" strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── Category & Top Issues ── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Category Pie Chart */}
        <div className="card p-6">
          <h2 className="text-base font-semibold text-white mb-5">Distribusi per Kategori</h2>
          {isLoading ? (
            <div className="h-60 skeleton rounded-xl" />
          ) : (
            <div className="flex gap-6 items-center">
              <div className="flex-shrink-0">
                <ResponsiveContainer width={180} height={180}>
                  <PieChart>
                    <Pie
                      data={categories} dataKey="count" nameKey="category"
                      cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                      paddingAngle={3}
                    >
                      {categories.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: any, n: any) => [v, n]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-2 min-w-0">
                {categories
                  .sort((a, b) => b.count - a.count)
                  .map((cat, i) => (
                    <div key={cat.category} className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="text-xs text-slate-300 flex-1 truncate">{cat.category}</span>
                      <span className="text-xs font-bold text-slate-100 flex-shrink-0">{cat.count}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* Top Issues */}
        <div className="card p-6">
          <h2 className="text-base font-semibold text-white mb-5">Top 8 Keluhan Terbanyak</h2>
          {isLoading ? (
            <div className="h-60 skeleton rounded-xl" />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={topIssues} layout="vertical" barSize={14}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis
                  dataKey="issue" type="category" width={140}
                  tick={{ fill: '#94a3b8', fontSize: 10 }}
                  tickFormatter={(v: string) => v.length > 20 ? v.slice(0, 20) + '…' : v}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Jumlah" radius={[0, 4, 4, 0]}>
                  {topIssues.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── Department & Technician ── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Department volume */}
        <div className="card p-6">
          <h2 className="text-base font-semibold text-white mb-5">Volume Tiket per Departemen</h2>
          {isLoading ? (
            <div className="h-56 skeleton rounded-xl" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={departments.sort((a, b) => b.count - a.count)} barSize={24}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis
                  dataKey="department" tick={{ fill: '#94a3b8', fontSize: 10 }}
                  tickFormatter={(v: string) => v.length > 10 ? v.slice(0, 10) + '…' : v}
                />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Jumlah Tiket" radius={[4, 4, 0, 0]}>
                  {departments.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Technician performance table */}
        <div className="card p-6 flex flex-col">
          <h2 className="text-base font-semibold text-white mb-4">Performa Teknisi</h2>
          {isLoading ? (
            <div className="flex-1 skeleton rounded-xl" />
          ) : (
            <div className="overflow-y-auto custom-scrollbar flex-1">
              <table className="w-full text-sm">
                <thead className="text-xs text-slate-400 uppercase">
                  <tr>
                    <th className="pb-3 text-left font-semibold">Teknisi</th>
                    <th className="pb-3 text-right font-semibold">Total</th>
                    <th className="pb-3 text-right font-semibold">Selesai</th>
                    <th className="pb-3 text-right font-semibold">SLA</th>
                    <th className="pb-3 text-right font-semibold">Avg (jam)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-border">
                  {technicians
                    .sort((a, b) => b.slaCompliance - a.slaCompliance)
                    .map((tech, idx) => (
                      <tr key={tech.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-2.5">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-500 w-4">#{idx + 1}</span>
                            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                              style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] + '33', color: PIE_COLORS[idx % PIE_COLORS.length] }}
                            >
                              {tech.name.charAt(0)}
                            </div>
                            <span className="text-slate-200 text-xs truncate max-w-[100px]">{tech.name}</span>
                          </div>
                        </td>
                        <td className="py-2.5 text-right text-slate-300 text-xs">{tech.totalTickets}</td>
                        <td className="py-2.5 text-right text-emerald-400 text-xs">{tech.resolvedTickets}</td>
                        <td className="py-2.5 text-right text-xs font-bold"
                          style={{ color: tech.slaCompliance >= 90 ? '#10b981' : tech.slaCompliance >= 70 ? '#eab308' : '#ef4444' }}
                        >
                          {tech.slaCompliance}%
                        </td>
                        <td className="py-2.5 text-right text-slate-400 text-xs">{tech.avgResolutionTime}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
