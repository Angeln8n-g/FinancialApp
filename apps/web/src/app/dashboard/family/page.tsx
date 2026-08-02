'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

export default function FamilyPage() {
  const router = useRouter();

  const [members, setMembers] = useState<any[]>([]);
  const [allowances, setAllowances] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [household, setHousehold] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Formulario Invitación
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('COLLABORATOR');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Formulario Crear Mesada
  const [showAllowModal, setShowAllowModal] = useState(false);
  const [allowMemberId, setAllowMemberId] = useState('');
  const [allowTitle, setAllowTitle] = useState('Mesada Mensual');
  const [allowAmount, setAllowAmount] = useState('150');
  const [allowPeriod, setAllowPeriod] = useState('MONTHLY');

  // Formulario Registrar Gasto en Mesada
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [selectedAllowance, setSelectedAllowance] = useState<any>(null);
  const [expenseAmount, setExpenseAmount] = useState('');

  // Formulario Desembolsar Mesada desde Cuenta
  const [showDisburseModal, setShowDisburseModal] = useState(false);
  const [disburseAccountId, setDisburseAccountId] = useState('');
  const [disburseAmount, setDisburseAmount] = useState('');

  // Estados Actividad & Invitaciones por Link
  const [activities, setActivities] = useState<any[]>([]);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [allowanceRequests, setAllowanceRequests] = useState<any[]>([]);
  const [lastInviteLink, setLastInviteLink] = useState('');

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

  const fetchActivity = async () => {
    const token = getToken();
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/household/activity`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setActivities(await res.json());
    } catch (e) {
      console.log('Error cargando actividad:', e);
    }
  };

  const fetchInvitations = async () => {
    const token = getToken();
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/household/invitations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setInvitations(await res.json());
    } catch (e) {
      console.log('Error cargando invitaciones:', e);
    }
  };

  const fetchAllowanceRequests = async () => {
    const token = getToken();
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/allowances/requests`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setAllowanceRequests(await res.json());
    } catch (e) {
      console.log('Error cargando solicitudes:', e);
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

  const fetchAccounts = async () => {
    const token = getToken();
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/accounts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const accs = await res.json();
        setAccounts(accs);
        if (accs.length > 0 && !disburseAccountId) setDisburseAccountId(accs[0].id);
      }
    } catch (e) {
      console.log('Error cargando cuentas:', e);
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
    fetchAccounts();
    fetchActivity();
    fetchInvitations();
    fetchAllowanceRequests();
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
          period: allowPeriod,
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

  const handleRecordExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAllowance || !expenseAmount) return;
    const token = getToken();
    try {
      const res = await fetch(`${API_URL}/api/allowances/${selectedAllowance.id}/expense`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ amount: parseFloat(expenseAmount) }),
      });
      if (res.ok) {
        setShowExpenseModal(false);
        setExpenseAmount('');
        setSelectedAllowance(null);
        fetchAllowances();
      }
    } catch (err) {
      console.error('Error registrando gasto de mesada:', err);
    }
  };

  const handleDisburseAllowance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAllowance || !disburseAccountId) return;
    const token = getToken();
    try {
      const res = await fetch(`${API_URL}/api/allowances/${selectedAllowance.id}/disburse`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          accountId: disburseAccountId,
          amount: parseFloat(disburseAmount || selectedAllowance.limitAmount.toString()),
        }),
      });
      if (res.ok) {
        setShowDisburseModal(false);
        setDisburseAmount('');
        setSelectedAllowance(null);
        fetchAllowances();
        fetchAccounts();
        alert('¡Desembolso registrado con éxito en la cuenta!');
      }
    } catch (err) {
      console.error('Error al desembolsar mesada:', err);
    }
  };

  const handleResetAllowance = async (id: string) => {
    const token = getToken();
    try {
      const res = await fetch(`${API_URL}/api/allowances/${id}/reset`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) fetchAllowances();
    } catch (err) {
      console.error('Error reiniciando mesada:', err);
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

      setMsg({ type: 'success', text: `¡Invitación enviada a ${inviteEmail}! Código: ${data.invitationCode}` });
      if (data.inviteLink) {
        setLastInviteLink(data.inviteLink);
      }
      setInviteEmail('');
      fetchMembers();
      fetchInvitations();
      fetchActivity();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message });
    } finally {
      setInviteLoading(false);
    }
  };

  const handleRespondRequest = async (requestId: string, status: 'APPROVED' | 'REJECTED') => {
    const token = getToken();
    try {
      const res = await fetch(`${API_URL}/api/allowances/requests/${requestId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        fetchAllowanceRequests();
        fetchAllowances();
        fetchActivity();
      }
    } catch (e) {
      console.error('Error respondiendo solicitud:', e);
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
        fetchActivity();
      }
    } catch (err) {
      console.error('Error al cambiar rol:', err);
    }
  };

  const handleChangeCustomTitle = async (memberId: string, customTitle: string) => {
    const token = getToken();
    try {
      const res = await fetch(`${API_URL}/api/household/members/${memberId}/title`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ customTitle }),
      });
      if (res.ok) {
        fetchMembers();
        fetchActivity();
      }
    } catch (err) {
      console.error('Error al cambiar título personalizado:', err);
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
              <option value="DEPENDENT">👦 Hijo / Dependiente (Solo su Mesada)</option>
            </select>

            <button
              type="submit"
              disabled={inviteLoading}
              className="px-5 py-2.5 glow-button text-xs font-bold text-white rounded-xl cursor-pointer disabled:opacity-50 shrink-0"
            >
              {inviteLoading ? 'Enviando...' : 'Generar Invitación'}
            </button>
          </form>

          {lastInviteLink && (
            <div className="p-3 bg-purple-950/40 border border-purple-500/40 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-purple-400 uppercase">Enlace Directo de Invitación</span>
                <p className="text-xs text-purple-200 font-mono font-bold">{lastInviteLink}</p>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(lastInviteLink);
                  alert('¡Enlace copiado al portapapeles! Puedes enviarlo por WhatsApp.');
                }}
                className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs cursor-pointer"
              >
                📋 Copiar Link
              </button>
            </div>
          )}
        </div>

        {/* Lista de Miembros */}
        <div className="space-y-4">
          <h3 className="text-base font-bold text-white">Miembros Activos ({members.length})</h3>

          <div className="space-y-3">
            {members.map((m) => (
              <div key={m.id} className="glass-card p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-slate-800/40 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center font-bold text-purple-300">
                    {m.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-white">{m.fullName}</p>
                      {m.customTitle && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          {m.customTitle}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400">{m.email}</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Selector Título Personalizado */}
                  <select
                    value={m.customTitle || ''}
                    onChange={(e) => handleChangeCustomTitle(m.id, e.target.value)}
                    className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-amber-300 font-bold focus:outline-none focus:border-amber-500"
                  >
                    <option value="">+ Título Personalizado</option>
                    <option value="👑 Esposa (Jefa de Finanzas)">👑 Esposa (Jefa de Finanzas)</option>
                    <option value="👨‍💼 Esposo (Co-Administrador)">👨‍💼 Esposo (Co-Administrador)</option>
                    <option value="👦 Hijo/a (Estudiante)">👦 Hijo/a (Estudiante)</option>
                    <option value="👨‍👩‍👧 Integrante del Hogar">👨‍👩‍👧 Integrante del Hogar</option>
                  </select>

                  {household?.role === 'ADMIN' && m.userId !== currentUser?.id ? (
                    <select
                      value={m.role}
                      onChange={(e) => handleChangeRole(m.id, e.target.value)}
                      className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                    >
                      <option value="ADMIN">ADMIN</option>
                      <option value="COLLABORATOR">COLLABORATOR</option>
                      <option value="VIEWER">VIEWER</option>
                      <option value="DEPENDENT">DEPENDENT</option>
                    </select>
                  ) : (
                    <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${m.role === 'ADMIN' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : m.role === 'DEPENDENT' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>
                      {m.role === 'DEPENDENT' ? '👦 DEPENDIENTE' : m.role}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 📜 Historial de Actividad Reciente del Hogar */}
        <div className="glass-card p-6 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              📜 Feed de Actividad Reciente ("Quién Hizo Qué")
            </h3>
            <span className="text-xs text-slate-400">{activities.length} registros</span>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {activities.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No hay actividad reciente registrada.</p>
            ) : (
              activities.map((act) => (
                <div key={act.id} className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-3">
                    <span className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-purple-400">
                      {act.userName.charAt(0).toUpperCase()}
                    </span>
                    <div>
                      <p className="text-slate-200 font-semibold">
                        <strong className="text-white">{act.userName}</strong>: {act.details}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 💸 2. CONTROL DE MESADAS & PRESUPUESTOS FAMILIARES */}
        <section className="glass-card p-6 border border-purple-500/30 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white">💸 Mesadas & Presupuestos para Integrantes</h3>
              <p className="text-xs text-slate-400">Asigna presupuestos periódicos a tus hijos o familiares dependientes con seguimiento de consumo.</p>
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
              allowances.map((a) => {
                const pct = a.percentageUsed || 0;
                const barColor = pct >= 90 ? 'bg-rose-500' : pct >= 70 ? 'bg-amber-500' : 'bg-emerald-500';
                const badgeColor = pct >= 90 ? 'text-rose-400 bg-rose-500/10 border-rose-500/30' : pct >= 70 ? 'text-amber-400 bg-amber-500/10 border-amber-500/30' : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';

                return (
                  <div key={a.id} className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-400">
                          👤 {a.member?.user?.fullName || 'Familiar'}
                        </span>
                        <h4 className="text-base font-bold text-white mt-0.5">{a.title}</h4>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeColor}`}>
                          {a.period === 'WEEKLY' ? 'Semanal' : 'Mensual'}
                        </span>
                        <button
                          onClick={() => handleDeleteAllowance(a.id)}
                          className="text-slate-500 hover:text-rose-400 text-xs font-bold cursor-pointer"
                          title="Eliminar Mesada"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>

                    {/* Barra de Progreso */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-400">Gastado: <strong className="text-white">${Number(a.spentAmount).toFixed(2)}</strong></span>
                        <span className="text-slate-400">Límite: <strong className="text-purple-300">${Number(a.limitAmount).toFixed(2)}</strong></span>
                      </div>
                      <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                        <div className={`h-full ${barColor} transition-all duration-500`} style={{ width: `${pct}%` }} />
                      </div>
                      <div className="flex justify-between items-center text-[11px] pt-0.5">
                        <span className={`font-bold ${pct >= 90 ? 'text-rose-400' : 'text-slate-400'}`}>
                          {pct}% consumido {pct >= 100 ? '⚠️ Excedido' : ''}
                        </span>
                        <span className="text-emerald-400 font-extrabold">
                          Disponible: ${Number(a.remainingAmount).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Acciones de Mesada */}
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
                      <button
                        onClick={() => {
                          setSelectedAllowance(a);
                          setExpenseAmount('');
                          setShowExpenseModal(true);
                        }}
                        className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 cursor-pointer border border-slate-700 transition-colors"
                      >
                        📉 Gasto
                      </button>
                      <button
                        onClick={() => {
                          setSelectedAllowance(a);
                          setDisburseAmount(a.limitAmount.toString());
                          setShowDisburseModal(true);
                        }}
                        className="flex-1 py-2 px-3 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 text-xs font-bold cursor-pointer border border-purple-500/40 transition-colors"
                      >
                        💵 Desembolsar
                      </button>
                      <button
                        onClick={() => handleResetAllowance(a.id)}
                        className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs font-bold cursor-pointer border border-slate-700"
                        title="Reiniciar consumo a $0"
                      >
                        🔄
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Modal Crear Mesada */}
        {showAllowModal && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="glass-card w-full max-w-md p-6 relative border border-purple-500/40">
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

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Límite ($)</label>
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
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Frecuencia</label>
                    <select
                      value={allowPeriod}
                      onChange={(e) => setAllowPeriod(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-purple-500"
                    >
                      <option value="MONTHLY">Mensual</option>
                      <option value="WEEKLY">Semanal</option>
                    </select>
                  </div>
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

        {/* Modal Registrar Gasto en Mesada */}
        {showExpenseModal && selectedAllowance && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="glass-card w-full max-w-md p-6 relative border border-purple-500/40">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">📉 Registrar Gasto en Mesada</h3>
                <button onClick={() => setShowExpenseModal(false)} className="text-slate-400 hover:text-white cursor-pointer text-xl">✕</button>
              </div>

              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 mb-4 text-xs">
                <p className="text-slate-400">Mesada de: <strong className="text-white">{selectedAllowance.member?.user?.fullName}</strong></p>
                <p className="text-purple-300 font-bold mt-0.5">{selectedAllowance.title}</p>
              </div>

              <form onSubmit={handleRecordExpense} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Monto consumido ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={expenseAmount}
                    onChange={(e) => setExpenseAmount(e.target.value)}
                    placeholder="Ej. 15.00"
                    className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white font-bold text-lg focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowExpenseModal(false)}
                    className="flex-1 py-2.5 rounded-xl bg-slate-800 text-xs font-bold text-slate-300"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white rounded-xl cursor-pointer"
                  >
                    Imputar Gasto
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Desembolsar Mesada */}
        {showDisburseModal && selectedAllowance && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="glass-card w-full max-w-md p-6 relative border border-emerald-500/40">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">💵 Desembolsar Mesada</h3>
                <button onClick={() => setShowDisburseModal(false)} className="text-slate-400 hover:text-white cursor-pointer text-xl">✕</button>
              </div>

              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 mb-4 text-xs">
                <p className="text-slate-400">Integrante: <strong className="text-white">{selectedAllowance.member?.user?.fullName}</strong></p>
                <p className="text-emerald-400 font-bold mt-0.5">{selectedAllowance.title}</p>
              </div>

              <form onSubmit={handleDisburseAllowance} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">¿Desde cuál cuenta enviar dinero?</label>
                  <select
                    value={disburseAccountId}
                    onChange={(e) => setDisburseAccountId(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500 font-semibold"
                  >
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} ({acc.type}) - Saldo: ${Number(acc.balance).toLocaleString()}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Monto del Desembolso ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={disburseAmount}
                    onChange={(e) => setDisburseAmount(e.target.value)}
                    placeholder="Monto"
                    className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white font-bold text-lg focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowDisburseModal(false)}
                    className="flex-1 py-2.5 rounded-xl bg-slate-800 text-xs font-bold text-slate-300"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-xs font-bold text-white rounded-xl cursor-pointer"
                  >
                    ✓ Transferir Mesada
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
