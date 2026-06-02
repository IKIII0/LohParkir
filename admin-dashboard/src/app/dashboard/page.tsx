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
import { dashboardApi } from '@/lib/api';
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
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow animate-fade-in">
      <div className="flex items-start justify-between">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center`} style={{ backgroundColor: color + '15' }}>
          <Icon size={22} style={{ color }} />
        </div>
        {trend && (
          <span className={`text-xs font-bold px-2 py-1 rounded-full ${trend === 'up' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {trend === 'up' ? '↑' : '↓'}
          </span>
        )}
      </div>
      <p className="text-gray-500 text-sm mt-3 font-medium">{label}</p>
      <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [trend, setTrend] = useState<TrendData[]>([]);
  const [revenue, setRevenue] = useState<RevenueData[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
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
      const ws = new WebSocket('ws://localhost:3001');
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
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Monitoring</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Update terakhir: {format(lastRefresh, 'HH:mm:ss', { locale: id })}
          </p>
        </div>
        <button
          onClick={loadAll}
          className="flex items-center gap-2 bg-[#1a237e] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[#0d1757] transition-colors"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={QrCode} label="Total Scan Hari Ini" value={fmt(stats?.total_scan_hari_ini || 0)}
          sub={`${fmt(stats?.scan_valid || 0)} valid · ${fmt(stats?.scan_invalid || 0)} tidak valid`}
          color="#1a237e" trend="up" />
        <StatCard icon={DollarSign} label="Pendapatan Hari Ini" value={fmtRp(stats?.pendapatan_hari_ini || 0)}
          sub={`QRIS: ${fmtRp(stats?.pendapatan_qris || 0)}`} color="#2e7d32" />
        <StatCard icon={FileText} label="Laporan Hari Ini" value={fmt(stats?.laporan_hari_ini || 0)}
          sub={`${fmt(stats?.laporan_pending || 0)} menunggu tindak lanjut`}
          color="#e65100" trend={stats?.laporan_pending ? 'up' : null} />
        <StatCard icon={Users} label="QR Aktif" value={fmt(stats?.total_qr_aktif || 0)}
          sub="Petugas terdaftar resmi" color="#7b1fa2" />
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-5 gap-6">

        {/* Scan Trend Chart */}
        <div className="lg:col-span-3 bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp size={18} className="text-[#1a237e]" />
            Tren Validasi QR (14 Hari Terakhir)
          </h2>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="periode" tickFormatter={(v) => format(new Date(v), 'dd/MM')} tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip labelFormatter={(v) => format(new Date(v), 'dd MMM yyyy', { locale: id })} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line dataKey="scan_valid" name="Valid" stroke={COLORS.valid} strokeWidth={2} dot={false} />
              <Line dataKey="scan_invalid" name="Tidak Valid" stroke={COLORS.invalid} strokeWidth={2} dot={false} strokeDasharray="5 5" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h2 className="font-bold text-gray-900 mb-4">Komposisi Scan Hari Ini</h2>
          {stats && (stats.scan_valid + stats.scan_invalid) > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Valid', value: stats.scan_valid },
                    { name: 'Tidak Valid', value: stats.scan_invalid },
                  ]}
                  cx="50%" cy="50%"
                  innerRadius={50} outerRadius={80}
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
            <div className="h-[180px] flex items-center justify-center text-gray-400 text-sm">
              Belum ada data scan hari ini
            </div>
          )}
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <DollarSign size={18} className="text-green-700" />
          Pendapatan Parkir (14 Hari Terakhir)
        </h2>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={revenue}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="tanggal" tickFormatter={(v) => format(new Date(v), 'dd/MM')} tick={{ fontSize: 11 }} />
            <YAxis tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
            <Tooltip
              formatter={(value: any) => [`Rp ${Number(value || 0).toLocaleString('id')}`, '']}
              labelFormatter={(v) => format(new Date(v), 'dd MMM yyyy', { locale: id })}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="total_qris" name="QRIS" fill={COLORS.qris} radius={[4, 4, 0, 0]} />
            <Bar dataKey="total_tunai" name="Tunai" fill={COLORS.tunai} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
