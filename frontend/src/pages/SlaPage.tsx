import { useEffect, useState } from 'react';
import {
  RadialBarChart, RadialBar, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell, Legend,
  PieChart, Pie
} from 'recharts';
import {
  ShieldCheck, ShieldAlert, Clock, TrendingDown,
  ChevronLeft, ChevronRight, AlertTriangle
} from 'lucide-react';
import { slaService } from '../services';
import { SlaSummary, SlaByPriority, SlaByCategory, SlaByTechnician, Ticket, Pagination } from '../types';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import toast from 'react-hot-toast';

// ─── Color helpers ────────────────────────────────────────────────────────────
const PRIORITY_COLORS: Record<string, string> = {
  CRITICAL: '#ef4444',
  HIGH: '#f97316',
  MEDIUM: '#eab308',
  LOW: '#22c55e',
};

const COMPLIANCE_COLOR = (value: number) =>
  value >= 90 ? '#10b981' : value >= 70 ? '#eab308' : '#ef4444';

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
const CustomBarTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-dark-card border border-dark-border rounded-lg px-4 py-3 shadow-xl text-sm">
        <p className="font-semibold text-white mb-2">{label}</p>
        {payload.map((p: any) => (
          <p key={p.name} style={{ color: p.fill || p.color }}>
            {p.name}: <span className="font-bold">{p.value}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({
  title, value, sub, icon: Icon, iconColor, valueSuffix = ''
}: {
  title: string;
  value: string | number;
  sub?: string;
  icon: any;
  iconColor: string;
  valueSuffix?: string;
}) {
  return (
    <div className="card p-5 flex items-center gap-4">
      <div className={`p-3 rounded-xl ${iconColor} flex-shrink-0`}>
        <Icon size={22} />
      </div>
      <div>
        <p className="text-xs text-slate-400 mb-0.5">{title}</p>
        <p className="text-2xl font-bold text-white">
          {value}<span className="text-lg text-slate-400">{valueSuffix}</span>
        </p>
        {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function SlaPage() {
  const [summary, setSummary] = useState<SlaSummary | null>(null);
  const [byPriority, setByPriority] = useState<SlaByPriority[]>([]);
  const [byCategory, setByCategory] = useState<SlaByCategory[]>([]);
  const [byTechnician, setByTechnician] = useState<SlaByTechnician[]>([]);
  const [breached, setBreached] = useState<Ticket[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [breachPage, setBreachPage] = useState(1);

  const fetchAll = async () => {
    setIsLoading(true);
    try {
      const [sumRes, priRes, catRes, techRes, breachRes] = await Promise.all([
        slaService.getSummary(),
        slaService.getByPriority(),
        slaService.getByCategory(),
        slaService.getByTechnician(),
        slaService.getBreached({ page: breachPage, limit: 15 }),
      ]);
      setSummary(sumRes.data.data);
      setByPriority(priRes.data.data);
      setByCategory(catRes.data.data);
      setByTechnician(techRes.data.data);
      setBreached(breachRes.data.data);
      if (breachRes.data.pagination) setPagination(breachRes.data.pagination);
    } catch {
      toast.error('Gagal memuat data SLA');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, [breachPage]);

  // ── Gauge data for radial chart ──
  const gaugeData = summary
    ? [{ name: 'SLA', value: summary.slaCompliance, fill: COMPLIANCE_COLOR(summary.slaCompliance) }]
    : [];

  // ── Compliance color class ──
  const complianceColor = summary
    ? COMPLIANCE_COLOR(summary.slaCompliance)
    : '#6b7280';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Kepatuhan SLA</h1>
        <p className="text-sm text-slate-400 mt-1">
          Monitoring Service Level Agreement — standar penyelesaian tiket
        </p>
      </div>

      {/* ── Summary KPI Cards ── */}
      {isLoading ? (
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {Array(4).fill(0).map((_, i) => <div key={i} className="card p-5 h-24 skeleton" />)}
        </div>
      ) : summary && (
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard
            title="Tiket Terselesaikan"
            value={summary.totalResolved}
            sub="Total yang sudah Resolved/Closed"
            icon={ShieldCheck}
            iconColor="bg-emerald-500/15 text-emerald-400"
          />
          <StatCard
            title="SLA Terpenuhi"
            value={summary.slaMet}
            sub={`${summary.slaCompliance}% compliance rate`}
            icon={ShieldCheck}
            iconColor="bg-primary-500/15 text-primary-400"
          />
          <StatCard
            title="SLA Dilanggar"
            value={summary.slaBreached}
            sub={`+${summary.avgBreachTime} jam rata-rata terlambat`}
            icon={ShieldAlert}
            iconColor="bg-red-500/15 text-red-400"
          />
          <StatCard
            title="Rata-rata Resolusi"
            value={summary.avgResolutionTime}
            valueSuffix=" Jam"
            sub="Dari semua tiket yang diselesaikan"
            icon={Clock}
            iconColor="bg-amber-500/15 text-amber-400"
          />
        </div>
      )}

      {/* ── Main Charts Row ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Gauge / Compliance Meter */}
        <div className="card p-6 flex flex-col items-center justify-center">
          <h2 className="text-base font-semibold text-white mb-4 self-start">Overall Compliance</h2>
          {isLoading ? (
            <div className="h-48 w-full skeleton rounded-xl" />
          ) : (
            <>
              <div className="relative w-48 h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart
                    cx="50%" cy="50%"
                    innerRadius="70%" outerRadius="100%"
                    startAngle={180} endAngle={-180}
                    data={[{ value: 100, fill: '#1e293b' }, ...gaugeData]}
                  >
                    <RadialBar dataKey="value" cornerRadius={8} />
                  </RadialBarChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-bold" style={{ color: complianceColor }}>
                    {summary?.slaCompliance ?? 0}
                  </span>
                  <span className="text-slate-400 text-sm mt-1">%</span>
                </div>
              </div>
              <div className="mt-4 flex gap-4 text-sm">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="text-slate-400">≥90% Baik</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <span className="text-slate-400">70-89% Sedang</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span className="text-slate-400">&lt;70% Buruk</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* SLA by Priority Bar Chart */}
        <div className="card p-6 xl:col-span-2">
          <h2 className="text-base font-semibold text-white mb-4">SLA per Prioritas</h2>
          {isLoading ? (
            <div className="h-52 skeleton rounded-xl" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={byPriority} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="priority" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <Tooltip content={<CustomBarTooltip />} />
                <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 12 }} />
                <Bar dataKey="met" name="SLA Met" stackId="a" radius={[0, 0, 0, 0]}>
                  {byPriority.map((entry) => (
                    <Cell key={entry.priority} fill={PRIORITY_COLORS[entry.priority]} fillOpacity={0.9} />
                  ))}
                </Bar>
                <Bar dataKey="breached" name="SLA Breached" stackId="a" fill="#ef444460" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── Category & Technician Charts Row ── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* By Category */}
        <div className="card p-6">
          <h2 className="text-base font-semibold text-white mb-4">Compliance per Kategori</h2>
          {isLoading ? (
            <div className="h-64 skeleton rounded-xl" />
          ) : (
            <div className="space-y-3">
              {byCategory
                .sort((a, b) => b.compliance - a.compliance)
                .map((cat) => (
                  <div key={cat.category}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-slate-300">{cat.category}</span>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-emerald-400">{cat.met} Met</span>
                        <span className="text-red-400">{cat.breached} Breached</span>
                        <span
                          className="font-bold text-sm w-14 text-right"
                          style={{ color: COMPLIANCE_COLOR(cat.compliance) }}
                        >
                          {cat.compliance}%
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-dark-bg rounded-full h-2 overflow-hidden">
                      <div
                        className="h-2 rounded-full transition-all duration-500"
                        style={{
                          width: `${cat.compliance}%`,
                          backgroundColor: COMPLIANCE_COLOR(cat.compliance),
                        }}
                      />
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* By Technician */}
        <div className="card p-6">
          <h2 className="text-base font-semibold text-white mb-4">Performa Teknisi (SLA)</h2>
          {isLoading ? (
            <div className="h-64 skeleton rounded-xl" />
          ) : (
            <div className="space-y-3 max-h-72 overflow-y-auto custom-scrollbar pr-1">
              {byTechnician
                .sort((a, b) => b.compliance - a.compliance)
                .map((tech, idx) => (
                  <div key={tech.technician} className="flex items-center gap-3">
                    <span className="text-xs text-slate-500 w-5 flex-shrink-0">#{idx + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-slate-300 truncate">{tech.technician}</span>
                        <span
                          className="text-sm font-bold flex-shrink-0 ml-2"
                          style={{ color: COMPLIANCE_COLOR(tech.compliance) }}
                        >
                          {tech.compliance}%
                        </span>
                      </div>
                      <div className="w-full bg-dark-bg rounded-full h-1.5 overflow-hidden">
                        <div
                          className="h-1.5 rounded-full transition-all duration-500"
                          style={{
                            width: `${tech.compliance}%`,
                            backgroundColor: COMPLIANCE_COLOR(tech.compliance),
                          }}
                        />
                      </div>
                    </div>
                    <div className="text-[10px] text-slate-500 flex-shrink-0 text-right">
                      <div className="text-emerald-400">{tech.met}✓</div>
                      <div className="text-red-400">{tech.breached}✗</div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Breached Tickets Table ── */}
      <div className="card">
        <div className="p-5 border-b border-dark-border flex items-center gap-3">
          <AlertTriangle size={18} className="text-red-400" />
          <h2 className="text-base font-semibold text-white">Tiket SLA Dilanggar</h2>
          <span className="ml-auto text-sm text-slate-400">{pagination.total} tiket</span>
        </div>

        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>ID Tiket</th>
                <th>Keluhan</th>
                <th>Prioritas</th>
                <th>Kategori</th>
                <th>Departemen</th>
                <th>SLA Target</th>
                <th>Waktu Aktual</th>
                <th>Selisih</th>
                <th>Tgl Dibuat</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i}>
                    {Array(9).fill(0).map((_, j) => (
                      <td key={j}><div className="h-4 skeleton rounded-full w-3/4" /></td>
                    ))}
                  </tr>
                ))
              ) : breached.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-slate-500">
                    🎉 Tidak ada tiket yang melanggar SLA!
                  </td>
                </tr>
              ) : (
                breached.map((ticket) => {
                  const overBy = ticket.resolutionTime
                    ? Math.round((ticket.resolutionTime - ticket.slaTarget) * 10) / 10
                    : null;
                  return (
                    <tr key={ticket.id}>
                      <td className="font-mono text-xs text-red-400">{ticket.ticketId}</td>
                      <td className="max-w-[180px]">
                        <div className="truncate text-slate-200 text-sm" title={ticket.issue}>{ticket.issue}</div>
                      </td>
                      <td>
                        <span style={{ color: PRIORITY_COLORS[ticket.priority] }} className="text-xs font-semibold">
                          {ticket.priority}
                        </span>
                      </td>
                      <td className="text-xs text-slate-300">{ticket.category?.name}</td>
                      <td className="text-xs text-slate-400">{ticket.department?.name}</td>
                      <td className="text-xs text-slate-300">{ticket.slaTarget} jam</td>
                      <td className="text-xs text-red-300">
                        {ticket.resolutionTime ? `${ticket.resolutionTime} jam` : '-'}
                      </td>
                      <td>
                        {overBy !== null ? (
                          <span className="text-xs font-semibold text-red-400 flex items-center gap-1">
                            <TrendingDown size={12} /> +{overBy} jam
                          </span>
                        ) : '-'}
                      </td>
                      <td className="text-xs text-slate-400">
                        {format(new Date(ticket.createdAt), 'dd MMM yy', { locale: localeId })}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-dark-border flex items-center justify-between">
          <div className="text-sm text-slate-400">
            Halaman <span className="text-white font-medium">{pagination.page}</span> dari{' '}
            <span className="text-white font-medium">{pagination.totalPages}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="btn-secondary px-2 py-1"
              disabled={breachPage <= 1}
              onClick={() => setBreachPage(p => p - 1)}
            >
              <ChevronLeft size={16} />
            </button>
            <button
              className="btn-secondary px-2 py-1"
              disabled={breachPage >= pagination.totalPages}
              onClick={() => setBreachPage(p => p + 1)}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
