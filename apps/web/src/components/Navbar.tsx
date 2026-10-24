'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Logo from './Logo';
import {
  LayoutDashboard,
  Calendar,
  Target,
  CreditCard,
  Landmark,
  Users,
  BarChart3,
  Bell,
  LogOut,
  Menu,
  X,
  Home,
  ChevronDown,
  CheckCheck
} from 'lucide-react';

interface NavbarProps {
  user?: any;
  household?: any;
  unreadNotifications?: number;
}

function NotificationBell() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  const getToken = () => typeof window !== 'undefined' ? localStorage.getItem('hogariq_token') : null;

  const fetchNotifs = async () => {
    const token = getToken();
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setNotifications(await res.json());
      }
    } catch (e) {
      console.log('Error cargando notificaciones:', e);
    }
  };

  useEffect(() => {
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 15000);
    return () => clearInterval(interval);
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkAllRead = async () => {
    const token = getToken();
    if (!token) return;
    try {
      await fetch(`${API_URL}/api/notifications/read-all`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchNotifs();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-xl bg-[#101A36] hover:bg-[#162347] text-slate-300 hover:text-emerald-300 border border-[#1E2B4D] transition-colors cursor-pointer relative"
        title="Notificaciones"
        aria-label="Notificaciones"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full tabular-nums">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 p-4 border border-[#1E2B4D] shadow-2xl z-50 rounded-2xl bg-[#101A36] backdrop-blur-xl">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#1E2B4D]">
            <span className="text-xs font-semibold text-slate-200 flex items-center gap-2">
              <Bell className="w-3.5 h-3.5 text-emerald-400" />
              Notificaciones ({notifications.length})
            </span>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-[11px] font-medium text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
              >
                <CheckCheck className="w-3 h-3" />
                Marcar leídas
              </button>
            )}
          </div>

          <div className="space-y-2 max-h-72 overflow-y-auto pr-1 custom-scrollbar">
            {notifications.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-5">No hay notificaciones pendientes.</p>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-3 rounded-xl border text-xs transition-colors ${
                    n.isRead
                      ? 'bg-[#0A1128]/60 border-[#1E2B4D]/60 opacity-60'
                      : 'bg-[#162347] border-emerald-500/30'
                  }`}
                >
                  <p className="font-semibold text-slate-100 text-xs">{n.title}</p>
                  <p className="text-slate-300 text-[11px] mt-0.5">{n.body}</p>
                  <span className="text-[10px] text-slate-400 mt-1 block tabular-nums">
                    {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function HouseholdSelector({ currentHousehold }: { currentHousehold?: any }) {
  const [availableHouseholds, setAvailableHouseholds] = useState<any[]>([]);
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  const getToken = () => typeof window !== 'undefined' ? localStorage.getItem('hogariq_token') : null;

  useEffect(() => {
    const fetchMe = async () => {
      const token = getToken();
      if (!token) return;
      try {
        const res = await fetch(`${API_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.availableHouseholds) setAvailableHouseholds(data.availableHouseholds);
        }
      } catch (e) {
        console.log('Error fetching available households:', e);
      }
    };
    fetchMe();
  }, []);

  const handleSwitchHousehold = async (targetHouseholdId: string) => {
    const token = getToken();
    if (!token || targetHouseholdId === currentHousehold?.id) return;
    try {
      const res = await fetch(`${API_URL}/api/auth/switch-household`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ householdId: targetHouseholdId }),
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('hogariq_token', data.accessToken);
        localStorage.setItem('hogariq_user', JSON.stringify(data.user));
        localStorage.setItem('hogariq_household', JSON.stringify(data.household));
        window.location.reload();
      }
    } catch (e) {
      console.error('Error cambiando de hogar:', e);
    }
  };

  if (availableHouseholds.length <= 1) {
    return (
      <span className="hidden xl:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#162347] border border-[#1E2B4D] text-[11px] text-emerald-300 font-medium">
        <Home className="w-3 h-3 text-emerald-400" />
        {currentHousehold?.name || 'Hogar'}
      </span>
    );
  }

  return (
    <div className="relative hidden xl:inline-block">
      <select
        value={currentHousehold?.id || ''}
        onChange={(e) => handleSwitchHousehold(e.target.value)}
        className="px-2.5 py-1 pr-6 rounded-lg bg-[#162347] border border-emerald-500/30 text-[11px] text-emerald-200 font-medium focus:outline-none focus:border-emerald-400 cursor-pointer appearance-none"
      >
        {availableHouseholds.map((h) => (
          <option key={h.id} value={h.id} className="bg-[#101A36] text-slate-100">
            {h.name} ({h.role})
          </option>
        ))}
      </select>
      <ChevronDown className="w-3 h-3 text-emerald-400 absolute right-1.5 top-2 pointer-events-none" />
    </div>
  );
}

export default function Navbar({
  user,
  household,
  unreadNotifications = 0,
}: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/calendar', label: 'Calendario', icon: Calendar },
    { href: '/dashboard/budgets', label: 'Presupuestos', icon: Target },
    { href: '/dashboard/commitments', label: 'Compromisos', icon: CreditCard },
    { href: '/dashboard/patrimony', label: 'Patrimonio', icon: Landmark },
    { href: '/dashboard/family', label: 'Familia', icon: Users },
    { href: '/dashboard/reports', label: 'Reportes', icon: BarChart3 },
  ];

  const handleLogout = () => {
    localStorage.removeItem('hogariq_token');
    localStorage.removeItem('hogariq_user');
    localStorage.removeItem('hogariq_household');
    router.push('/login');
  };

  return (
    <>
      {/* Header Bar Principal */}
      <header className="border-b border-[#1E2B4D] bg-[#0A1128]/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center space-x-4 lg:space-x-6">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <Logo size="md" showText={true} />
              <HouseholdSelector currentHousehold={household} />
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center space-x-1 border-l border-[#1E2B4D] pl-4">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 flex items-center space-x-1.5 ${
                      isActive
                        ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-[#162347]'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Action Icons & Controls */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <NotificationBell />

            {/* User Info (Desktop) */}
            {user && (
              <div className="hidden sm:flex flex-col text-right border-l border-[#1E2B4D] pl-3">
                <p className="text-xs font-semibold text-slate-200">{user.fullName || user.email}</p>
                <span className="text-[10px] text-emerald-400 font-medium">
                  {household?.role || 'Miembro'}
                </span>
              </div>
            )}

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="p-2 rounded-xl bg-[#101A36] hover:bg-rose-950/30 hover:border-rose-500/40 text-slate-400 hover:text-rose-300 border border-[#1E2B4D] text-xs transition-colors cursor-pointer"
              title="Cerrar Sesión"
              aria-label="Cerrar Sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>

            {/* Mobile Hamburger Toggle Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl bg-[#101A36] hover:bg-[#162347] text-slate-300 border border-[#1E2B4D] lg:hidden cursor-pointer"
              aria-label="Abrir Menú Móvil"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-[#1E2B4D] bg-[#0A1128]/95 backdrop-blur-xl px-4 py-4 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`p-2.5 rounded-xl text-xs font-medium flex items-center space-x-2 transition-all ${
                      isActive
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-[#101A36] text-slate-300 border border-[#1E2B4D] hover:bg-[#162347]'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                    <span className="truncate">{link.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </header>

      {/* Mobile Fixed Bottom Navigation Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0A1128]/95 backdrop-blur-xl border-t border-[#1E2B4D] px-2 py-2 flex justify-around items-center shadow-2xl">
        {navLinks.map((link) => {
          const isActive = pathname === link.href;
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-col items-center justify-center px-2 py-1 rounded-xl transition-all ${
                isActive ? 'text-emerald-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-[10px] mt-1 tracking-tight truncate max-w-[60px] text-center">
                {link.label.split(' ')[0]}
              </span>
            </Link>
          );
        })}
      </div>
    </>
  );
}
