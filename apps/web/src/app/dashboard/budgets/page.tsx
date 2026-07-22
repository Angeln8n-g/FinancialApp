'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function BudgetsAndGoalsPage() {
  const router = useRouter();

  const [budgets, setBudgets] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modales
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);

  // Form Presupuesto
  const [bCategoryId, setBCategoryId] = useState('');
  const [bLimitAmount, setBLimitAmount] = useState('');

  // Form Meta
  const [gName, setGName] = useState('');
  const [gTargetAmount, setGTargetAmount] = useState('');
  const [gCurrentAmount, setGCurrentAmount] = useState('');
  const [gTargetDate, setGTargetDate] = useState('');

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

      const [resBudgets, resGoals, resCats] = await Promise.all([
        fetch(`${API_URL}/api/budgets/progress`, { headers }),
        fetch(`${API_URL}/api/goals`, { headers }),
        fetch(`${API_URL}/api/categories`, { headers }),
      ]);

      if (resBudgets.ok) setBudgets(await resBudgets.json());
      if (resGoals.ok) setGoals(await resGoals.json());
      if (resCats.ok) {
        const cats = await resCats.json();
        setCategories(cats);
        if (cats.length > 0 && !bCategoryId) setBCategoryId(cats[0].id);
      }
    } catch (err) {
      console.error('Error cargando presupuestos/metas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getToken();
    if (!token || !bCategoryId) return;

    try {
      const res = await fetch(`${API_URL}/api/budgets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          categoryId: bCategoryId,
          limitAmount: parseFloat(bLimitAmount),
        }),
      });

      if (res.ok) {
        setShowBudgetModal(false);
        setBLimitAmount('');
        fetchData();
      }
    } catch (err) {
      console.error('Error creando presupuesto:', err);
    }
  };

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getToken();
    if (!token || !gName) return;

    try {
      const res = await fetch(`${API_URL}/api/goals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: gName,
          targetAmount: parseFloat(gTargetAmount),
          currentAmount: parseFloat(gCurrentAmount || '0'),
          targetDate: gTargetDate || undefined,
        }),
      });

      if (res.ok) {
        setShowGoalModal(false);
        setGName('');
        setGTargetAmount('');
        setGCurrentAmount('');
        setGTargetDate('');
        fetchData();
      }
    } catch (err) {
      console.error('Error creando meta:', err);
    }
  };

  const handleDeleteBudget = async (id: string) => {
    const token = getToken();
    try {
      const res = await fetch(`${API_URL}/api/budgets/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) fetchData();
    } catch (err) {
      console.error('Error eliminando presupuesto:', err);
    }
  };

  const handleDeleteGoal = async (id: string) => {
    const token = getToken();
    try {
      const res = await fetch(`${API_URL}/api/goals/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) fetchData();
    } catch (err) {
      console.error('Error eliminando meta:', err);
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
            <h1 className="text-lg font-bold text-white leading-tight">Presupuestos Mensuales & Metas de Ahorro</h1>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 py-8 space-y-10">
        {/* 📊 1. PRESTUPUESTOS MENSUALES POR CATEGORÍA */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">Presupuestos Mensuales por Categoría</h2>
              <p className="text-xs text-slate-400">Control de gastos por categoría para mantener el límite mensual.</p>
            </div>
            <button
              onClick={() => setShowBudgetModal(true)}
              className="px-4 py-2 rounded-xl glow-button text-xs font-bold text-white cursor-pointer"
            >
              + Crear Presupuesto
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {budgets.map((b) => (
              <div key={b.id} className="glass-card p-5 space-y-3 border border-slate-800 hover:border-purple-500/40 transition-colors relative group">
                <button
                  onClick={() => handleDeleteBudget(b.id)}
                  className="absolute top-3 right-3 text-slate-500 hover:text-rose-400 text-xs font-bold transition-colors cursor-pointer"
                  title="Eliminar presupuesto"
                >
                  🗑️
                </button>

                <div className="flex items-center justify-between pr-6">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{b.categoryIcon}</span>
                    <div>
                      <h3 className="text-sm font-bold text-white">{b.categoryName}</h3>
                      <p className="text-xs text-slate-400">
                        Consumo: RD${Number(b.spentAmount).toLocaleString()} / RD${Number(b.limitAmount).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <span className={`text-sm font-black px-2.5 py-1 rounded-xl border ${b.percentage >= 90 ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' : 'bg-purple-500/20 text-purple-300 border-purple-500/30'}`}>
                    {b.percentage}%
                  </span>
                </div>

                {/* Progress Bar Visual */}
                <div className="w-full bg-slate-900 rounded-full h-3.5 p-0.5 border border-slate-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${b.percentage >= 90 ? 'bg-rose-500' : 'bg-gradient-to-r from-purple-600 to-indigo-500'}`}
                    style={{ width: `${Math.max(b.percentage, 5)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 🎯 2. METAS DE AHORRO */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">Metas de Ahorro Familiares</h2>
              <p className="text-xs text-slate-400">Planificación de compras importantes, viajes y fondos de reserva.</p>
            </div>
            <button
              onClick={() => setShowGoalModal(true)}
              className="px-4 py-2 rounded-xl glow-button text-xs font-bold text-white cursor-pointer"
            >
              + Nueva Meta
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {goals.map((g) => (
              <div key={g.id} className="glass-card p-5 space-y-4 relative overflow-hidden border border-purple-500/20">
                <button
                  onClick={() => handleDeleteGoal(g.id)}
                  className="absolute top-3 right-3 text-slate-500 hover:text-rose-400 text-xs font-bold transition-colors cursor-pointer"
                  title="Eliminar meta"
                >
                  🗑️
                </button>

                <div className="flex items-center justify-between pr-6">
                  <h3 className="text-base font-bold text-white">{g.name}</h3>
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                    {g.percentage}%
                  </span>
                </div>

                <div>
                  <p className="text-xs text-slate-400">Ahorrado actual</p>
                  <p className="text-2xl font-black text-white">
                    RD${Number(g.currentAmount).toLocaleString()}
                    <span className="text-xs font-normal text-slate-400"> / RD${Number(g.targetAmount).toLocaleString()}</span>
                  </p>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-800 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Ahorro mensual sugerido:</span>
                    <span className="font-bold text-purple-300">RD${Number(g.suggestedMonthly).toLocaleString()}/mes</span>
                  </div>
                  {g.targetDate && (
                    <div className="flex justify-between text-slate-400">
                      <span>Fecha objetivo:</span>
                      <span className="font-semibold text-slate-300">{new Date(g.targetDate).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-900 rounded-full h-3 p-0.5 border border-slate-800">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                    style={{ width: `${Math.max(g.percentage, 5)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Modal Nuevo Presupuesto */}
      {showBudgetModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-md p-6 relative border border-purple-500/40">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white">Crear Presupuesto Mensual</h3>
              <button onClick={() => setShowBudgetModal(false)} className="text-slate-400 hover:text-white cursor-pointer text-xl">✕</button>
            </div>

            <form onSubmit={handleCreateBudget} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Categoría</label>
                <select
                  value={bCategoryId}
                  onChange={(e) => setBCategoryId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:border-purple-500"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.icon} {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Límite Mensual (RD$)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={bLimitAmount}
                  onChange={(e) => setBLimitAmount(e.target.value)}
                  placeholder="Ej. 18000"
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white font-bold text-lg focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowBudgetModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl glow-button text-white text-xs font-bold cursor-pointer"
                >
                  Guardar Presupuesto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Nueva Meta */}
      {showGoalModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-md p-6 relative border border-purple-500/40">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white">Nueva Meta de Ahorro</h3>
              <button onClick={() => setShowGoalModal(false)} className="text-slate-400 hover:text-white cursor-pointer text-xl">✕</button>
            </div>

            <form onSubmit={handleCreateGoal} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Nombre de la Meta</label>
                <input
                  type="text"
                  required
                  value={gName}
                  onChange={(e) => setGName(e.target.value)}
                  placeholder="Ej. Inicial apartamento, Viaje"
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Monto Objetivo (RD$)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={gTargetAmount}
                  onChange={(e) => setGTargetAmount(e.target.value)}
                  placeholder="Ej. 1200000"
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white font-bold text-lg focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Monto Actual Ahorrado (RD$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={gCurrentAmount}
                  onChange={(e) => setGCurrentAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Fecha Objetivo (Opcional)</label>
                <input
                  type="date"
                  value={gTargetDate}
                  onChange={(e) => setGTargetDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowGoalModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl glow-button text-white text-xs font-bold cursor-pointer"
                >
                  Guardar Meta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
