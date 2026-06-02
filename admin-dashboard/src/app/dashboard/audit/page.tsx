'use client';
import { useState, useEffect } from 'react';
import { Search, Database, Filter } from 'lucide-react';
import { adminApi } from '@/lib/api';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { toast } from 'react-hot-toast';

interface AuditEntry {
  id: string;
  user_id: string;
  user_nama: string;
  user_email: string;
  aksi: string;
  entitas: string;
  entitas_id: string;
  data_lama: any;
  data_baru: any;
  ip_address: string;
  timestamp: string;
}

const ACTION_COLOR: Record<string, string> = {
  LOGIN: 'bg-blue-100 text-blue-700',
  LOGOUT: 'bg-gray-100 text-gray-600',
  CREATE_OFFICER: 'bg-green-100 text-green-700',
  GENERATE_QR: 'bg-purple-100 text-purple-700',
  REVOKE_QR: 'bg-red-100 text-red-700',
  UPDATE_OFFICER: 'bg-amber-100 text-amber-700',
  UPDATE_REPORT_STATUS: 'bg-orange-100 text-orange-700',
  UPDATE_USER_ROLE: 'bg-indigo-100 text-indigo-700',
  DEACTIVATE_USER: 'bg-red-100 text-red-700',
};

export default function AuditPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [entitasFilter, setEntitasFilter] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => { loadAudit(); }, [search, entitasFilter, page]);

  const loadAudit = async () => {
    setLoading(true);
    try {
      const res = await adminApi.audit({
        aksi: search || undefined,
        entitas: entitasFilter || undefined,
        page,
        limit: 30,
      });
      setEntries(res.data.data);
      setTotal(res.data.total);
    } catch (err: any) {
      if (err.response?.status === 403) {
        toast.error('Hanya Superadmin yang dapat mengakses Audit Trail');
      } else {
        toast.error('Gagal memuat audit trail');
      }
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Database size={22} className="text-[#1a237e]" />
            Audit Trail
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} entri · Hanya dapat diakses Superadmin</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-wrap gap-3">
        <div className="flex-1 min-w-[200px] relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            placeholder="Cari jenis aksi..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#1a237e]"
          />
        </div>
        <select value={entitasFilter} onChange={(e) => { setEntitasFilter(e.target.value); setPage(1); }}
          className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#1a237e]">
          <option value="">Semua Entitas</option>
          <option value="users">Users</option>
          <option value="officers">Officers</option>
          <option value="qr_codes">QR Codes</option>
          <option value="reports">Reports</option>
          <option value="parking_zones">Zona Parkir</option>
        </select>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-5 py-3.5 font-semibold text-gray-600">Waktu</th>
                <th className="text-left px-4 py-3.5 font-semibold text-gray-600">User</th>
                <th className="text-left px-4 py-3.5 font-semibold text-gray-600">Aksi</th>
                <th className="text-left px-4 py-3.5 font-semibold text-gray-600">Entitas</th>
                <th className="text-left px-4 py-3.5 font-semibold text-gray-600">IP</th>
                <th className="text-left px-4 py-3.5 font-semibold text-gray-600">Detail</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="py-12 text-center text-gray-400">Memuat...</td></tr>
              ) : entries.length === 0 ? (
                <tr><td colSpan={6} className="py-12 text-center text-gray-400">Tidak ada entri audit</td></tr>
              ) : entries.map((e) => (
                <>
                  <tr key={e.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-5 py-3 text-xs text-gray-500 whitespace-nowrap">
                      {format(new Date(e.timestamp), 'dd/MM/yy HH:mm:ss', { locale: id })}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800 text-xs">{e.user_nama || '—'}</p>
                      <p className="text-xs text-gray-400">{e.user_email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${ACTION_COLOR[e.aksi] || 'bg-gray-100 text-gray-600'}`}>
                        {e.aksi}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">{e.entitas || '—'}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-400">{e.ip_address || '—'}</td>
                    <td className="px-4 py-3">
                      {(e.data_lama || e.data_baru) && (
                        <button
                          onClick={() => setExpanded(expanded === e.id ? null : e.id)}
                          className="text-xs text-[#1a237e] font-semibold hover:underline"
                        >
                          {expanded === e.id ? 'Sembunyikan' : 'Lihat Data'}
                        </button>
                      )}
                    </td>
                  </tr>
                  {expanded === e.id && (
                    <tr key={e.id + '-detail'} className="bg-gray-50">
                      <td colSpan={6} className="px-5 py-3">
                        <div className="grid grid-cols-2 gap-4 text-xs">
                          {e.data_lama && (
                            <div>
                              <p className="font-bold text-gray-500 mb-1">Data Sebelum:</p>
                              <pre className="bg-white border border-gray-200 rounded-lg p-2 overflow-auto text-gray-700 max-h-32">
                                {JSON.stringify(e.data_lama, null, 2)}
                              </pre>
                            </div>
                          )}
                          {e.data_baru && (
                            <div>
                              <p className="font-bold text-gray-500 mb-1">Data Sesudah:</p>
                              <pre className="bg-white border border-gray-200 rounded-lg p-2 overflow-auto text-gray-700 max-h-32">
                                {JSON.stringify(e.data_baru, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
        {total > 30 && (
          <div className="px-6 py-4 border-t flex items-center justify-between">
            <span className="text-sm text-gray-500">Menampilkan {(page-1)*30+1}–{Math.min(page*30, total)} dari {total}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page===1}
                className="px-3 py-1.5 border rounded-lg text-sm disabled:opacity-40">←</button>
              <button onClick={() => setPage(p => p+1)} disabled={page*30>=total}
                className="px-3 py-1.5 border rounded-lg text-sm disabled:opacity-40">→</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
