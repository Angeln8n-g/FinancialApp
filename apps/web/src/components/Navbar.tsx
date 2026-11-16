'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Check,
  CheckCheck,
  Trash2,
  Palette,
  User,
  ShieldCheck,
  WifiOff,
  RefreshCw,
  PiggyBank,
} from 'lucide-react';
import ThemeModal from './modals/ThemeModal';
import UserProfileModal from './modals/UserProfileModal';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { useHouseholdSocket } from '@/hooks/useHouseholdSocket';

interface NavbarProps {
  user?: any;
  household?: any;
  unreadNotifications?: number;
}

function formatRelativeTime(dateStr: string) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Ahora mismo';
  if (mins < 60) return `Hace ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Hace ${hours} h`;
  return new Date(dateStr).toLocaleDateString([], { day: '2-digit', month: 'short' });
}

function NotificationBell({
  isChildAccount,
  householdId,
}: {
  isChildAccount?: boolean;
  householdId?: string;
}) {
  const router = useRouter();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [filterMode, setFilterMode] = useState<'all' | 'unread'>('all');
  const containerRef = useRef<HTMLDivElement>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  const getToken = () => (typeof window !== 'undefined' ? localStorage.getItem('hogariq_token') : null);

  const fetchNotifs = useCallback(async () => {
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
  }, [API_URL]);

  useEffect(() => {
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 20000);
    return () => clearInterval(interval);
  }, [fetchNotifs]);

  // Actualización en tiempo real vía WebSocket
  useHouseholdSocket(householdId, (payload) => {
    if (!payload || payload.entity === 'notification' || payload.type === 'TRANSACTION_CREATED') {
      fetchNotifs();
    }
  });

  // Cerrar al hacer clic fuera o presionar Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKey);
    };
  }, [isOpen]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const readCount = notifications.length - unreadCount;
  const displayedNotifs =
    filterMode === 'unread' ? notifications.filter((n) => !n.isRead) : notifications;

  const handleMarkAsRead = async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    const token = getToken();
    if (!token) return;
    try {
      await fetch(`${API_URL}/api/notifications/${id}/read`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
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

  const handleDeleteNotification = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    const token = getToken();
    if (!token) return;
    try {
      await fetch(`${API_URL}/api/notifications/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleClearRead = async () => {
    setNotifications((prev) => prev.filter((n) => !n.isRead));
    const token = getToken();
    if (!token) return;
    try {
      await fetch(`${API_URL}/api/notifications/clear-read`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchNotifs();
    } catch (err) {
      console.error(err);
    }
  };

  const handleNotificationClick = async (n: any) => {
    if (!n.isRead) {
      await handleMarkAsRead(n.id);
    }
    setIsOpen(false);

    if (
      n.type === 'ALLOWANCE_REQUEST' ||
      n.type === 'PARENTAL_CONTROL' ||
      n.type === 'MISSION_COMPLETED' ||
      n.type === 'MEMBER_JOINED' ||
      (n.title && n.title.toLowerCase().includes('misión'))
    ) {
      router.push('/dashboard/family');
    } else if (n.type === 'REMINDER_DUE' && !isChildAccount) {
      router.push('/dashboard/commitments');
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`p-2 rounded-xl border transition-colors cursor-pointer relative ${
          isChildAccount
            ? 'bg-sky-50 hover:bg-sky-100 text-sky-700 border-sky-200'
            : 'bg-[#101A36] hover:bg-[#162347] text-slate-300 hover:text-[var(--primary)] border-[#1E2B4D]'
        }`}
        title="Notificaciones"
        aria-label="Notificaciones"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full tabular-nums">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          className={`absolute right-0 mt-2 w-80 sm:w-[400px] p-4 shadow-2xl z-50 rounded-2xl backdrop-blur-xl ${
            isChildAccount
              ? 'bg-white border-2 border-sky-200'
              : 'border border-[#1E2B4D] bg-[#101A36]'
          }`}
        >
          {/* Header & Bulk Actions */}
          <div
            className={`flex items-center justify-between pb-2.5 mb-2.5 border-b ${
              isChildAccount ? 'border-sky-100' : 'border-[#1E2B4D]'
            }`}
          >
            <span
              className={`text-sm font-bold flex items-center gap-2 ${
                isChildAccount ? 'text-[#1E1B4B]' : 'text-slate-200'
              }`}
            >
              <Bell className={`w-4 h-4 ${isChildAccount ? 'text-sky-600' : 'text-[var(--primary)]'}`} />
              <span>Notificaciones</span>
            </span>

            <div className="flex items-center gap-2.5">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className={`text-xs font-semibold hover:opacity-80 flex items-center gap-1 cursor-pointer ${
                    isChildAccount ? 'text-sky-700' : 'text-[var(--primary-text)]'
                  }`}
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Marcar leídas
                </button>
              )}
              {readCount > 0 && (
                <button
                  onClick={handleClearRead}
                  className={`text-xs font-semibold hover:opacity-80 flex items-center gap-1 cursor-pointer ${
                    isChildAccount ? 'text-rose-600' : 'text-rose-400'
                  }`}
                  title="Eliminar notificaciones ya leídas"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Limpiar
                </button>
              )}
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 mb-3">
            <button
              type="button"
              onClick={() => setFilterMode('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                filterMode === 'all'
                  ? isChildAccount
                    ? 'bg-sky-600 text-white'
                    : 'bg-[var(--primary-muted)] text-[var(--primary-text)] border border-[var(--primary-border)]'
                  : isChildAccount
                  ? 'bg-sky-50 text-slate-600 hover:bg-sky-100'
                  : 'bg-[#0A1128] text-slate-400 hover:text-slate-200'
              }`}
            >
              Todas ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('unread')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                filterMode === 'unread'
                  ? isChildAccount
                    ? 'bg-sky-600 text-white'
                    : 'bg-[var(--primary-muted)] text-[var(--primary-text)] border border-[var(--primary-border)]'
                  : isChildAccount
                  ? 'bg-sky-50 text-slate-600 hover:bg-sky-100'
                  : 'bg-[#0A1128] text-slate-400 hover:text-slate-200'
              }`}
            >
              Sin leer ({unreadCount})
            </button>
          </div>

          {/* Notification List */}
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1 custom-scrollbar">
            {displayedNotifs.length === 0 ? (
              <p className={`text-xs text-center py-6 ${isChildAccount ? 'text-slate-500' : 'text-slate-400'}`}>
                {filterMode === 'unread'
                  ? '¡Todo al día! No tienes notificaciones sin leer.'
                  : 'No hay notificaciones pendientes.'}
              </p>
            ) : (
              displayedNotifs.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={`p-3 rounded-xl border text-xs transition-colors cursor-pointer group flex items-start justify-between gap-2.5 ${
                    isChildAccount
                      ? n.isRead
                        ? 'bg-slate-50 border-slate-200 opacity-75 hover:bg-slate-100'
                        : 'bg-sky-50 border-sky-200 hover:bg-sky-100/70'
                      : n.isRead
                      ? 'bg-[#0A1128]/60 border-[#1E2B4D]/60 opacity-65 hover:opacity-90'
                      : 'bg-[#162347] border-[var(--primary-border)] hover:bg-[#1D2D5A]'
                  }`}
                >
                  <div className="flex items-start gap-2 flex-1 min-w-0">
                    {!n.isRead && (
                      <span
                        className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                          isChildAccount ? 'bg-sky-600' : 'bg-[var(--primary)]'
                        }`}
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className={`font-bold text-xs ${isChildAccount ? 'text-[#1E1B4B]' : 'text-slate-100'}`}>
                        {n.title}
                      </p>
                      <p className={`text-xs mt-0.5 leading-relaxed ${isChildAccount ? 'text-slate-700' : 'text-slate-300'}`}>
                        {n.body}
                      </p>
                      <span className={`text-[11px] mt-1 block tabular-nums ${isChildAccount ? 'text-slate-500' : 'text-slate-400'}`}>
                        {formatRelativeTime(n.createdAt)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {!n.isRead && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkAsRead(n.id);
                        }}
                        className={`p-1 rounded-lg transition-colors cursor-pointer ${
                          isChildAccount
                            ? 'text-sky-700 hover:bg-sky-200/70'
                            : 'text-emerald-400 hover:bg-[#0A1128]'
                        }`}
                        title="Marcar como leída"
                        aria-label="Marcar como leída"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={(e) => handleDeleteNotification(e, n.id)}
                      className={`p-1 rounded-lg transition-colors cursor-pointer ${
                        isChildAccount
                          ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                          : 'text-slate-500 hover:text-rose-400 hover:bg-[#0A1128]'
                      }`}
                      title="Eliminar notificación"
                      aria-label="Eliminar notificación"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function HouseholdSelector({ currentHousehold, isChildAccount, parentEmail }: { currentHousehold?: any; isChildAccount?: boolean; parentEmail?: string }) {
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
          if (data.household) {
            localStorage.setItem('hogariq_household', JSON.stringify(data.household));
          }
          if (data.user) {
            localStorage.setItem('hogariq_user', JSON.stringify(data.user));
          }
        }
      } catch (e) {
        console.log('Error fetching available households:', e);
      }
    };
    fetchMe();
  }, []);

  if (isChildAccount) {
    return null;
  }

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
}: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const { isOnline, pendingCount, isSyncing, syncNow } = useOfflineSync();

  const isChildAccount =
    household?.role === 'DEPENDENT' ||
    Boolean(user?.isChildAccount) ||
    Boolean(household?.isChildAccount);

  const parentEmail = household?.parentEmail || user?.parentEmail || household?.parentalControls?.parentEmail;

  // 🛡️ Restricción de rutas: si es una cuenta de niño, solo tiene acceso a su Cuenta de Niño (/dashboard) y Misiones/Familia (/dashboard/family)
  useEffect(() => {
    if (isChildAccount && pathname && pathname.startsWith('/dashboard/')) {
      const allowedChildPaths = ['/dashboard', '/dashboard/family'];
      if (!allowedChildPaths.includes(pathname)) {
        router.replace('/dashboard');
      }
    }
  }, [isChildAccount, pathname, router]);

  const adultNavLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/calendar', label: 'Calendario', icon: Calendar },
    { href: '/dashboard/budgets', label: 'Presupuestos', icon: Target },
    { href: '/dashboard/commitments', label: 'Compromisos', icon: CreditCard },
    { href: '/dashboard/patrimony', label: 'Patrimonio', icon: Landmark },
    { href: '/dashboard/family', label: 'Familia', icon: Users },
    { href: '/dashboard/reports', label: 'Reportes', icon: BarChart3 },
  ];

  const childNavLinks = [
    { href: '/dashboard', label: 'Mi Alcancía', icon: PiggyBank },
    { href: '/dashboard/family', label: 'Misiones y Mesada', icon: Users },
  ];

  const navLinks = isChildAccount ? childNavLinks : adultNavLinks;

  const handleLogout = () => {
    localStorage.removeItem('hogariq_token');
    localStorage.removeItem('hogariq_user');
    localStorage.removeItem('hogariq_household');
    router.push('/login');
  };

  return (
    <>
      {/* Header Bar Principal */}
      <header
        className={`backdrop-blur-md sticky top-0 z-40 ${
          isChildAccount
            ? 'kids-header'
            : 'border-b border-[#1E2B4D] bg-[#101A36]'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center space-x-4 lg:space-x-6">
            <Link href="/dashboard" className="flex items-center space-x-2 shrink-0">
              <Logo size="md" showText={true} variant={isChildAccount ? 'kids' : 'default'} />
              <HouseholdSelector
                currentHousehold={household}
                isChildAccount={isChildAccount}
                parentEmail={parentEmail}
              />
            </Link>

            {/* Desktop Navigation Links */}
            <nav
              className={`hidden lg:flex items-center space-x-1.5 pl-4 ${
                isChildAccount ? 'border-l-2 border-sky-200' : 'border-l border-[#1E2B4D]'
              }`}
            >
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-3.5 py-2 rounded-xl text-[13px] font-semibold flex items-center space-x-2 ${
                      isChildAccount
                        ? isActive
                          ? 'kids-nav-active'
                          : 'kids-nav-inactive'
                        : isActive
                        ? 'nav-link-active'
                        : 'nav-link-inactive'
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 ${
                        isChildAccount
                          ? isActive
                            ? 'text-white'
                            : 'text-sky-600'
                          : isActive
                          ? 'nav-icon-active'
                          : 'nav-icon-inactive'
                      }`}
                    />
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
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold border ${
                  isChildAccount
                    ? 'bg-amber-100 text-amber-900 border-amber-300'
                    : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                }`}
                title="Modo sin conexión activo"
              >
                <WifiOff className={`w-3.5 h-3.5 shrink-0 ${isChildAccount ? 'text-amber-700' : 'text-amber-400'}`} />
                <span className="hidden sm:inline">Offline</span>
                {pendingCount > 0 && <span className="tabular-nums">({pendingCount})</span>}
              </span>
            ) : pendingCount > 0 ? (
              <button
                onClick={() => syncNow()}
                disabled={isSyncing}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                  isChildAccount
                    ? 'bg-sky-100 hover:bg-sky-200 text-sky-900 border-sky-300'
                    : 'bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border-sky-500/30'
                }`}
                title="Sincronizar movimientos guardados en este dispositivo"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isChildAccount ? 'text-sky-700' : 'text-sky-400'} ${isSyncing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">{isSyncing ? 'Sincronizando...' : 'Sincronizar'}</span>
                <span className="tabular-nums">({pendingCount})</span>
              </button>
            ) : null}

            {!isChildAccount && (
              <button
                onClick={() => setShowThemeModal(true)}
                className="p-2 rounded-xl bg-[#101A36] hover:bg-[#162347] border border-[#1E2B4D] transition-transform cursor-pointer relative group"
                title="Temas y Paletas de Colores"
                aria-label="Personalizar Temas"
              >
                <Palette className="w-4 h-4 text-[var(--primary)] transition-transform group-hover:scale-110" />
              </button>
            )}

            <NotificationBell isChildAccount={isChildAccount} householdId={household?.id} />

            {/* User Info (Desktop) */}
            {user && (
              <button
                onClick={() => setShowProfileModal(true)}
                className={`hidden sm:flex items-center gap-2 text-left pl-3 hover:opacity-90 transition-opacity cursor-pointer group ${
                  isChildAccount ? 'border-l-2 border-sky-200' : 'border-l border-[#1E2B4D]'
                }`}
                title="Mi Cuenta, Privacidad y Exportación de Datos"
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                    isChildAccount
                      ? 'bg-amber-100 border-2 border-amber-300 text-amber-800'
                      : 'bg-[var(--primary-muted)] border border-[var(--primary-border)] text-[var(--primary)]'
                  }`}
                >
                  <User className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <p
                    className={`text-[13px] font-bold leading-tight transition-colors ${
                      isChildAccount
                        ? 'text-[#1E1B4B] group-hover:text-sky-700'
                        : 'text-slate-200 group-hover:text-[var(--primary-text)]'
                    }`}
                  >
                    {user.fullName || user.email}
                  </p>
                  <span
                    className={`text-xs font-medium leading-tight ${
                      isChildAccount ? 'text-sky-700' : 'text-[var(--primary-text)]'
                    }`}
                  >
                    {isChildAccount ? 'Cuenta infantil' : (household?.role || 'Miembro')}
                  </span>
                </div>
              </button>
            )}

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className={`p-2 rounded-xl border text-xs transition-colors cursor-pointer ${
                isChildAccount
                  ? 'bg-rose-50 hover:bg-rose-100 border-rose-200 text-rose-700'
                  : 'bg-[#101A36] hover:bg-rose-950/30 hover:border-rose-500/40 text-slate-400 hover:text-rose-300 border-[#1E2B4D]'
              }`}
              title="Cerrar Sesión"
              aria-label="Cerrar Sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>

            {/* Mobile Hamburger Toggle Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`p-2 rounded-xl border lg:hidden cursor-pointer ${
                isChildAccount
                  ? 'bg-sky-50 hover:bg-sky-100 text-[#1E1B4B] border-sky-200'
                  : 'bg-[#101A36] hover:bg-[#162347] text-slate-300 border-[#1E2B4D]'
              }`}
              aria-label="Abrir Menú Móvil"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu Drawer */}
        {mobileMenuOpen && (
          <div
            className={`lg:hidden backdrop-blur-xl px-4 py-4 space-y-3 ${
              isChildAccount
                ? 'border-t-2 border-sky-200 bg-white/95'
                : 'border-t border-[#1E2B4D] bg-[#0A1128]/95'
            }`}
          >
            <div className="grid grid-cols-2 gap-2">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`p-2.5 rounded-xl text-[13px] font-semibold flex items-center space-x-2 transition-colors ${
                      isChildAccount
                        ? isActive
                          ? 'kids-nav-active'
                          : 'bg-sky-50 text-[#1E1B4B] border border-sky-200 hover:bg-sky-100'
                        : isActive
                        ? 'nav-drawer-link-active'
                        : 'bg-[#101A36] text-slate-300 border border-[#1E2B4D] hover:bg-[#162347]'
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 ${
                        isChildAccount
                          ? isActive
                            ? 'text-white'
                            : 'text-sky-600'
                          : isActive
                          ? 'nav-icon-active'
                          : 'text-slate-400'
                      }`}
                    />
                    <span className="truncate">{link.label}</span>
                  </Link>
                );
              })}
            </div>

            {user && (
              <div className={`pt-2 ${isChildAccount ? 'border-t border-sky-200' : 'border-t border-[#1E2B4D]'}`}>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setShowProfileModal(true);
                  }}
                  className={`w-full p-2.5 rounded-xl text-[13px] font-semibold flex items-center space-x-2.5 cursor-pointer ${
                    isChildAccount
                      ? 'bg-amber-50 border border-amber-300 text-[#1E1B4B] hover:bg-amber-100'
                      : 'bg-[var(--primary-muted)] border border-[var(--primary-border)] text-[var(--primary-text)] hover:opacity-90'
                  }`}
                >
                  <ShieldCheck className={`w-4 h-4 ${isChildAccount ? 'text-amber-600' : 'text-[var(--primary)]'}`} />
                  <span>Mi Cuenta & Privacidad</span>
                </button>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Mobile Fixed Bottom Navigation Bar */}
      <div
        className={`lg:hidden fixed bottom-0 left-0 right-0 z-40 backdrop-blur-xl px-2 py-2 flex justify-around items-center shadow-2xl ${
          isChildAccount
            ? 'bg-white/95 border-t-2 border-sky-200'
            : 'bg-[#0A1128]/95 border-t border-[#1E2B4D]'
        }`}
      >
        {navLinks.map((link) => {
          const isActive = pathname === link.href;
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-col items-center justify-center px-3 py-1.5 rounded-xl transition-colors ${
                isChildAccount
                  ? isActive
                    ? 'text-sky-700 bg-sky-100 font-bold'
                    : 'text-slate-600 hover:text-sky-700'
                  : isActive
                  ? 'nav-bottom-link-active'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-xs mt-1 tracking-tight truncate max-w-[110px] text-center">
                {link.label}
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
