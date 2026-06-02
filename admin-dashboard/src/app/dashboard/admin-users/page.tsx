'use client';
import { useState, useEffect } from 'react';
import { Plus, ToggleLeft, ToggleRight, Shield, UserCog } from 'lucide-react';
import { adminApi } from '@/lib/api';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface UserData {
  id: string;
  role: 'public' | 'officer' | 'admin' | 'superadmin';
  nama: string;
  email: string;
  is_active: boolean;
  last_login_at: string;
  created_at: string;
}

const ROLE_STYLE: Record<string, string> = {
  superadmin: 'bg-red-100 text-red-700',
  admin: 'bg-blue-100 text-blue-700',
  officer: 'bg-green-100 text-green-700',
  public: 'bg-gray-100 text-gray-600',
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [form, setForm] = useState({ nama: '', email: '', role: 'admin', password: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { loadUsers(); }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await adminApi.users();
      setUsers(res.data.data);
    } catch (err: any) {
      if (err.response?.status === 403) {
        toast.error('Hanya Superadmin yang dapat mengakses halaman ini');
      }
    } finally { setLoading(false); }
  };

  const handleUpdateRole = async (userId: string, currentRole: string, userName: string) => {
    const newRole = prompt(`Update role untuk ${userName}?\nRole saat ini: ${currentRole}\nMasukkan role baru (public/officer/admin/superadmin):`);
    if (!newRole || newRole === currentRole) return;
    if (!['public', 'officer', 'admin', 'superadmin'].includes(newRole)) {
      toast.error('Role tidak valid'); return;
    }
    if (!confirm(`Yakin ubah role ${userName} dari "${currentRole}" ke "${newRole}"?`)) return;
    try {
      await adminApi.updateRole(userId, newRole);
      toast.success('Role berhasil diubah');
      loadUsers();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Gagal mengubah role'); }
  };

  const handleToggle = async (userId: string, isActive: boolean, userName: string) => {
    const action = isActive ? 'nonaktifkan' : 'aktifkan';
    if (!confirm(`Yakin ingin ${action} akun ${userName}?`)) return;
    try {
      await adminApi.toggleUser(userId);
      toast.success(`Akun ${userName} berhasil di${action}`);
      loadUsers();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Gagal mengubah status'); }
  };

  const handleCreate = async () => {
    if (!form.nama || !form.email || !form.password) { toast.error('Semua field wajib diisi'); return; }
    setSubmitting(true);
    try {
      await adminApi.createUser(form);
      toast.success('Akun berhasil dibuat');
      setShowCreateModal(false);
      setForm({ nama: '', email: '', role: 'admin', password: '' });
      loadUsers();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Gagal membuat akun'); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <UserCog size={22} className="text-[#1a237e]" />
            Kelola Admin & User
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">{users.length} akun terdaftar</p>
        </div>
        <button onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-[#1a237e] text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#0d1757]">
          <Plus size={16} /> Tambah Admin
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-5 py-3.5 font-semibold text-gray-600">Nama</th>
                <th className="text-left px-4 py-3.5 font-semibold text-gray-600">Email</th>
                <th className="text-left px-4 py-3.5 font-semibold text-gray-600">Role</th>
                <th className="text-left px-4 py-3.5 font-semibold text-gray-600">Status</th>
                <th className="text-left px-4 py-3.5 font-semibold text-gray-600">Login Terakhir</th>
                <th className="text-right px-5 py-3.5 font-semibold text-gray-600">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="py-12 text-center text-gray-400">Memuat...</td></tr>
              ) : users.map((u) => (
                <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#1a237e]/10 flex items-center justify-center text-[#1a237e] font-bold text-sm">
                        {u.nama.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-semibold text-gray-900">{u.nama}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-gray-600">{u.email}</td>
                  <td className="px-4 py-4">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${ROLE_STYLE[u.role]}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${u.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {u.is_active ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-xs text-gray-500">
                    {u.last_login_at ? format(new Date(u.last_login_at), 'dd MMM yyyy HH:mm', { locale: id }) : '—'}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleUpdateRole(u.id, u.role, u.nama)}
                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Ubah Role"
                      >
                        <Shield size={16} />
                      </button>
                      <button
                        onClick={() => handleToggle(u.id, u.is_active, u.nama)}
                        className={`p-2 rounded-lg transition-colors ${u.is_active ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-50'}`}
                        title={u.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                      >
                        {u.is_active ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="font-bold text-lg">Tambah Admin Baru</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400">✕</button>
            </div>
            <div className="p-6 space-y-4">
              {[
                { label: 'Nama Lengkap', key: 'nama', type: 'text', placeholder: 'Admin Dishub 3' },
                { label: 'Email', key: 'email', type: 'email', placeholder: 'admin3@dishubmedan.id' },
                { label: 'Password', key: 'password', type: 'password', placeholder: 'Min. 8 karakter' },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">{f.label}</label>
                  <input type={f.type} placeholder={f.placeholder}
                    value={(form as any)[f.key]}
                    onChange={(e) => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#1a237e]" />
                </div>
              ))}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Role</label>
                <select value={form.role} onChange={(e) => setForm(f => ({ ...f, role: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#1a237e]">
                  <option value="admin">Admin Dishub</option>
                  <option value="superadmin">Superadmin</option>
                </select>
              </div>
            </div>
            <div className="p-6 border-t flex gap-3">
              <button onClick={() => setShowCreateModal(false)} className="flex-1 py-2.5 border rounded-xl text-sm font-semibold text-gray-600">Batal</button>
              <button onClick={handleCreate} disabled={submitting}
                className="flex-1 py-2.5 bg-[#1a237e] text-white rounded-xl text-sm font-bold disabled:opacity-50">
                {submitting ? 'Membuat...' : 'Buat Akun'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
