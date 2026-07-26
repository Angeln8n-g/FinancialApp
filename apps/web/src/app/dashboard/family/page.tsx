'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

export default function FamilyPage() {
  const router = useRouter();

  const [members, setMembers] = useState<any[]>([]);
  const [allowances, setAllowances] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [household, setHousehold] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Formulario Invitación
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('COLLABORATOR');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Formulario Mesada
  const [showAllowModal, setShowAllowModal] = useState(false);
  const [allowMemberId, setAllowMemberId] = useState('');
  const [allowTitle, setAllowTitle] = useState('Mesada Mensual');
  const [allowAmount, setAllowAmount] = useState('150');

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

  const fetchAllowances = async () => {
    const token = getToken();
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/allowances`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setAllowances(await res.json());
      }
    } catch (e) {
      console.log('Error cargando mesadas:', e);
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
    fetchAllowances();
  }, []);

  const handleCreateAllowance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allowMemberId || !allowTitle || !allowAmount) return;
    const token = getToken();
    try {
      const res = await fetch(`${API_URL}/api/allowances`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          memberId: allowMemberId,
          title: allowTitle,
          limitAmount: parseFloat(allowAmount),
        }),
      });
      if (res.ok) {
        setShowAllowModal(false);
        fetchAllowances();
      }
    } catch (err) {
      console.error('Error creando mesada:', err);
    }
  };

  const handleDeleteAllowance = async (id: string) => {
    const token = getToken();
    try {
      const res = await fetch(`${API_URL}/api/allowances/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) fetchAllowances();
    } catch (err) {
      console.error('Error eliminando mesada:', err);
    }
  };

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
    <div className="min-h-screen bg-[#0f172a] text-slate-100 pb-20 lg:pb-12">
      <Navbar user={currentUser} household={household} />

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

        {/* 💸 2. CONTROL DE MESADAS & PRESUPUESTOS FAMILIARES */}
        <section className="glass-card p-6 border border-purple-500/30 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white">💸 Mesadas & Presupuestos para Integrantes</h3>
              <p className="text-xs text-slate-400">Asigna presupuestos mensuales o mesadas a tus hijos o familiares dependientes.</p>
            </div>
            <button
              onClick={() => {
                if (members.length > 0 && !allowMemberId) setAllowMemberId(members[0].id);
                setShowAllowModal(true);
              }}
              className="px-4 py-2 rounded-xl glow-button text-xs font-bold text-white cursor-pointer shadow-md"
            >
              + Asignar Mesada
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {allowances.length === 0 ? (
              <div className="col-span-2 text-center py-6 border border-dashed border-slate-800 rounded-xl">
                <p className="text-xs text-slate-400">No hay mesadas ni límites asignados aún.</p>
              </div>
            ) : (
              allowances.map((a) => (
                <div key={a.id} className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">
                      {a.member?.user?.fullName || 'Familiar'}
                    </span>
                    <h4 className="text-sm font-bold text-white mt-0.5">{a.title}</h4>
                    <p className="text-xs text-slate-400 mt-1">
                      Límite: <span className="font-bold text-slate-200">${Number(a.limitAmount).toFixed(2)}</span> / mes
                    </p>
                  </div>

                  <button
                    onClick={() => handleDeleteAllowance(a.id)}
                    className="p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                    title="Eliminar Mesada"
                  >
                    🗑️
                  </button>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Modal Crear Mesada */}
        {showAllowModal && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="glass-card w-full max-w-md p-6 relative">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">Asignar Mesada Familiar</h3>
                <button onClick={() => setShowAllowModal(false)} className="text-slate-400 hover:text-white cursor-pointer text-xl">✕</button>
              </div>

              <form onSubmit={handleCreateAllowance} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Familiar / Integrante</label>
                  <select
                    value={allowMemberId}
                    onChange={(e) => setAllowMemberId(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-purple-500"
                  >
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.fullName} ({m.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Título de la Mesada</label>
                  <input
                    type="text"
                    required
                    value={allowTitle}
                    onChange={(e) => setAllowTitle(e.target.value)}
                    placeholder="Ej. Mesada Universidad / Colegio"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Límite Mensual ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={allowAmount}
                    onChange={(e) => setAllowAmount(e.target.value)}
                    placeholder="150.00"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-base font-bold text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAllowModal(false)}
                    className="flex-1 py-2.5 rounded-xl bg-slate-800 text-xs font-bold text-slate-300"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 glow-button text-xs font-bold text-white rounded-xl"
                  >
                    Guardar Mesada
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
