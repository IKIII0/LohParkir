'use client';
import { useState, useEffect } from 'react';
import { Search, Eye, ChevronRight, CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react';
import { reportsApi } from '@/lib/api';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface Report {
  id: string;
  ticket_no: string;
  deskripsi: string;
  gps_lat: number;
  gps_lng: number;
  alamat_lokasi: string;
  status: 'diterima' | 'sedang_diproses' | 'diselesaikan' | 'ditolak';
  foto_url: string;
  created_at: string;
}

const STATUS_CONFIG = {
  diterima: { label: 'Diterima', icon: Clock, color: 'text-blue-700', bg: 'bg-blue-100' },
  sedang_diproses: { label: 'Sedang Diproses', icon: AlertCircle, color: 'text-orange-700', bg: 'bg-orange-100' },
  diselesaikan: { label: 'Diselesaikan', icon: CheckCircle, color: 'text-green-700', bg: 'bg-green-100' },
  ditolak: { label: 'Ditolak', icon: XCircle, color: 'text-red-700', bg: 'bg-red-100' },
};

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState<Report | null>(null);
  const [newStatus, setNewStatus] = useState('');
  const [catatan, setCatatan] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => { loadReports(); }, [statusFilter, page]);

  const loadReports = async () => {
    setLoading(true);
    try {
      const res = await reportsApi.list({ status: statusFilter || undefined, page, limit: 20 });
      setReports(res.data.data);
      setTotal(res.data.total);
    } catch { toast.error('Gagal memuat laporan'); }
    finally { setLoading(false); }
  };

  const handleUpdateStatus = async () => {
    if (!selected || !newStatus) { toast.error('Pilih status baru'); return; }
    setUpdating(true);
    try {
      await reportsApi.updateStatus(selected.id, newStatus, catatan);
      toast.success('Status laporan berhasil diperbarui');
      setSelected(null);
      setCatatan('');
      setNewStatus('');
      loadReports();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal memperbarui status');
    } finally { setUpdating(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manajemen Laporan</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} laporan masuk</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-wrap gap-3">
        <div className="flex gap-2 flex-wrap">
          {[
            { value: '', label: 'Semua' },
            { value: 'diterima', label: '🔵 Diterima' },
            { value: 'sedang_diproses', label: '🟠 Diproses' },
            { value: 'diselesaikan', label: '🟢 Selesai' },
            { value: 'ditolak', label: '🔴 Ditolak' },
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => { setStatusFilter(f.value); setPage(1); }}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                statusFilter === f.value
                  ? 'bg-[#1a237e] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Report List */}
        <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-gray-400">Memuat laporan...</div>
          ) : reports.length === 0 ? (
            <div className="p-12 text-center text-gray-400">Tidak ada laporan dengan filter ini</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {reports.map((r) => {
                const statusCfg = STATUS_CONFIG[r.status];
                return (
                  <button
                    key={r.id}
                    onClick={() => { setSelected(r); setNewStatus(''); setCatatan(''); }}
                    className={`w-full text-left px-5 py-4 hover:bg-gray-50 transition-colors flex items-start gap-4 ${selected?.id === r.id ? 'bg-blue-50 border-l-4 border-[#1a237e]' : ''}`}
                  >
                    <statusCfg.icon size={18} className={statusCfg.color + ' mt-0.5 shrink-0'} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-gray-900 text-sm font-mono">{r.ticket_no}</span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${statusCfg.bg} ${statusCfg.color}`}>
                          {statusCfg.label}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 truncate">{r.deskripsi || r.alamat_lokasi || 'Tidak ada deskripsi'}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {format(new Date(r.created_at), 'dd MMM yyyy HH:mm', { locale: id })}
                      </p>
                    </div>
                    <ChevronRight size={16} className="text-gray-300 shrink-0 mt-1" />
                  </button>
                );
              })}
            </div>
          )}
          {total > 20 && (
            <div className="p-4 border-t border-gray-100 flex justify-between items-center">
              <span className="text-sm text-gray-500">{(page-1)*20+1}–{Math.min(page*20, total)} dari {total}</span>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page===1}
                  className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-40">←</button>
                <button onClick={() => setPage(p => p+1)} disabled={page*20>=total}
                  className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-40">→</button>
              </div>
            </div>
          )}
        </div>

        {/* Detail Panel */}
        <div className="lg:col-span-2">
          {selected ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-5 border-b border-gray-100">
                <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-1">Detail Laporan</p>
                <p className="font-bold text-lg text-[#1a237e] font-mono">{selected.ticket_no}</p>
              </div>

              <div className="p-5 space-y-4">
                {/* Photo */}
                {selected.foto_url && (
                  <img
                    src={`http://localhost:3001${selected.foto_url}`}
                    alt="Foto bukti"
                    className="w-full h-48 object-cover rounded-xl bg-gray-100"
                    onError={(e: any) => { e.target.src = 'https://placehold.co/400x200?text=Foto+Bukti'; }}
                  />
                )}

                {/* Info */}
                <div className="space-y-2 text-sm">
                  <div className="flex gap-2">
                    <span className="text-gray-400 w-24 shrink-0">Deskripsi</span>
                    <span className="text-gray-800">{selected.deskripsi || '—'}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-gray-400 w-24 shrink-0">Lokasi</span>
                    <span className="text-gray-800">{selected.alamat_lokasi || `${selected.gps_lat}, ${selected.gps_lng}`}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-gray-400 w-24 shrink-0">Tanggal</span>
                    <span className="text-gray-800">{format(new Date(selected.created_at), 'dd MMM yyyy HH:mm', { locale: id })}</span>
                  </div>
                </div>

                {/* Update Status */}
                {['diterima', 'sedang_diproses'].includes(selected.status) && (
                  <div className="border-t border-gray-100 pt-4 space-y-3">
                    <p className="text-sm font-bold text-gray-700">Perbarui Status</p>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#1a237e]"
                    >
                      <option value="">— Pilih Status Baru —</option>
                      {selected.status === 'diterima' && <option value="sedang_diproses">Sedang Diproses</option>}
                      <option value="diselesaikan">Diselesaikan</option>
                      <option value="ditolak">Ditolak</option>
                    </select>
                    <textarea
                      value={catatan}
                      onChange={(e) => setCatatan(e.target.value)}
                      placeholder="Catatan tindak lanjut (opsional)..."
                      rows={3}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:border-[#1a237e]"
                    />
                    <button
                      onClick={handleUpdateStatus}
                      disabled={!newStatus || updating}
                      className="w-full bg-[#1a237e] text-white py-2.5 rounded-xl text-sm font-bold disabled:opacity-40 hover:bg-[#0d1757] transition-colors"
                    >
                      {updating ? 'Memperbarui...' : 'Perbarui Status'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center text-gray-400">
              <Eye size={32} className="mx-auto mb-3 opacity-40" />
              <p className="text-sm">Pilih laporan untuk melihat detail</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
