'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function FamilyPage() {
  const router = useRouter();

  const [members, setMembers] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [household, setHousehold] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Formulario Invitación
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('COLLABORATOR');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  const getToken = () => localStorage.getItem('hogariq_token');

  const fetchMembers = async () => {
    const token = getToken();
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/household/members`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setMembers(data);
      }
    } catch (err) {
      console.error('Error cargando miembros:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const uStr = localStorage.getItem('hogariq_user');
    const hStr = localStorage.getItem('hogariq_household');

    if (!uStr || !getToken()) {
      router.push('/login');
      return;
    }

    setCurrentUser(JSON.parse(uStr));
    if (hStr) setHousehold(JSON.parse(hStr));

    fetchMembers();
  }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;

    setInviteLoading(true);
    setMsg(null);
    const token = getToken();

    try {
      const res = await fetch(`${API_URL}/api/household/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Error al invitar al familiar');
      }

      setMsg({ type: 'success', text: `¡Invitación enviada a ${inviteEmail}!` });
      setInviteEmail('');
      fetchMembers();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message });
    } finally {
      setInviteLoading(false);
    }
  };

  const handleChangeRole = async (memberId: string, newRole: string) => {
    const token = getToken();
    try {
      const res = await fetch(`${API_URL}/api/household/members/${memberId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (res.ok) {
        fetchMembers();
      }
    } catch (err) {
      console.error('Error cambiando rol:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] text-slate-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 pb-12">
      {/* Header Bar */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard" className="text-slate-400 hover:text-white transition-colors text-sm font-semibold">
              ← Volver al Dashboard
            </Link>
            <div className="h-4 w-px bg-slate-800" />
            <h1 className="text-lg font-bold text-white leading-tight">Integrantes del Hogar</h1>
          </div>

          <span className="text-xs text-purple-400 font-bold bg-purple-600/20 border border-purple-500/30 px-3 py-1 rounded-full">
            {household?.name}
          </span>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Formulario Invitación */}
        <div className="glass-card p-6 border border-purple-500/30">
          <h2 className="text-lg font-bold text-white mb-2">Invitar a un nuevo Integrante</h2>
          <p className="text-xs text-slate-400 mb-6">
            Agrega parejas, hijos o colaboradores a las finanzas familiares con permisos específicos.
          </p>

          {msg && (
            <div className={`mb-4 p-3 rounded-xl text-xs font-semibold ${msg.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'}`}>
              {msg.text}
            </div>
          )}

          <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              required
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="familiar@ejemplo.com"
              className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-purple-500"
            />

            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
              className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-purple-500"
            >
              <option value="COLLABORATOR">Colaborador (Editar)</option>
              <option value="ADMIN">Administrador (Control Total)</option>
              <option value="VIEWER">Espectador (Solo Ver)</option>
            </select>

            <button
              type="submit"
              disabled={inviteLoading}
              className="px-5 py-2.5 glow-button text-xs font-bold text-white rounded-xl cursor-pointer disabled:opacity-50 shrink-0"
            >
              {inviteLoading ? 'Enviando...' : 'Enviar Invitación'}
            </button>
          </form>
        </div>

        {/* Lista de Miembros */}
        <div className="space-y-4">
          <h3 className="text-base font-bold text-white">Miembros Activos ({members.length})</h3>

          <div className="space-y-3">
            {members.map((m) => (
              <div key={m.id} className="glass-card p-4 flex items-center justify-between hover:bg-slate-800/40 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center font-bold text-purple-300">
                    {m.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{m.fullName}</p>
                    <p className="text-xs text-slate-400">{m.email}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  {household?.role === 'ADMIN' && m.userId !== currentUser?.id ? (
                    <select
                      value={m.role}
                      onChange={(e) => handleChangeRole(m.id, e.target.value)}
                      className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                    >
                      <option value="ADMIN">ADMIN</option>
                      <option value="COLLABORATOR">COLLABORATOR</option>
                      <option value="VIEWER">VIEWER</option>
                    </select>
                  ) : (
                    <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${m.role === 'ADMIN' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>
                      {m.role}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
