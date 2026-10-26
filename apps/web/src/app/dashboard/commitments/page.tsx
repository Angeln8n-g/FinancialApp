'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import PayDebtModal from '@/components/modals/PayDebtModal';
import EditDebtModal from '@/components/modals/EditDebtModal';
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
  Target,
  TrendingDown,
  ShieldCheck,
  CheckCircle2,
  Coins,
  ArrowRight,
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
  const [showPayDebtModal, setShowPayDebtModal] = useState(false);
  const [selectedDebtForPay, setSelectedDebtForPay] = useState<any>(null);
  const [showEditDebtModal, setShowEditDebtModal] = useState(false);
  const [selectedDebtForEdit, setSelectedDebtForEdit] = useState<any>(null);

  const [showSubModal, setShowSubModal] = useState(false);
  const [showEditSubModal, setShowEditSubModal] = useState(false);
  const [selectedSubForEdit, setSelectedSubForEdit] = useState<any>(null);
  const [showReminderModal, setShowReminderModal] = useState(false);

  // Form Deuda (Nueva)
  const [dName, setDName] = useState('');
  const [dTotalAmount, setDTotalAmount] = useState('');
  const [dRemainingAmount, setDRemainingAmount] = useState('');
  const [dInterestRate, setDInterestRate] = useState('');
  const [dTargetPayoffDate, setDTargetPayoffDate] = useState('');
  const [dMonthlyTargetPayment, setDMonthlyTargetPayment] = useState('');
  const [dMitigationStrategy, setDMitigationStrategy] = useState<'AVALANCHE' | 'SNOWBALL' | 'CUSTOM'>('CUSTOM');
  const [dNotes, setDNotes] = useState('');

  // Form Suscripción (Nueva)
  const [sName, setSName] = useState('');
  const [sCost, setSCost] = useState('');
  const [sPeriod, setSPeriod] = useState<'MONTHLY' | 'YEARLY' | 'WEEKLY'>('MONTHLY');
  const [sNextBillingDate, setSNextBillingDate] = useState('');
  const [sAutoDeduct, setSAutoDeduct] = useState(true);
  const [sAccountId, setSAccountId] = useState('');
  const [sCategoryId, setSCategoryId] = useState('');

  // Form Suscripción (Edición)
  const [eName, setEName] = useState('');
  const [eCost, setECost] = useState('');
  const [ePeriod, setEPeriod] = useState<'MONTHLY' | 'YEARLY' | 'WEEKLY'>('MONTHLY');
  const [eNextBillingDate, setENextBillingDate] = useState('');
  const [eAutoDeduct, setEAutoDeduct] = useState(false);
  const [eAccountId, setEAccountId] = useState('');
  const [eCategoryId, setECategoryId] = useState('');

  // Categorías del Hogar
  const [categories, setCategories] = useState<any[]>([]);

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
      const [resDebts, resSubs, resAccounts, resCategories] = await Promise.all([
        apiFetch('/api/debts').catch(() => []),
        apiFetch('/api/subscriptions').catch(() => ({
          totalMonthlyConsumption: 0,
          totalAnnualConsumption: 0,
          subscriptions: [],
        })),
        apiFetch('/api/accounts').catch(() => []),
        apiFetch('/api/categories').catch(() => []),
      ]);

      setDebts(Array.isArray(resDebts) ? resDebts : []);
      setSubData(resSubs);
      setAccounts(Array.isArray(resAccounts) ? resAccounts : []);
      setCategories(Array.isArray(resCategories) ? resCategories : []);

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
      d.targetPayoffDate
        ? new Date(d.targetPayoffDate).toISOString().split('T')[0]
        : d.dueDate
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
          targetPayoffDate: dTargetPayoffDate ? dTargetPayoffDate : undefined,
          monthlyTargetPayment: dMonthlyTargetPayment ? parseFloat(dMonthlyTargetPayment) : undefined,
          mitigationStrategy: dMitigationStrategy,
          notes: dNotes.trim() || undefined,
        }),
      });

      setShowDebtModal(false);
      setDName('');
      setDTotalAmount('');
      setDRemainingAmount('');
      setDInterestRate('');
      setDTargetPayoffDate('');
      setDMonthlyTargetPayment('');
      setDMitigationStrategy('CUSTOM');
      setDNotes('');
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Error creando deuda');
    }
  };

  const handleOpenPayDebt = (debt: any) => {
    setSelectedDebtForPay(debt);
    setShowPayDebtModal(true);
  };

  const handleOpenEditDebt = (debt: any) => {
    setSelectedDebtForEdit(debt);
    setShowEditDebtModal(true);
  };

  const handlePayDebt = async (debtId: string, data: { amount: number; accountId?: string; notes?: string }) => {
    await apiFetch(`/api/debts/${debtId}/pay`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    await fetchData();
  };

  const handleUpdateDebt = async (debtId: string, data: any) => {
    await apiFetch(`/api/debts/${debtId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    await fetchData();
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
          categoryId: sCategoryId || undefined,
        }),
      });

      setShowSubModal(false);
      setSName('');
      setSCost('');
      setSPeriod('MONTHLY');
      setSNextBillingDate('');
      setSAutoDeduct(true);
      setSCategoryId('');
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
    setECategoryId(sub.categoryId || '');
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
          categoryId: eCategoryId || null,
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

  const handleDeleteSub = async (id: string) => {
    if (!confirm('¿Eliminar esta suscripción?')) return;
    try {
      await apiFetch(`/api/subscriptions/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Error eliminando suscripción');
    }
  };

  // Métrica consolidada de mitigación de deuda familiar
  const totalDebtRemaining = debts.reduce((acc, d) => acc + Number(d.remainingAmount || 0), 0);
  const totalDebtInitial = debts.reduce(
    (acc, d) => acc + Number(d.totalAmount || d.remainingAmount || 0),
    0,
  );
  const totalDebtAmortized = Math.max(0, totalDebtInitial - totalDebtRemaining);
  const globalAmortizedPct =
    totalDebtInitial > 0
      ? Math.min(100, Math.round((totalDebtAmortized / totalDebtInitial) * 100))
      : 100;

  const totalMonthlyCommitment = debts.reduce((acc, d) => {
    if (d.isPaidOff || Number(d.remainingAmount) <= 0) return acc;
    const q = d.monthlyTargetPayment
      ? Number(d.monthlyTargetPayment)
      : d.suggestedMonthlyPayment
      ? Number(d.suggestedMonthlyPayment)
      : 0;
    return acc + q;
  }, 0);

  // Fecha estimada libre de deudas
  const debtsWithTarget = debts.filter(
    (d) => !d.isPaidOff && Number(d.remainingAmount) > 0 && d.targetPayoffDate,
  );
  let estimatedFreedomLabel = 'Sin fecha definida';
  if (totalDebtRemaining <= 0 && debts.length > 0) {
    estimatedFreedomLabel = '¡Libre de Deudas!';
  } else if (debtsWithTarget.length > 0) {
    const timestamps = debtsWithTarget.map((d) => new Date(d.targetPayoffDate).getTime());
    const maxDate = new Date(Math.max(...timestamps));
    estimatedFreedomLabel = maxDate.toLocaleDateString('es-ES', {
      month: 'short',
      year: 'numeric',
    });
  } else if (totalMonthlyCommitment > 0 && totalDebtRemaining > 0) {
    const months = Math.ceil(totalDebtRemaining / totalMonthlyCommitment);
    const est = new Date();
    est.setMonth(est.getMonth() + months);
    estimatedFreedomLabel = `~${est.toLocaleDateString('es-ES', {
      month: 'short',
      year: 'numeric',
    })} (${months}m)`;
  }

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
        {/* 1. SECCIÓN DE DEUDAS, PRÉSTAMOS Y PLANES DE MITIGACIÓN       */}
        {/* ============================================================ */}
        <section className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                <Target className="w-5 h-5 text-rose-400" />
                <span>Control de Deudas y Planes de Mitigación</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Estrategias de saldado (Avalancha, Bola de Nieve), seguimiento de amortización y abonos directos.
              </p>
            </div>
            <button
              onClick={() => setShowDebtModal(true)}
              className="px-3.5 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-xs font-semibold shadow-sm flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nueva Deuda</span>
            </button>
          </div>

          {/* Banner de Salud y Amortización Familiar */}
          {debts.length > 0 && (
            <div className="mint-card p-5 border border-[#1E2B4D] bg-gradient-to-br from-[#101A36] via-[#101A36] to-[#0D152F] space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#1E2B4D]">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    Plan Maestro de Mitigación Familiar
                  </span>
                </div>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
                  {globalAmortizedPct}% Amortizado Global
                </span>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <p className="text-[11px] text-slate-400">Total Deuda Pendiente</p>
                  <p className="text-xl lg:text-2xl font-bold text-rose-400 tabular-nums">
                    ${totalDebtRemaining.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                </div>

                <div>
                  <p className="text-[11px] text-slate-400">Total Ya Amortizado</p>
                  <p className="text-xl lg:text-2xl font-bold text-emerald-400 tabular-nums">
                    ${totalDebtAmortized.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                </div>

                <div>
                  <p className="text-[11px] text-slate-400">Cuota Mensual Comprometida</p>
                  <p className="text-xl lg:text-2xl font-bold text-cyan-400 tabular-nums">
                    ${totalMonthlyCommitment.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    <span className="text-xs font-normal text-slate-400">/mes</span>
                  </p>
                </div>

                <div>
                  <p className="text-[11px] text-slate-400">Meta Libre de Deudas</p>
                  <p className="text-base lg:text-lg font-bold text-slate-100 capitalize">
                    {estimatedFreedomLabel}
                  </p>
                </div>
              </div>

              {/* Barra de progreso global */}
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Progreso de Amortización Familiar</span>
                  <span className="text-emerald-400 font-semibold tabular-nums">
                    ${totalDebtAmortized.toLocaleString('en-US', { minimumFractionDigits: 0 })} / $
                    {totalDebtInitial.toLocaleString('en-US', { minimumFractionDigits: 0 })}
                  </span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-[#0A1128] overflow-hidden border border-[#1E2B4D]/60 p-0.5">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 transition-all duration-500"
                    style={{ width: `${globalAmortizedPct}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {debts.length === 0 ? (
            <div className="mint-card p-8 text-center text-slate-400 text-xs">
              No tienes deudas activas registradas. Mantén un seguimiento claro de préstamos para planificar su pago.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {debts.map((d: any) => {
                const isPaid = d.isPaidOff || Number(d.remainingAmount) <= 0;
                const strategy = d.mitigationStrategy || 'CUSTOM';

                let strategyBadge = {
                  label: 'Personalizado',
                  color: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30',
                };
                if (strategy === 'AVALANCHE') {
                  strategyBadge = {
                    label: '⚡ Avalancha',
                    color: 'text-rose-300 bg-rose-500/10 border-rose-500/30',
                  };
                } else if (strategy === 'SNOWBALL') {
                  strategyBadge = {
                    label: '❄️ Bola de Nieve',
                    color: 'text-cyan-300 bg-cyan-500/10 border-cyan-500/30',
                  };
                }

                return (
                  <div
                    key={d.id}
                    className={`mint-card p-5 space-y-4 relative border transition-all ${
                      isPaid
                        ? 'border-emerald-500/40 bg-gradient-to-br from-[#101A36] to-emerald-950/20'
                        : 'border-[#1E2B4D] hover:border-rose-500/40'
                    }`}
                  >
                    {/* Botones de acción superiores */}
                    <div className="absolute top-3.5 right-3.5 flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditDebt(d)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-300 hover:bg-[#162347] transition-colors cursor-pointer"
                        title="Editar plan de deuda"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteDebt(d.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-[#162347] transition-colors cursor-pointer"
                        title="Eliminar deuda"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Cabecera de la Deuda */}
                    <div className="pr-16 space-y-1">
                      <h3 className="text-sm font-semibold text-slate-100 truncate">{d.contactName}</h3>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span
                          className={`text-[10px] font-bold border px-2 py-0.5 rounded-full ${strategyBadge.color}`}
                        >
                          {strategyBadge.label}
                        </span>
                        {Number(d.interestRate) > 0 && (
                          <span className="text-[10px] font-bold text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full tabular-nums">
                            {d.interestRate}% Tasa
                          </span>
                        )}
                        {isPaid && (
                          <span className="text-[10px] font-bold text-emerald-300 bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Saldada
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Saldo y Amortización */}
                    <div className="space-y-1.5">
                      <div className="flex items-baseline justify-between">
                        <span className="text-[11px] text-slate-400">Saldo Pendiente</span>
                        <span className="text-[11px] text-slate-400 tabular-nums">
                          Inicial: ${Number(d.totalAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <p
                        className={`text-2xl font-bold tabular-nums ${
                          isPaid ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        ${Number(d.remainingAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </p>

                      {/* Barra de progreso de amortización individual */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] text-slate-400">
                          <span>{d.progressPercentage ?? 0}% amortizado</span>
                          <span className="tabular-nums">
                            Pagado: ${Number(d.paidAmount ?? 0).toLocaleString('en-US', { minimumFractionDigits: 0 })}
                          </span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-[#0A1128] overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300"
                            style={{ width: `${d.progressPercentage ?? 0}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Plan Objetivo de Mitigación */}
                    {(d.targetPayoffDate || d.monthlyTargetPayment || d.suggestedMonthlyPayment) && (
                      <div className="p-2.5 rounded-xl bg-[#0A1128] border border-[#1E2B4D] text-[11px] space-y-1">
                        {d.targetPayoffDate && (
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400 flex items-center gap-1">
                              <Target className="w-3 h-3 text-emerald-400" /> Meta saldado:
                            </span>
                            <span className="font-semibold text-slate-200 tabular-nums">
                              {new Date(d.targetPayoffDate).toLocaleDateString()}
                              {d.daysRemaining != null && d.daysRemaining > 0 && (
                                <span className="text-[10px] text-slate-400 ml-1">
                                  ({d.daysRemaining}d)
                                </span>
                              )}
                            </span>
                          </div>
                        )}

                        {(d.monthlyTargetPayment || d.suggestedMonthlyPayment) && (
                          <div className="flex items-center justify-between pt-1 border-t border-[#1E2B4D]/60">
                            <span className="text-slate-400">
                              {d.monthlyTargetPayment ? 'Cuota comprometida:' : 'Cuota sugerida:'}
                            </span>
                            <span className="font-bold text-emerald-400 tabular-nums">
                              $
                              {Number(
                                d.monthlyTargetPayment || d.suggestedMonthlyPayment || 0,
                              ).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                              /mes
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {d.notes && (
                      <p className="text-[10px] text-slate-400 italic line-clamp-1">
                        &quot;{d.notes}&quot;
                      </p>
                    )}

                    {/* Acciones de la Deuda */}
                    <div className="pt-2 border-t border-[#1E2B4D] flex items-center justify-between gap-2">
                      <button
                        onClick={() => handleOpenReminderFromDebt(d)}
                        className="px-2.5 py-1.5 rounded-lg bg-[#162347] hover:bg-[#1D2D5A] text-slate-300 hover:text-emerald-300 border border-[#1E2B4D] text-[11px] font-medium transition-all cursor-pointer flex items-center gap-1"
                        title="Programar recordatorio"
                      >
                        <CalendarClock className="w-3 h-3 text-emerald-400" />
                        <span>Aviso</span>
                      </button>

                      {!isPaid && (
                        <button
                          onClick={() => handleOpenPayDebt(d)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                          title="Realizar un abono y descontar de cuenta bancaria o efectivo"
                        >
                          <Coins className="w-3.5 h-3.5" />
                          <span>+ Abonar a Deuda</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
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

                    {/* Badge de Categoría de Presupuesto */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {s.category ? (
                        <span
                          className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-md border"
                          style={{
                            backgroundColor: `${s.category.color || '#3B82F6'}18`,
                            borderColor: `${s.category.color || '#3B82F6'}40`,
                            color: s.category.color || '#93C5FD',
                          }}
                        >
                          <span>{s.category.icon || '🏷️'}</span>
                          <span>{s.category.name}</span>
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-500 italic">
                          ⚪ Sin categoría asignada
                        </span>
                      )}
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
      {/* MODAL NUEVA DEUDA CON PLAN DE MITIGACIÓN                     */}
      {/* ============================================================ */}
      {showDebtModal && (
        <div className="fixed inset-0 bg-[#0A1128]/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="mint-card w-full max-w-lg p-6 relative border border-rose-500/30 shadow-2xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-5 pb-3 border-b border-[#1E2B4D]">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-rose-400" />
                <span>Nueva Deuda y Plan de Mitigación</span>
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
                <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1.5">
                  Acreedor / Contacto
                </label>
                <input
                  type="text"
                  required
                  value={dName}
                  onChange={(e) => setDName(e.target.value)}
                  placeholder="Ej. Tarjeta de Crédito Visa, Préstamo Auto, Banco"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A1128] border border-[#1E2B4D] text-slate-100 text-sm focus:outline-none focus:border-emerald-400 transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1.5">
                    Monto Total Original ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={dTotalAmount}
                    onChange={(e) => setDTotalAmount(e.target.value)}
                    placeholder="Ej. 2500.00"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A1128] border border-[#1E2B4D] text-slate-100 font-bold text-sm focus:outline-none focus:border-emerald-400 tabular-nums transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1.5">
                    Saldo Pendiente ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={dRemainingAmount}
                    onChange={(e) => setDRemainingAmount(e.target.value)}
                    placeholder="Vacío = Monto total"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A1128] border border-[#1E2B4D] text-slate-100 font-bold text-sm focus:outline-none focus:border-emerald-400 tabular-nums transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1.5">
                  Tasa de Interés (% Anual)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={dInterestRate}
                  onChange={(e) => setDInterestRate(e.target.value)}
                  placeholder="0.0"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A1128] border border-[#1E2B4D] text-slate-100 text-sm focus:outline-none focus:border-emerald-400 tabular-nums transition-colors"
                />
              </div>

              {/* Sección Opcional: Plan de Mitigación */}
              <div className="p-3.5 rounded-xl bg-[#0A1128] border border-emerald-500/30 space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                  <Target className="w-3.5 h-3.5" />
                  <span>Plan de Saldado / Mitigación (Opcional)</span>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1.5">
                    Estrategia
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setDMitigationStrategy('AVALANCHE')}
                      className={`py-1.5 px-2 text-xs font-semibold rounded-lg border transition-all cursor-pointer text-center ${
                        dMitigationStrategy === 'AVALANCHE'
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                          : 'bg-[#101A36] text-slate-400 border-[#1E2B4D]'
                      }`}
                    >
                      Avalancha
                    </button>
                    <button
                      type="button"
                      onClick={() => setDMitigationStrategy('SNOWBALL')}
                      className={`py-1.5 px-2 text-xs font-semibold rounded-lg border transition-all cursor-pointer text-center ${
                        dMitigationStrategy === 'SNOWBALL'
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                          : 'bg-[#101A36] text-slate-400 border-[#1E2B4D]'
                      }`}
                    >
                      Bola de Nieve
                    </button>
                    <button
                      type="button"
                      onClick={() => setDMitigationStrategy('CUSTOM')}
                      className={`py-1.5 px-2 text-xs font-semibold rounded-lg border transition-all cursor-pointer text-center ${
                        dMitigationStrategy === 'CUSTOM'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : 'bg-[#101A36] text-slate-400 border-[#1E2B4D]'
                      }`}
                    >
                      Personalizado
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1">
                      Fecha Meta
                    </label>
                    <input
                      type="date"
                      value={dTargetPayoffDate}
                      onChange={(e) => setDTargetPayoffDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#101A36] border border-[#1E2B4D] text-slate-100 text-xs focus:outline-none focus:border-emerald-400 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1">
                      Cuota Mensual ($)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={dMonthlyTargetPayment}
                      onChange={(e) => setDMonthlyTargetPayment(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-3 py-2 rounded-xl bg-[#101A36] border border-[#1E2B4D] text-slate-100 text-xs focus:outline-none focus:border-emerald-400 tabular-nums transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1">
                    Notas adicionales
                  </label>
                  <input
                    type="text"
                    value={dNotes}
                    onChange={(e) => setDNotes(e.target.value)}
                    placeholder="No. cuenta, acuerdos..."
                    className="w-full px-3 py-1.5 rounded-xl bg-[#101A36] border border-[#1E2B4D] text-slate-100 text-xs focus:outline-none focus:border-emerald-400 transition-colors"
                  />
                </div>
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
      {/* MODAL EDITAR DEUDA                                           */}
      {/* ============================================================ */}
      <EditDebtModal
        isOpen={showEditDebtModal}
        onClose={() => {
          setShowEditDebtModal(false);
          setSelectedDebtForEdit(null);
        }}
        debt={selectedDebtForEdit}
        onConfirm={handleUpdateDebt}
      />

      {/* ============================================================ */}
      {/* MODAL ABONAR A DEUDA                                         */}
      {/* ============================================================ */}
      <PayDebtModal
        isOpen={showPayDebtModal}
        onClose={() => {
          setShowPayDebtModal(false);
          setSelectedDebtForPay(null);
        }}
        debt={selectedDebtForPay}
        accounts={accounts}
        onConfirm={handlePayDebt}
      />

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

              {/* Categoría de Presupuesto */}
              <div>
                <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1.5">
                  Categoría de Presupuesto Mensual
                </label>
                <select
                  value={sCategoryId}
                  onChange={(e) => setSCategoryId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A1128] border border-[#1E2B4D] text-slate-100 text-sm focus:outline-none focus:border-emerald-400 cursor-pointer transition-colors"
                >
                  <option value="">⚪ Sin categoría asignada (General)</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon || '🏷️'} {cat.name}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400 mt-1">
                  💡 Al vincularla, los cobros de esta suscripción computarán automáticamente en el presupuesto mensual de dicha categoría.
                </p>
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

              {/* Categoría de Presupuesto */}
              <div>
                <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1.5">
                  Categoría de Presupuesto Mensual
                </label>
                <select
                  value={eCategoryId}
                  onChange={(e) => setECategoryId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A1128] border border-[#1E2B4D] text-slate-100 text-sm focus:outline-none focus:border-emerald-400 cursor-pointer transition-colors"
                >
                  <option value="">⚪ Sin categoría asignada (General)</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon || '🏷️'} {cat.name}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400 mt-1">
                  💡 Los cobros de esta suscripción computarán automáticamente en el presupuesto de esta categoría.
                </p>
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
                <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1.5">
                  Título del Recordatorio
                </label>
                <input
                  type="text"
                  required
                  value={remTitle}
                  onChange={(e) => setRemTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A1128] border border-[#1E2B4D] text-slate-100 text-sm focus:outline-none focus:border-emerald-400 transition-colors"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1.5">
                  Monto ($)
                </label>
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
                <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1.5">
                  Fecha de Vencimiento
                </label>
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
