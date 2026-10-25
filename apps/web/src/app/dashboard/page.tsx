'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import KPICards from '@/components/dashboard/KPICards';
import QuickEntryBar from '@/components/dashboard/QuickEntryBar';
import TransactionModal from '@/components/modals/TransactionModal';
import AccountModal from '@/components/modals/AccountModal';
import ReminderModal from '@/components/modals/ReminderModal';
import PayReminderModal from '@/components/modals/PayReminderModal';
import EditTransactionModal from '@/components/modals/EditTransactionModal';
import VoidTransactionModal from '@/components/modals/VoidTransactionModal';
import { apiFetch, getUser, getHousehold, getToken } from '@/lib/api';
import { useHouseholdSocket } from '@/hooks/useHouseholdSocket';
import {
  ArrowDownRight,
  ArrowUpRight,
  ArrowLeftRight,
  CalendarClock,
  Plus,
  Trash2,
  Check,
  Building2,
  CreditCard,
  Banknote,
  PiggyBank,
  Landmark,
  Pencil,
  Ban,
  ArrowRight,
  TrendingUp,
  Receipt
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [household, setHousehold] = useState<any>(null);
  const [summary, setSummary] = useState<any>({ totalBalance: 0, monthlyIncome: 0, monthlyExpense: 0 });
  const [accounts, setAccounts] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [reminders, setReminders] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [debts, setDebts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados de Modales
  const [showTxModal, setShowTxModal] = useState(false);
  const [txInitialType, setTxInitialType] = useState<'EXPENSE' | 'INCOME' | 'TRANSFER'>('EXPENSE');
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [showPayReminderModal, setShowPayReminderModal] = useState(false);
  const [selectedReminderForPay, setSelectedReminderForPay] = useState<any>(null);

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
      const [sum, accs, txs, cats, rems, subs, dbts] = await Promise.all([
        apiFetch('/api/transactions/summary').catch(() => ({ totalBalance: 0, monthlyIncome: 0, monthlyExpense: 0 })),
        apiFetch('/api/accounts').catch(() => []),
        apiFetch('/api/transactions?limit=10').catch(() => []),
        apiFetch('/api/categories').catch(() => []),
        apiFetch('/api/reminders').catch(() => []),
        apiFetch('/api/subscriptions').catch(() => ({ subscriptions: [] })),
        apiFetch('/api/debts').catch(() => []),
      ]);

      setSummary(sum);
      setAccounts(Array.isArray(accs) ? accs : []);
      setTransactions(Array.isArray(txs) ? txs : []);
      setCategories(Array.isArray(cats) ? cats : []);
      setReminders(Array.isArray(rems) ? rems : []);
      setSubscriptions(subs?.subscriptions || []);
      setDebts(Array.isArray(dbts) ? dbts : []);
    } catch (err) {
      console.error('Error cargando datos del dashboard:', err);
    } finally {
      setLoading(false);
    }
  }, [router]);

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
    await apiFetch('/api/transactions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    await fetchData();
  };

  const handleCreateAccount = async (data: any) => {
    await apiFetch('/api/accounts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    await fetchData();
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

  const getAccountIcon = (type: string) => {
    switch (type) {
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A1128] text-slate-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-3 border-emerald-500 border-t-transparent" />
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
                className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 font-semibold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
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
                className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-blue-500/15 hover:bg-blue-500/25 text-blue-300 border border-blue-500/30 font-semibold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                <ArrowLeftRight className="w-4 h-4 text-blue-400" />
                <span>Transferir <kbd className="hidden md:inline px-1 py-0.5 rounded bg-blue-950/60 text-[10px] text-blue-300 font-mono">T</kbd></span>
              </button>
            </div>
          </div>
        </section>

        {/* ⚡ Barra de Entrada Rápida Inline */}
        <QuickEntryBar
          accounts={accounts}
          categories={categories}
          onSubmit={handleCreateTransaction}
          onOpenModal={(type) => {
            setTxInitialType(type);
            setShowTxModal(true);
          }}
        />

        {/* 📊 KPI Cards */}
        <KPICards summary={summary} />

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
              accounts.map((acc) => (
                <div
                  key={acc.id}
                  className="mint-card p-3.5 flex items-center justify-between hover:border-[#2D3E6B] transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-xl bg-[#162347] border border-[#1E2B4D] flex items-center justify-center">
                      {getAccountIcon(acc.type)}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-100">{acc.name}</p>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">{acc.type.replace('_', ' ')}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold tabular-nums ${Number(acc.balance) < 0 ? 'text-rose-400' : 'text-slate-100'}`}>
                      ${Number(acc.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-[10px] text-slate-400">{acc.currency}</p>
                  </div>
                </div>
              ))
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
    </div>
  );
}
