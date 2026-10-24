'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { Target, PiggyBank, Plus, Trash2, X, Calendar } from 'lucide-react';

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
  const getToken = () => typeof window !== 'undefined' ? localStorage.getItem('hogariq_token') : null;

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
          currentAmount: parseFloat(gCurrentAmount) || 0,
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
    if (!confirm('¿Eliminar este presupuesto mensual?')) return;
    const token = getToken();
    if (!token) return;

    try {
      await fetch(`${API_URL}/api/budgets/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchData();
    } catch (err) {
      console.error('Error eliminando presupuesto:', err);
    }
  };

  const handleDeleteGoal = async (id: string) => {
    if (!confirm('¿Eliminar esta meta de ahorro?')) return;
    const token = getToken();
    if (!token) return;

    try {
      await fetch(`${API_URL}/api/goals/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchData();
    } catch (err) {
      console.error('Error eliminando meta:', err);
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
        {/* 1. PRESUPUESTOS MENSUALES */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                <Target className="w-5 h-5 text-emerald-400" />
                <span>Presupuestos Mensuales</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Control de gastos por categoría para mantener el límite del hogar.</p>
            </div>
            <button
              onClick={() => setShowBudgetModal(true)}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white shadow-sm flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Crear Presupuesto</span>
            </button>
          </div>

          {budgets.length === 0 ? (
            <div className="mint-card p-8 text-center text-slate-400 text-xs">
              No hay presupuestos mensuales configurados. Define uno para controlar gastos en alimentación, servicios o transporte.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {budgets.map((b) => (
                <div key={b.id} className="mint-card p-5 space-y-3.5 relative group hover:border-[#2D3E6B] transition-colors">
                  <button
                    onClick={() => handleDeleteBudget(b.id)}
                    className="absolute top-3.5 right-3.5 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                    title="Eliminar presupuesto"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <div className="flex items-center justify-between pr-7">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-100">{b.categoryName}</h3>
                      <p className="text-xs text-slate-400 mt-0.5 tabular-nums">
                        Consumo: ${Number(b.spentAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })} / ${Number(b.limitAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-lg border tabular-nums ${
                      b.percentage >= 90
                        ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                        : b.percentage >= 75
                        ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                        : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                    }`}>
                      {b.percentage}%
                    </span>
                  </div>

                  {/* Progress Bar Visual */}
                  <div className="w-full bg-[#0A1128] rounded-full h-2.5 p-0.5 border border-[#1E2B4D] overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        b.percentage >= 90
                          ? 'bg-rose-500'
                          : b.percentage >= 75
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(Math.max(b.percentage, 3), 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 2. METAS DE AHORRO */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                <PiggyBank className="w-5 h-5 text-amber-400" />
                <span>Metas de Ahorro Familiares</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Planificación de compras importantes, viajes y fondos de emergencia.</p>
            </div>
            <button
              onClick={() => setShowGoalModal(true)}
              className="px-3.5 py-2 rounded-xl bg-[#162347] hover:bg-[#1D2D5A] text-amber-300 border border-amber-500/30 text-xs font-semibold shadow-sm flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nueva Meta</span>
            </button>
          </div>

          {goals.length === 0 ? (
            <div className="mint-card p-8 text-center text-slate-400 text-xs">
              No tienes metas de ahorro activas. ¡Comienza una para alcanzar los sueños de tu familia!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {goals.map((g) => (
                <div key={g.id} className="mint-card p-5 space-y-4 relative overflow-hidden border border-[#1E2B4D]">
                  <button
                    onClick={() => handleDeleteGoal(g.id)}
                    className="absolute top-3.5 right-3.5 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                    title="Eliminar meta"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <div className="flex items-center justify-between pr-7">
                    <h3 className="text-sm font-semibold text-slate-100">{g.name}</h3>
                    <span className="text-xs font-bold text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full tabular-nums">
                      {g.percentage}%
                    </span>
                  </div>

                  <div>
                    <p className="text-[11px] text-slate-400">Ahorrado actual</p>
                    <p className="text-2xl font-bold text-slate-100 tabular-nums">
                      ${Number(g.currentAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      <span className="text-xs font-normal text-slate-400 ml-1">
                        / ${Number(g.targetAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                    </p>
                  </div>

                  <div className="space-y-1.5 pt-3 border-t border-[#1E2B4D] text-xs">
                    <div className="flex justify-between text-slate-400">
                      <span>Ahorro mensual sugerido:</span>
                      <span className="font-semibold text-amber-300 tabular-nums">
                        ${Number(g.suggestedMonthly).toLocaleString('en-US', { minimumFractionDigits: 2 })}/mes
                      </span>
                    </div>
                    {g.targetDate && (
                      <div className="flex justify-between text-slate-400">
                        <span>Fecha objetivo:</span>
                        <span className="font-medium text-slate-300 tabular-nums">
                          {new Date(g.targetDate).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-[#0A1128] rounded-full h-2.5 p-0.5 border border-[#1E2B4D]">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                      style={{ width: `${Math.min(Math.max(g.percentage, 3), 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Modal Nuevo Presupuesto */}
      {showBudgetModal && (
        <div className="fixed inset-0 bg-[#0A1128]/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="mint-card w-full max-w-md p-6 relative border border-[#1E2B4D] shadow-2xl">
            <div className="flex items-center justify-between mb-5 pb-3 border-b border-[#1E2B4D]">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Target className="w-4 h-4 text-emerald-400" />
                <span>Crear Presupuesto Mensual</span>
              </h3>
              <button
                onClick={() => setShowBudgetModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-[#162347] transition-colors cursor-pointer"
                aria-label="Cerrar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateBudget} className="space-y-4">
              <div>
                <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1.5">Categoría</label>
                <select
                  value={bCategoryId}
                  onChange={(e) => setBCategoryId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A1128] border border-[#1E2B4D] text-slate-100 text-sm focus:outline-none focus:border-emerald-400 cursor-pointer transition-colors"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id} className="bg-[#101A36]">
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1.5">Límite Mensual ($)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={bLimitAmount}
                  onChange={(e) => setBLimitAmount(e.target.value)}
                  placeholder="Ej. 500.00"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A1128] border border-[#1E2B4D] text-slate-100 font-bold text-base focus:outline-none focus:border-emerald-400 tabular-nums transition-colors"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-[#1E2B4D]">
                <button
                  type="button"
                  onClick={() => setShowBudgetModal(false)}
                  className="px-4 py-2 rounded-xl bg-[#162347] text-slate-300 text-xs font-medium hover:bg-[#1D2D5A] hover:text-slate-100 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
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
        <div className="fixed inset-0 bg-[#0A1128]/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="mint-card w-full max-w-md p-6 relative border border-[#1E2B4D] shadow-2xl">
            <div className="flex items-center justify-between mb-5 pb-3 border-b border-[#1E2B4D]">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <PiggyBank className="w-4 h-4 text-amber-400" />
                <span>Nueva Meta de Ahorro</span>
              </h3>
              <button
                onClick={() => setShowGoalModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-[#162347] transition-colors cursor-pointer"
                aria-label="Cerrar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateGoal} className="space-y-4">
              <div>
                <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1.5">Nombre de la Meta</label>
                <input
                  type="text"
                  required
                  value={gName}
                  onChange={(e) => setGName(e.target.value)}
                  placeholder="Ej. Fondo de Emergencia, Vacaciones"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A1128] border border-[#1E2B4D] text-slate-100 text-sm focus:outline-none focus:border-emerald-400 transition-colors"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1.5">Monto Objetivo ($)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={gTargetAmount}
                  onChange={(e) => setGTargetAmount(e.target.value)}
                  placeholder="Ej. 5000.00"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A1128] border border-[#1E2B4D] text-slate-100 font-bold text-base focus:outline-none focus:border-emerald-400 tabular-nums transition-colors"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1.5">Monto Inicial Ahorrado ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={gCurrentAmount}
                  onChange={(e) => setGCurrentAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A1128] border border-[#1E2B4D] text-slate-100 text-sm focus:outline-none focus:border-emerald-400 tabular-nums transition-colors"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1.5">Fecha Objetivo (Opcional)</label>
                <input
                  type="date"
                  value={gTargetDate}
                  onChange={(e) => setGTargetDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A1128] border border-[#1E2B4D] text-slate-100 text-sm focus:outline-none focus:border-emerald-400 transition-colors"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-[#1E2B4D]">
                <button
                  type="button"
                  onClick={() => setShowGoalModal(false)}
                  className="px-4 py-2 rounded-xl bg-[#162347] text-slate-300 text-xs font-medium hover:bg-[#1D2D5A] hover:text-slate-100 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
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
