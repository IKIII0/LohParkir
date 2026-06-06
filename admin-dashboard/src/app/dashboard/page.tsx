'use client';
import { useState, useEffect, useRef } from 'react';
import {
  QrCode, FileText, TrendingUp, DollarSign,
  Users, AlertTriangle, RefreshCw, Wifi, WifiOff
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { dashboardApi, BASE_URL, getWsUrl } from '@/lib/api';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface Stats {
  total_scan_hari_ini: number;
  scan_valid: number;
  scan_invalid: number;
  total_qr_aktif: number;
  laporan_hari_ini: number;
  laporan_pending: number;
  pendapatan_hari_ini: number;
  pendapatan_qris: number;
  pendapatan_tunai: number;
}

interface TrendData {
  periode: string;
  total_scan: number;
  scan_valid: number;
  scan_invalid: number;
}

interface RevenueData {
  tanggal: string;
  total_qris: number;
  total_tunai: number;
  total: number;
}

const COLORS = { valid: '#2e7d32', invalid: '#c62828', qris: '#1a237e', tunai: '#e65100' };

function StatCard({
  icon: Icon, label, value, sub, color, trend
}: {
  icon: any; label: string; value: string | number; sub?: string; color: string; trend?: 'up' | 'down' | null;
}) {
  return (
    <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-slate-100 hover:border-slate-200 hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
      {/* Subtle background glow on hover */}
      <div 
        className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full opacity-0 group-hover:opacity-10 transition-opacity duration-300"
        style={{ backgroundColor: color }}
      />
      
      <div className="flex items-start justify-between">
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 shadow-sm" style={{ backgroundColor: color + '12' }}>
          <Icon size={20} style={{ color }} className="sm:hidden" />
          <Icon size={24} style={{ color }} className="hidden sm:block" />
        </div>
        {trend && (
          <span className={`text-[10px] sm:text-[11px] font-extrabold px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full flex items-center gap-1 ${
            trend === 'up' 
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
              : 'bg-rose-50 text-rose-700 border border-rose-100'
          }`}>
            {trend === 'up' ? '▲ +12%' : '▼ -4%'}
          </span>
        )}
      </div>
      
      <p className="text-slate-500 text-[10px] sm:text-xs font-semibold uppercase tracking-wider mt-3 sm:mt-4">{label}</p>
      <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1 tracking-tight">{value}</p>
      {sub && (
        <div className="flex items-center gap-1.5 mt-2 text-[10px] sm:text-xs text-slate-400 font-medium border-t border-slate-50/80 pt-2">
          <span>{sub}</span>
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [trend, setTrend] = useState<TrendData[]>([]);
  const [revenue, setRevenue] = useState<RevenueData[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    setLastRefresh(new Date()); // set di client untuk hindari hydration mismatch
    loadAll();
    // WebSocket for real-time updates
    connectWs();
    const interval = setInterval(loadStats, 30000);
    return () => {
      clearInterval(interval);
      wsRef.current?.close();
    };
  }, []);

  const connectWs = () => {
    try {
      const ws = new WebSocket(getWsUrl(BASE_URL));
      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (['SCAN_EVENT', 'NEW_REPORT', 'NEW_TRANSACTION'].includes(msg.event)) {
          loadStats();
        }
      };
      wsRef.current = ws;
    } catch (e) {
      console.log('WS connection failed');
    }
  };

  const loadAll = async () => {
    setLoading(true);
    await Promise.allSettled([loadStats(), loadTrend(), loadRevenue()]);
    setLoading(false);
  };

  const loadStats = async () => {
    try {
      const res = await dashboardApi.stats();
      setStats(res.data.data);
      setLastRefresh(new Date());
    } catch (err) { console.log('Stats failed:', err); }
  };

  const loadTrend = async () => {
    try {
      const res = await dashboardApi.trend('daily', 14);
      setTrend(res.data.data.slice(-14));
    } catch {}
  };

  const loadRevenue = async () => {
    try {
      const res = await dashboardApi.revenue(14);
      setRevenue(res.data.data.slice(-14));
    } catch {}
  };

  const fmt = (n: number) => n?.toLocaleString('id') || '0';
  const fmtRp = (n: number) => `Rp ${n?.toLocaleString('id') || '0'}`;

  return (
    <div className="space-y-5 sm:space-y-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">Dashboard Monitoring</h1>
          <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
            Update terakhir: {lastRefresh ? format(lastRefresh, 'HH:mm:ss', { locale: id }) : '--:--:--'} WIB
          </p>
        </div>
        <button
          onClick={loadAll}
          className="self-start sm:self-auto flex items-center justify-center gap-2 bg-slate-900 text-white hover:bg-slate-800 active:scale-95 px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl text-sm font-bold shadow-md shadow-slate-900/10 transition-all cursor-pointer"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          Refresh Data
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        <StatCard icon={QrCode} label="Total Scan Hari Ini" value={fmt(stats?.total_scan_hari_ini || 0)}
          sub={`${fmt(stats?.scan_valid || 0)} valid · ${fmt(stats?.scan_invalid || 0)} tidak valid`}
          color="#3b82f6" trend="up" />
        <StatCard icon={DollarSign} label="Pendapatan Hari Ini" value={fmtRp(stats?.pendapatan_hari_ini || 0)}
          sub={`QRIS: ${fmtRp(stats?.pendapatan_qris || 0)}`} color="#10b981" />
        <StatCard icon={FileText} label="Laporan Hari Ini" value={fmt(stats?.laporan_hari_ini || 0)}
          sub={`${fmt(stats?.laporan_pending || 0)} menunggu tindak lanjut`}
          color="#f59e0b" trend={stats?.laporan_pending ? 'up' : null} />
        <StatCard icon={Users} label="QR Aktif" value={fmt(stats?.total_qr_aktif || 0)}
          sub="Petugas terdaftar resmi" color="#8b5cf6" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6">

        {/* Scan Trend Chart */}
        <div className="lg:col-span-3 bg-white rounded-2xl p-4 sm:p-6 shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-slate-100 flex flex-col justify-between">
          <div>
            <h2 className="font-extrabold text-slate-800 text-base sm:text-lg flex items-center gap-2">
              <TrendingUp size={18} className="text-blue-500" />
              Tren Validasi QR (14 Hari Terakhir)
            </h2>
            <p className="text-xs text-slate-400 font-medium mt-0.5 mb-4 sm:mb-6">Distribusi harian scan valid vs tidak valid</p>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="periode" tickFormatter={(v) => format(new Date(v), 'dd/MM')} tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
              <Tooltip labelFormatter={(v) => format(new Date(v), 'dd MMM yyyy', { locale: id })} />
              <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
              <Line dataKey="scan_valid" name="Valid" stroke={COLORS.valid} strokeWidth={3} dot={false} />
              <Line dataKey="scan_invalid" name="Tidak Valid" stroke={COLORS.invalid} strokeWidth={3} dot={false} strokeDasharray="5 5" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-4 sm:p-6 shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-slate-100 flex flex-col justify-between">
          <div>
            <h2 className="font-extrabold text-slate-800 text-base sm:text-lg">Komposisi Scan Hari Ini</h2>
            <p className="text-xs text-slate-400 font-medium mt-0.5 mb-4 sm:mb-6">Persentase keaslian scan juru parkir</p>
          </div>
          {stats && (stats.scan_valid + stats.scan_invalid) > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Valid', value: stats.scan_valid },
                    { name: 'Tidak Valid', value: stats.scan_invalid },
                  ]}
                  cx="50%" cy="50%"
                  innerRadius={55} outerRadius={80}
                  paddingAngle={4} dataKey="value"
                  label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  <Cell fill={COLORS.valid} />
                  <Cell fill={COLORS.invalid} />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[180px] flex items-center justify-center text-slate-400 font-semibold text-sm border border-dashed border-slate-100 rounded-xl bg-slate-50/50">
              Belum ada data scan hari ini
            </div>
          )}
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-slate-100">
        <h2 className="font-extrabold text-slate-800 text-base sm:text-lg flex items-center gap-2 mb-1">
          <DollarSign size={18} className="text-emerald-500" />
          Pendapatan Parkir (14 Hari Terakhir)
        </h2>
        <p className="text-xs text-slate-400 font-medium mb-4 sm:mb-6">Perbandingan pendapatan melalui QRIS vs Tunai</p>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={revenue}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="tanggal" tickFormatter={(v) => format(new Date(v), 'dd/MM')} tick={{ fontSize: 11, fill: '#64748b' }} />
            <YAxis tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: '#64748b' }} />
            <Tooltip
              formatter={(value: any) => [`Rp ${Number(value || 0).toLocaleString('id')}`, '']}
              labelFormatter={(v) => format(new Date(v), 'dd MMM yyyy', { locale: id })}
            />
            <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
            <Bar dataKey="total_qris" name="QRIS" fill={COLORS.qris} radius={[4, 4, 0, 0]} />
            <Bar dataKey="total_tunai" name="Tunai" fill={COLORS.tunai} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
