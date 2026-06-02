'use client';
import { useState, useEffect } from 'react';
import { Plus, Search, ToggleLeft, ToggleRight, QrCode, User, ChevronDown, Filter } from 'lucide-react';
import { officersApi, qrApi } from '@/lib/api';
import { toast } from 'react-hot-toast';

interface Officer {
  id: string;
  nama: string;
  nip: string;
  badge_number: string;
  status: 'aktif' | 'nonaktif' | 'suspended';
  zona_nama: string;
  nomor_hp: string;
  email: string;
  qr_kode: string;
  qr_status: string;
}

const STATUS_STYLE = {
  aktif: 'bg-green-100 text-green-700',
  nonaktif: 'bg-gray-100 text-gray-600',
  suspended: 'bg-red-100 text-red-700',
};

export default function OfficersPage() {
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  // Form state
  const [form, setForm] = useState({ nip: '', nama: '', nomorHp: '', zonaId: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { loadOfficers(); }, [search, statusFilter, page]);

  const loadOfficers = async () => {
    setLoading(true);
    try {
      const res = await officersApi.list({
        search: search || undefined,
        status: statusFilter || undefined,
        page,
        limit: 20,
      });
      setOfficers(res.data.data);
      setTotal(res.data.total);
    } catch (err) {
      toast.error('Gagal memuat data petugas');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (id: string, currentStatus: string) => {
    const action = currentStatus === 'aktif' ? 'nonaktifkan' : 'aktifkan';
    if (!confirm(`Yakin ingin ${action} petugas ini?`)) return;
    try {
      await officersApi.toggle(id);
      toast.success(`Petugas berhasil di${action}`);
      loadOfficers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal mengubah status');
    }
  };

  const handleGenerateQr = async (officerId: string, officerNama: string) => {
    if (!confirm(`Generate QR Code baru untuk ${officerNama}? QR Code lama akan dicabut.`)) return;
    try {
      const res = await qrApi.generate(officerId);
      const { kode, qrImageDataUrl } = res.data.data;
      // Download QR Image
      const link = document.createElement('a');
      link.href = qrImageDataUrl;
      link.download = `badge-${kode}.png`;
      link.click();
      toast.success(`QR Code ${kode} berhasil dibuat dan diunduh`);
      loadOfficers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal generate QR Code');
    }
  };

  const handleSubmitOfficer = async () => {
    if (!form.nip || !form.nama) { toast.error('NIP dan nama wajib diisi'); return; }
    setSubmitting(true);
    try {
      const res = await officersApi.create(form);
      const data = res.data.data;
      toast.success(`Petugas ${data.nama} berhasil didaftarkan!`);
      // Show credentials info
      alert(`✅ Petugas Berhasil Dibuat!\n\nNama: ${form.nama}\nBadge: ${data.badgeNumber}\nEmail: ${data.email}\nPassword Sementara: ${data.tempPassword}\n\n⚠️ Catat password ini sebelum menutup!`);
      setShowModal(false);
      setForm({ nip: '', nama: '', nomorHp: '', zonaId: '' });
      loadOfficers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal mendaftarkan petugas');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manajemen Petugas</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} petugas terdaftar</p>
        </div>
        <button
          id="add-officer-btn"
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-[#1a237e] text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#0d1757] transition-colors"
        >
          <Plus size={16} />
          Tambah Petugas
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-wrap gap-3">
        <div className="flex-1 min-w-[200px] relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            id="search-officer"
            placeholder="Cari nama, NIP, atau badge..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#1a237e]"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1a237e] bg-white"
        >
          <option value="">Semua Status</option>
          <option value="aktif">Aktif</option>
          <option value="nonaktif">Nonaktif</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-6 py-3.5 font-semibold text-gray-600">Petugas</th>
                <th className="text-left px-4 py-3.5 font-semibold text-gray-600">Badge / NIP</th>
                <th className="text-left px-4 py-3.5 font-semibold text-gray-600">Zona Kerja</th>
                <th className="text-left px-4 py-3.5 font-semibold text-gray-600">Status</th>
                <th className="text-left px-4 py-3.5 font-semibold text-gray-600">QR Code</th>
                <th className="text-right px-6 py-3.5 font-semibold text-gray-600">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400">Memuat data...</td></tr>
              ) : officers.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400">Tidak ada data petugas</td></tr>
              ) : officers.map((o) => (
                <tr key={o.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#1a237e]/10 flex items-center justify-center">
                        <User size={16} className="text-[#1a237e]" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{o.nama}</p>
                        <p className="text-xs text-gray-400">{o.nomor_hp || o.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <p className="font-mono font-bold text-[#1a237e] text-xs">{o.badge_number}</p>
                    <p className="text-xs text-gray-400">{o.nip}</p>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-sm text-gray-700">{o.zona_nama || '—'}</span>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full capitalize ${STATUS_STYLE[o.status]}`}>
                      {o.status}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    {o.qr_kode ? (
                      <div>
                        <p className="font-mono text-xs text-gray-700">{o.qr_kode}</p>
                        <p className={`text-xs mt-0.5 ${o.qr_status === 'aktif' ? 'text-green-600' : 'text-gray-400'}`}>
                          {o.qr_status}
                        </p>
                      </div>
                    ) : <span className="text-xs text-gray-400">Belum ada QR</span>}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleGenerateQr(o.id, o.nama)}
                        title="Generate QR Code"
                        className="p-2 text-[#1a237e] hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <QrCode size={16} />
                      </button>
                      <button
                        onClick={() => handleToggle(o.id, o.status)}
                        title={o.status === 'aktif' ? 'Nonaktifkan' : 'Aktifkan'}
                        className={`p-2 rounded-lg transition-colors ${
                          o.status === 'aktif'
                            ? 'text-green-600 hover:bg-green-50'
                            : 'text-gray-400 hover:bg-gray-50'
                        }`}
                      >
                        {o.status === 'aktif' ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {total > 20 && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-500">Menampilkan {(page - 1) * 20 + 1}–{Math.min(page * 20, total)} dari {total}</p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm disabled:opacity-40 hover:border-[#1a237e]">
                ← Sebelumnya
              </button>
              <button onClick={() => setPage(p => p + 1)} disabled={page * 20 >= total}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm disabled:opacity-40 hover:border-[#1a237e]">
                Selanjutnya →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Officer Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-fade-in">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-bold text-lg text-gray-900">Tambah Petugas Baru</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-700">✕</button>
            </div>
            <div className="p-6 space-y-4">
              {[
                { id: 'nip', label: 'NIP', placeholder: '198501010001', key: 'nip', required: true },
                { id: 'nama', label: 'Nama Lengkap', placeholder: 'Nama Petugas', key: 'nama', required: true },
                { id: 'nomorHp', label: 'Nomor HP', placeholder: '081234567890', key: 'nomorHp', required: false },
              ].map(field => (
                <div key={field.id}>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    {field.label} {field.required && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    id={field.id}
                    placeholder={field.placeholder}
                    value={(form as any)[field.key]}
                    onChange={(e) => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#1a237e]"
                  />
                </div>
              ))}
              <p className="text-xs text-amber-700 bg-amber-50 p-3 rounded-xl">
                ⚠️ Password sementara akan ditampilkan setelah petugas berhasil didaftarkan. Catat segera!
              </p>
            </div>
            <div className="p-6 border-t border-gray-100 flex gap-3">
              <button onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50">
                Batal
              </button>
              <button
                id="submit-officer"
                onClick={handleSubmitOfficer}
                disabled={submitting}
                className="flex-1 py-2.5 bg-[#1a237e] text-white rounded-xl text-sm font-bold hover:bg-[#0d1757] disabled:opacity-50"
              >
                {submitting ? 'Mendaftarkan...' : 'Daftarkan Petugas'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
