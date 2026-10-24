'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import KPICards from '@/components/dashboard/KPICards';
import TransactionModal from '@/components/modals/TransactionModal';
import AccountModal from '@/components/modals/AccountModal';
import ReminderModal from '@/components/modals/ReminderModal';
import PayReminderModal from '@/components/modals/PayReminderModal';
import EditTransactionModal from '@/components/modals/EditTransactionModal';
import VoidTransactionModal from '@/components/modals/VoidTransactionModal';
import { apiFetch, getUser, getHousehold, getToken } from '@/lib/api';
import { useHouseholdSocket } from '@/hooks/useHouseholdSocket';

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
  const [txInitialType, setTxInitialType] = useState<'EXPENSE' | 'INCOME'>('EXPENSE');
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] text-slate-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 pb-20 lg:pb-12">
      <Navbar
        user={user}
        household={household}
        unreadNotifications={reminders.filter((r) => !r.isPaid).length}
      />

      <main className="max-w-7xl mx-auto px-4 py-6 sm:py-8 space-y-8">
        {/* 🚀 Hero Action Panel */}
        <section className="glass-card p-5 sm:p-6 border-2 border-purple-500/40 shadow-2xl relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-900">
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-1 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[10px] font-extrabold uppercase tracking-wider">
                  Acción Principal
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Registro Rápido de Movimientos
                </h2>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Registra tus gastos o ingresos fácilmente en un clic.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setTxInitialType('EXPENSE');
                  setShowTxModal(true);
                }}
                className="flex-1 sm:flex-none px-5 py-3.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-extrabold text-sm shadow-lg shadow-rose-950/50 flex items-center justify-center space-x-2 cursor-pointer transition-all hover:scale-105"
              >
                <span className="text-lg">📉</span>
                <span>Registrar Gasto (-)</span>
              </button>

              <button
                onClick={() => {
                  setTxInitialType('INCOME');
                  setShowTxModal(true);
                }}
                className="flex-1 sm:flex-none px-5 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-sm shadow-lg shadow-emerald-950/50 flex items-center justify-center space-x-2 cursor-pointer transition-all hover:scale-105"
              >
                <span className="text-lg">📈</span>
                <span>Registrar Ingreso (+)</span>
              </button>
            </div>
          </div>
        </section>

        {/* 📊 KPI Cards */}
        <KPICards summary={summary} />

        {/* ⏰ Recordatorios de Pago */}
        <div className="glass-card p-6 border border-purple-500/20 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <span>⏰</span>
              <span>Recordatorios de Pago Próximos</span>
            </h3>
            <div className="flex items-center space-x-3">
              <span className="text-xs text-slate-400">
                {reminders.filter((r) => !r.isPaid).length} pendientes
              </span>
              <button
                onClick={() => setShowReminderModal(true)}
                className="px-3 py-1 rounded-lg bg-purple-600/30 hover:bg-purple-600/50 text-purple-300 border border-purple-500/40 text-xs font-bold transition-colors cursor-pointer"
              >
                + Nuevo Recordatorio
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {reminders.map((r) => (
              <div
                key={r.id}
                onClick={() => handleToggleReminder(r)}
                className={`p-4 rounded-xl border transition-all cursor-pointer relative group ${
                  r.isPaid ? 'bg-slate-900/40 border-slate-800 opacity-60' : 'bg-slate-800/80 border-slate-700 hover:border-purple-500'
                }`}
              >
                <button
                  onClick={(e) => handleDeleteReminder(e, r.id)}
                  className="absolute top-2 right-2 text-slate-500 hover:text-rose-400 text-xs font-bold cursor-pointer"
                  title="Eliminar recordatorio"
                >
                  🗑️
                </button>

                <div className="flex items-center justify-between mb-2 pr-4">
                  <span className="text-xs font-bold text-white">{r.title}</span>
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      r.isPaid ? 'bg-emerald-500 text-white' : 'border border-slate-600 text-slate-400'
                    }`}
                  >
                    {r.isPaid ? '✓' : ''}
                  </span>
                </div>
                <p className={`text-base font-black ${r.isPaid ? 'text-slate-500 line-through' : 'text-purple-300'}`}>
                  ${Number(r.amount).toLocaleString()}
                </p>
                <p className="text-[10px] text-slate-400 mt-1">
                  Vence: {new Date(r.dueDate).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Action Banner */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-gradient-to-r from-purple-900/40 via-slate-900 to-slate-900 border border-purple-500/30">
          <div>
            <h3 className="text-base font-bold text-white">¿Nuevo movimiento financiero?</h3>
            <p className="text-xs text-slate-400">Registra un gasto o ingreso en segundos para mantener las cuentas al día.</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowAccountModal(true)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700 transition-colors cursor-pointer"
            >
              + Nueva Cuenta
            </button>
            <button
              onClick={() => {
                setTxInitialType('EXPENSE');
                setShowTxModal(true);
              }}
              className="px-5 py-2.5 rounded-xl glow-button text-xs font-bold text-white cursor-pointer"
            >
              + Registrar Movimiento
            </button>
          </div>
        </div>

        {/* Accounts & Transactions Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cuentas */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Cuentas Financieras</h3>
              <span className="text-xs text-slate-400 font-semibold">{accounts.length} activas</span>
            </div>

            {accounts.length === 0 ? (
              <div className="glass-card p-6 text-center text-slate-400 text-sm">
                No tienes cuentas registradas.{' '}
                <button onClick={() => setShowAccountModal(true)} className="text-purple-400 font-semibold underline cursor-pointer">
                  Crea una aquí
                </button>
              </div>
            ) : (
              accounts.map((acc) => (
                <div key={acc.id} className="glass-card p-4 flex items-center justify-between hover:border-slate-600 transition-all">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-xl">
                      {acc.type === 'CASH' ? '💵' : acc.type === 'CREDIT_CARD' ? '💳' : '🏦'}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{acc.name}</p>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">{acc.type}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-base font-bold ${Number(acc.balance) < 0 ? 'text-rose-400' : 'text-slate-100'}`}>
                      ${Number(acc.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-[10px] text-slate-400">{acc.currency}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Transacciones Recientes */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Últimos Movimientos</h3>
              <Link href="/dashboard/reports" className="text-xs text-purple-400 font-semibold hover:underline">
                Ver todos
              </Link>
            </div>

            {transactions.length === 0 ? (
              <div className="glass-card p-12 text-center text-slate-400 text-sm">
                No hay movimientos registrados recientemente.
              </div>
            ) : (
              <div className="space-y-2">
                {transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className={`glass-card p-4 flex items-center justify-between transition-all group ${
                      tx.isVoided
                        ? 'opacity-40 border-rose-950/40 bg-rose-950/10'
                        : 'hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-lg">
                        {tx.category?.icon || (tx.type === 'INCOME' ? '💼' : '🛒')}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className={`text-sm font-bold ${tx.isVoided ? 'line-through text-slate-500' : 'text-white'}`}>
                            {tx.description || (tx.type === 'INCOME' ? 'Ingreso General' : 'Gasto General')}
                          </p>
                          {tx.isVoided && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-400 border border-rose-500/30">
                              Anulado
                            </span>
                          )}
                          {tx.isEdited && !tx.isVoided && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/30">
                              Editado
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400">
                          {tx.account?.name} • {new Date(tx.date).toLocaleDateString()}
                          {tx.createdBy?.fullName || tx.createdBy?.email
                            ? ` • 👤 ${tx.createdBy?.fullName || tx.createdBy?.email.split('@')[0]}`
                            : ''}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p
                          className={`text-sm font-black ${
                            tx.isVoided
                              ? 'text-slate-500 line-through'
                              : tx.type === 'INCOME'
                              ? 'text-emerald-400'
                              : 'text-rose-400'
                          }`}
                        >
                          {tx.type === 'INCOME' ? '+' : '-'}${Number(tx.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-[10px] text-slate-500">{tx.category?.name || 'General'}</p>
                      </div>

                      {!tx.isVoided && (
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                          <button
                            onClick={() => {
                              setSelectedTxForEdit(tx);
                              setShowEditTxModal(true);
                            }}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-amber-950/40 text-slate-400 hover:text-amber-300 border border-slate-700 text-xs cursor-pointer"
                            title="Editar Transacción"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => {
                              setSelectedTxForVoid(tx);
                              setShowVoidTxModal(true);
                            }}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-slate-700 text-xs cursor-pointer"
                            title="Anular Transacción"
                          >
                            🚫
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

      {/* 🧩 Modales Extraídos y Modularizados */}
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
