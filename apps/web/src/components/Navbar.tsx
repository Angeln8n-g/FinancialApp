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
  CheckCheck,
  Palette,
  User,
  ShieldCheck,
  WifiOff,
  RefreshCw,
} from 'lucide-react';
import ThemeModal from './modals/ThemeModal';
import UserProfileModal from './modals/UserProfileModal';
import { useOfflineSync } from '@/hooks/useOfflineSync';

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
        className="p-2 rounded-xl bg-[#101A36] hover:bg-[#162347] text-slate-300 hover:text-[var(--primary)] border border-[#1E2B4D] transition-colors cursor-pointer relative"
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
              <Bell className="w-3.5 h-3.5 text-[var(--primary)]" />
              Notificaciones ({notifications.length})
            </span>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-[11px] font-medium text-[var(--primary-text)] hover:opacity-80 flex items-center gap-1 cursor-pointer"
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
                      : 'bg-[#162347] border-[var(--primary-border)]'
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
      <span className="hidden xl:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--primary-muted)] border border-[var(--primary-border)] text-[11px] text-[var(--primary-text)] font-medium whitespace-nowrap shrink-0">
        <Home className="w-3 h-3 text-[var(--primary)]" />
        {currentHousehold?.name || 'Hogar'}
      </span>
    );
  }

  return (
    <div className="relative hidden xl:inline-block shrink-0">
      <select
        value={currentHousehold?.id || ''}
        onChange={(e) => handleSwitchHousehold(e.target.value)}
        className="px-2.5 py-1 pr-6 rounded-lg bg-[#162347] border border-[var(--primary-border)] text-[11px] text-[var(--primary-text)] font-medium focus:outline-none focus:border-[var(--primary)] cursor-pointer appearance-none whitespace-nowrap"
      >
        {availableHouseholds.map((h) => (
          <option key={h.id} value={h.id} className="bg-[#101A36] text-slate-100">
            {h.name} ({h.role})
          </option>
        ))}
      </select>
      <ChevronDown className="w-3 h-3 text-[var(--primary)] absolute right-1.5 top-2 pointer-events-none" />
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
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const { isOnline, pendingCount, isSyncing, syncNow } = useOfflineSync();

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
      <header className="border-b border-[#1E2B4D] bg-[#101A36] backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center space-x-4 lg:space-x-6">
            <Link href="/dashboard" className="flex items-center space-x-2 shrink-0">
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
                        ? 'nav-link-active'
                        : 'nav-link-inactive'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'nav-icon-active' : 'nav-icon-inactive'}`} />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Action Icons & Controls */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Estado Offline / Sincronización */}
            {!isOnline ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30" title="Modo sin conexión activo">
                <WifiOff className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="hidden sm:inline">Offline</span>
                {pendingCount > 0 && <span className="tabular-nums">({pendingCount})</span>}
              </span>
            ) : pendingCount > 0 ? (
              <button
                onClick={() => syncNow()}
                disabled={isSyncing}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-semibold bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-500/30 transition-colors cursor-pointer"
                title="Sincronizar movimientos guardados en este dispositivo"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-sky-400 ${isSyncing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">{isSyncing ? 'Sincronizando...' : 'Sincronizar'}</span>
                <span className="tabular-nums">({pendingCount})</span>
              </button>
            ) : null}

            <button
              onClick={() => setShowThemeModal(true)}
              className="p-2 rounded-xl bg-[#101A36] hover:bg-[#162347] border border-[#1E2B4D] transition-all cursor-pointer relative group"
              title="Temas y Paletas de Colores"
              aria-label="Personalizar Temas"
            >
              <Palette className="w-4 h-4 text-[var(--primary)] transition-transform group-hover:scale-110" />
            </button>

            <NotificationBell />

            {/* User Info (Desktop) */}
            {user && (
              <button
                onClick={() => setShowProfileModal(true)}
                className="hidden sm:flex items-center gap-2 text-left border-l border-[#1E2B4D] pl-3 hover:opacity-90 transition-opacity cursor-pointer group"
                title="Mi Cuenta, Privacidad y Exportación de Datos"
              >
                <div className="w-7 h-7 rounded-lg bg-[var(--primary-muted)] border border-[var(--primary-border)] flex items-center justify-center text-[var(--primary)] group-hover:opacity-80 transition-all">
                  <User className="w-3.5 h-3.5" />
                </div>
                <div className="flex flex-col">
                  <p className="text-xs font-semibold text-slate-200 group-hover:text-[var(--primary-text)] transition-colors">
                    {user.fullName || user.email}
                  </p>
                  <span className="text-[10px] text-[var(--primary-text)] font-medium">
                    {household?.role || 'Miembro'}
                  </span>
                </div>
              </button>
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
                        ? 'nav-drawer-link-active'
                        : 'bg-[#101A36] text-slate-300 border border-[#1E2B4D] hover:bg-[#162347]'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'nav-icon-active' : 'text-slate-400'}`} />
                    <span className="truncate">{link.label}</span>
                  </Link>
                );
              })}
            </div>

            {/* Mobile User Profile & Privacy Option */}
            {user && (
              <div className="pt-2 border-t border-[#1E2B4D]">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setShowProfileModal(true);
                  }}
                  className="w-full p-2.5 rounded-xl text-xs font-medium flex items-center space-x-2.5 bg-[var(--primary-muted)] border border-[var(--primary-border)] text-[var(--primary-text)] hover:opacity-90 transition-all cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4 text-[var(--primary)]" />
                  <span>Mi Cuenta & Privacidad</span>
                </button>
              </div>
            )}
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
                isActive ? 'nav-bottom-link-active' : 'text-slate-400 hover:text-slate-200'
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

      <ThemeModal isOpen={showThemeModal} onClose={() => setShowThemeModal(false)} />
      <UserProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        user={user}
        household={household}
      />
    </>
  );
}
