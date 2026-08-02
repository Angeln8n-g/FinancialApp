'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Logo from './Logo';

interface NavbarProps {
  user?: any;
  household?: any;
  unreadNotifications?: number;
  onOpenChat?: () => void;
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
    const interval = setInterval(fetchNotifs, 15000); // Polling suave cada 15s
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
        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs transition-colors cursor-pointer relative"
        title="Notificaciones"
      >
        🔔
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 glass-card p-4 border border-purple-500/40 shadow-2xl z-50 rounded-2xl bg-slate-900/95 backdrop-blur-xl">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              🔔 Notificaciones del Hogar ({notifications.length})
            </span>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-[10px] font-bold text-purple-400 hover:underline cursor-pointer"
              >
                Marcar leídas
              </button>
            )}
          </div>

          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {notifications.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-4">No hay notificaciones sin leer.</p>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-3 rounded-xl border text-xs transition-colors ${
                    n.isRead ? 'bg-slate-900/50 border-slate-800 opacity-60' : 'bg-purple-950/30 border-purple-500/30 font-semibold'
                  }`}
                >
                  <p className="font-bold text-white text-xs">{n.title}</p>
                  <p className="text-slate-300 text-[11px] mt-0.5">{n.body}</p>
                  <span className="text-[9px] text-slate-500 mt-1 block">
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
      <span className="hidden xl:inline-block px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-[11px] text-purple-300 font-bold">
        🏠 {currentHousehold?.name || 'Hogar'}
      </span>
    );
  }

  return (
    <select
      value={currentHousehold?.id || ''}
      onChange={(e) => handleSwitchHousehold(e.target.value)}
      className="hidden xl:inline-block px-2.5 py-1 rounded-xl bg-purple-950/60 border border-purple-500/40 text-[11px] text-purple-200 font-bold focus:outline-none cursor-pointer"
    >
      {availableHouseholds.map((h) => (
        <option key={h.id} value={h.id} className="bg-slate-900 text-white">
          🏠 {h.name} ({h.role})
        </option>
      ))}
    </select>
  );
}

export default function Navbar({
  user,
  household,
  unreadNotifications = 0,
  onOpenChat,
}: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: '🏠' },
    { href: '/dashboard/calendar', label: 'Calendario', icon: '📅' },
    { href: '/dashboard/budgets', label: 'Presupuestos', icon: '🎯' },
    { href: '/dashboard/commitments', label: 'Deudas & Suscripciones', icon: '💸' },
    { href: '/dashboard/patrimony', label: 'Patrimonio', icon: '💎' },
    { href: '/dashboard/family', label: 'Familia', icon: '👨‍👩‍👧‍👦' },
    { href: '/dashboard/reports', label: 'Reportes', icon: '📊' },
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
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-4 lg:space-x-6">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <Logo size="md" showText={true} />
              <HouseholdSelector currentHousehold={household} />
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center space-x-1 border-l border-slate-800 pl-4">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center space-x-1.5 ${
                      isActive
                        ? 'bg-purple-600/20 text-purple-300 border border-purple-500/40 shadow-sm'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <span>{link.icon}</span>
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Action Icons & Controls */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Notification Bell Button */}
            <NotificationBell />

            {/* AI Assistant Chat Button */}
            {onOpenChat && (
              <button
                onClick={onOpenChat}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-900/40 to-indigo-900/40 hover:from-purple-800/60 hover:to-indigo-800/60 text-purple-300 text-xs font-bold border border-purple-500/30 flex items-center space-x-1.5 cursor-pointer transition-all shadow-sm"
              >
                <span>🤖</span>
                <span className="hidden sm:inline">Chat IA Privado</span>
              </button>
            )}

            {/* User Info (Desktop) */}
            {user && (
              <div className="hidden sm:flex flex-col text-right border-l border-slate-800 pl-3">
                <p className="text-xs font-bold text-slate-200">{user.fullName || user.email}</p>
                <span className="text-[9px] text-purple-400 font-semibold uppercase tracking-wider">
                  {household?.role || 'Miembro'}
                </span>
              </div>
            )}

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-rose-950/40 hover:border-rose-500/50 text-slate-300 hover:text-rose-400 border border-slate-700 text-xs transition-colors cursor-pointer"
              title="Cerrar Sesión"
            >
              🚪
            </button>

            {/* Mobile Hamburger Toggle Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 lg:hidden cursor-pointer"
              aria-label="Abrir Menú Móvil"
            >
              {mobileMenuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu Drawer (Visible when hamburger is clicked) */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-800 bg-slate-900/95 backdrop-blur-xl px-4 py-4 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`p-3 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all ${
                      isActive
                        ? 'bg-purple-600/30 text-purple-300 border border-purple-500/40'
                        : 'bg-slate-800/60 text-slate-300 border border-slate-700/50 hover:bg-slate-800'
                    }`}
                  >
                    <span className="text-base">{link.icon}</span>
                    <span className="truncate">{link.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </header>

      {/* Mobile Fixed Bottom Navigation Bar (Sticky at bottom on small screens) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800/80 px-2 py-2 flex justify-around items-center shadow-2xl">
        {navLinks.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-col items-center justify-center px-2 py-1 rounded-xl transition-all ${
                isActive ? 'text-purple-400 bg-purple-950/50 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="text-lg leading-none">{link.icon}</span>
              <span className="text-[10px] font-semibold mt-1 tracking-tight truncate max-w-[64px] text-center">
                {link.label.split(' ')[0]}
              </span>
            </Link>
          );
        })}
      </div>
    </>
  );
}
