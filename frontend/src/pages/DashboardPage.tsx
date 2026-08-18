import { useEffect, useState, ElementType } from 'react';
import {
  Ticket, TrendingUp, TrendingDown, Clock,
  CheckCircle2, XCircle, AlertTriangle, RefreshCw
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';
import { analyticsService, slaService } from '../services';
import { KpiData, TrendData, CategoryData, TopIssueData, Ticket as TicketType } from '../types';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const statusClass: Record<string, string> = {
  OPEN: 'badge-open', IN_PROGRESS: 'badge-in-progress',
  PENDING: 'badge-pending', RESOLVED: 'badge-resolved', CLOSED: 'badge-closed',
};

const priorityClass: Record<string, string> = {
  CRITICAL: 'priority-critical', HIGH: 'priority-high',
  MEDIUM: 'priority-medium', LOW: 'priority-low',
};

function KpiCard({ title, value, subtitle, icon: Icon, trend, color }: {
  title: string; value: string | number; subtitle?: string;
  icon: ElementType; trend?: 'up' | 'down' | 'neutral'; color: string;
}) {
  return (
    <div className="kpi-card animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
          <p className={`text-3xl font-bold mt-2 ${color}`}>{value}</p>
          {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color.replace('text-', 'bg-').replace('-400', '-500/20').replace('-300', '-500/20')}`}>
          <Icon size={20} className={color} />
        </div>
      </div>
      {trend && (
        <div className={`flex items-center gap-1 mt-3 text-xs ${trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-red-400' : 'text-slate-500'}`}>
          {trend === 'up' ? <TrendingUp size={12} /> : trend === 'down' ? <TrendingDown size={12} /> : null}
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const [kpi, setKpi] = useState<KpiData | null>(null);
  const [trend, setTrend] = useState<TrendData[]>([]);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [topIssues, setTopIssues] = useState<TopIssueData[]>([]);
  const [breachedTickets, setBreachedTickets] = useState<TicketType[]>([]);
  const [trendPeriod, setTrendPeriod] = useState<'day' | 'week' | 'month'>('month');
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [kpiRes, trendRes, catRes, issueRes, breachedRes] = await Promise.all([
        analyticsService.getKpi(),
        analyticsService.getTrend(trendPeriod),
        analyticsService.getCategories(),
        analyticsService.getTopIssues(5),
        slaService.getBreached({ page: 1, limit: 8 }),
      ]);

      setKpi(kpiRes.data.data);
      setTrend(trendRes.data.data);
      setCategories(catRes.data.data);
      setTopIssues(issueRes.data.data);
      setBreachedTickets(breachedRes.data.data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Dashboard fetch error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [trendPeriod]);

  const formatTrendDate = (dateStr: string) => {
    try {
      if (dateStr.length === 7) {
        const [year, month] = dateStr.split('-');
        return format(new Date(parseInt(year), parseInt(month) - 1), 'MMM yy', { locale: id });
      }
      return format(new Date(dateStr), 'd MMM', { locale: id });
    } catch { return dateStr; }
  };

  if (isLoading && !kpi) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {Array(5).fill(0).map((_, i) => (
            <div key={i} className="card p-6 h-28 skeleton" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array(4).fill(0).map((_, i) => (
            <div key={i} className="card p-6 h-72 skeleton" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Overview Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Terakhir diperbarui: {format(lastUpdated, 'HH:mm:ss', { locale: id })}
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={isLoading}
          className="btn-secondary gap-2"
        >
          <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* KPI Cards */}
      {kpi && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <KpiCard
            title="Total Tiket"
            value={kpi.totalTickets.toLocaleString('id-ID')}
            subtitle="Semua waktu"
            icon={Ticket}
            color="text-blue-400"
          />
          <KpiCard
            title="Tiket Terbuka"
            value={kpi.openTickets.toLocaleString('id-ID')}
            subtitle="Belum selesai"
            icon={AlertTriangle}
            color="text-amber-400"
          />
          <KpiCard
            title="Tiket Telat"
            value={kpi.slaBreached.toLocaleString('id-ID')}
            subtitle="SLA breached"
            icon={XCircle}
            color="text-red-400"
          />
          <KpiCard
            title="SLA Compliance"
            value={`${kpi.slaCompliance}%`}
            subtitle={`${kpi.slaMet} tiket tepat waktu`}
            icon={CheckCircle2}
            color={kpi.slaCompliance >= 90 ? 'text-emerald-400' : kpi.slaCompliance >= 70 ? 'text-amber-400' : 'text-red-400'}
          />
          <KpiCard
            title="Avg Resolution"
            value={`${kpi.avgResolutionTime} jam`}
            subtitle="Rata-rata penyelesaian"
            icon={Clock}
            color="text-purple-400"
          />
        </div>
      )}

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Chart */}
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-semibold text-white">Tren Tiket</h3>
              <p className="text-xs text-slate-500 mt-0.5">Jumlah tiket berdasarkan waktu</p>
            </div>
            <div className="flex gap-1">
              {(['day', 'week', 'month'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setTrendPeriod(p)}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                    trendPeriod === p
                      ? 'bg-primary-600 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-dark-border'
                  }`}
                >
                  {p === 'day' ? 'Harian' : p === 'week' ? 'Mingguan' : 'Bulanan'}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="date" tickFormatter={formatTrendDate} tick={{ fill: '#64748b', fontSize: 11 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', color: '#0f172a' }}
                labelFormatter={formatTrendDate}
              />
              <Legend />
              <Line type="monotone" dataKey="total" name="Total" stroke="#3b82f6" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="resolved" name="Resolved" stroke="#10b981" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Category Donut */}
        <div className="card p-5">
          <div className="mb-5">
            <h3 className="font-semibold text-white">Kategori Tiket</h3>
            <p className="text-xs text-slate-500 mt-0.5">Distribusi per kategori</p>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={categories}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                dataKey="count"
                nameKey="category"
                paddingAngle={3}
              >
                {categories.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', color: '#0f172a' }}
                formatter={(value, name) => [value, name]}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-3 space-y-1.5">
            {categories.slice(0, 6).map((cat, i) => (
              <div key={cat.category} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                  <span className="text-slate-400">{cat.category}</span>
                </div>
                <span className="text-slate-300 font-medium">{cat.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Issues */}
        <div className="card p-5">
          <div className="mb-5">
            <h3 className="font-semibold text-white">Top 5 Keluhan</h3>
            <p className="text-xs text-slate-500 mt-0.5">Masalah paling sering dilaporkan</p>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={topIssues} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} />
              <YAxis type="category" dataKey="issue" width={140} tick={{ fill: '#94a3b8', fontSize: 10 }}
                tickFormatter={(v) => v.length > 20 ? v.substring(0, 20) + '...' : v} />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#e2e8f0' }}
              />
              <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} name="Jumlah" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* SLA Breached Tickets Table */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-semibold text-white">Tiket SLA Breached</h3>
              <p className="text-xs text-slate-500 mt-0.5">Tiket yang melewati batas waktu SLA</p>
            </div>
            <span className="badge sla-breached">{kpi?.slaBreached} total</span>
          </div>
          <div className="overflow-auto max-h-56">
            <table className="table">
              <thead>
                <tr>
                  <th>Ticket ID</th>
                  <th>Keluhan</th>
                  <th>Priority</th>
                  <th>Res. Time</th>
                </tr>
              </thead>
              <tbody>
                {breachedTickets.map((ticket) => (
                  <tr key={ticket.id}>
                    <td className="font-mono text-xs text-primary-400">{ticket.ticketId}</td>
                    <td className="max-w-32 truncate" title={ticket.issue}>{ticket.issue}</td>
                    <td>
                      <span className={priorityClass[ticket.priority]}>
                        {ticket.priority}
                      </span>
                    </td>
                    <td className="text-red-400">{ticket.resolutionTime?.toFixed(1)} j</td>
                  </tr>
                ))}
                {breachedTickets.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center text-slate-500 py-8">
                      🎉 Tidak ada tiket SLA breached
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
