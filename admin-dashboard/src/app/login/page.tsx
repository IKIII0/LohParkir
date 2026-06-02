'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import { toast } from 'react-hot-toast';
import { ShieldCheck, Eye, EyeOff, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await authApi.login(email, password);
      const { accessToken, refreshToken, user } = res.data.data;
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));
      toast.success(`Selamat datang, ${user.nama}!`);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Terjadi kesalahan. Coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0d1757] via-[#1a237e] to-[#283593] flex items-center justify-center p-6">

      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="absolute rounded-full opacity-5 bg-white"
            style={{
              width: `${120 + i * 40}px`, height: `${120 + i * 40}px`,
              top: `${(i * 15) % 90}%`, left: `${(i * 20) % 90}%`,
            }} />
        ))}
      </div>

      <div className="w-full max-w-md relative">
        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden animate-fade-in">

          {/* Header */}
          <div className="bg-gradient-to-r from-[#1a237e] to-[#3949ab] p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/15 rounded-2xl mb-4 backdrop-blur-sm">
              <ShieldCheck size={32} className="text-yellow-400" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">LohParkir</h1>
            <p className="text-blue-200 text-sm mt-1">Admin Dashboard — Dishub Kota Medan</p>
          </div>

          {/* Form */}
          <div className="p-8 space-y-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Masuk ke Dashboard</h2>
              <p className="text-sm text-gray-500 mt-1">Khusus untuk Admin dan Superadmin</p>
            </div>

            {error && (
              <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
                <AlertCircle size={18} className="text-red-600 mt-0.5 shrink-0" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="admin@dishubmedan.id"
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#1a237e] focus:outline-none transition-colors text-gray-900 placeholder-gray-400"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#1a237e] focus:outline-none transition-colors pr-12 text-gray-900"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                id="login-submit"
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-[#1a237e] to-[#3949ab] text-white font-bold py-4 rounded-xl hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-900/30 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : 'Masuk ke Dashboard'}
              </button>
            </form>

            <p className="text-xs text-center text-gray-400">
              Lupa password? Hubungi Superadmin LohParkir
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-blue-200/60 mt-6">
          © 2024 LohParkir — Dinas Perhubungan Kota Medan
        </p>
      </div>
    </div>
  );
}
