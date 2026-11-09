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

  // Formulario Invitación & Unirme
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('COLLABORATOR');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joinLoading, setJoinLoading] = useState(false);
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

  // Estados Gastos Compartidos (Splitwise)
  const [splitSummary, setSplitSummary] = useState<any>(null);
  const [splitLoading, setSplitLoading] = useState(false);
  const [settling, setSettling] = useState(false);

  // Estados Misiones Familiares & Gamificación
  const [missions, setMissions] = useState<any[]>([]);
  const [savingsMatching, setSavingsMatching] = useState<any>({ matchPercentage: 50, maxMonthlyBonus: 50, active: true, totalMatchedThisMonth: 15.0 });
  const [showMissionModal, setShowMissionModal] = useState(false);
  const [showApproveMissionModal, setShowApproveMissionModal] = useState(false);
  const [selectedMission, setSelectedMission] = useState<any>(null);
  const [missionMemberId, setMissionMemberId] = useState('');
  const [missionTitle, setMissionTitle] = useState('');
  const [missionAmount, setMissionAmount] = useState('5.00');
  const [missionDesc, setMissionDesc] = useState('');
  const [missionPayAccountId, setMissionPayAccountId] = useState('');

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

  const fetchSplitSummary = async () => {
    const token = getToken();
    if (!token) return;
    setSplitLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/household/split-summary`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setSplitSummary(await res.json());
      }
    } catch (e) {
      console.log('Error cargando balance compartido:', e);
    } finally {
      setSplitLoading(false);
    }
  };

  const handleSettleSplit = async (fromUserId: string, toUserId: string, amount: number) => {
    if (!confirm(`¿Confirmas saldar el balance de $${amount.toFixed(2)}? Se registrará como liquidado entre ambos integrantes.`)) return;
    const token = getToken();
    setSettling(true);
    try {
      const res = await fetch(`${API_URL}/api/household/split-settle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ fromUserId, toUserId, amount }),
      });
      if (res.ok) {
        alert('¡Cuentas saldadas exitosamente!');
        fetchSplitSummary();
        fetchActivity();
      } else {
        const err = await res.json();
        alert(err.message || 'Error al saldar la cuenta.');
      }
    } catch (e) {
      console.error('Error saldando cuentas:', e);
    } finally {
      setSettling(false);
    }
  };

  const fetchMissions = async () => {
    const token = getToken();
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/allowances/missions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setMissions(await res.json());
    } catch (e) {
      console.log('Error cargando misiones:', e);
    }
  };

  const fetchSavingsMatching = async () => {
    const token = getToken();
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/allowances/savings-matching`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setSavingsMatching(await res.json());
    } catch (e) {
      console.log('Error cargando matching:', e);
    }
  };

  const handleCreateMission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!missionTitle.trim() || !missionAmount) return;
    const token = getToken();
    try {
      const res = await fetch(`${API_URL}/api/allowances/missions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          memberId: missionMemberId || (members.length > 0 ? members[0].id : ''),
          title: missionTitle.trim(),
          rewardAmount: parseFloat(missionAmount),
          description: missionDesc.trim() || undefined,
        }),
      });
      if (res.ok) {
        setShowMissionModal(false);
        setMissionTitle('');
        setMissionDesc('');
        setMissionAmount('5.00');
        fetchMissions();
      }
    } catch (e) {
      console.error('Error creando misión:', e);
    }
  };

  const handleCompleteMission = async (id: string) => {
    const token = getToken();
    try {
      const res = await fetch(`${API_URL}/api/allowances/missions/${id}/complete`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        fetchMissions();
        fetchActivity();
        alert('¡Misión marcada como completada! Notificación enviada a los administradores para aprobación.');
      }
    } catch (e) {
      console.error('Error completando misión:', e);
    }
  };

  const handleApproveMission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMission || !missionPayAccountId) return;
    const token = getToken();
    try {
      const res = await fetch(`${API_URL}/api/allowances/missions/${selectedMission.id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ accountId: missionPayAccountId }),
      });
      if (res.ok) {
        setShowApproveMissionModal(false);
        setSelectedMission(null);
        fetchMissions();
        fetchAccounts();
        fetchActivity();
        alert('¡Recompensa aprobada y acreditada con éxito!');
      }
    } catch (e) {
      console.error('Error aprobando misión:', e);
    }
  };

  const handleDeleteMission = async (id: string) => {
    const token = getToken();
    try {
      const res = await fetch(`${API_URL}/api/allowances/missions/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) fetchMissions();
    } catch (e) {
      console.error('Error eliminando misión:', e);
    }
  };

  const handleUpdateMatching = async (matchPercentage: number, maxMonthlyBonus: number, active: boolean) => {
    const token = getToken();
    try {
      const res = await fetch(`${API_URL}/api/allowances/savings-matching`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ matchPercentage, maxMonthlyBonus, active }),
      });
      if (res.ok) setSavingsMatching(await res.json());
    } catch (e) {
      console.error('Error actualizando matching:', e);
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
    fetchSplitSummary();
    fetchMissions();
    fetchSavingsMatching();
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

  const handleJoinByCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;

    setJoinLoading(true);
    setMsg(null);
    const token = getToken();

    try {
      const formattedCode = joinCode.trim().toUpperCase();
      const res = await fetch(`${API_URL}/api/household/join/${formattedCode}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Código de invitación inválido o expirado');
      }

      setMsg({ type: 'success', text: '🎉 ¡Te has unido con éxito al hogar!' });
      setJoinCode('');
      fetchMembers();
      fetchActivity();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message });
    } finally {
      setJoinLoading(false);
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

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar a ${memberName} de este hogar?`)) return;

    const token = getToken();
    try {
      const res = await fetch(`${API_URL}/api/household/members/${memberId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        fetchMembers();
        fetchActivity();
        alert('Integrante eliminado del hogar correctamente.');
      } else {
        const data = await res.json();
        alert(data.message || 'No se pudo eliminar al integrante.');
      }
    } catch (err) {
      console.error('Error al eliminar integrante:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A1128] text-slate-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-3 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A1128] text-slate-100 pb-20 lg:pb-12">
      <Navbar user={currentUser} household={household} />

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Formulario Invitación */}
        <div className="glass-card p-6 border border-[#1E2B4D]">
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
              className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-400"
            />

            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
              className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-emerald-400"
            >
              <option value="COLLABORATOR">Colaborador (Editar)</option>
              <option value="ADMIN">Administrador (Control Total)</option>
              <option value="VIEWER">Espectador (Solo Ver)</option>
              <option value="DEPENDENT">👦 Hijo / Dependiente (Solo su Mesada)</option>
            </select>

            <button
              type="submit"
              disabled={inviteLoading}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-all text-xs font-bold text-white rounded-xl cursor-pointer disabled:opacity-50 shrink-0"
            >
              {inviteLoading ? 'Enviando...' : 'Generar Invitación'}
            </button>
          </form>

          {lastInviteLink && (
            <div className="p-3 mt-4 bg-[#101A36] border border-emerald-500/30 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-emerald-400 uppercase">Enlace Directo de Invitación</span>
                <p className="text-xs text-emerald-200 font-mono font-bold">{lastInviteLink}</p>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(lastInviteLink);
                  alert('¡Enlace copiado al portapapeles! Puedes enviarlo por WhatsApp.');
                }}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer"
              >
                📋 Copiar Link
              </button>
            </div>
          )}

          {/* Formulario Unirme a un Hogar con Código */}
          <div className="pt-6 mt-6 border-t border-slate-800">
            <h3 className="text-sm font-bold text-white mb-1">🔑 ¿Te invitaron a un Hogar? Únete con un Código</h3>
            <p className="text-xs text-slate-400 mb-3">
              Ingresa el código de 6 caracteres que te compartió el administrador (ej: <code className="text-emerald-300 font-mono">HIQ-A7X9</code>).
            </p>
            <form onSubmit={handleJoinByCode} className="flex gap-3 max-w-md">
              <input
                type="text"
                required
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                placeholder="HIQ-XXXXXX"
                className="flex-1 px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-white focus:outline-none focus:border-emerald-400 uppercase"
              />
              <button
                type="submit"
                disabled={joinLoading || !joinCode.trim()}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl cursor-pointer disabled:opacity-50"
              >
                {joinLoading ? 'Uniéndote...' : 'Unirme al Hogar'}
              </button>
            </form>
          </div>
        </div>

        {/* Lista de Miembros */}
        <div className="space-y-4">
          <h3 className="text-base font-bold text-white">Miembros Activos ({members.length})</h3>

          <div className="space-y-3">
            {members.map((m) => (
              <div key={m.id} className="glass-card p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-slate-800/40 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-[#1E2B4D] flex items-center justify-center font-bold text-emerald-300">
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
                      className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-emerald-400"
                    >
                      <option value="ADMIN">ADMIN</option>
                      <option value="COLLABORATOR">COLLABORATOR</option>
                      <option value="VIEWER">VIEWER</option>
                      <option value="DEPENDENT">DEPENDENT</option>
                    </select>
                  ) : (
                    <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${m.role === 'ADMIN' ? 'bg-emerald-500/15 text-emerald-300 border border-[#1E2B4D]' : m.role === 'DEPENDENT' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>
                      {m.role === 'DEPENDENT' ? '👦 DEPENDIENTE' : m.role}
                    </span>
                  )}

                  {household?.role === 'ADMIN' && m.userId !== currentUser?.id && (
                    <button
                      onClick={() => handleRemoveMember(m.id, m.fullName || m.email)}
                      className="p-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 border border-rose-500/30 text-xs font-bold transition-all cursor-pointer"
                      title="Eliminar Integrante del Hogar"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 🤝 GASTOS COMPARTIDOS EN PAREJA / HOGAR (SPLIT 50/50) */}
        <section className="glass-card p-6 border border-[#1E2B4D] space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl">🤝</span>
                <h3 className="text-lg font-bold text-white">Gastos Compartidos en Pareja / Hogar (Split 50/50)</h3>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                División transparente y automática estilo Splitwise para gastos comunes del mes en curso.
              </p>
            </div>
            <button
              onClick={fetchSplitSummary}
              disabled={splitLoading}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 border border-slate-700 flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
            >
              <span>{splitLoading ? '🔄 Calculando...' : '🔄 Actualizar Balance'}</span>
            </button>
          </div>

          {/* KPI Strip de División */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-xl bg-[#0A1128] border border-[#1E2B4D]">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Gastado en Común</span>
              <p className="text-2xl font-bold text-white mt-1 tabular-nums">
                ${Number(splitSummary?.totalShared || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <span className="text-[11px] text-slate-500">{splitSummary?.sharedTransactions?.length || 0} compras compartidas este mes</span>
            </div>

            <div className="p-4 rounded-xl bg-[#0A1128] border border-[#1E2B4D]">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cuota Justa por Adulto</span>
              <p className="text-2xl font-bold text-emerald-400 mt-1 tabular-nums">
                ${Number(splitSummary?.fairSharePerAdult || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <span className="text-[11px] text-slate-500">Dividido entre {splitSummary?.adultsCount || 1} integrante(s) adultos</span>
            </div>

            <div className="p-4 rounded-xl bg-[#0A1128] border border-[#1E2B4D]">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tu Balance Personal</span>
              {(() => {
                const myBal = splitSummary?.memberBalances?.find((b: any) => b.userId === currentUser?.id);
                const net = myBal ? myBal.netBalance : 0;
                if (net > 0.01) {
                  return (
                    <>
                      <p className="text-2xl font-bold text-emerald-400 mt-1 tabular-nums">+${net.toFixed(2)}</p>
                      <span className="text-[11px] text-emerald-300/80 font-medium">Te deben dinero 🎉</span>
                    </>
                  );
                } else if (net < -0.01) {
                  return (
                    <>
                      <p className="text-2xl font-bold text-rose-400 mt-1 tabular-nums">-${Math.abs(net).toFixed(2)}</p>
                      <span className="text-[11px] text-rose-300/80 font-medium">Debes transferir al hogar</span>
                    </>
                  );
                } else {
                  return (
                    <>
                      <p className="text-2xl font-bold text-slate-300 mt-1 tabular-nums">$0.00</p>
                      <span className="text-[11px] text-slate-400">Estás al día (cuentas claras) 👌</span>
                    </>
                  );
                }
              })()}
            </div>
          </div>

          {/* Liquidaciones / Quién le debe a Quién */}
          {splitSummary?.settlements && splitSummary.settlements.length > 0 ? (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-3">
              <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
                <span>⚡ Liquidaciones Pendientes para estar a mano:</span>
              </div>
              <div className="space-y-2">
                {splitSummary.settlements.map((s: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-900/90 border border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-rose-300">{s.fromName}</span>
                      <span className="text-slate-400">le debe</span>
                      <span className="text-emerald-300 font-bold tabular-nums">${Number(s.amount).toFixed(2)}</span>
                      <span className="text-slate-400">a</span>
                      <span className="font-semibold text-emerald-300">{s.toName}</span>
                    </div>

                    <button
                      onClick={() => handleSettleSplit(s.fromUserId, s.toUserId, s.amount)}
                      disabled={settling}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer shadow-sm transition-all shrink-0 self-end sm:self-auto"
                    >
                      {settling ? 'Procesando...' : '✓ Marcar como Saldado'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center gap-2">
              <span>✓ ¡Cuentas totalmente equilibradas! Ningún integrante adulto debe dinero en este momento.</span>
            </div>
          )}

          {/* Desglose de aportes de cada adulto */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Aportes individuales este mes</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {splitSummary?.memberBalances?.map((mb: any) => (
                <div key={mb.memberId} className="p-3.5 rounded-xl bg-[#0A1128] border border-[#1E2B4D] flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-300 font-bold flex items-center justify-center text-xs">
                      {mb.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">{mb.name}</p>
                      <p className="text-[11px] text-slate-400">Pagó: ${Number(mb.paidTotal).toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs font-extrabold tabular-nums ${mb.netBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {mb.formattedBalance}
                    </span>
                    <p className="text-[10px] text-slate-500">
                      {mb.netBalance >= 0 ? 'a favor' : 'por aportar'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Últimos Gastos Compartidos Registrados */}
          {splitSummary?.sharedTransactions && splitSummary.sharedTransactions.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-[#1E2B4D]">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Últimos Gastos Compartidos</h4>
                <span className="text-[11px] text-slate-500 font-medium">Marcados con 🤝 50/50</span>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {splitSummary.sharedTransactions.map((tx: any) => (
                  <div key={tx.id} className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium">{tx.description}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                          {tx.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Pagado por <strong className="text-slate-200">{tx.memberName}</strong> ({tx.accountName}) • {new Date(tx.date).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="text-rose-400 font-bold tabular-nums text-sm shrink-0">
                      -${Number(tx.amount).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Banner explicativo rápido */}
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2">
            <span className="text-base shrink-0">💡</span>
            <span>
              <strong>¿Cómo funciona?</strong> Al registrar cualquier gasto en el Dashboard (o vía el botón rápido), activa la casilla <em>"🤝 Gasto Común en Pareja / Hogar (50/50)"</em>. El sistema divide equitativamente los montos entre los integrantes adultos y calcula quién le debe a quién automáticamente.
            </span>
          </div>
        </section>

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
                    <span className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-emerald-400">
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
        <section className="glass-card p-6 border border-[#1E2B4D] space-y-6">
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
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-all text-xs font-bold text-white cursor-pointer shadow-md"
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
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400">
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
                        <span className="text-slate-400">Límite: <strong className="text-emerald-300">${Number(a.limitAmount).toFixed(2)}</strong></span>
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
                        className="flex-1 py-2 px-3 rounded-xl bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-200 text-xs font-bold cursor-pointer border border-emerald-500/30 transition-colors"
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

        {/* 🏆 3. MISIONES FAMILIARES & GAMIFICACIÓN DE TAREAS (AHORRO CON PROPÓSITO) */}
        <section className="glass-card p-6 border border-[#1E2B4D] space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl">🏆</span>
                <h3 className="text-lg font-bold text-white">Misiones Familiares & Tareas Remuneradas</h3>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Gamificación financiera: Asigna misiones y recompensas a tus hijos para cultivar hábitos de esfuerzo, ahorro y responsabilidad.
              </p>
            </div>
            <button
              onClick={() => {
                if (members.length > 0 && !missionMemberId) setMissionMemberId(members[0].id);
                setShowMissionModal(true);
              }}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-emerald-600 hover:from-amber-400 hover:to-emerald-500 text-white font-bold text-xs cursor-pointer shadow-md self-start sm:self-auto transition-all"
            >
              + Nueva Misión
            </button>
          </div>

          {/* Grid de Misiones */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {missions.length === 0 ? (
              <div className="col-span-3 text-center py-6 border border-dashed border-slate-800 rounded-xl">
                <p className="text-xs text-slate-400">No hay misiones asignadas actualmente.</p>
              </div>
            ) : (
              missions.map((m) => {
                const isPaid = m.status === 'APPROVED_AND_PAID';
                const isDone = m.status === 'COMPLETED';

                return (
                  <div
                    key={m.id}
                    className={`p-4 rounded-2xl border space-y-3 transition-all relative overflow-hidden ${
                      isPaid
                        ? 'bg-slate-900/60 border-emerald-500/30'
                        : isDone
                        ? 'bg-amber-500/10 border-amber-500/40'
                        : 'bg-slate-900/90 border-[#1E2B4D]'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                        👤 {m.memberName}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                            isPaid
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : isDone
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                              : 'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}
                        >
                          {isPaid ? '✓ Pagada' : isDone ? '⚡ Por Aprobar' : '⏳ Pendiente'}
                        </span>
                        <button
                          onClick={() => handleDeleteMission(m.id)}
                          className="text-slate-500 hover:text-rose-400 text-xs p-0.5"
                          title="Eliminar misión"
                        >
                          ✕
                        </button>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-white leading-snug">{m.title}</h4>
                      {m.description && (
                        <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{m.description}</p>
                      )}
                    </div>

                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase">Recompensa</span>
                        <p className="text-lg font-bold text-amber-400 tabular-nums">+${m.rewardAmount.toFixed(2)}</p>
                      </div>

                      <div>
                        {m.status === 'PENDING' && (
                          <button
                            onClick={() => handleCompleteMission(m.id)}
                            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-emerald-300 border border-emerald-500/30 cursor-pointer transition-colors"
                          >
                            ✓ Hecha
                          </button>
                        )}

                        {m.status === 'COMPLETED' && (
                          <button
                            onClick={() => {
                              setSelectedMission(m);
                              if (accounts.length > 0 && !missionPayAccountId) setMissionPayAccountId(accounts[0].id);
                              setShowApproveMissionModal(true);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer shadow-md transition-all"
                          >
                            💵 Pagar
                          </button>
                        )}

                        {m.status === 'APPROVED_AND_PAID' && (
                          <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                            <span>✓ Acreditada</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Tarjeta de Matching de Ahorro para Hijos */}
          <div className="p-4 rounded-2xl bg-[#0A1128] border border-[#1E2B4D] space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="text-lg">💡</span>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-white">
                    Matching de Ahorro Educativo ("Premio al Ahorro")
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Incentiva a tus hijos: Por cada \$1 que ahorren en sus metas, el hogar bonifica un porcentaje adicional.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleUpdateMatching(25, savingsMatching.maxMonthlyBonus, true)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${savingsMatching.matchPercentage === 25 ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300'}`}
                >
                  +25%
                </button>
                <button
                  onClick={() => handleUpdateMatching(50, savingsMatching.maxMonthlyBonus, true)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${savingsMatching.matchPercentage === 50 ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300'}`}
                >
                  +50%
                </button>
                <button
                  onClick={() => handleUpdateMatching(100, savingsMatching.maxMonthlyBonus, true)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${savingsMatching.matchPercentage === 100 ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300'}`}
                >
                  +100% (Duplicar)
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-800/80 text-xs">
              <span className="text-slate-400">
                Regla activa: <strong>+{savingsMatching.matchPercentage}% de aporte adicional</strong> (Tope máx: \${savingsMatching.maxMonthlyBonus}/mes).
              </span>
              <span className="text-emerald-400 font-bold">
                Total bonificado este mes: \${Number(savingsMatching.totalMatchedThisMonth || 0).toFixed(2)}
              </span>
            </div>
          </div>
        </section>

        {/* Modal Crear Misión Familiar */}
        {showMissionModal && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="glass-card w-full max-w-md p-6 relative border border-amber-500/30">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>🏆 Asignar Misión o Tarea Remunerada</span>
                </h3>
                <button onClick={() => setShowMissionModal(false)} className="text-slate-400 hover:text-white cursor-pointer text-xl">✕</button>
              </div>

              <form onSubmit={handleCreateMission} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Familiar Asignado</label>
                  <select
                    value={missionMemberId}
                    onChange={(e) => setMissionMemberId(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-400"
                  >
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.fullName} ({m.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Título de la Misión</label>
                  <input
                    type="text"
                    required
                    value={missionTitle}
                    onChange={(e) => setMissionTitle(e.target.value)}
                    placeholder="ej. Lavar el coche familiar"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Descripción / Criterio de Éxito</label>
                  <input
                    type="text"
                    value={missionDesc}
                    onChange={(e) => setMissionDesc(e.target.value)}
                    placeholder="ej. Limpiar interior, tapetes y vidrios"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Recompensa ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.50"
                    required
                    value={missionAmount}
                    onChange={(e) => setMissionAmount(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-base font-bold text-white tabular-nums focus:outline-none focus:border-emerald-400"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowMissionModal(false)}
                    className="flex-1 py-2.5 rounded-xl bg-slate-800 text-xs font-bold text-slate-300"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-emerald-600 hover:from-amber-400 hover:to-emerald-500 text-white font-bold text-xs rounded-xl"
                  >
                    Guardar Misión
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Aprobar y Pagar Misión */}
        {showApproveMissionModal && selectedMission && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="glass-card w-full max-w-md p-6 relative border border-emerald-500/40">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>💵 Aprobar & Pagar Recompensa</span>
                </h3>
                <button onClick={() => setShowApproveMissionModal(false)} className="text-slate-400 hover:text-white cursor-pointer text-xl">✕</button>
              </div>

              <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 mb-4 text-xs space-y-1">
                <p className="text-slate-400">Misión completada por: <strong className="text-white">{selectedMission.memberName}</strong></p>
                <p className="text-slate-200 font-bold">"{selectedMission.title}"</p>
                <p className="text-amber-400 font-extrabold text-sm pt-1">Recompensa: ${selectedMission.rewardAmount.toFixed(2)}</p>
              </div>

              <form onSubmit={handleApproveMission} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                    ¿Desde cuál cuenta transferir la recompensa?
                  </label>
                  <select
                    value={missionPayAccountId}
                    onChange={(e) => setMissionPayAccountId(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500 font-semibold"
                  >
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} ({acc.type}) - Saldo: ${Number(acc.balance).toLocaleString()}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowApproveMissionModal(false)}
                    className="flex-1 py-2.5 rounded-xl bg-slate-800 text-xs font-bold text-slate-300"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-xs font-bold text-white rounded-xl cursor-pointer shadow-md"
                  >
                    ✓ Acreditar ${selectedMission.rewardAmount.toFixed(2)}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Crear Mesada */}
        {showAllowModal && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="glass-card w-full max-w-md p-6 relative border border-emerald-500/30">
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
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-emerald-400"
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
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-400"
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
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-base font-bold text-white focus:outline-none focus:border-emerald-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Frecuencia</label>
                    <select
                      value={allowPeriod}
                      onChange={(e) => setAllowPeriod(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-400"
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
                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-all text-xs font-bold text-white rounded-xl"
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
            <div className="glass-card w-full max-w-md p-6 relative border border-emerald-500/30">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">📉 Registrar Gasto en Mesada</h3>
                <button onClick={() => setShowExpenseModal(false)} className="text-slate-400 hover:text-white cursor-pointer text-xl">✕</button>
              </div>

              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 mb-4 text-xs">
                <p className="text-slate-400">Mesada de: <strong className="text-white">{selectedAllowance.member?.user?.fullName}</strong></p>
                <p className="text-emerald-300 font-bold mt-0.5">{selectedAllowance.title}</p>
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
                    className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white font-bold text-lg focus:outline-none focus:border-emerald-400"
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
