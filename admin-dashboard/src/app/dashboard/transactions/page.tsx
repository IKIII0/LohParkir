'use client';
import { useState, useEffect } from 'react';
import { Activity, Filter } from 'lucide-react';
import { transactionsApi } from '@/lib/api';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { toast } from 'react-hot-toast';

interface Transaction {
  id: string;
  metode: 'qris' | 'tunai';
  nominal: number;
  status: string;
  created_at: string;
  officer_nama: string;
  badge_number: string;
  zona_nama: string;
  idempotency_key: string;
}

const STATUS_STYLE: Record<string, string> = {
  berhasil: 'bg-green-100 text-green-700',
  pending: 'bg-amber-100 text-amber-700',
  gagal: 'bg-red-100 text-red-700',
  refunded: 'bg-purple-100 text-purple-700',
};

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalNominal, setTotalNominal] = useState(0);
  const [page, setPage] = useState(1);
  const [metodeFilter, setMetodeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => { loadTransactions(); }, [metodeFilter, statusFilter, page]);

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const res = await transactionsApi.list({
        metode: metodeFilter || undefined,
        status: statusFilter || undefined,
        page,
        limit: 25,
      });
      setTransactions(res.data.data);
      setTotal(res.data.total);
      setTotalNominal(res.data.totalNominal || 0);
    } catch { toast.error('Gagal memuat transaksi'); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transaksi Pembayaran</h1>
          <p className="text-sm text-gray-500">{total} transaksi · Total: Rp {totalNominal.toLocaleString('id')}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-wrap gap-3">
        <select value={metodeFilter} onChange={(e) => { setMetodeFilter(e.target.value); setPage(1); }}
          className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#1a237e]">
          <option value="">Semua Metode</option>
          <option value="qris">QRIS Digital</option>
          <option value="tunai">Tunai</option>
        </select>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#1a237e]">
          <option value="">Semua Status</option>
          <option value="berhasil">Berhasil</option>
          <option value="pending">Pending</option>
          <option value="gagal">Gagal</option>
          <option value="refunded">Refunded</option>
        </select>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-5 py-3.5 font-semibold text-gray-600">Petugas</th>
                <th className="text-left px-4 py-3.5 font-semibold text-gray-600">Zona</th>
                <th className="text-left px-4 py-3.5 font-semibold text-gray-600">Metode</th>
                <th className="text-right px-4 py-3.5 font-semibold text-gray-600">Nominal</th>
                <th className="text-left px-4 py-3.5 font-semibold text-gray-600">Status</th>
                <th className="text-left px-5 py-3.5 font-semibold text-gray-600">Waktu</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="py-12 text-center text-gray-400">Memuat...</td></tr>
              ) : transactions.length === 0 ? (
                <tr><td colSpan={6} className="py-12 text-center text-gray-400">Tidak ada transaksi</td></tr>
              ) : transactions.map((t) => (
                <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="px-5 py-4">
                    <p className="font-semibold text-gray-900">{t.officer_nama || '—'}</p>
                    <p className="text-xs text-gray-400 font-mono">{t.badge_number}</p>
                  </td>
                  <td className="px-4 py-4 text-gray-700">{t.zona_nama || '—'}</td>
                  <td className="px-4 py-4">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${t.metode === 'qris' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                      {t.metode === 'qris' ? 'QRIS' : 'Tunai'}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right font-bold text-gray-900">
                    Rp {t.nominal.toLocaleString('id')}
                  </td>
                  <td className="px-4 py-4">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${STATUS_STYLE[t.status] || 'bg-gray-100 text-gray-600'}`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-gray-500 text-xs">
                    {format(new Date(t.created_at), 'dd MMM yyyy HH:mm', { locale: id })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {total > 25 && (
          <div className="px-6 py-4 border-t flex items-center justify-between">
            <span className="text-sm text-gray-500">{(page-1)*25+1}–{Math.min(page*25, total)} dari {total}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page===1}
                className="px-3 py-1.5 border rounded-lg text-sm disabled:opacity-40">←</button>
              <button onClick={() => setPage(p => p+1)} disabled={page*25>=total}
                className="px-3 py-1.5 border rounded-lg text-sm disabled:opacity-40">→</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
