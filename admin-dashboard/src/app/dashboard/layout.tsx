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
    <div className="min-h-screen flex bg-[#f0f2f5]">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-30 w-[260px] bg-gradient-to-b from-[#0d1757] to-[#1a237e] flex flex-col transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>

        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-white/10">
          <div className="w-9 h-9 bg-yellow-400/20 rounded-xl flex items-center justify-center">
            <ShieldCheck size={20} className="text-yellow-400" />
          </div>
          <div>
            <span className="text-white font-bold text-lg tracking-tight">LohParkir</span>
            <p className="text-blue-300 text-xs">Dishub Kota Medan</p>
          </div>
          <button className="ml-auto lg:hidden text-white/60" onClick={() => setSidebarOpen(false)}>
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {visibleNav.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link key={item.href} href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                  active
                    ? 'bg-white/20 text-white shadow-sm'
                    : 'text-blue-200 hover:bg-white/10 hover:text-white'
                }`}
              >
                <item.icon size={18} className={active ? 'text-yellow-400' : 'text-blue-300 group-hover:text-white'} />
                <span>{item.label}</span>
                {active && <ChevronRight size={14} className="ml-auto text-yellow-400" />}
                {item.href === '/dashboard/audit' && (
                  <span className="ml-auto text-xs bg-yellow-400/20 text-yellow-400 px-1.5 py-0.5 rounded-md">SA</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Info */}
        {user && (
          <div className="p-4 border-t border-white/10">
            <div className="bg-white/10 rounded-xl p-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-white font-bold text-sm">
                {user.nama.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-semibold truncate">{user.nama}</p>
                <p className="text-blue-300 text-xs capitalize">{user.role}</p>
              </div>
              <button onClick={handleLogout} className="text-blue-300 hover:text-red-400 transition-colors" title="Logout">
                <LogOut size={16} />
              </button>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <div className="flex-1 lg:ml-[260px] flex flex-col min-h-screen">

        {/* Header */}
        <header className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
          <div className="flex items-center gap-4 px-6 h-14">
            <button className="lg:hidden text-gray-600" onClick={() => setSidebarOpen(true)}>
              <Menu size={20} />
            </button>

            <div className="flex items-center gap-2 flex-1">
              {/* DB Status */}
              <div className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
                dbStatus === 'online' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${dbStatus === 'online' ? 'bg-green-500 pulse-dot' : 'bg-red-500'}`} />
                Database {dbStatus === 'online' ? 'Terhubung' : 'Terputus'}
              </div>
            </div>

            {/* Notifications */}
            <button id="notifications-btn" className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors">
              <Bell size={18} />
              {notifications > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                  {notifications > 9 ? '9+' : notifications}
                </span>
              )}
            </button>

            {/* Emergency Alert Banner (appears when triggered) */}
            <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-gray-600 hover:text-red-600 transition-colors px-3 py-2 hover:bg-red-50 rounded-xl">
              <LogOut size={16} />
              <span className="hidden sm:block">Keluar</span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 animate-fade-in">
          {children}
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 px-6 py-3">
          <p className="text-xs text-gray-400 text-center">
            © 2024 LohParkir — Dinas Perhubungan Kota Medan. Semua hak dilindungi.
          </p>
        </footer>
      </div>
    </div>
  );
}
