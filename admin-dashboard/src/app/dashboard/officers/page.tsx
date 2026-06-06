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
  aktif: 'bg-emerald-50 text-emerald-700 border border-emerald-150',
  nonaktif: 'bg-slate-50 text-slate-600 border border-slate-200/60',
  suspended: 'bg-rose-50 text-rose-700 border border-rose-150',
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
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Manajemen Petugas</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">{total} petugas terdaftar resmi di sistem</p>
        </div>
        <button
          id="add-officer-btn"
          onClick={() => setShowModal(true)}
          className="flex items-center justify-center gap-2 bg-slate-900 text-white hover:bg-slate-800 active:scale-95 px-5 py-3 rounded-xl text-sm font-bold shadow-md shadow-slate-900/10 transition-all cursor-pointer"
        >
          <Plus size={18} />
          Tambah Petugas
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-slate-100 flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            id="search-officer"
            placeholder="Cari nama, NIP, atau nomor badge..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 placeholder-slate-400 font-medium transition-all"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 bg-white text-slate-700 cursor-pointer min-w-[160px] transition-all"
        >
          <option value="">Semua Status</option>
          <option value="aktif">Aktif</option>
          <option value="nonaktif">Nonaktif</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="text-left px-6 py-4 font-bold text-slate-500 tracking-wider uppercase text-xs">Petugas</th>
                <th className="text-left px-4 py-4 font-bold text-slate-500 tracking-wider uppercase text-xs">Badge / NIP</th>
                <th className="text-left px-4 py-4 font-bold text-slate-500 tracking-wider uppercase text-xs">Zona Kerja</th>
                <th className="text-left px-4 py-4 font-bold text-slate-500 tracking-wider uppercase text-xs">Status</th>
                <th className="text-left px-4 py-4 font-bold text-slate-500 tracking-wider uppercase text-xs">QR Code</th>
                <th className="text-right px-6 py-4 font-bold text-slate-500 tracking-wider uppercase text-xs">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-16 text-center text-slate-400 font-semibold">Memuat data petugas...</td></tr>
              ) : officers.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-16 text-center text-slate-400 font-semibold">Tidak ada data petugas ditemukan</td></tr>
              ) : officers.map((o) => (
                <tr key={o.id} className="hover:bg-slate-50/40 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100/50 flex items-center justify-center">
                        <User size={18} className="text-indigo-600" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">{o.nama}</p>
                        <p className="text-xs text-slate-400 font-semibold mt-0.5">{o.nomor_hp || o.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <p className="font-mono font-extrabold text-indigo-600 text-xs tracking-wider bg-indigo-50/50 px-2 py-0.5 rounded-md inline-block border border-indigo-100/20">{o.badge_number}</p>
                    <p className="text-xs text-slate-400 mt-1 font-medium">NIP. {o.nip}</p>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-sm font-semibold text-slate-700">{o.zona_nama || '—'}</span>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`text-[11px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider ${STATUS_STYLE[o.status]}`}>
                      {o.status}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    {o.qr_kode ? (
                      <div>
                        <p className="font-mono text-xs font-bold text-slate-700">{o.qr_kode}</p>
                        <p className={`text-[10px] font-extrabold uppercase mt-0.5 tracking-wider ${o.qr_status === 'aktif' ? 'text-emerald-600' : 'text-slate-400'}`}>
                          ● {o.qr_status}
                        </p>
                      </div>
                    ) : <span className="text-xs font-semibold text-slate-400">Belum ada QR</span>}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleGenerateQr(o.id, o.nama)}
                        title="Generate QR Code"
                        className="p-2 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 rounded-xl transition-all"
                      >
                        <QrCode size={18} />
                      </button>
                      <button
                        onClick={() => handleToggle(o.id, o.status)}
                        title={o.status === 'aktif' ? 'Nonaktifkan' : 'Aktifkan'}
                        className={`p-2 rounded-xl transition-all ${
                          o.status === 'aktif'
                            ? 'text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700'
                            : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'
                        }`}
                      >
                        {o.status === 'aktif' ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
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
          <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/30">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Menampilkan {(page - 1) * 20 + 1}–{Math.min(page * 20, total)} dari {total} petugas</p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3.5 py-2 border border-slate-200 rounded-xl text-sm font-semibold disabled:opacity-40 hover:border-slate-300 hover:bg-white transition-all cursor-pointer">
                ← Sebelumnya
              </button>
              <button onClick={() => setPage(p => p + 1)} disabled={page * 20 >= total}
                className="px-3.5 py-2 border border-slate-200 rounded-xl text-sm font-semibold disabled:opacity-40 hover:border-slate-300 hover:bg-white transition-all cursor-pointer">
                Selanjutnya →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Officer Modal with high-end look */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-100 animate-fade-in overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="font-extrabold text-slate-800 text-lg">Tambah Petugas Baru</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700 w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors">✕</button>
            </div>
            <div className="p-6 space-y-4">
              {[
                { id: 'nip', label: 'NIP (Nomor Induk Pegawai)', placeholder: '198501010001', key: 'nip', required: true },
                { id: 'nama', label: 'Nama Lengkap', placeholder: 'Masukkan nama petugas...', key: 'nama', required: true },
                { id: 'nomorHp', label: 'Nomor WhatsApp / HP', placeholder: '081234567890', key: 'nomorHp', required: false },
              ].map(field => (
                <div key={field.id}>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    {field.label} {field.required && <span className="text-rose-500">*</span>}
                  </label>
                  <input
                    id={field.id}
                    placeholder={field.placeholder}
                    value={(form as any)[field.key]}
                    onChange={(e) => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 placeholder-slate-400 font-medium transition-all"
                  />
                </div>
              ))}
              <div className="text-xs text-amber-800 bg-amber-50/80 border border-amber-100/50 p-4 rounded-2xl flex items-start gap-2.5">
                <span className="text-base mt-0.5">⚠️</span>
                <div>
                  <p className="font-bold">Informasi Kredensial</p>
                  <p className="text-amber-700/90 mt-0.5 leading-relaxed">Password sementara akan ditampilkan setelah petugas berhasil didaftarkan. Catat segera karena tidak dapat ditampilkan kembali!</p>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 flex gap-3 bg-slate-50/30">
              <button onClick={() => setShowModal(false)}
                className="flex-1 py-3 border border-slate-200 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-50 transition-colors cursor-pointer">
                Batal
              </button>
              <button
                id="submit-officer"
                onClick={handleSubmitOfficer}
                disabled={submitting}
                className="flex-1 py-3 bg-slate-900 text-white rounded-xl text-sm font-extrabold hover:bg-slate-800 disabled:opacity-50 transition-colors cursor-pointer"
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
