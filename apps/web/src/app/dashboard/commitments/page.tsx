'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { CreditCard, Tv, CalendarClock, Plus, Trash2, X } from 'lucide-react';

export default function CommitmentsPage() {
  const router = useRouter();

  const [debts, setDebts] = useState<any[]>([]);
  const [subData, setSubData] = useState<any>({ totalMonthlyConsumption: 0, totalAnnualConsumption: 0, subscriptions: [] });
  const [loading, setLoading] = useState(true);

  // Modales
  const [showDebtModal, setShowDebtModal] = useState(false);
  const [showSubModal, setShowSubModal] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);

  // Form Deuda
  const [dName, setDName] = useState('');
  const [dTotalAmount, setDTotalAmount] = useState('');
  const [dRemainingAmount, setDRemainingAmount] = useState('');
  const [dInterestRate, setDInterestRate] = useState('');

  // Form Suscripción
  const [sName, setSName] = useState('');
  const [sCost, setSCost] = useState('');

  // Form Recordatorio
  const [remTitle, setRemTitle] = useState('');
  const [remAmount, setRemAmount] = useState('');
  const [remDueDate, setRemDueDate] = useState('');
  const [remSubscriptionId, setRemSubscriptionId] = useState('');
  const [remDebtId, setRemDebtId] = useState('');

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  const getToken = () => typeof window !== 'undefined' ? localStorage.getItem('hogariq_token') : null;

  const handleOpenReminderFromDebt = (d: any) => {
    setRemTitle(`Deuda: ${d.contactName}`);
    setRemAmount(d.remainingAmount.toString());
    setRemDueDate(d.dueDate ? new Date(d.dueDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
    setRemDebtId(d.id);
    setRemSubscriptionId('');
    setShowReminderModal(true);
  };

  const handleOpenReminderFromSub = (s: any) => {
    setRemTitle(`Suscripción: ${s.name}`);
    setRemAmount(s.cost.toString());
    setRemDueDate(s.nextBillingDate ? new Date(s.nextBillingDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
    setRemSubscriptionId(s.id);
    setRemDebtId('');
    setShowReminderModal(true);
  };

  const handleCreateReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getToken();
    if (!token || !remTitle || !remAmount || !remDueDate) return;

    try {
      const res = await fetch(`${API_URL}/api/reminders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: remTitle,
          amount: parseFloat(remAmount),
          dueDate: remDueDate,
          subscriptionId: remSubscriptionId || undefined,
          debtId: remDebtId || undefined,
        }),
      });

      if (res.ok) {
        setShowReminderModal(false);
        setRemTitle('');
        setRemAmount('');
        setRemDueDate('');
        setRemSubscriptionId('');
        setRemDebtId('');
        alert('¡Recordatorio programado con éxito!');
      }
    } catch (err) {
      console.error('Error programando recordatorio:', err);
    }
  };

  const fetchData = async () => {
    const token = getToken();
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const headers = { Authorization: `Bearer ${token}` };

      const [resDebts, resSubs] = await Promise.all([
        fetch(`${API_URL}/api/debts`, { headers }),
        fetch(`${API_URL}/api/subscriptions`, { headers }),
      ]);

      if (resDebts.ok) setDebts(await resDebts.json());
      if (resSubs.ok) setSubData(await resSubs.json());
    } catch (err) {
      console.error('Error cargando compromisos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateDebt = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getToken();
    if (!token || !dName) return;

    try {
      const res = await fetch(`${API_URL}/api/debts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          contactName: dName,
          totalAmount: parseFloat(dTotalAmount),
          remainingAmount: parseFloat(dRemainingAmount || dTotalAmount),
          interestRate: parseFloat(dInterestRate) || 0,
        }),
      });

      if (res.ok) {
        setShowDebtModal(false);
        setDName('');
        setDTotalAmount('');
        setDRemainingAmount('');
        setDInterestRate('');
        fetchData();
      }
    } catch (err) {
      console.error('Error creando deuda:', err);
    }
  };

  const handleCreateSub = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getToken();
    if (!token || !sName) return;

    try {
      const res = await fetch(`${API_URL}/api/subscriptions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: sName,
          cost: parseFloat(sCost),
          billingCycle: 'MONTHLY',
        }),
      });

      if (res.ok) {
        setShowSubModal(false);
        setSName('');
        setSCost('');
        fetchData();
      }
    } catch (err) {
      console.error('Error creando suscripción:', err);
    }
  };

  const handleDeleteDebt = async (id: string) => {
    if (!confirm('¿Eliminar este registro de deuda?')) return;
    const token = getToken();
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/api/debts/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) fetchData();
    } catch (err) {
      console.error('Error eliminando deuda:', err);
    }
  };

  const handleDeleteSub = async (id: string) => {
    if (!confirm('¿Eliminar esta suscripción recurrente?')) return;
    const token = getToken();
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/api/subscriptions/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) fetchData();
    } catch (err) {
      console.error('Error eliminando suscripción:', err);
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
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-10">
        {/* 1. DEUDAS Y PRÉSTAMOS */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-rose-400" />
                <span>Deudas, Préstamos y Compromisos</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Control de saldos pendientes de pago, tasas e intereses del hogar.</p>
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
              No tienes deudas ni préstamos registrados. ¡Excelente salud crediticia familiar!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {debts.map((d) => (
                <div key={d.id} className="mint-card p-5 space-y-3.5 border border-rose-500/20 relative group hover:border-rose-500/40 transition-colors">
                  <button
                    onClick={() => handleDeleteDebt(d.id)}
                    className="absolute top-3.5 right-3.5 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                    title="Eliminar deuda"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <div className="flex items-center justify-between pr-7">
                    <h3 className="text-sm font-semibold text-slate-100">{d.contactName}</h3>
                    <span className="text-xs font-bold text-rose-300 bg-rose-500/15 border border-rose-500/30 px-2 py-0.5 rounded-full tabular-nums">
                      Tasa: {d.interestRate}%
                    </span>
                  </div>

                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-[11px] text-slate-400">Saldo Restante</p>
                      <p className="text-2xl font-bold text-rose-400 tabular-nums">
                        ${Number(d.remainingAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] text-slate-400">Monto Inicial</p>
                      <p className="text-xs font-medium text-slate-300 tabular-nums">${Number(d.totalAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#1E2B4D] flex justify-end">
                    <button
                      onClick={() => handleOpenReminderFromDebt(d)}
                      className="px-3 py-1.5 rounded-lg bg-[#162347] hover:bg-[#1D2D5A] text-emerald-300 border border-emerald-500/30 text-xs font-medium transition-all cursor-pointer flex items-center space-x-1.5"
                    >
                      <CalendarClock className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Programar Recordatorio</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 2. SUSCRIPCIONES RECURRENTES */}
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                <Tv className="w-5 h-5 text-emerald-400" />
                <span>Suscripciones y Servicios Recurrentes</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Control de gastos fijos recurrentes (streaming, internet, software).</p>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-right">
                <span className="text-[11px] text-slate-400 block">Consumo Mensual:</span>
                <span className="text-lg font-bold text-emerald-400 tabular-nums">
                  ${Number(subData.totalMonthlyConsumption || 0).toFixed(2)}/mes
                </span>
              </div>
              <button
                onClick={() => setShowSubModal(true)}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white shadow-sm flex items-center gap-1.5 cursor-pointer transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nueva Suscripción</span>
              </button>
            </div>
          </div>

          {subData.subscriptions?.length === 0 ? (
            <div className="mint-card p-8 text-center text-slate-400 text-xs">
              No tienes suscripciones registradas. Añade tus servicios mensuales para no olvidar fechas de facturación.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {subData.subscriptions?.map((s: any) => (
                <div key={s.id} className="mint-card p-4 space-y-2.5 relative group hover:border-[#2D3E6B] transition-colors">
                  <button
                    onClick={() => handleDeleteSub(s.id)}
                    className="absolute top-3 right-3 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                    title="Eliminar suscripción"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  <div className="flex items-center justify-between pr-6">
                    <h3 className="text-xs font-semibold text-slate-100 truncate">{s.name}</h3>
                    <span className="text-xs font-bold text-emerald-300 bg-emerald-500/15 px-2 py-0.5 rounded-lg tabular-nums">
                      ${Number(s.cost).toFixed(2)}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 tabular-nums">
                    Próximo cobro: {new Date(s.nextBillingDate).toLocaleDateString()}
                  </p>

                  <div className="pt-2 border-t border-[#1E2B4D] flex justify-end">
                    <button
                      onClick={() => handleOpenReminderFromSub(s)}
                      className="px-2.5 py-1 rounded-lg bg-[#162347] hover:bg-[#1D2D5A] text-emerald-300 border border-emerald-500/30 text-[11px] font-medium transition-all cursor-pointer flex items-center space-x-1"
                    >
                      <CalendarClock className="w-3 h-3 text-emerald-400" />
                      <span>Recordatorio</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Modal Nueva Deuda */}
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
                <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1.5">Acreedor / Concepto</label>
                <input
                  type="text"
                  required
                  value={dName}
                  onChange={(e) => setDName(e.target.value)}
                  placeholder="Ej. Préstamo Vehículo, Tarjeta Visa, Préstamo Familiar"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A1128] border border-[#1E2B4D] text-slate-100 text-sm focus:outline-none focus:border-rose-400 transition-colors"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1.5">Monto Total Original ($)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={dTotalAmount}
                  onChange={(e) => setDTotalAmount(e.target.value)}
                  placeholder="Ej. 10000.00"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A1128] border border-[#1E2B4D] text-slate-100 font-bold text-base focus:outline-none focus:border-rose-400 tabular-nums transition-colors"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1.5">Saldo Pendiente Restante ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={dRemainingAmount}
                  onChange={(e) => setDRemainingAmount(e.target.value)}
                  placeholder="Ej. 5000.00"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A1128] border border-[#1E2B4D] text-slate-100 text-sm focus:outline-none focus:border-rose-400 tabular-nums transition-colors"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1.5">Tasa de Interés Anual (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={dInterestRate}
                  onChange={(e) => setDInterestRate(e.target.value)}
                  placeholder="Ej. 12"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A1128] border border-[#1E2B4D] text-slate-100 text-sm focus:outline-none focus:border-rose-400 tabular-nums transition-colors"
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

      {/* Modal Nueva Suscripción */}
      {showSubModal && (
        <div className="fixed inset-0 bg-[#0A1128]/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="mint-card w-full max-w-md p-6 relative border border-[#1E2B4D] shadow-2xl">
            <div className="flex items-center justify-between mb-5 pb-3 border-b border-[#1E2B4D]">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Tv className="w-4 h-4 text-emerald-400" />
                <span>Nueva Suscripción</span>
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
                <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1.5">Nombre del Servicio</label>
                <input
                  type="text"
                  required
                  value={sName}
                  onChange={(e) => setSName(e.target.value)}
                  placeholder="Ej. Netflix, Spotify, Internet Fibra"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A1128] border border-[#1E2B4D] text-slate-100 text-sm focus:outline-none focus:border-emerald-400 transition-colors"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1.5">Costo Mensual ($)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={sCost}
                  onChange={(e) => setSCost(e.target.value)}
                  placeholder="Ej. 14.99"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A1128] border border-[#1E2B4D] text-slate-100 font-bold text-base focus:outline-none focus:border-emerald-400 tabular-nums transition-colors"
                />
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

      {/* Modal Nuevo Recordatorio desde Compromiso */}
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
