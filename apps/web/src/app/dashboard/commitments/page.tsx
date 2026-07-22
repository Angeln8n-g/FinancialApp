'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CommitmentsPage() {
  const router = useRouter();

  const [debts, setDebts] = useState<any[]>([]);
  const [subData, setSubData] = useState<any>({ totalMonthlyConsumption: 0, totalAnnualConsumption: 0, subscriptions: [] });
  const [loading, setLoading] = useState(true);

  // Modales
  const [showDebtModal, setShowDebtModal] = useState(false);
  const [showSubModal, setShowSubModal] = useState(false);

  // Form Deuda
  const [dName, setDName] = useState('');
  const [dTotalAmount, setDTotalAmount] = useState('');
  const [dRemainingAmount, setDRemainingAmount] = useState('');
  const [dInterestRate, setDInterestRate] = useState('');

  // Form Suscripción
  const [sName, setSName] = useState('');
  const [sCost, setSCost] = useState('');

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  const getToken = () => localStorage.getItem('hogariq_token');

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
          interestRate: parseFloat(dInterestRate || '0'),
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
    const token = getToken();
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
    const token = getToken();
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
            <h1 className="text-lg font-bold text-white leading-tight">Deudas & Suscripciones Recurrentes</h1>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 py-8 space-y-10">
        {/* 💸 1. DEUDAS Y PRÉSTAMOS */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">Deudas, Préstamos e Hipotecas</h2>
              <p className="text-xs text-slate-400">Control de saldos pendientes de pago, intereses y compromisos.</p>
            </div>
            <button
              onClick={() => setShowDebtModal(true)}
              className="px-4 py-2 rounded-xl glow-button text-xs font-bold text-white cursor-pointer"
            >
              + Nueva Deuda
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {debts.map((d) => (
              <div key={d.id} className="glass-card p-5 space-y-3 border border-rose-500/20 relative group">
                <button
                  onClick={() => handleDeleteDebt(d.id)}
                  className="absolute top-3 right-3 text-slate-500 hover:text-rose-400 text-xs font-bold transition-colors cursor-pointer"
                  title="Eliminar deuda"
                >
                  🗑️
                </button>

                <div className="flex items-center justify-between pr-6">
                  <h3 className="text-base font-bold text-white">{d.contactName}</h3>
                  <span className="text-xs font-bold text-rose-400 bg-rose-500/10 border border-rose-500/30 px-2.5 py-0.5 rounded-full">
                    Tasa: {d.interestRate}%
                  </span>
                </div>

                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-xs text-slate-400">Saldo Restante</p>
                    <p className="text-2xl font-black text-rose-400">
                      RD${Number(d.remainingAmount).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400">Monto Inicial</p>
                    <p className="text-sm font-bold text-slate-300">RD${Number(d.totalAmount).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 📺 2. SUSCRIPCIONES RECURRENTES */}
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-white">Suscripciones Recurrentes</h2>
              <p className="text-xs text-slate-400">Detección automática de consumo recurrente (servicios, streaming, hosting).</p>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-right">
                <span className="text-xs text-slate-400 block">Consumo Total Mensual:</span>
                <span className="text-xl font-black text-purple-400">
                  ${Number(subData.totalMonthlyConsumption || 0).toFixed(2)}/mes
                </span>
              </div>
              <button
                onClick={() => setShowSubModal(true)}
                className="px-4 py-2 rounded-xl glow-button text-xs font-bold text-white cursor-pointer"
              >
                + Nueva Suscripción
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {subData.subscriptions?.map((s: any) => (
              <div key={s.id} className="glass-card p-4 space-y-2 border border-slate-800 hover:border-purple-500/40 transition-colors relative group">
                <button
                  onClick={() => handleDeleteSub(s.id)}
                  className="absolute top-2 right-2 text-slate-500 hover:text-rose-400 text-xs font-bold transition-colors cursor-pointer"
                  title="Eliminar suscripción"
                >
                  🗑️
                </button>

                <div className="flex items-center justify-between pr-5">
                  <h3 className="text-sm font-bold text-white">{s.name}</h3>
                  <span className="text-xs font-bold text-purple-300 bg-purple-500/20 px-2 py-0.5 rounded-md">
                    ${Number(s.cost).toFixed(2)}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400">
                  Próximo cobro: {new Date(s.nextBillingDate).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Modal Nueva Deuda */}
      {showDebtModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-md p-6 relative border border-rose-500/40">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white">Nueva Deuda o Préstamo</h3>
              <button onClick={() => setShowDebtModal(false)} className="text-slate-400 hover:text-white cursor-pointer text-xl">✕</button>
            </div>

            <form onSubmit={handleCreateDebt} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Nombre / Acreedor</label>
                <input
                  type="text"
                  required
                  value={dName}
                  onChange={(e) => setDName(e.target.value)}
                  placeholder="Ej. Préstamo Vehículo, Tarjeta Gold, Amigo Juan"
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Monto Inicial (RD$)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={dTotalAmount}
                  onChange={(e) => setDTotalAmount(e.target.value)}
                  placeholder="Ej. 350000"
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white font-bold text-lg focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Saldo Pendiente Restante (RD$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={dRemainingAmount}
                  onChange={(e) => setDRemainingAmount(e.target.value)}
                  placeholder="Ej. 180000"
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Tasa de Interés Anual (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={dInterestRate}
                  onChange={(e) => setDInterestRate(e.target.value)}
                  placeholder="Ej. 12"
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowDebtModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold cursor-pointer"
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
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-md p-6 relative border border-purple-500/40">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white">Nueva Suscripción</h3>
              <button onClick={() => setShowSubModal(false)} className="text-slate-400 hover:text-white cursor-pointer text-xl">✕</button>
            </div>

            <form onSubmit={handleCreateSub} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Nombre del Servicio</label>
                <input
                  type="text"
                  required
                  value={sName}
                  onChange={(e) => setSName(e.target.value)}
                  placeholder="Ej. Netflix, ChatGPT Plus, Hosting Cloud"
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Costo Mensual ($)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={sCost}
                  onChange={(e) => setSCost(e.target.value)}
                  placeholder="Ej. 15.99"
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white font-bold text-lg focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowSubModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl glow-button text-white text-xs font-bold cursor-pointer"
                >
                  Guardar Suscripción
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
