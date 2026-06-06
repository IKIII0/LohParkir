'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Users, FileText, MapPin, Activity,
  Settings, Bell, LogOut, ShieldCheck, ChevronRight,
  AlertTriangle, Database, Menu, X
} from 'lucide-react';

interface User {
  nama: string;
  email: string;
  role: string;
}

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: ['admin', 'superadmin'] },
  { href: '/dashboard/officers', icon: Users, label: 'Manajemen Petugas', roles: ['admin', 'superadmin'] },
  { href: '/dashboard/reports', icon: FileText, label: 'Manajemen Laporan', roles: ['admin', 'superadmin'] },
  { href: '/dashboard/zones', icon: MapPin, label: 'Zona Parkir', roles: ['admin', 'superadmin'] },
  { href: '/dashboard/transactions', icon: Activity, label: 'Transaksi', roles: ['admin', 'superadmin'] },
  { href: '/dashboard/audit', icon: Database, label: 'Audit Trail', roles: ['superadmin'] },
  { href: '/dashboard/admin-users', icon: Settings, label: 'Kelola Admin', roles: ['superadmin'] },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState(0);
  const [dbStatus, setDbStatus] = useState<'online' | 'offline'>('online');

  useEffect(() => {
    const userJson = localStorage.getItem('user');
    if (!userJson) { router.push('/login'); return; }
    setUser(JSON.parse(userJson));
    // Poll DB status every 30s
    const interval = setInterval(checkDbStatus, 30000);
    return () => clearInterval(interval);
  }, [router]);

  const checkDbStatus = async () => {
    try {
      const res = await fetch('http://localhost:3001/health');
      setDbStatus(res.ok ? 'online' : 'offline');
    } catch {
      setDbStatus('offline');
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push('/login');
  };

  const userRole = user?.role || '';
  const visibleNav = navItems.filter(item => item.roles.includes(userRole));

  return (
    <div className="min-h-screen flex bg-[#f8fafc] font-sans antialiased text-slate-800">
      {/* Mobile Overlay */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'active' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside className={`sidebar bg-[#0a0f2c] border-r border-slate-800/40 flex flex-col shadow-2xl ${sidebarOpen ? 'sidebar-open' : ''}`}>
        
        {/* Decorative subtle top glow */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-yellow-400" />

        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-6 border-b border-slate-800/40">
          <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-xl flex items-center justify-center shadow-lg shadow-yellow-500/25 transform hover:scale-105 transition-transform">
            <ShieldCheck size={22} className="text-slate-950" />
          </div>
          <div>
            <span className="text-white font-extrabold text-lg tracking-tight bg-clip-text bg-gradient-to-r from-white to-slate-300">
              LohParkir
            </span>
            <p className="text-slate-400 text-xs font-semibold tracking-wider uppercase">Dishub Kota Medan</p>
          </div>
          <button className="sidebar-close-btn ml-auto text-slate-400 hover:text-white transition-colors" onClick={() => setSidebarOpen(false)}>
            <X size={18} />
          </button>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {visibleNav.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link key={item.href} href={item.href}
                className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 group relative ${
                  active
                    ? 'bg-gradient-to-r from-indigo-600/30 to-blue-600/10 text-white shadow-inner border border-indigo-500/20'
                    : 'text-slate-400 hover:bg-slate-800/30 hover:text-white'
                }`}
              >
                {active && (
                  <span className="absolute left-0 top-1/3 bottom-1/3 w-1 bg-yellow-400 rounded-r-full" />
                )}
                <item.icon size={18} className={`transition-transform duration-200 group-hover:scale-110 ${active ? 'text-yellow-400' : 'text-slate-400 group-hover:text-white'}`} />
                <span>{item.label}</span>
                {active && <ChevronRight size={14} className="ml-auto text-yellow-400 animate-pulse" />}
                {item.href === '/dashboard/audit' && (
                  <span className="ml-auto text-[10px] font-bold bg-yellow-400/15 text-yellow-400 border border-yellow-400/30 px-1.5 py-0.5 rounded-md">SA</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Info Card */}
        {user && (
          <div className="p-4 border-t border-slate-800/40 bg-slate-950/40">
            <div className="bg-slate-900/60 border border-slate-800/30 rounded-xl p-3.5 flex items-center gap-3 shadow-inner">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-extrabold text-sm shadow-md">
                {user.nama.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-bold truncate tracking-tight">{user.nama}</p>
                <span className="inline-flex items-center text-[10px] font-bold text-yellow-400 uppercase tracking-widest mt-0.5 bg-yellow-400/10 px-1.5 py-0.5 rounded-md border border-yellow-400/25">
                  {user.role}
                </span>
              </div>
              <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800/30 rounded-lg transition-all" title="Logout">
                <LogOut size={16} />
              </button>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content Area */}
      <div className="main-content">

        {/* Top Floating Glass Header */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200/60 shadow-sm px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button className="hamburger-btn text-slate-600 p-2 hover:bg-slate-100 rounded-lg transition-colors" onClick={() => setSidebarOpen(true)}>
              <Menu size={20} />
            </button>

            {/* DB Connection Status Badge */}
            <div className={`flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full border transition-all duration-300 ${
              dbStatus === 'online' 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200/50' 
                : 'bg-rose-50 text-rose-700 border-rose-200/50'
            }`}>
              <span className={`w-2 h-2 rounded-full relative flex`}>
                {dbStatus === 'online' && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                )}
                <span className={`relative inline-flex rounded-full h-2 w-2 ${dbStatus === 'online' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
              </span>
              <span>Database {dbStatus === 'online' ? 'Terhubung' : 'Terputus'}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Notifications Panel Trigger */}
            <button id="notifications-btn" className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all">
              <Bell size={19} />
              {notifications > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-rose-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold border-2 border-white">
                  {notifications > 9 ? '9+' : notifications}
                </span>
              )}
            </button>

            {/* Logout Button */}
            <button onClick={handleLogout} className="flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-rose-600 transition-all px-2 sm:px-3 py-2 hover:bg-rose-50 rounded-xl">
              <LogOut size={16} />
              <span className="hidden sm:block">Keluar</span>
            </button>
          </div>
        </header>

        {/* Page Content with soft background */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 bg-[#f8fafc] overflow-auto">
          {children}
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-slate-100 px-6 py-4">
          <p className="text-xs text-slate-400 text-center font-medium">
            © 2024 LohParkir — Dinas Perhubungan Kota Medan. Semua hak dilindungi.
          </p>
        </footer>
      </div>
    </div>
  );
}
