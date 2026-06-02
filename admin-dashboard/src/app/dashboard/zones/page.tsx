'use client';
import { useState, useEffect } from 'react';
import { Plus, MapPin, Edit, Eye } from 'lucide-react';
import { zonesApi } from '@/lib/api';
import { toast } from 'react-hot-toast';

interface Zone {
  id: string;
  nama: string;
  alamat: string;
  tarif_motor: number;
  tarif_mobil: number;
  is_active: boolean;
  jumlah_petugas: number;
}

export default function ZonesPage() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ nama: '', alamat: '', lat: '', lng: '', tarifMotor: '2000', tarifMobil: '5000' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { loadZones(); }, []);

  const loadZones = async () => {
    setLoading(true);
    try {
      const res = await zonesApi.list();
      setZones(res.data.data);
    } catch { toast.error('Gagal memuat zona parkir'); }
    finally { setLoading(false); }
  };

  const handleSubmit = async () => {
    if (!form.nama || !form.lat || !form.lng) { toast.error('Nama, latitude, dan longitude wajib diisi'); return; }
    setSubmitting(true);
    try {
      await zonesApi.create({ ...form });
      toast.success('Zona parkir berhasil ditambahkan');
      setShowModal(false);
      setForm({ nama: '', alamat: '', lat: '', lng: '', tarifMotor: '2000', tarifMobil: '5000' });
      loadZones();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Gagal menambahkan zona'); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Zona Parkir</h1>
          <p className="text-sm text-gray-500">{zones.length} zona terdaftar</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-[#1a237e] text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#0d1757]">
          <Plus size={16} /> Tambah Zona
        </button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? <div className="col-span-3 py-12 text-center text-gray-400">Memuat...</div>
          : zones.map((z) => (
            <div key={z.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3 mb-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${z.is_active ? 'bg-green-100' : 'bg-gray-100'}`}>
                  <MapPin size={18} className={z.is_active ? 'text-green-700' : 'text-gray-400'} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">{z.nama}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{z.alamat || 'Alamat belum diisi'}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-500">Motor</p>
                  <p className="text-sm font-bold text-[#1a237e]">Rp {z.tarif_motor.toLocaleString('id')}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-500">Mobil</p>
                  <p className="text-sm font-bold text-[#1a237e]">Rp {z.tarif_mobil.toLocaleString('id')}</p>
                </div>
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                <span className="text-xs text-gray-500">{z.jumlah_petugas} petugas aktif</span>
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${z.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {z.is_active ? 'Aktif' : 'Nonaktif'}
                </span>
              </div>
            </div>
          ))}
      </div>

      {/* Add Zone Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="font-bold text-lg">Tambah Zona Parkir</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400">✕</button>
            </div>
            <div className="p-6 space-y-4">
              {[
                { label: 'Nama Zona', key: 'nama', placeholder: 'Zona A — Pusat Pasar', required: true },
                { label: 'Alamat', key: 'alamat', placeholder: 'Jl. Pusat Pasar, Medan Kota', required: false },
                { label: 'Latitude', key: 'lat', placeholder: '3.5896', required: true },
                { label: 'Longitude', key: 'lng', placeholder: '98.6789', required: true },
                { label: 'Tarif Motor (Rp)', key: 'tarifMotor', placeholder: '2000', required: false },
                { label: 'Tarif Mobil (Rp)', key: 'tarifMobil', placeholder: '5000', required: false },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    {f.label} {f.required && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    placeholder={f.placeholder}
                    value={(form as any)[f.key]}
                    onChange={(e) => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#1a237e]"
                  />
                </div>
              ))}
            </div>
            <div className="p-6 border-t flex gap-3">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 border rounded-xl text-sm font-semibold text-gray-600">Batal</button>
              <button onClick={handleSubmit} disabled={submitting}
                className="flex-1 py-2.5 bg-[#1a237e] text-white rounded-xl text-sm font-bold disabled:opacity-50">
                {submitting ? 'Menyimpan...' : 'Simpan Zona'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
