'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import KPICards from '@/components/dashboard/KPICards';
import QuickEntryBar from '@/components/dashboard/QuickEntryBar';
import CashFlowProjection from '@/components/dashboard/CashFlowProjection';
import TransactionModal from '@/components/modals/TransactionModal';
import AccountModal from '@/components/modals/AccountModal';
import EditAccountModal from '@/components/modals/EditAccountModal';
import ReminderModal from '@/components/modals/ReminderModal';
import PayReminderModal from '@/components/modals/PayReminderModal';
import PayDebtModal from '@/components/modals/PayDebtModal';
import EditTransactionModal from '@/components/modals/EditTransactionModal';
import VoidTransactionModal from '@/components/modals/VoidTransactionModal';
import ImportModal from '@/components/modals/ImportModal';
import ReceiptScanModal from '@/components/modals/ReceiptScanModal';
import { PiggyBuddyIllustration } from '@/components/kids/KidsIllustrations';
import { apiFetch, getUser, getHousehold, getToken } from '@/lib/api';
import { useHouseholdSocket } from '@/hooks/useHouseholdSocket';
import { enqueueOfflineTransaction } from '@/lib/offlineSync';
import {
  ArrowDownRight,
  ArrowUpRight,
  ArrowLeftRight,
  CalendarClock,
  Plus,
  Trash2,
  Check,
  Building2,
  Briefcase,
  CreditCard,
  Banknote,
  PiggyBank,
  Landmark,
  Pencil,
  Ban,
  ArrowRight,
  TrendingUp,
  Receipt,
  FileSpreadsheet,
  Camera,
  ShieldCheck,
  Lock,
  Sparkles,
  Wallet,
  Trophy,
  Gift,
  Coins,
  ShoppingBag,
  Target,
  X,
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [household, setHousehold] = useState<any>(null);
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [summary, setSummary] = useState<any>({ totalBalance: 0, monthlyIncome: 0, monthlyExpense: 0 });
  const [accounts, setAccounts] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [reminders, setReminders] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [debts, setDebts] = useState<any[]>([]);
  const [piggyBank, setPiggyBank] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Estados de Alcancía Infantil & Filtros Claros
  const [kidTxFilter, setKidTxFilter] = useState<'ALL' | 'INCOME' | 'EXPENSE' | 'SAVINGS'>('ALL');
  const [showNewGoalModal, setShowNewGoalModal] = useState(false);
  const [newGoalName, setNewGoalName] = useState('');
  const [newGoalTarget, setNewGoalTarget] = useState('50');
  const [newGoalEmoji, setNewGoalEmoji] = useState('🚲');
  const [creatingGoal, setCreatingGoal] = useState(false);

  const [showSaveToGoalModal, setShowSaveToGoalModal] = useState(false);
  const [selectedGoalForSave, setSelectedGoalForSave] = useState<any>(null);
  const [saveGoalAmount, setSaveGoalAmount] = useState('5');
  const [saveGoalNote, setSaveGoalNote] = useState('');
  const [savingToGoal, setSavingToGoal] = useState(false);
  const [kidFeedback, setKidFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // Estados de Modales
  const [showTxModal, setShowTxModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [txInitialType, setTxInitialType] = useState<'EXPENSE' | 'INCOME' | 'TRANSFER'>('EXPENSE');
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showEditAccountModal, setShowEditAccountModal] = useState(false);
  const [selectedAccountForEdit, setSelectedAccountForEdit] = useState<any>(null);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [showPayReminderModal, setShowPayReminderModal] = useState(false);
  const [selectedReminderForPay, setSelectedReminderForPay] = useState<any>(null);
  const [showPayDebtModal, setShowPayDebtModal] = useState(false);
  const [selectedDebtForPay, setSelectedDebtForPay] = useState<any>(null);

  // Estados de Modales de Auditoría
  const [showEditTxModal, setShowEditTxModal] = useState(false);
  const [selectedTxForEdit, setSelectedTxForEdit] = useState<any>(null);
  const [showVoidTxModal, setShowVoidTxModal] = useState(false);
  const [selectedTxForVoid, setSelectedTxForVoid] = useState<any>(null);

  const fetchData = useCallback(async () => {
    if (!getToken()) {
      router.push('/login');
      return;
    }

    try {
      const [sum, accs, txs, cats, rems, subs, dbts, piggy] = await Promise.all([
        apiFetch(`/api/transactions/summary?currency=${selectedCurrency}`).catch(() => ({ totalBalance: 0, monthlyIncome: 0, monthlyExpense: 0 })),
        apiFetch('/api/accounts').catch(() => []),
        apiFetch('/api/transactions?limit=25').catch(() => []),
        apiFetch('/api/categories').catch(() => []),
        apiFetch('/api/reminders').catch(() => []),
        apiFetch('/api/subscriptions').catch(() => ({ subscriptions: [] })),
        apiFetch('/api/debts').catch(() => []),
        apiFetch('/api/goals/piggy-bank').catch(() => null),
      ]);

      setSummary(sum);
      setAccounts(Array.isArray(accs) ? accs : []);
      setTransactions(Array.isArray(txs) ? txs : []);
      setCategories(Array.isArray(cats) ? cats : []);
      setReminders(Array.isArray(rems) ? rems : []);
      setSubscriptions(subs?.subscriptions || []);
      setDebts(Array.isArray(dbts) ? dbts : []);
      setPiggyBank(piggy);
    } catch (err) {
      console.error('Error cargando datos del dashboard:', err);
    } finally {
      setLoading(false);
    }
  }, [router, selectedCurrency]);

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

  // ⚡ Sincronización WebSockets en tiempo real
  useHouseholdSocket(household?.id, () => {
    fetchData();
  });

  // Atajos de teclado globales (G = Gasto, I = Ingreso, T = Transferencia)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = (document.activeElement?.tagName || '').toLowerCase();
      const isEditing =
        activeTag === 'input' ||
        activeTag === 'textarea' ||
        activeTag === 'select' ||
        (document.activeElement as HTMLElement)?.isContentEditable;

      if (isEditing) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      if (e.key === 'g' || e.key === 'G') {
        e.preventDefault();
        setTxInitialType('EXPENSE');
        setShowTxModal(true);
      } else if (e.key === 'i' || e.key === 'I') {
        e.preventDefault();
        setTxInitialType('INCOME');
        setShowTxModal(true);
      } else if (e.key === 't' || e.key === 'T') {
        e.preventDefault();
        setTxInitialType('TRANSFER');
        setShowTxModal(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleToggleReminder = (r: any) => {
    if (!r.isPaid) {
      setSelectedReminderForPay(r);
      setShowPayReminderModal(true);
      return;
    }

    apiFetch(`/api/reminders/${r.id}/toggle`, { method: 'PUT' })
      .then(() => fetchData())
      .catch((err) => alert(err.message || 'Error al cambiar recordatorio'));
  };

  const handleDeleteReminder = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    apiFetch(`/api/reminders/${id}`, { method: 'DELETE' })
      .then(() => fetchData())
      .catch((err) => alert(err.message || 'Error al eliminar recordatorio'));
  };

  const handleCreateTransaction = async (data: any) => {
    if (typeof window !== 'undefined' && !navigator.onLine) {
      enqueueOfflineTransaction(data);
      alert('⚡ Guardado sin conexión: Tu movimiento se guardó en este dispositivo y se sincronizará cuando vuelvas a tener red.');
      return;
    }

    try {
      await apiFetch('/api/transactions', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      await fetchData();
    } catch (err: any) {
      if (typeof window !== 'undefined' && (!navigator.onLine || err?.name === 'TypeError' || err?.message?.includes('Failed to fetch'))) {
        enqueueOfflineTransaction(data);
        alert('⚡ Sin conexión con el servidor: Movimiento guardado en cola local. Se sincronizará automáticamente.');
        return;
      }
      throw err;
    }
  };

  const handleCreateAccount = async (data: any) => {
    await apiFetch('/api/accounts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    await fetchData();
  };

  const handleUpdateAccount = async (accountId: string, data: any) => {
    await apiFetch(`/api/accounts/${accountId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    await fetchData();
  };

  const handleDeleteAccount = async (accountId: string) => {
    await apiFetch(`/api/accounts/${accountId}`, {
      method: 'DELETE',
    });
    await fetchData();
  };

  const handleConfirmPayDebt = async (debtId: string, data: { amount: number; accountId?: string; notes?: string }) => {
    await apiFetch(`/api/debts/${debtId}/pay`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    await fetchData();
  };

  const handleManualPayrollDeposit = async (accountId: string) => {
    try {
      const res = await apiFetch(`/api/accounts/${accountId}/payroll/deposit`, {
        method: 'POST',
      });
      await fetchData();
      alert(res?.message || 'Ingreso de nómina registrado con éxito.');
    } catch (err: any) {
      alert(err?.message || 'Error al abonar nómina.');
    }
  };

  const handleCreateReminder = async (data: any) => {
    await apiFetch('/api/reminders', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    await fetchData();
  };

  const handleConfirmPayReminder = async (reminderId: string, accountId: string) => {
    await apiFetch(`/api/reminders/${reminderId}/toggle`, {
      method: 'PUT',
      body: JSON.stringify({ accountId }),
    });
    await fetchData();
  };

  const handleSaveEditTx = async (txId: string, data: any) => {
    await apiFetch(`/api/transactions/${txId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    await fetchData();
  };

  const handleConfirmVoidTx = async (txId: string, voidReason: string) => {
    await apiFetch(`/api/transactions/${txId}/void`, {
      method: 'PUT',
      body: JSON.stringify({ voidReason }),
    });
    await fetchData();
  };

  const handleCreateKidGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalName.trim() || !newGoalTarget) return;
    setCreatingGoal(true);
    setKidFeedback(null);
    try {
      await apiFetch('/api/goals', {
        method: 'POST',
        body: JSON.stringify({
          name: newGoalName.trim(),
          targetAmount: parseFloat(newGoalTarget),
          emoji: newGoalEmoji,
        }),
      });
      setShowNewGoalModal(false);
      setNewGoalName('');
      setNewGoalTarget('50');
      setKidFeedback({ type: 'ok', text: `¡Objetivo "${newGoalName.trim()}" creado en tu alcancía!` });
      await fetchData();
    } catch (err: any) {
      setKidFeedback({ type: 'err', text: err?.message || 'No se pudo crear el objetivo.' });
    } finally {
      setCreatingGoal(false);
    }
  };

  const handleSaveToKidGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoalForSave || !saveGoalAmount) return;
    setSavingToGoal(true);
    setKidFeedback(null);
    try {
      await apiFetch(`/api/goals/${selectedGoalForSave.id}/contribute`, {
        method: 'POST',
        body: JSON.stringify({
          amount: parseFloat(saveGoalAmount),
          notes: saveGoalNote.trim() || undefined,
        }),
      });
      setShowSaveToGoalModal(false);
      setSelectedGoalForSave(null);
      setSaveGoalAmount('5');
      setSaveGoalNote('');
      setKidFeedback({ type: 'ok', text: `¡Genial! Guardaste $${parseFloat(saveGoalAmount).toFixed(2)} en tu alcancía.` });
      await fetchData();
    } catch (err: any) {
      setKidFeedback({ type: 'err', text: err?.message || 'No pudimos guardar en tu alcancía.' });
    } finally {
      setSavingToGoal(false);
    }
  };

  const getAccountIcon = (type: string) => {
    switch (type) {
      case 'PAYROLL':
        return <Briefcase className="w-4 h-4 text-emerald-400" />;
      case 'CASH':
        return <Banknote className="w-4 h-4 text-emerald-400" />;
      case 'CREDIT_CARD':
        return <CreditCard className="w-4 h-4 text-sky-400" />;
      case 'SAVINGS':
        return <PiggyBank className="w-4 h-4 text-amber-400" />;
      default:
        return <Landmark className="w-4 h-4 text-indigo-400" />;
    }
  };

  const isChildAccount = Boolean(
    household?.role === 'DEPENDENT' ||
      household?.isChildAccount ||
      user?.isChildAccount ||
      summary?.isChildAccount,
  );
  const childAccount = accounts[0] || null;
  const parentalControls =
    summary?.parentalControls ||
    childAccount?.parentalControls ||
    household?.parentalControls ||
    user?.parentalControls ||
    null;
  const linkedParentEmail =
    summary?.parentEmail ||
    parentalControls?.parentEmail ||
    household?.parentEmail ||
    user?.parentEmail ||
    null;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A1128] text-slate-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-3 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  if (isChildAccount) {
    const isFrozen = Boolean(parentalControls?.isFrozen);
    const maxSingle = Number(parentalControls?.maxSingleTransaction || 25);
    const maxDaily = Number(parentalControls?.maxDailySpend || 50);
    const todayExpense = Number(summary?.todayExpense || 0);
    const dailyPct = maxDaily > 0 ? Math.min(100, Math.round((todayExpense / maxDaily) * 100)) : 0;
    const spendableBalance = Number(childAccount?.balance ?? summary?.totalBalance ?? 0);
    const piggyBankGoals = Array.isArray(piggyBank?.goals) ? piggyBank.goals : [];
    const totalSavedInPiggyBank = Number(
      piggyBank?.totalSavedInPiggyBank ?? summary?.piggyBankTotal ?? 0,
    );
    const allowSavingsGoals = parentalControls?.allowSavingsGoals !== false;

    const filteredKidTransactions = transactions.filter((tx) => {
      if (kidTxFilter === 'INCOME') return tx.type === 'INCOME';
      if (kidTxFilter === 'SAVINGS') return tx.movementKind === 'SAVINGS_DEPOSIT';
      if (kidTxFilter === 'EXPENSE') {
        return tx.type !== 'INCOME' && tx.movementKind !== 'SAVINGS_DEPOSIT';
      }
      return true;
    });

    const getKidMovementMeta = (tx: any) => {
      const kind = tx.movementKind || (tx.type === 'INCOME' ? 'INCOME' : 'EXPENSE');
      if (kind === 'MISSION_REWARD') {
        return {
          badge: tx.movementLabel || 'Premio de Misión',
          icon: <Trophy className="w-5 h-5" />,
          boxClass: 'bg-amber-50 border-amber-300 text-amber-700',
          badgeClass: 'bg-amber-100 text-amber-900',
        };
      }
      if (kind === 'ALLOWANCE') {
        return {
          badge: tx.movementLabel || 'Mesada Recibida',
          icon: <Coins className="w-5 h-5" />,
          boxClass: 'bg-emerald-50 border-emerald-300 text-emerald-700',
          badgeClass: 'bg-emerald-100 text-emerald-900',
        };
      }
      if (kind === 'PARENT_TOPUP') {
        return {
          badge: tx.movementLabel || 'Recarga de Tutor',
          icon: <Gift className="w-5 h-5" />,
          boxClass: 'bg-sky-50 border-sky-300 text-sky-700',
          badgeClass: 'bg-sky-100 text-sky-900',
        };
      }
      if (kind === 'SAVINGS_DEPOSIT') {
        return {
          badge: tx.movementLabel || 'Guardado en Alcancía',
          icon: <PiggyBank className="w-5 h-5" />,
          boxClass: 'bg-violet-50 border-violet-300 text-violet-700',
          badgeClass: 'bg-violet-100 text-violet-900',
        };
      }
      if (tx.type === 'INCOME') {
        return {
          badge: tx.movementLabel || 'Dinero recibido',
          icon: <ArrowUpRight className="w-5 h-5" />,
          boxClass: 'bg-emerald-50 border-emerald-200 text-emerald-700',
          badgeClass: 'bg-emerald-100 text-emerald-900',
        };
      }
      return {
        badge: tx.movementLabel || 'Compra',
        icon: <ShoppingBag className="w-5 h-5" />,
        boxClass: 'bg-rose-50 border-rose-200 text-rose-700',
        badgeClass: 'bg-rose-100 text-rose-900',
      };
    };

    return (
      <div className="kids-stage pb-24 lg:pb-14">
        <Navbar user={user} household={household} unreadNotifications={0} />

        <main className="max-w-4xl mx-auto px-4 py-6 sm:py-8 space-y-8">
          {kidFeedback && (
            <div
              className={`rounded-2xl px-4 py-3 border-2 flex items-center justify-between gap-3 text-sm font-bold ${
                kidFeedback.type === 'ok'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                  : 'bg-rose-50 border-rose-300 text-rose-900'
              }`}
            >
              <span>{kidFeedback.text}</span>
              <button
                onClick={() => setKidFeedback(null)}
                className="p-1 rounded-lg hover:bg-black/5 cursor-pointer"
                aria-label="Cerrar aviso"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Tarjeta Principal Transparente de Mi Cuenta + Alcancía */}
          <section className="kids-hero-card p-6 sm:p-8 relative overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-start sm:items-center gap-4">
                <PiggyBuddyIllustration className="w-20 h-20 sm:w-24 sm:h-24 shrink-0" />
                <div className="space-y-2">
                  <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1E1B4B] tracking-tight leading-tight">
                    ¡Hola, {user?.fullName || 'Campeón'}!
                  </h1>
                  <p className="text-sm text-slate-700 max-w-md leading-relaxed">
                    Tu cuenta está cuidada junto a{' '}
                    <strong className="text-[#0369A1]">{linkedParentEmail || 'tu tutor'}</strong>. Aquí ves claro cada peso que entra, sale o ahorras.
                  </p>
                  <p
                    className={`text-[13px] font-bold flex items-center gap-1.5 ${
                      isFrozen ? 'text-rose-700' : 'text-emerald-700'
                    }`}
                  >
                    {isFrozen ? (
                      <>
                        <Lock className="w-4 h-4 shrink-0" />
                        <span>Cuenta pausada temporalmente por tu tutor</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4 shrink-0" />
                        <span>Cuenta activa y lista para usar</span>
                      </>
                    )}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 gap-3 sm:min-w-[250px]">
                <div className="bg-emerald-50 border-2 border-emerald-300 rounded-3xl p-4 md:text-right shadow-sm">
                  <p className="text-[13px] font-bold text-emerald-900">
                    Disponible para gastar
                  </p>
                  <p className="text-3xl font-extrabold text-emerald-700 tabular-nums mt-1 leading-none">
                    ${spendableBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-[13px] font-medium text-emerald-800/85 mt-1.5">
                    {childAccount?.name || 'Mi Cuenta'} ({childAccount?.currency || 'USD'})
                  </p>
                </div>

                <div className="bg-violet-50 border-2 border-violet-300 rounded-3xl p-4 md:text-right shadow-sm">
                  <p className="text-[13px] font-bold text-violet-900">
                    Guardado en tu alcancía
                  </p>
                  <p className="text-2xl font-extrabold text-violet-700 tabular-nums mt-1 leading-none">
                    ${totalSavedInPiggyBank.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-[13px] font-medium text-violet-800/85 mt-1.5">
                    {piggyBankGoals.length} {piggyBankGoals.length === 1 ? 'objetivo activo' : 'objetivos activos'}
                  </p>
                </div>
              </div>
            </div>

            {/* Resumen Transparente del Mes */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 pt-5 border-t-2 border-amber-200/80">
              <div className="p-3.5 rounded-2xl bg-emerald-50/90 border border-emerald-200">
                <p className="text-[13px] font-bold text-emerald-900">Recibido este mes</p>
                <p className="text-xl font-extrabold text-emerald-700 tabular-nums mt-0.5">
                  +${Number(summary?.monthlyIncome || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-[13px] text-emerald-800/80 mt-0.5">Misiones, mesada y recargas</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-rose-50/90 border border-rose-200">
                <p className="text-[13px] font-bold text-rose-900">Gastado este mes</p>
                <p className="text-xl font-extrabold text-rose-700 tabular-nums mt-0.5">
                  -${Number(summary?.monthlyExpense || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-[13px] text-rose-800/80 mt-0.5">Compras registradas</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-amber-50/95 border border-amber-200">
                <p className="text-[13px] font-bold text-amber-900">Límite diario de compras</p>
                <p className="text-xl font-extrabold text-[#1E1B4B] tabular-nums mt-0.5">
                  ${todayExpense.toFixed(2)} / ${maxDaily.toFixed(2)}
                </p>
                <div className="w-full h-2.5 rounded-full bg-amber-200/70 overflow-hidden mt-2">
                  <div
                    className={`h-full rounded-full ${
                      dailyPct >= 90 ? 'bg-rose-500' : dailyPct >= 65 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{
                      width: `${dailyPct}%`,
                      transition: 'width 240ms cubic-bezier(0.22, 1, 0.36, 1)',
                    }}
                  />
                </div>
                <p className="text-[13px] text-slate-700 mt-1">
                  Máx. ${maxSingle.toFixed(2)} por compra
                </p>
              </div>
            </div>

            {/* Botones de Acción Amigables */}
            <div className="flex flex-wrap items-center gap-3 mt-6">
              <button
                disabled={isFrozen}
                onClick={() => {
                  setTxInitialType('EXPENSE');
                  setShowTxModal(true);
                }}
                className="kids-btn-coral px-5 py-3 disabled:opacity-50 font-bold text-sm flex items-center gap-2 cursor-pointer"
              >
                <ArrowDownRight className="w-4 h-4" />
                <span>Registrar una compra</span>
              </button>

              {allowSavingsGoals && (
                <button
                  disabled={isFrozen}
                  onClick={() => setShowNewGoalModal(true)}
                  className="kids-btn-sunny px-5 py-3 disabled:opacity-50 font-bold text-sm flex items-center gap-2 cursor-pointer"
                >
                  <PiggyBank className="w-4 h-4" />
                  <span>Nuevo objetivo de ahorro</span>
                </button>
              )}

              <Link
                href="/dashboard/family"
                className="px-5 py-3 rounded-2xl bg-sky-100 hover:bg-sky-200 border-2 border-sky-300 text-[#1E1B4B] font-bold text-sm flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-sky-700" />
                <span>Mis misiones y mesada</span>
              </Link>
            </div>
          </section>

          {/* 🐷 Mi Alcancía de Ahorros con Objetivos */}
          <section className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-violet-100 border-2 border-violet-300 flex items-center justify-center text-violet-700">
                  <PiggyBank className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-[#1E1B4B]">
                    Mi Alcancía con Objetivos
                  </h2>
                  <p className="text-sm text-slate-600">
                    Aparta dinero para tus metas; tu tutor también puede hacerte abonos directos aquí.
                  </p>
                </div>
              </div>

              {allowSavingsGoals && (
                <button
                  onClick={() => setShowNewGoalModal(true)}
                  className="px-4 py-2 rounded-2xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Crear meta</span>
                </button>
              )}
            </div>

            {piggyBankGoals.length === 0 ? (
              <div className="kids-card p-6 sm:p-8 text-center space-y-3">
                <p className="text-lg font-extrabold text-[#1E1B4B]">
                  ¡Empieza tu primer objetivo de ahorro!
                </p>
                <p className="text-sm text-slate-600 max-w-md mx-auto">
                  Elige algo que quieras lograr (una bicicleta, un juego o un regalo) y guarda poco a poco desde tu saldo o recibe abonos de tu tutor.
                </p>
                {allowSavingsGoals && (
                  <button
                    onClick={() => setShowNewGoalModal(true)}
                    className="kids-btn-sunny px-5 py-2.5 text-sm font-bold inline-flex items-center gap-2 cursor-pointer"
                  >
                    <Target className="w-4 h-4" />
                    <span>Crear mi primera meta</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {piggyBankGoals.map((goal: any) => {
                  const pct = Math.min(100, Number(goal.percentage || 0));
                  return (
                    <div key={goal.id} className="kids-card p-5 flex flex-col justify-between gap-4">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <span className="text-3xl leading-none">{goal.emoji || '🐷'}</span>
                            <div>
                              <h3 className="text-base font-extrabold text-[#1E1B4B]">
                                {goal.name}
                              </h3>
                              <p className="text-sm text-slate-600 tabular-nums">
                                Llevas <strong className="text-violet-700">${Number(goal.currentAmount).toFixed(2)}</strong> de ${Number(goal.targetAmount).toFixed(2)}
                              </p>
                            </div>
                          </div>
                          <span
                            className={`px-2.5 py-1 rounded-full text-[13px] font-extrabold tabular-nums ${
                              goal.isCompleted
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-violet-100 text-violet-900'
                            }`}
                          >
                            {goal.isCompleted ? '¡Logrado!' : `${pct}%`}
                          </span>
                        </div>

                        <div className="w-full h-3.5 rounded-full bg-violet-100 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              goal.isCompleted ? 'bg-emerald-500' : 'bg-violet-500'
                            }`}
                            style={{
                              width: `${pct}%`,
                              transition: 'width 240ms cubic-bezier(0.22, 1, 0.36, 1)',
                            }}
                          />
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2 text-[13px] text-slate-700">
                          <span>
                            {goal.remainingAmount > 0
                              ? `Faltan $${Number(goal.remainingAmount).toFixed(2)}`
                              : 'Meta completada al 100%'}
                          </span>
                          {(goal.childSavedTotal > 0 || goal.parentDepositedTotal > 0) && (
                            <span className="font-semibold text-violet-800 tabular-nums">
                              Tú: ${Number(goal.childSavedTotal || 0).toFixed(2)} · Tutor: ${Number(goal.parentDepositedTotal || 0).toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        disabled={isFrozen || spendableBalance <= 0}
                        onClick={() => {
                          setSelectedGoalForSave(goal);
                          setSaveGoalAmount(spendableBalance >= 5 ? '5' : spendableBalance.toFixed(2));
                          setSaveGoalNote('');
                          setShowSaveToGoalModal(true);
                        }}
                        className="w-full py-2.5 px-4 rounded-2xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-bold text-sm cursor-pointer flex items-center justify-center gap-2"
                      >
                        <PiggyBank className="w-4 h-4" />
                        <span>Guardar dinero aquí</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {Array.isArray(piggyBank?.recentDeposits) && piggyBank.recentDeposits.length > 0 && (
              <div className="kids-card p-4 space-y-2.5">
                <h3 className="text-sm font-extrabold text-[#1E1B4B]">
                  Últimos abonos a tu alcancía
                </h3>
                <div className="space-y-2">
                  {piggyBank.recentDeposits.slice(0, 5).map((dep: any) => (
                    <div
                      key={dep.id}
                      className="flex items-center justify-between gap-3 py-2 border-b border-amber-100 last:border-b-0 text-sm"
                    >
                      <div className="min-w-0">
                        <p className="font-bold text-[#1E1B4B] truncate">
                          {dep.emoji || '🐷'} {dep.goalName || 'Alcancía'} —{' '}
                          <span className="font-semibold text-slate-700">
                            {dep.depositSource === 'PARENT_DIRECT'
                              ? `Abono directo de ${dep.actorName}`
                              : 'Ahorraste desde tu cuenta'}
                          </span>
                        </p>
                        {dep.note && (
                          <p className="text-[13px] text-slate-600 truncate">{dep.note}</p>
                        )}
                      </div>
                      <span className="font-extrabold text-emerald-700 tabular-nums shrink-0">
                        +${Number(dep.amount).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Movimientos de la Cuenta (Transparentes y Claros) */}
          <section className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-sky-100 border-2 border-sky-300 flex items-center justify-center text-sky-700">
                  <Wallet className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-extrabold text-[#1E1B4B]">
                  Tus últimos movimientos
                </h2>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {(
                  [
                    { key: 'ALL', label: 'Todos' },
                    { key: 'INCOME', label: 'Entradas (+)' },
                    { key: 'EXPENSE', label: 'Compras (-)' },
                    { key: 'SAVINGS', label: 'Alcancía' },
                  ] as const
                ).map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setKidTxFilter(f.key)}
                    className={`px-3 py-1.5 rounded-full text-[13px] font-bold cursor-pointer ${
                      kidTxFilter === f.key
                        ? 'bg-[#1E1B4B] text-white'
                        : 'bg-white/80 border border-amber-200 text-[#1E1B4B] hover:bg-amber-50'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {filteredKidTransactions.length === 0 ? (
              <div className="kids-card p-8 text-center space-y-2">
                <p className="text-base font-bold text-[#1E1B4B]">
                  No hay movimientos en esta vista todavía
                </p>
                <p className="text-sm text-slate-600">
                  Aquí verás con claridad cada premio de misión (+), mesada (+), compra (-) o ahorro a tu alcancía.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredKidTransactions.map((tx) => {
                  const meta = getKidMovementMeta(tx);
                  const isIncome = tx.type === 'INCOME';
                  const isSavingsTransfer = tx.movementKind === 'SAVINGS_DEPOSIT';
                  return (
                    <div
                      key={tx.id}
                      className="kids-card p-4 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center space-x-3.5 min-w-0">
                        <div
                          className={`w-11 h-11 rounded-2xl flex items-center justify-center border-2 shrink-0 ${meta.boxClass}`}
                        >
                          {meta.icon}
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[13px] font-bold ${meta.badgeClass}`}
                            >
                              {meta.badge}
                            </span>
                            <span className="text-[13px] text-slate-600 tabular-nums">
                              {new Date(tx.date).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm font-bold text-[#1E1B4B] mt-1 truncate">
                            {tx.description || meta.badge}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p
                          className={`text-base font-extrabold tabular-nums ${
                            isIncome
                              ? 'text-emerald-700'
                              : isSavingsTransfer
                              ? 'text-violet-700'
                              : 'text-rose-600'
                          }`}
                        >
                          {isIncome ? '+' : '-'}$
                          {Number(tx.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-[13px] font-semibold text-slate-600">
                          {isIncome ? 'Entró a tu saldo' : isSavingsTransfer ? 'Pasó a alcancía' : 'Salió de tu saldo'}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </main>

        {/* Modal Crear Objetivo en Alcancía Infantil */}
        {showNewGoalModal && (
          <div className="fixed inset-0 bg-[#1E1B4B]/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="kids-hero-card w-full max-w-md p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-extrabold text-[#1E1B4B]">
                  🐷 Nuevo objetivo de ahorro
                </h3>
                <button
                  onClick={() => setShowNewGoalModal(false)}
                  className="p-1.5 rounded-xl hover:bg-amber-100 text-[#1E1B4B] cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateKidGoal} className="space-y-4">
                <div>
                  <label className="block text-[13px] font-bold text-[#1E1B4B] mb-1.5">
                    Elige un ícono para tu meta
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {['🚲', '🎮', '🎸', '⚽', '📚', '🛹', '🎨', '🐷'].map((emoji) => (
                      <button
                        type="button"
                        key={emoji}
                        onClick={() => setNewGoalEmoji(emoji)}
                        className={`w-11 h-11 rounded-2xl text-2xl flex items-center justify-center border-2 cursor-pointer ${
                          newGoalEmoji === emoji
                            ? 'bg-violet-100 border-violet-500'
                            : 'bg-white border-amber-200'
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[13px] font-bold text-[#1E1B4B] mb-1">
                    ¿Para qué quieres ahorrar? *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Bicicleta nueva"
                    value={newGoalName}
                    onChange={(e) => setNewGoalName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-white border-2 border-amber-200 text-sm font-semibold text-[#1E1B4B]"
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-bold text-[#1E1B4B] mb-1">
                    ¿Cuánto cuesta tu meta? ($) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    value={newGoalTarget}
                    onChange={(e) => setNewGoalTarget(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-white border-2 border-amber-200 text-lg font-extrabold text-violet-700 tabular-nums"
                  />
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowNewGoalModal(false)}
                    className="flex-1 py-2.5 rounded-2xl bg-slate-100 text-sm font-bold text-slate-700 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={creatingGoal}
                    className="flex-1 py-2.5 rounded-2xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold cursor-pointer"
                  >
                    {creatingGoal ? 'Creando...' : 'Crear objetivo'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Guardar Dinero en Alcancía */}
        {showSaveToGoalModal && selectedGoalForSave && (
          <div className="fixed inset-0 bg-[#1E1B4B]/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="kids-hero-card w-full max-w-md p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-extrabold text-[#1E1B4B]">
                  {selectedGoalForSave.emoji || '🐷'} Guardar en &ldquo;{selectedGoalForSave.name}&rdquo;
                </h3>
                <button
                  onClick={() => setShowSaveToGoalModal(false)}
                  className="p-1.5 rounded-xl hover:bg-amber-100 text-[#1E1B4B] cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-50 border-2 border-emerald-200 text-sm text-emerald-900">
                Tu dinero disponible para ahorrar es{' '}
                <strong className="tabular-nums">${spendableBalance.toFixed(2)}</strong>. Este monto pasará de tu saldo disponible a tu alcancía.
              </div>

              <form onSubmit={handleSaveToKidGoal} className="space-y-4">
                <div>
                  <label className="block text-[13px] font-bold text-[#1E1B4B] mb-1.5">
                    ¿Cuánto quieres guardar hoy? ($) *
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {[1, 5, 10, 20].map((preset) => (
                      <button
                        type="button"
                        key={preset}
                        disabled={spendableBalance < preset}
                        onClick={() => setSaveGoalAmount(String(preset))}
                        className="px-3 py-1.5 rounded-full bg-violet-100 hover:bg-violet-200 disabled:opacity-40 text-violet-900 text-sm font-bold cursor-pointer"
                      >
                        ${preset}
                      </button>
                    ))}
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    min="0.50"
                    max={spendableBalance > 0 ? spendableBalance : undefined}
                    required
                    value={saveGoalAmount}
                    onChange={(e) => setSaveGoalAmount(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-white border-2 border-violet-200 text-lg font-extrabold text-violet-700 tabular-nums"
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-bold text-[#1E1B4B] mb-1">
                    Nota (opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Premio de mi misión de hoy"
                    value={saveGoalNote}
                    onChange={(e) => setSaveGoalNote(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-white border-2 border-amber-200 text-sm text-[#1E1B4B]"
                  />
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowSaveToGoalModal(false)}
                    className="flex-1 py-2.5 rounded-2xl bg-slate-100 text-sm font-bold text-slate-700 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={savingToGoal}
                    className="flex-1 py-2.5 rounded-2xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold cursor-pointer"
                  >
                    {savingToGoal ? 'Guardando...' : 'Guardar en alcancía'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <TransactionModal
          isOpen={showTxModal}
          onClose={() => setShowTxModal(false)}
          accounts={accounts}
          categories={categories}
          initialType="EXPENSE"
          isChildMode={true}
          onSubmit={handleCreateTransaction}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A1128] text-slate-100 pb-20 lg:pb-12">
      <Navbar
        user={user}
        household={household}
        unreadNotifications={reminders.filter((r) => !r.isPaid).length}
      />

      <main className="max-w-7xl mx-auto px-4 py-6 sm:py-8 space-y-6">
        {/* Quick Actions Panel */}
        <section className="mint-card p-5 sm:p-6 border border-[#1E2B4D] relative overflow-hidden bg-gradient-to-r from-[#101A36] via-[#121E40] to-[#101A36]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight">
                Control Financiero Familiar
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Registra tus movimientos en segundos para mantener las cuentas claras en el hogar.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={() => {
                  setTxInitialType('EXPENSE');
                  setShowTxModal(true);
                }}
                className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                <ArrowDownRight className="w-4 h-4 text-rose-400" />
                <span>Gasto <kbd className="hidden md:inline px-1 py-0.5 rounded bg-rose-950/60 text-[10px] text-rose-300 font-mono">G</kbd></span>
              </button>

              <button
                onClick={() => {
                  setTxInitialType('INCOME');
                  setShowTxModal(true);
                }}
                className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                <ArrowUpRight className="w-4 h-4 text-white" />
                <span>Ingreso <kbd className="hidden md:inline px-1 py-0.5 rounded bg-emerald-800 text-[10px] text-emerald-100 font-mono">I</kbd></span>
              </button>

              <button
                onClick={() => {
                  setTxInitialType('TRANSFER');
                  setShowTxModal(true);
                }}
                className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-[#162347] hover:bg-[#1D2D5A] text-slate-300 border border-[#1E2B4D] font-semibold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                <ArrowLeftRight className="w-4 h-4 text-sky-400" />
                <span>Transferir <kbd className="hidden md:inline px-1 py-0.5 rounded bg-[#101A36] text-[10px] text-slate-400 font-mono">T</kbd></span>
              </button>

              <button
                onClick={() => setShowImportModal(true)}
                className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-[#162347] hover:bg-[#1D2D5A] text-slate-300 border border-[#1E2B4D] font-semibold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                title="Subir extracto bancario CSV / Excel para carga masiva"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <span>Importar Extracto</span>
              </button>

              <button
                onClick={() => setShowReceiptModal(true)}
                className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-[#162347] hover:bg-[#1D2D5A] text-slate-300 border border-[#1E2B4D] font-semibold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                title="Escanear ticket o recibo de compra con OCR inteligente"
              >
                <Camera className="w-4 h-4 text-purple-400" />
                <span>Escanear Ticket</span>
              </button>
            </div>
          </div>
        </section>

        {/* ⚡ Barra de Entrada Rápida Inline */}
        <QuickEntryBar
          accounts={accounts}
          categories={categories}
          onSubmit={handleCreateTransaction}
          onRefresh={fetchData}
          onOpenModal={(type) => {
            setTxInitialType(type);
            setShowTxModal(true);
          }}
        />

        {/* 📊 KPI Cards */}
        <KPICards
          summary={summary}
          selectedCurrency={selectedCurrency}
          onCurrencyChange={(curr) => setSelectedCurrency(curr)}
        />

        {/* 📈 Flujo de Caja Predictivo & Salud Financiera Familiar */}
        <CashFlowProjection
          summary={summary}
          accounts={accounts}
          reminders={reminders}
          subscriptions={subscriptions}
          debts={debts}
          selectedCurrency={selectedCurrency}
        />

        {/* ⏰ Recordatorios de Pago */}
        <div className="mint-card p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm sm:text-base font-semibold text-slate-100 flex items-center gap-2">
              <CalendarClock className="w-4 h-4 text-emerald-400" />
              <span>Próximos Vencimientos y Pagos</span>
            </h3>
            <div className="flex items-center space-x-3">
              <span className="text-xs text-slate-400 tabular-nums">
                {reminders.filter((r) => !r.isPaid).length} pendientes
              </span>
              <button
                onClick={() => setShowReminderModal(true)}
                className="px-3 py-1.5 rounded-lg bg-[#162347] hover:bg-[#1D2D5A] text-emerald-300 border border-emerald-500/30 text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nuevo Recordatorio</span>
              </button>
            </div>
          </div>

          {reminders.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              No tienes pagos programados ni vencimientos pendientes este mes.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {reminders.map((r) => (
                <div
                  key={r.id}
                  onClick={() => handleToggleReminder(r)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer relative group ${
                    r.isPaid
                      ? 'bg-[#0A1128]/50 border-[#1E2B4D]/60 opacity-60'
                      : 'bg-[#162347]/80 border-[#1E2B4D] hover:border-emerald-500/40 hover:bg-[#162347]'
                  }`}
                >
                  <button
                    onClick={(e) => handleDeleteReminder(e, r.id)}
                    className="absolute top-2.5 right-2.5 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                    title="Eliminar recordatorio"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  <div className="flex items-center justify-between mb-2 pr-5">
                    <span className="text-xs font-semibold text-slate-200 truncate">{r.title}</span>
                    <span
                      className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                        r.isPaid ? 'bg-emerald-500 text-[#0A1128]' : 'border border-[#1E2B4D] text-transparent'
                      }`}
                    >
                      {r.isPaid && <Check className="w-3 h-3 stroke-[3]" />}
                    </span>
                  </div>
                  <p className={`text-base font-bold tabular-nums ${r.isPaid ? 'text-slate-500 line-through' : 'text-slate-100'}`}>
                    ${Number(r.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1 tabular-nums">
                    Vence: {new Date(r.dueDate).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Accounts & Transactions Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cuentas */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1">
              <div className="flex items-center gap-2">
                <Landmark className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-semibold text-slate-100">Cuentas Financieras</h3>
              </div>
              <button
                onClick={() => setShowAccountModal(true)}
                className="px-2.5 py-1 rounded-lg bg-[#162347] hover:bg-[#1D2D5A] text-emerald-300 border border-emerald-500/30 text-[11px] font-medium transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Nueva</span>
              </button>
            </div>

            {accounts.length === 0 ? (
              <div className="mint-card p-6 text-center text-slate-400 text-xs">
                No tienes cuentas registradas.{' '}
                <button
                  onClick={() => setShowAccountModal(true)}
                  className="text-emerald-400 font-semibold underline cursor-pointer ml-1"
                >
                  Crea una aquí
                </button>
              </div>
            ) : (
              accounts.map((acc) => {
                const isPayroll = acc.type === 'PAYROLL';
                const isCreditCard = acc.type === 'CREDIT_CARD';
                const hasPayrollConfig = isPayroll && acc.payrollAmount && Number(acc.payrollAmount) > 0;
                const linkedDebt = acc.debts && acc.debts.length > 0 ? acc.debts[0] : null;

                return (
                  <div
                    key={acc.id}
                    className={`mint-card p-3.5 space-y-2.5 transition-colors group border ${
                      isPayroll
                        ? 'border-emerald-500/30 bg-gradient-to-br from-[#101A36] to-emerald-950/15'
                        : isCreditCard
                        ? 'border-amber-500/30 bg-gradient-to-br from-[#101A36] to-amber-950/15'
                        : 'border-[#1E2B4D] hover:border-[#2D3E6B]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${
                          isPayroll
                            ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                            : isCreditCard
                            ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                            : 'bg-[#162347] border-[#1E2B4D]'
                        }`}>
                          {getAccountIcon(acc.type)}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="text-xs font-semibold text-slate-100">{acc.name}</p>
                            {isPayroll && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                                Nómina
                              </span>
                            )}
                            {isCreditCard && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                                <CreditCard className="w-2.5 h-2.5" />
                                Tarjeta • Deuda Vinculada
                              </span>
                            )}
                            {acc.isChildAccount && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                                <ShieldCheck className="w-2.5 h-2.5" />
                                Cuenta de Niño • {acc.parentalControls?.isFrozen ? 'Pausada' : 'Control Parental'}
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">
                            {acc.isChildAccount
                              ? `Niño: ${acc.childName || 'Hijo/a'} • Tutor: ${acc.parentEmail || ''}`
                              : isPayroll
                              ? 'Cuenta de Nómina'
                              : isCreditCard
                              ? 'Tarjeta de Crédito'
                              : acc.type.replace('_', ' ')}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <p className={`text-sm font-bold tabular-nums ${Number(acc.balance) < 0 ? 'text-rose-400' : 'text-slate-100'}`}>
                            ${Number(acc.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </p>
                          <p className="text-[10px] text-slate-400">{acc.currency}</p>
                        </div>

                        <button
                          onClick={() => {
                            setSelectedAccountForEdit(acc);
                            setShowEditAccountModal(true);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg bg-[#162347] hover:bg-[#1D2D5A] text-slate-400 hover:text-emerald-300 border border-[#1E2B4D] transition-all cursor-pointer"
                          title="Configurar cuenta"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Fila de detalles para cuenta de nómina */}
                    {isPayroll && (
                      <div className="pt-2 border-t border-[#1E2B4D]/60 flex items-center justify-between text-[11px]">
                        <div className="text-slate-300 flex items-center gap-1.5">
                          {hasPayrollConfig ? (
                            <span>
                              Fijo: <strong className="text-emerald-400 font-semibold tabular-nums">
                                ${Number(acc.payrollAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                              </strong>{' '}
                              <span className="text-slate-400">
                                ({acc.payrollFrequency === 'BIWEEKLY' ? `quincenal • días ${acc.payrollDay1 || 15} y ${acc.payrollDay2 || 30}` : `mensual • día ${acc.payrollDay1 || 30}`})
                              </span>
                            </span>
                          ) : (
                            <span className="text-amber-400 font-medium">Sin monto fijo configurado</span>
                          )}
                        </div>

                        {hasPayrollConfig && (
                          <button
                            onClick={() => handleManualPayrollDeposit(acc.id)}
                            className="px-2 py-0.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-[10px] font-semibold transition-all cursor-pointer shadow-xs"
                            title="Abonar el sueldo de nómina en esta cuenta inmediatamente"
                          >
                            + Cobrar Nómina
                          </button>
                        )}
                      </div>
                    )}

                    {/* Fila de detalles para tarjeta de crédito con deuda vinculada */}
                    {isCreditCard && linkedDebt && (
                      <div className="pt-2 border-t border-[#1E2B4D]/60 space-y-2 text-[11px]">
                        <div className="flex items-center justify-between text-slate-300">
                          <span>
                            Límite: <strong className="text-slate-100 font-semibold tabular-nums">
                              ${Number(linkedDebt.totalAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </strong>
                          </span>
                          <span className="text-rose-400 font-medium tabular-nums">
                            Deuda: ${Number(linkedDebt.remainingAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </span>
                        </div>

                        {/* Barra de utilización de crédito */}
                        <div className="space-y-0.5">
                          <div className="flex justify-between text-[10px] text-slate-400">
                            <span>
                              Utilización: {Number(linkedDebt.totalAmount) > 0 ? Math.round((Number(linkedDebt.remainingAmount) / Number(linkedDebt.totalAmount)) * 100) : 0}%
                            </span>
                            {linkedDebt.minimumPayment && (
                              <span className="tabular-nums">
                                Mínimo: ${Number(linkedDebt.minimumPayment).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                              </span>
                            )}
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-[#0A1128] overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                Number(linkedDebt.remainingAmount) / (Number(linkedDebt.totalAmount) || 1) > 0.7
                                  ? 'bg-gradient-to-r from-amber-500 to-rose-500'
                                  : 'bg-gradient-to-r from-emerald-500 to-amber-400'
                              }`}
                              style={{
                                width: `${Math.min(100, Number(linkedDebt.totalAmount) > 0 ? Math.round((Number(linkedDebt.remainingAmount) / Number(linkedDebt.totalAmount)) * 100) : 0)}%`,
                              }}
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                          <span>
                            {linkedDebt.cutoffDay ? `Corte: día ${linkedDebt.cutoffDay}` : ''}
                            {linkedDebt.cutoffDay && linkedDebt.paymentDueDay ? ' • ' : ''}
                            {linkedDebt.paymentDueDay ? `Límite: día ${linkedDebt.paymentDueDay}` : ''}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <Link
                              href="/dashboard/commitments"
                              className="px-2 py-0.5 rounded-lg bg-[#162347] hover:bg-[#1D2D5A] text-slate-300 hover:text-white border border-[#1E2B4D] transition-colors"
                            >
                              Detalles
                            </Link>
                            <button
                              onClick={() => {
                                setSelectedDebtForPay(linkedDebt);
                                setShowPayDebtModal(true);
                              }}
                              className="px-2 py-0.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 font-semibold transition-all cursor-pointer shadow-xs"
                              title="Abonar a esta tarjeta de crédito"
                            >
                              Abonar Tarjeta
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Transacciones Recientes */}
          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-center justify-between pb-1">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-semibold text-slate-100">Últimos Movimientos</h3>
              </div>
              <Link
                href="/dashboard/reports"
                className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1 transition-colors"
              >
                <span>Ver historial</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {transactions.length === 0 ? (
              <div className="mint-card p-10 text-center text-slate-400 text-xs">
                No hay movimientos registrados recientemente.
              </div>
            ) : (
              <div className="space-y-2">
                {transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className={`mint-card p-3.5 flex items-center justify-between transition-colors group ${
                      tx.isVoided
                        ? 'opacity-40 bg-rose-950/5 border-rose-900/30'
                        : 'hover:border-[#2D3E6B]'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
                        tx.type === 'INCOME'
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                          : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                      }`}>
                        {tx.type === 'INCOME' ? (
                          <ArrowUpRight className="w-4 h-4" />
                        ) : (
                          <ArrowDownRight className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className={`text-xs font-semibold ${tx.isVoided ? 'line-through text-slate-500' : 'text-slate-100'}`}>
                            {tx.description || (tx.type === 'INCOME' ? 'Ingreso General' : 'Gasto General')}
                          </p>
                          {tx.isVoided && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider bg-rose-500/15 text-rose-300 border border-rose-500/30">
                              Anulado
                            </span>
                          )}
                          {tx.isEdited && !tx.isVoided && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/30">
                              Editado
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400">
                          {tx.account?.name} • {new Date(tx.date).toLocaleDateString()}
                          {tx.createdBy?.fullName || tx.createdBy?.email
                            ? ` • ${tx.createdBy?.fullName || tx.createdBy?.email.split('@')[0]}`
                            : ''}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p
                          className={`text-xs font-bold tabular-nums ${
                            tx.isVoided
                              ? 'text-slate-500 line-through'
                              : tx.type === 'INCOME'
                              ? 'text-emerald-400'
                              : 'text-rose-400'
                          }`}
                        >
                          {tx.type === 'INCOME' ? '+' : '-'}${Number(tx.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-[10px] text-slate-400">{tx.category?.name || 'General'}</p>
                      </div>

                      {!tx.isVoided && (
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                          <button
                            onClick={() => {
                              setSelectedTxForEdit(tx);
                              setShowEditTxModal(true);
                            }}
                            className="p-1 rounded-lg bg-[#162347] hover:bg-amber-950/40 text-slate-400 hover:text-amber-300 border border-[#1E2B4D] transition-colors cursor-pointer"
                            title="Editar Transacción"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedTxForVoid(tx);
                              setShowVoidTxModal(true);
                            }}
                            className="p-1 rounded-lg bg-[#162347] hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-[#1E2B4D] transition-colors cursor-pointer"
                            title="Anular Transacción"
                          >
                            <Ban className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modales */}
      <TransactionModal
        isOpen={showTxModal}
        onClose={() => setShowTxModal(false)}
        accounts={accounts}
        categories={categories}
        initialType={txInitialType}
        onSubmit={handleCreateTransaction}
      />

      <AccountModal
        isOpen={showAccountModal}
        onClose={() => setShowAccountModal(false)}
        onSubmit={handleCreateAccount}
      />

      <EditAccountModal
        isOpen={showEditAccountModal}
        onClose={() => {
          setShowEditAccountModal(false);
          setSelectedAccountForEdit(null);
        }}
        account={selectedAccountForEdit}
        onConfirm={handleUpdateAccount}
        onDelete={handleDeleteAccount}
      />

      <ReminderModal
        isOpen={showReminderModal}
        onClose={() => setShowReminderModal(false)}
        debts={debts}
        subscriptions={subscriptions}
        onSubmit={handleCreateReminder}
      />

      <PayReminderModal
        isOpen={showPayReminderModal}
        onClose={() => {
          setShowPayReminderModal(false);
          setSelectedReminderForPay(null);
        }}
        reminder={selectedReminderForPay}
        accounts={accounts}
        onConfirm={handleConfirmPayReminder}
      />

      <PayDebtModal
        isOpen={showPayDebtModal}
        onClose={() => {
          setShowPayDebtModal(false);
          setSelectedDebtForPay(null);
        }}
        debt={selectedDebtForPay}
        accounts={accounts}
        onConfirm={handleConfirmPayDebt}
      />

      <EditTransactionModal
        isOpen={showEditTxModal}
        onClose={() => {
          setShowEditTxModal(false);
          setSelectedTxForEdit(null);
        }}
        transaction={selectedTxForEdit}
        accounts={accounts}
        categories={categories}
        onConfirm={handleSaveEditTx}
      />

      <VoidTransactionModal
        isOpen={showVoidTxModal}
        onClose={() => {
          setShowVoidTxModal(false);
          setSelectedTxForVoid(null);
        }}
        transaction={selectedTxForVoid}
        onConfirm={handleConfirmVoidTx}
      />

      <ImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        accounts={accounts}
        categories={categories}
        onImportComplete={fetchData}
      />

      <ReceiptScanModal
        isOpen={showReceiptModal}
        onClose={() => setShowReceiptModal(false)}
        accounts={accounts}
        categories={categories}
        onSuccess={fetchData}
      />
    </div>
  );
}
