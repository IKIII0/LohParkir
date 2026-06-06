'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import { toast } from 'react-hot-toast';
import { ShieldCheck, Eye, EyeOff, AlertCircle, Lock, Mail, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [focused, setFocused] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await authApi.login(email, password);
      const { accessToken, refreshToken, user } = res.data.data;
      if (!['admin', 'superadmin'].includes(user.role)) {
        setError('Akun Anda tidak memiliki akses ke Dashboard Admin');
        setLoading(false);
        return;
      }
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
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      fontFamily: "'Inter', -apple-system, sans-serif",
      overflow: 'hidden',
      background: '#080f3d',
    }}>
      {/* ===== LEFT PANEL: Branding ===== */}
      <div style={{
        flex: '1',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'flex-start',
        padding: '60px 64px',
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #080f3d 0%, #1a237e 50%, #283593 100%)',
      }}>
        {/* Animated blobs */}
        <div style={{
          position: 'absolute', top: '-80px', right: '-80px',
          width: '400px', height: '400px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(57,73,171,0.5) 0%, transparent 70%)',
          animation: 'blob1 8s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', bottom: '-100px', left: '-60px',
          width: '350px', height: '350px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(26,35,126,0.6) 0%, transparent 70%)',
          animation: 'blob2 10s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', top: '40%', left: '30%',
          width: '200px', height: '200px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,235,59,0.07) 0%, transparent 70%)',
          animation: 'blob1 6s ease-in-out infinite reverse',
        }} />

        {/* Grid dots pattern */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }} />

        {/* Content */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Logo */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: '64px', height: '64px', borderRadius: '20px',
            background: 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.15)',
            marginBottom: '32px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          }}>
            <ShieldCheck size={32} color="#ffeb3b" />
          </div>

          <div style={{
            display: 'inline-block',
            background: 'rgba(255,235,59,0.12)',
            border: '1px solid rgba(255,235,59,0.25)',
            borderRadius: '100px',
            padding: '4px 14px',
            marginBottom: '20px',
          }}>
            <span style={{ color: '#ffeb3b', fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Admin Portal
            </span>
          </div>

          <h1 style={{
            fontSize: '42px', fontWeight: 800, color: '#ffffff',
            lineHeight: 1.15, letterSpacing: '-0.02em', marginBottom: '16px',
          }}>
            LohParkir<br />
            <span style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 400, fontSize: '28px' }}>
              Sistem Manajemen
            </span>
          </h1>

          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '15px', lineHeight: 1.7, maxWidth: '380px', marginBottom: '48px' }}>
            Platform pengawasan parkir resmi Dinas Perhubungan Kota Medan. Kelola petugas, pantau transaksi, dan analisis data secara real-time.
          </p>

          {/* Feature pills */}
          {[
            { icon: '🛡️', text: 'Manajemen Petugas & Zona' },
            { icon: '📊', text: 'Analitik Transaksi Real-time' },
            { icon: '🚨', text: 'Monitoring Alarm Darurat' },
          ].map((f, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              marginBottom: '12px',
            }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '10px',
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '16px',
              }}>{f.icon}</div>
              <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px', fontWeight: 500 }}>{f.text}</span>
            </div>
          ))}
        </div>

        {/* Bottom badge */}
        <div style={{
          position: 'absolute', bottom: '32px', left: '64px',
          color: 'rgba(255,255,255,0.3)', fontSize: '11px',
        }}>
          © 2024 LohParkir — Dinas Perhubungan Kota Medan
        </div>
      </div>

      {/* ===== RIGHT PANEL: Login Form ===== */}
      <div style={{
        width: '480px',
        minWidth: '480px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px',
        background: '#f8f9ff',
        position: 'relative',
      }}>
        {/* Top accent line */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          height: '3px',
          background: 'linear-gradient(90deg, #1a237e, #3949ab, #ffeb3b)',
        }} />

        <div style={{ width: '100%', maxWidth: '380px' }}>
          {/* Header */}
          <div style={{ marginBottom: '36px' }}>
            <h2 style={{ fontSize: '26px', fontWeight: 800, color: '#0d1757', letterSpacing: '-0.02em', marginBottom: '6px' }}>
              Selamat Datang
            </h2>
            <p style={{ color: '#6b7280', fontSize: '14px' }}>
              Masuk untuk mengakses dashboard admin
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: '10px',
              background: '#fff1f0', border: '1px solid #fca5a5',
              borderRadius: '12px', padding: '14px 16px',
              marginBottom: '20px',
              animation: 'fadeIn 0.3s ease-out',
            }}>
              <AlertCircle size={16} color="#dc2626" style={{ marginTop: '1px', flexShrink: 0 }} />
              <p style={{ fontSize: '13px', color: '#b91c1c', lineHeight: 1.5 }}>{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Email */}
            <div>
              <label style={{
                display: 'block', fontSize: '12px', fontWeight: 700,
                color: '#374151', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em',
              }}>Email</label>
              <div style={{ position: 'relative' }}>
                <div style={{
                  position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)',
                  color: focused === 'email' ? '#1a237e' : '#9ca3af',
                  transition: 'color 0.2s',
                }}>
                  <Mail size={16} />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocused('email')}
                  onBlur={() => setFocused(null)}
                  required
                  placeholder="admin@dishubmedan.id"
                  style={{
                    width: '100%', padding: '13px 14px 13px 42px',
                    borderRadius: '12px',
                    border: `2px solid ${focused === 'email' ? '#1a237e' : '#e5e7eb'}`,
                    background: focused === 'email' ? '#f5f6ff' : '#ffffff',
                    fontSize: '14px', color: '#111827',
                    outline: 'none', transition: 'all 0.2s',
                    boxShadow: focused === 'email' ? '0 0 0 4px rgba(26,35,126,0.08)' : 'none',
                  }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label style={{
                display: 'block', fontSize: '12px', fontWeight: 700,
                color: '#374151', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em',
              }}>Password</label>
              <div style={{ position: 'relative' }}>
                <div style={{
                  position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)',
                  color: focused === 'password' ? '#1a237e' : '#9ca3af',
                  transition: 'color 0.2s',
                }}>
                  <Lock size={16} />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocused('password')}
                  onBlur={() => setFocused(null)}
                  required
                  placeholder="••••••••"
                  style={{
                    width: '100%', padding: '13px 48px 13px 42px',
                    borderRadius: '12px',
                    border: `2px solid ${focused === 'password' ? '#1a237e' : '#e5e7eb'}`,
                    background: focused === 'password' ? '#f5f6ff' : '#ffffff',
                    fontSize: '14px', color: '#111827',
                    outline: 'none', transition: 'all 0.2s',
                    boxShadow: focused === 'password' ? '0 0 0 4px rgba(26,35,126,0.08)' : 'none',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: '#9ca3af', display: 'flex', padding: '4px',
                    transition: 'color 0.2s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#1a237e')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#9ca3af')}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '14px',
                background: loading ? '#c5cae9' : 'linear-gradient(135deg, #1a237e 0%, #3949ab 100%)',
                color: '#ffffff', fontWeight: 700, fontSize: '15px',
                borderRadius: '12px', border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                transition: 'all 0.2s',
                boxShadow: loading ? 'none' : '0 4px 20px rgba(26,35,126,0.4)',
                letterSpacing: '0.01em', marginTop: '4px',
              }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              {loading ? (
                <div style={{
                  width: '18px', height: '18px',
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderTop: '2px solid #ffffff',
                  borderRadius: '50%', animation: 'spin 0.7s linear infinite',
                }} />
              ) : (
                <>
                  Masuk ke Dashboard
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Footer note */}
          <p style={{
            textAlign: 'center', marginTop: '24px',
            fontSize: '12px', color: '#9ca3af',
          }}>
            Lupa akses? Hubungi{' '}
            <span style={{ color: '#1a237e', fontWeight: 600, cursor: 'pointer' }}>
              Superadmin LohParkir
            </span>
          </p>

          {/* Divider */}
          <div style={{
            margin: '28px 0 0', padding: '16px 0 0',
            borderTop: '1px solid #e5e7eb',
            textAlign: 'center',
          }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              background: '#fff', border: '1px solid #e5e7eb',
              borderRadius: '8px', padding: '8px 14px',
            }}>
              <ShieldCheck size={14} color="#2e7d32" />
              <span style={{ fontSize: '11px', color: '#6b7280', fontWeight: 500 }}>
                Koneksi terenkripsi & aman
              </span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        @keyframes blob1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(20px, -20px) scale(1.05); }
          66% { transform: translate(-15px, 10px) scale(0.97); }
        }
        @keyframes blob2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(-20px, 15px) scale(1.03); }
          66% { transform: translate(10px, -10px) scale(0.98); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        * { box-sizing: border-box; }

        @media (max-width: 900px) {
          .left-panel { display: none !important; }
        }
      `}</style>
    </div>
  );
}
