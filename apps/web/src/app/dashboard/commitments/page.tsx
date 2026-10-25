'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { apiFetch, getUser, getHousehold, getToken } from '@/lib/api';
import {
  CreditCard,
  Tv,
  CalendarClock,
  Plus,
  Trash2,
  X,
  Pencil,
  Check,
  AlertTriangle,
  Zap,
  Building2,
  Sparkles,
} from 'lucide-react';

export default function CommitmentsPage() {
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [household, setHousehold] = useState<any>(null);
  const [debts, setDebts] = useState<any[]>([]);
  const [subData, setSubData] = useState<any>({
    totalMonthlyConsumption: 0,
    totalAnnualConsumption: 0,
    subscriptions: [],
  });
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modales
  const [showDebtModal, setShowDebtModal] = useState(false);
  const [showSubModal, setShowSubModal] = useState(false);
  const [showEditSubModal, setShowEditSubModal] = useState(false);
  const [selectedSubForEdit, setSelectedSubForEdit] = useState<any>(null);
  const [showReminderModal, setShowReminderModal] = useState(false);

  // Form Deuda
  const [dName, setDName] = useState('');
  const [dTotalAmount, setDTotalAmount] = useState('');
  const [dRemainingAmount, setDRemainingAmount] = useState('');
  const [dInterestRate, setDInterestRate] = useState('');

  // Form Suscripción (Nueva)
  const [sName, setSName] = useState('');
  const [sCost, setSCost] = useState('');
  const [sPeriod, setSPeriod] = useState<'MONTHLY' | 'YEARLY' | 'WEEKLY'>('MONTHLY');
  const [sNextBillingDate, setSNextBillingDate] = useState('');
  const [sAutoDeduct, setSAutoDeduct] = useState(true);
  const [sAccountId, setSAccountId] = useState('');

  // Form Suscripción (Edición)
  const [eName, setEName] = useState('');
  const [eCost, setECost] = useState('');
  const [ePeriod, setEPeriod] = useState<'MONTHLY' | 'YEARLY' | 'WEEKLY'>('MONTHLY');
  const [eNextBillingDate, setENextBillingDate] = useState('');
  const [eAutoDeduct, setEAutoDeduct] = useState(false);
  const [eAccountId, setEAccountId] = useState('');

  // Form Recordatorio
  const [remTitle, setRemTitle] = useState('');
  const [remAmount, setRemAmount] = useState('');
  const [remDueDate, setRemDueDate] = useState('');
  const [remSubscriptionId, setRemSubscriptionId] = useState('');
  const [remDebtId, setRemDebtId] = useState('');

  const fetchData = useCallback(async () => {
    if (!getToken()) {
      router.push('/login');
      return;
    }

    try {
      const [resDebts, resSubs, resAccounts] = await Promise.all([
        apiFetch('/api/debts').catch(() => []),
        apiFetch('/api/subscriptions').catch(() => ({
          totalMonthlyConsumption: 0,
          totalAnnualConsumption: 0,
          subscriptions: [],
        })),
        apiFetch('/api/accounts').catch(() => []),
      ]);

      setDebts(Array.isArray(resDebts) ? resDebts : []);
      setSubData(resSubs);
      setAccounts(Array.isArray(resAccounts) ? resAccounts : []);

      if (Array.isArray(resAccounts) && resAccounts.length > 0 && !sAccountId) {
        setSAccountId(resAccounts[0].id);
      }
    } catch (err) {
      console.error('Error cargando compromisos:', err);
    } finally {
      setLoading(false);
    }
  }, [router, sAccountId]);

  useEffect(() => {
    const u = getUser();
    const h = getHousehold();
    if (!u || !getToken()) {
      router.push('/login');
      return;
    }
    setUser(u);
    if (h) setHousehold(h);

    fetchData();
  }, [fetchData, router]);

  const handleOpenReminderFromDebt = (d: any) => {
    setRemTitle(`Deuda: ${d.contactName}`);
    setRemAmount(d.remainingAmount.toString());
    setRemDueDate(
      d.dueDate
        ? new Date(d.dueDate).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
    );
    setRemDebtId(d.id);
    setRemSubscriptionId('');
    setShowReminderModal(true);
  };

  const handleOpenReminderFromSub = (s: any) => {
    setRemTitle(`Suscripción: ${s.name}`);
    setRemAmount(s.cost.toString());
    setRemDueDate(
      s.nextBillingDate
        ? new Date(s.nextBillingDate).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
    );
    setRemSubscriptionId(s.id);
    setRemDebtId('');
    setShowReminderModal(true);
  };

  const handleCreateReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!remTitle || !remAmount || !remDueDate) return;

    try {
      await apiFetch('/api/reminders', {
        method: 'POST',
        body: JSON.stringify({
          title: remTitle,
          amount: parseFloat(remAmount),
          dueDate: remDueDate,
          subscriptionId: remSubscriptionId || undefined,
          debtId: remDebtId || undefined,
        }),
      });

      setShowReminderModal(false);
      setRemTitle('');
      setRemAmount('');
      setRemDueDate('');
      setRemSubscriptionId('');
      setRemDebtId('');
      alert('¡Recordatorio programado con éxito!');
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Error programando recordatorio');
    }
  };

  const handleCreateDebt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dName || !dTotalAmount) return;

    try {
      await apiFetch('/api/debts', {
        method: 'POST',
        body: JSON.stringify({
          contactName: dName,
          totalAmount: parseFloat(dTotalAmount),
          remainingAmount: parseFloat(dRemainingAmount || dTotalAmount),
          interestRate: parseFloat(dInterestRate) || 0,
        }),
      });

      setShowDebtModal(false);
      setDName('');
      setDTotalAmount('');
      setDRemainingAmount('');
      setDInterestRate('');
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Error creando deuda');
    }
  };

  const handleCreateSub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sName || !sCost) return;

    try {
      await apiFetch('/api/subscriptions', {
        method: 'POST',
        body: JSON.stringify({
          name: sName,
          cost: parseFloat(sCost),
          period: sPeriod,
          nextBillingDate: sNextBillingDate ? sNextBillingDate : undefined,
          autoDeduct: sAutoDeduct,
          accountId: sAutoDeduct && sAccountId ? sAccountId : undefined,
        }),
      });

      setShowSubModal(false);
      setSName('');
      setSCost('');
      setSPeriod('MONTHLY');
      setSNextBillingDate('');
      setSAutoDeduct(true);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Error creando suscripción');
    }
  };

  const handleOpenEditSub = (sub: any) => {
    setSelectedSubForEdit(sub);
    setEName(sub.name);
    setECost(sub.cost.toString());
    setEPeriod(sub.period || 'MONTHLY');
    if (sub.nextBillingDate) {
      const d = new Date(sub.nextBillingDate);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      setENextBillingDate(`${yyyy}-${mm}-${dd}`);
    } else {
      setENextBillingDate('');
    }
    setEAutoDeduct(sub.autoDeduct ?? false);
    setEAccountId(sub.accountId || (accounts[0]?.id || ''));
    setShowEditSubModal(true);
  };

  const handleUpdateSub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubForEdit || !eName || !eCost) return;

    try {
      await apiFetch(`/api/subscriptions/${selectedSubForEdit.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: eName,
          cost: parseFloat(eCost),
          period: ePeriod,
          nextBillingDate: eNextBillingDate ? eNextBillingDate : undefined,
          autoDeduct: eAutoDeduct,
          accountId: eAutoDeduct && eAccountId ? eAccountId : null,
        }),
      });

      setShowEditSubModal(false);
      setSelectedSubForEdit(null);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Error actualizando suscripción');
    }
  };

  const handleManualDeduct = async (sub: any) => {
    if (!confirm(`¿Ejecutar el cobro de "$${Number(sub.cost).toFixed(2)}" para ${sub.name} ahora?`)) {
      return;
    }

    try {
      const res = await apiFetch(`/api/subscriptions/${sub.id}/deduct`, {
        method: 'POST',
      });

      if (res.success) {
        alert(`✅ ${res.message}`);
      } else {
        alert(`⚠️ ${res.message}`);
      }
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Error procesando el cobro de la suscripción');
    }
  };

  const handleDeleteDebt = async (id: string) => {
    if (!confirm('¿Eliminar esta deuda?')) return;
    try {
      await apiFetch(`/api/debts/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Error eliminando deuda');
    }
  };

  const handleDeleteSub = async (id: string) => {
    if (!confirm('¿Eliminar esta suscripción?')) return;
    try {
      await apiFetch(`/api/subscriptions/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Error eliminando suscripción');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A1128] text-slate-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-3 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A1128] text-slate-100 pb-20 lg:pb-12">
      <Navbar user={user} household={household} />

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-10">
        {/* ============================================================ */}
        {/* 1. SECCIÓN DE DEUDAS Y PRÉSTAMOS                            */}
        {/* ============================================================ */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-rose-400" />
                <span>Control de Deudas y Préstamos</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Seguimiento de montos adeudados a bancos, personas o tarjetas.</p>
            </div>
            <button
              onClick={() => setShowDebtModal(true)}
              className="px-3.5 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-xs font-semibold shadow-sm flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nueva Deuda</span>
            </button>
          </div>

          {debts.length === 0 ? (
            <div className="mint-card p-8 text-center text-slate-400 text-xs">
              No tienes deudas activas registradas. Mantén un seguimiento claro de préstamos para planificar su pago.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {debts.map((d: any) => (
                <div key={d.id} className="mint-card p-5 space-y-3.5 relative border border-rose-500/30 group hover:border-rose-500/50 transition-colors">
                  <button
                    onClick={() => handleDeleteDebt(d.id)}
                    className="absolute top-3.5 right-3.5 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                    title="Eliminar deuda"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <div className="flex items-center justify-between pr-7">
                    <h3 className="text-sm font-semibold text-slate-100">{d.contactName}</h3>
                    <span className="text-[10px] font-bold text-rose-300 bg-rose-500/10 border border-rose-500/30 px-2 py-0.5 rounded-full tabular-nums">
                      {d.interestRate}% Tasa
                    </span>
                  </div>

                  <div>
                    <p className="text-[11px] text-slate-400">Saldo Pendiente</p>
                    <p className="text-2xl font-bold text-rose-400 tabular-nums">
                      ${Number(d.remainingAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      <span className="text-xs font-normal text-slate-400 ml-1">
                        / ${Number(d.totalAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                    </p>
                  </div>

                  <div className="pt-2 border-t border-[#1E2B4D] flex justify-end">
                    <button
                      onClick={() => handleOpenReminderFromDebt(d)}
                      className="px-2.5 py-1 rounded-lg bg-[#162347] hover:bg-[#1D2D5A] text-emerald-300 border border-emerald-500/30 text-[11px] font-medium transition-all cursor-pointer flex items-center space-x-1"
                    >
                      <CalendarClock className="w-3 h-3 text-emerald-400" />
                      <span>Programar Pago</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ============================================================ */}
        {/* 2. SECCIÓN DE SUSCRIPCIONES Y SERVICIOS RECURRENTES          */}
        {/* ============================================================ */}
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                <Tv className="w-5 h-5 text-emerald-400" />
                <span>Suscripciones y Servicios Recurrentes</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Control y débito automático con verificación de saldo y notificaciones para streaming, internet, seguros y membresías.
              </p>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-right">
                <span className="text-[11px] text-slate-400 block">Consumo Mensual:</span>
                <span className="text-lg font-bold text-emerald-400 tabular-nums">
                  ${Number(subData.totalMonthlyConsumption || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}/mes
                </span>
              </div>
              <button
                onClick={() => {
                  const today = new Date().toISOString().split('T')[0];
                  setSNextBillingDate(today);
                  setShowSubModal(true);
                }}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white shadow-sm flex items-center gap-1.5 cursor-pointer transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nueva Suscripción</span>
              </button>
            </div>
          </div>

          {subData.subscriptions?.length === 0 ? (
            <div className="mint-card p-8 text-center text-slate-400 text-xs">
              No tienes suscripciones registradas. Añade tus servicios mensuales para automatizar los cobros y no olvidar fechas de facturación.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {subData.subscriptions?.map((s: any) => {
                const hasAccount = !!s.account;
                const isAuto = s.autoDeduct && hasAccount;
                const insufficientFunds = isAuto && Number(s.account.balance) < Number(s.cost);

                return (
                  <div
                    key={s.id}
                    className={`mint-card p-4 space-y-3 relative group transition-colors border ${
                      insufficientFunds
                        ? 'border-amber-500/40 bg-gradient-to-br from-[#101A36] to-amber-950/20'
                        : isAuto
                        ? 'border-emerald-500/30'
                        : 'border-[#1E2B4D] hover:border-[#2D3E6B]'
                    }`}
                  >
                    {/* Botones de acción superiores */}
                    <div className="absolute top-3 right-3 flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditSub(s)}
                        className="p-1 rounded-lg text-slate-400 hover:text-emerald-300 hover:bg-[#162347] transition-colors cursor-pointer"
                        title="Editar suscripción"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteSub(s.id)}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-[#162347] transition-colors cursor-pointer"
                        title="Eliminar suscripción"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between pr-16">
                      <h3 className="text-sm font-semibold text-slate-100 truncate">{s.name}</h3>
                      <span className="text-xs font-bold text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-lg tabular-nums">
                        ${Number(s.cost).toLocaleString('en-US', { minimumFractionDigits: 2 })}{' '}
                        <span className="text-[10px] font-normal text-slate-400">
                          /{s.period === 'YEARLY' ? 'año' : s.period === 'WEEKLY' ? 'sem' : 'mes'}
                        </span>
                      </span>
                    </div>

                    {/* Fecha de Próximo Cobro */}
                    <p className="text-[11px] text-slate-400 tabular-nums">
                      Próximo cobro: <strong className="text-slate-200">{new Date(s.nextBillingDate).toLocaleDateString()}</strong>
                    </p>

                    {/* Estado de Auto-Deducción y Cuenta */}
                    <div className="p-2.5 rounded-xl bg-[#0A1128] border border-[#1E2B4D] text-[11px] space-y-1">
                      {isAuto ? (
                        <>
                          <div className="flex items-center justify-between">
                            <span className="text-emerald-400 font-semibold flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                              Débito auto: {s.account.name}
                            </span>
                            <span className="text-slate-400 tabular-nums">
                              Saldo: ${Number(s.account.balance).toFixed(0)}
                            </span>
                          </div>

                          {insufficientFunds && (
                            <p className="text-[10px] text-amber-400 font-medium flex items-center gap-1 pt-1 border-t border-[#1E2B4D]/60">
                              <AlertTriangle className="w-3 h-3 text-amber-400 flex-shrink-0" />
                              <span>⚠️ Saldo insuficiente para el próximo cobro</span>
                            </p>
                          )}
                        </>
                      ) : (
                        <div className="flex items-center justify-between text-slate-400">
                          <span>Pago manual</span>
                          <span className="text-[10px] text-slate-500">Sin débito automático</span>
                        </div>
                      )}
                    </div>

                    {/* Botones de acción inferiores */}
                    <div className="pt-2 border-t border-[#1E2B4D] flex items-center justify-between gap-2">
                      <button
                        onClick={() => handleOpenReminderFromSub(s)}
                        className="px-2.5 py-1 rounded-lg bg-[#162347] hover:bg-[#1D2D5A] text-slate-300 hover:text-emerald-300 border border-[#1E2B4D] text-[11px] font-medium transition-all cursor-pointer flex items-center gap-1"
                        title="Programar recordatorio en el calendario"
                      >
                        <CalendarClock className="w-3 h-3 text-emerald-400" />
                        <span>Aviso</span>
                      </button>

                      {isAuto && (
                        <button
                          onClick={() => handleManualDeduct(s)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1 shadow-xs"
                          title="Cobrar ahora y debitar de la cuenta asignada"
                        >
                          <Zap className="w-3 h-3 text-emerald-400" />
                          <span>Deducir Ahora</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* ============================================================ */}
      {/* MODAL NUEVA SUSCRIPCIÓN                                      */}
      {/* ============================================================ */}
      {showSubModal && (
        <div className="fixed inset-0 bg-[#0A1128]/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="mint-card w-full max-w-md p-6 relative border border-[#1E2B4D] shadow-2xl animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5 pb-3 border-b border-[#1E2B4D]">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Tv className="w-4 h-4 text-emerald-400" />
                <span>Nueva Suscripción o Servicio</span>
              </h3>
              <button
                onClick={() => setShowSubModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-[#162347] transition-colors cursor-pointer"
                aria-label="Cerrar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSub} className="space-y-4">
              <div>
                <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1.5">
                  Nombre del Servicio
                </label>
                <input
                  type="text"
                  required
                  value={sName}
                  onChange={(e) => setSName(e.target.value)}
                  placeholder="Ej. Netflix, Spotify, Internet Fibra, Gym"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A1128] border border-[#1E2B4D] text-slate-100 text-sm focus:outline-none focus:border-emerald-400 transition-colors"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1.5">
                  Costo ($)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-bold">
                    $
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={sCost}
                    onChange={(e) => setSCost(e.target.value)}
                    placeholder="Ej. 14.99"
                    className="w-full pl-8 pr-3.5 py-2.5 rounded-xl bg-[#0A1128] border border-[#1E2B4D] text-slate-100 font-bold text-base focus:outline-none focus:border-emerald-400 tabular-nums transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1.5">
                  Frecuencia de Facturación
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setSPeriod('MONTHLY')}
                    className={`py-1.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                      sPeriod === 'MONTHLY'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : 'bg-[#0A1128] text-slate-400 border-[#1E2B4D] hover:bg-[#162347]'
                    }`}
                  >
                    Mensual
                  </button>
                  <button
                    type="button"
                    onClick={() => setSPeriod('YEARLY')}
                    className={`py-1.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                      sPeriod === 'YEARLY'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : 'bg-[#0A1128] text-slate-400 border-[#1E2B4D] hover:bg-[#162347]'
                    }`}
                  >
                    Anual
                  </button>
                  <button
                    type="button"
                    onClick={() => setSPeriod('WEEKLY')}
                    className={`py-1.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                      sPeriod === 'WEEKLY'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : 'bg-[#0A1128] text-slate-400 border-[#1E2B4D] hover:bg-[#162347]'
                    }`}
                  >
                    Semanal
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1.5">
                  Fecha del Próximo Cobro
                </label>
                <input
                  type="date"
                  required
                  value={sNextBillingDate}
                  onChange={(e) => setSNextBillingDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A1128] border border-[#1E2B4D] text-slate-100 text-sm focus:outline-none focus:border-emerald-400 transition-colors"
                />
              </div>

              {/* Configuración de Débito Automático */}
              <div className="p-3.5 rounded-xl bg-[#0A1128] border border-emerald-500/30 space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sAutoDeduct}
                    onChange={(e) => setSAutoDeduct(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-500 bg-[#101A36] border-[#1E2B4D] focus:ring-0 cursor-pointer"
                  />
                  <span className="text-xs font-semibold text-slate-200">
                    Deducir automáticamente de una cuenta
                  </span>
                </label>

                {sAutoDeduct && (
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1">
                      Cuenta de Origen
                    </label>
                    <select
                      value={sAccountId}
                      onChange={(e) => setSAccountId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#101A36] border border-[#1E2B4D] text-slate-100 text-xs focus:outline-none focus:border-emerald-400 cursor-pointer"
                    >
                      {accounts.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name} — Saldo: ${Number(a.balance).toFixed(2)}
                        </option>
                      ))}
                    </select>
                    <p className="text-[10px] text-slate-400 mt-1">
                      💡 El sistema verificará que haya saldo suficiente antes de debitar y emitirá una notificación al hogar.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-[#1E2B4D]">
                <button
                  type="button"
                  onClick={() => setShowSubModal(false)}
                  className="px-4 py-2 rounded-xl bg-[#162347] text-slate-300 text-xs font-medium hover:bg-[#1D2D5A] hover:text-slate-100 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
                >
                  Guardar Suscripción
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL EDITAR SUSCRIPCIÓN                                     */}
      {/* ============================================================ */}
      {showEditSubModal && selectedSubForEdit && (
        <div className="fixed inset-0 bg-[#0A1128]/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="mint-card w-full max-w-md p-6 relative border border-[#1E2B4D] shadow-2xl animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5 pb-3 border-b border-[#1E2B4D]">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Pencil className="w-4 h-4 text-emerald-400" />
                <span>Editar Suscripción</span>
              </h3>
              <button
                onClick={() => setShowEditSubModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-[#162347] transition-colors cursor-pointer"
                aria-label="Cerrar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateSub} className="space-y-4">
              <div>
                <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1.5">
                  Nombre del Servicio
                </label>
                <input
                  type="text"
                  required
                  value={eName}
                  onChange={(e) => setEName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A1128] border border-[#1E2B4D] text-slate-100 text-sm focus:outline-none focus:border-emerald-400 transition-colors"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1.5">
                  Costo ($)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-bold">
                    $
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={eCost}
                    onChange={(e) => setECost(e.target.value)}
                    className="w-full pl-8 pr-3.5 py-2.5 rounded-xl bg-[#0A1128] border border-[#1E2B4D] text-slate-100 font-bold text-base focus:outline-none focus:border-emerald-400 tabular-nums transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1.5">
                  Frecuencia de Facturación
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setEPeriod('MONTHLY')}
                    className={`py-1.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                      ePeriod === 'MONTHLY'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : 'bg-[#0A1128] text-slate-400 border-[#1E2B4D] hover:bg-[#162347]'
                    }`}
                  >
                    Mensual
                  </button>
                  <button
                    type="button"
                    onClick={() => setEPeriod('YEARLY')}
                    className={`py-1.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                      ePeriod === 'YEARLY'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : 'bg-[#0A1128] text-slate-400 border-[#1E2B4D] hover:bg-[#162347]'
                    }`}
                  >
                    Anual
                  </button>
                  <button
                    type="button"
                    onClick={() => setEPeriod('WEEKLY')}
                    className={`py-1.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                      ePeriod === 'WEEKLY'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : 'bg-[#0A1128] text-slate-400 border-[#1E2B4D] hover:bg-[#162347]'
                    }`}
                  >
                    Semanal
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1.5">
                  Fecha del Próximo Cobro
                </label>
                <input
                  type="date"
                  required
                  value={eNextBillingDate}
                  onChange={(e) => setENextBillingDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A1128] border border-[#1E2B4D] text-slate-100 text-sm focus:outline-none focus:border-emerald-400 transition-colors"
                />
              </div>

              {/* Configuración de Débito Automático */}
              <div className="p-3.5 rounded-xl bg-[#0A1128] border border-emerald-500/30 space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={eAutoDeduct}
                    onChange={(e) => setEAutoDeduct(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-500 bg-[#101A36] border-[#1E2B4D] focus:ring-0 cursor-pointer"
                  />
                  <span className="text-xs font-semibold text-slate-200">
                    Deducir automáticamente de una cuenta
                  </span>
                </label>

                {eAutoDeduct && (
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1">
                      Cuenta de Origen
                    </label>
                    <select
                      value={eAccountId}
                      onChange={(e) => setEAccountId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#101A36] border border-[#1E2B4D] text-slate-100 text-xs focus:outline-none focus:border-emerald-400 cursor-pointer"
                    >
                      {accounts.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name} — Saldo: ${Number(a.balance).toFixed(2)}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-[#1E2B4D]">
                <button
                  type="button"
                  onClick={() => setShowEditSubModal(false)}
                  className="px-4 py-2 rounded-xl bg-[#162347] text-slate-300 text-xs font-medium hover:bg-[#1D2D5A] hover:text-slate-100 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL NUEVA DEUDA                                            */}
      {/* ============================================================ */}
      {showDebtModal && (
        <div className="fixed inset-0 bg-[#0A1128]/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="mint-card w-full max-w-md p-6 relative border border-rose-500/30 shadow-2xl">
            <div className="flex items-center justify-between mb-5 pb-3 border-b border-[#1E2B4D]">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-rose-400" />
                <span>Nueva Deuda o Préstamo</span>
              </h3>
              <button
                onClick={() => setShowDebtModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-[#162347] transition-colors cursor-pointer"
                aria-label="Cerrar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateDebt} className="space-y-4">
              <div>
                <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1.5">Acreedor / Contacto</label>
                <input
                  type="text"
                  required
                  value={dName}
                  onChange={(e) => setDName(e.target.value)}
                  placeholder="Ej. Banco Santander, Juan Pérez, Tarjeta Visa"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A1128] border border-[#1E2B4D] text-slate-100 text-sm focus:outline-none focus:border-emerald-400 transition-colors"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1.5">Monto Total ($)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={dTotalAmount}
                  onChange={(e) => setDTotalAmount(e.target.value)}
                  placeholder="Ej. 1200.00"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A1128] border border-[#1E2B4D] text-slate-100 font-bold text-base focus:outline-none focus:border-emerald-400 tabular-nums transition-colors"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1.5">Monto Pendiente Actual ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={dRemainingAmount}
                  onChange={(e) => setDRemainingAmount(e.target.value)}
                  placeholder="Dejar vacío si es igual al total"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A1128] border border-[#1E2B4D] text-slate-100 text-sm focus:outline-none focus:border-emerald-400 tabular-nums transition-colors"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1.5">Tasa de Interés (% anual/mensual)</label>
                <input
                  type="number"
                  step="0.01"
                  value={dInterestRate}
                  onChange={(e) => setDInterestRate(e.target.value)}
                  placeholder="0.0"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A1128] border border-[#1E2B4D] text-slate-100 text-sm focus:outline-none focus:border-emerald-400 tabular-nums transition-colors"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-[#1E2B4D]">
                <button
                  type="button"
                  onClick={() => setShowDebtModal(false)}
                  className="px-4 py-2 rounded-xl bg-[#162347] text-slate-300 text-xs font-medium hover:bg-[#1D2D5A] hover:text-slate-100 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
                >
                  Guardar Deuda
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL PROGRAMAR RECORDATORIO                                 */}
      {/* ============================================================ */}
      {showReminderModal && (
        <div className="fixed inset-0 bg-[#0A1128]/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="mint-card w-full max-w-md p-6 relative border border-[#1E2B4D] shadow-2xl">
            <div className="flex items-center justify-between mb-5 pb-3 border-b border-[#1E2B4D]">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <CalendarClock className="w-4 h-4 text-emerald-400" />
                <span>Programar Recordatorio</span>
              </h3>
              <button
                onClick={() => setShowReminderModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-[#162347] transition-colors cursor-pointer"
                aria-label="Cerrar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateReminder} className="space-y-4">
              <div>
                <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1.5">Título del Recordatorio</label>
                <input
                  type="text"
                  required
                  value={remTitle}
                  onChange={(e) => setRemTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A1128] border border-[#1E2B4D] text-slate-100 text-sm focus:outline-none focus:border-emerald-400 transition-colors"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1.5">Monto ($)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={remAmount}
                  onChange={(e) => setRemAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A1128] border border-[#1E2B4D] text-slate-100 font-bold text-base focus:outline-none focus:border-emerald-400 tabular-nums transition-colors"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1.5">Fecha de Vencimiento</label>
                <input
                  type="date"
                  required
                  value={remDueDate}
                  onChange={(e) => setRemDueDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A1128] border border-[#1E2B4D] text-slate-100 text-sm focus:outline-none focus:border-emerald-400 transition-colors"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-[#1E2B4D]">
                <button
                  type="button"
                  onClick={() => setShowReminderModal(false)}
                  className="px-4 py-2 rounded-xl bg-[#162347] text-slate-300 text-xs font-medium hover:bg-[#1D2D5A] hover:text-slate-100 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
                >
                  Guardar Recordatorio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
