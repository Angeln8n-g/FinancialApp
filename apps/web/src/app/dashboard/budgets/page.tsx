'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import EditBudgetModal from '@/components/modals/EditBudgetModal';
import ContributeGoalModal from '@/components/modals/ContributeGoalModal';
import EditGoalModal from '@/components/modals/EditGoalModal';
import { apiFetch, getUser, getHousehold, getToken } from '@/lib/api';
import {
  Target,
  PiggyBank,
  Plus,
  Trash2,
  X,
  Calendar,
  Pencil,
  AlertTriangle,
  TrendingUp,
  Sparkles,
  CheckCircle2,
  Clock,
  DollarSign,
  ArrowRight,
} from 'lucide-react';

export default function BudgetsAndGoalsPage() {
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [household, setHousehold] = useState<any>(null);
  const [budgets, setBudgets] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modales de creación
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);

  // Modales de edición y aportes
  const [selectedBudgetForEdit, setSelectedBudgetForEdit] = useState<any>(null);
  const [selectedGoalForEdit, setSelectedGoalForEdit] = useState<any>(null);
  const [selectedGoalForContribute, setSelectedGoalForContribute] = useState<any>(null);

  // Form Creación Presupuesto
  const [bCategoryId, setBCategoryId] = useState('');
  const [bLimitAmount, setBLimitAmount] = useState('');

  // Form Creación Meta
  const [gName, setGName] = useState('');
  const [gTargetAmount, setGTargetAmount] = useState('');
  const [gCurrentAmount, setGCurrentAmount] = useState('');
  const [gTargetDate, setGTargetDate] = useState('');

  const fetchData = useCallback(async () => {
    if (!getToken()) {
      router.push('/login');
      return;
    }

    try {
      const [bData, gData, cData, aData] = await Promise.all([
        apiFetch('/api/budgets/progress').catch(() => []),
        apiFetch('/api/goals').catch(() => []),
        apiFetch('/api/categories').catch(() => []),
        apiFetch('/api/accounts').catch(() => []),
      ]);

      const bList = Array.isArray(bData) ? bData : [];
      const gList = Array.isArray(gData) ? gData : [];
      const cList = Array.isArray(cData) ? cData : [];
      const aList = Array.isArray(aData) ? aData : [];

      setBudgets(bList);
      setGoals(gList);
      setCategories(cList);
      setAccounts(aList);

      if (cList.length > 0 && !bCategoryId) {
        setBCategoryId(cList[0].id);
      }
    } catch (err) {
      console.error('Error cargando presupuestos/metas:', err);
    } finally {
      setLoading(false);
    }
  }, [router, bCategoryId]);

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

  // Manejo de creación de Presupuesto
  const handleCreateBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bCategoryId || !bLimitAmount) return;

    try {
      await apiFetch('/api/budgets', {
        method: 'POST',
        body: JSON.stringify({
          categoryId: bCategoryId,
          limitAmount: parseFloat(bLimitAmount),
        }),
      });

      setShowBudgetModal(false);
      setBLimitAmount('');
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Error al crear presupuesto');
    }
  };

  // Manejo de edición de Presupuesto
  const handleUpdateBudget = async (budgetId: string, limitAmount: number) => {
    await apiFetch(`/api/budgets/${budgetId}`, {
      method: 'PUT',
      body: JSON.stringify({ limitAmount }),
    });
    await fetchData();
  };

  // Manejo de eliminación de Presupuesto
  const handleDeleteBudget = async (id: string) => {
    if (!confirm('¿Eliminar este presupuesto mensual?')) return;
    try {
      await apiFetch(`/api/budgets/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Error al eliminar presupuesto');
    }
  };

  // Manejo de creación de Meta
  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gName || !gTargetAmount) return;

    try {
      await apiFetch('/api/goals', {
        method: 'POST',
        body: JSON.stringify({
          name: gName,
          targetAmount: parseFloat(gTargetAmount),
          currentAmount: parseFloat(gCurrentAmount) || 0,
          targetDate: gTargetDate || undefined,
        }),
      });

      setShowGoalModal(false);
      setGName('');
      setGTargetAmount('');
      setGCurrentAmount('');
      setGTargetDate('');
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Error al crear meta');
    }
  };

  // Manejo de edición de Meta
  const handleUpdateGoal = async (goalId: string, data: any) => {
    await apiFetch(`/api/goals/${goalId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    await fetchData();
  };

  // Manejo de aporte a Meta
  const handleContributeGoal = async (goalId: string, data: any) => {
    await apiFetch(`/api/goals/${goalId}/contribute`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    await fetchData();
  };

  // Manejo de eliminación de Meta
  const handleDeleteGoal = async (id: string) => {
    if (!confirm('¿Eliminar esta meta de ahorro?')) return;
    try {
      await apiFetch(`/api/goals/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Error al eliminar meta');
    }
  };

  // Cálculos consolidados del Presupuesto Familiar
  const totalBudgeted = budgets.reduce((acc, b) => acc + Number(b.limitAmount || 0), 0);
  const totalSpent = budgets.reduce((acc, b) => acc + Number(b.spentAmount || 0), 0);
  const totalRemaining = totalBudgeted - totalSpent;
  const overallPercentage = totalBudgeted > 0 ? Math.round((totalSpent / totalBudgeted) * 100) : 0;
  const daysRemainingInMonth = budgets.length > 0 && budgets[0].daysRemaining ? budgets[0].daysRemaining : 1;
  const overallDailyAllowance = totalRemaining > 0 ? Math.round((totalRemaining / daysRemainingInMonth) * 100) / 100 : 0;
  const overbudgetItems = budgets.filter((b) => b.isOverbudget || b.spentAmount > b.limitAmount);

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
        {/* RESUMEN GLOBAL DEL PRESUPUESTO FAMILIAR                      */}
        {/* ============================================================ */}
        <section className="mint-card p-6 border border-[#1E2B4D] relative overflow-hidden bg-gradient-to-r from-[#101A36] via-[#121E40] to-[#101A36]">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Target className="w-5 h-5" />
                </span>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight">
                  Salud Presupuestaria del Hogar
                </h1>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Monitoreo en tiempo real de todos los límites y ritmos de gasto para este mes.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400 flex items-center gap-1.5 bg-[#0A1128] px-3 py-1.5 rounded-xl border border-[#1E2B4D]">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                <span>Quedan <strong className="text-slate-200">{daysRemainingInMonth} días</strong> de este mes</span>
              </span>
            </div>
          </div>

          {/* Tarjetas de métricas consolidadas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Total Presupuestado */}
            <div className="p-4 rounded-xl bg-[#0A1128]/70 border border-[#1E2B4D]">
              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
                Total Presupuestado
              </span>
              <p className="text-xl sm:text-2xl font-bold text-slate-100 tabular-nums mt-1">
                ${totalBudgeted.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
              <span className="text-[11px] text-slate-500 mt-0.5 block">
                {budgets.length} categorías asignadas
              </span>
            </div>

            {/* 2. Total Gastado */}
            <div className="p-4 rounded-xl bg-[#0A1128]/70 border border-[#1E2B4D]">
              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
                Total Gastado
              </span>
              <p className={`text-xl sm:text-2xl font-bold tabular-nums mt-1 ${
                overallPercentage > 100 ? 'text-rose-400' : 'text-slate-100'
              }`}>
                ${totalSpent.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
              <span className="text-[11px] text-slate-400 mt-0.5 block tabular-nums">
                {overallPercentage}% del presupuesto global
              </span>
            </div>

            {/* 3. Disponible Restante */}
            <div className="p-4 rounded-xl bg-[#0A1128]/70 border border-[#1E2B4D]">
              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
                Disponible Restante
              </span>
              <p className={`text-xl sm:text-2xl font-bold tabular-nums mt-1 ${
                totalRemaining < 0 ? 'text-rose-400' : 'text-emerald-400'
              }`}>
                ${totalRemaining.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                {totalRemaining >= 0 ? 'Margen disponible' : 'Déficit global'}
              </span>
            </div>

            {/* 4. Ritmo Diario Restante */}
            <div className="p-4 rounded-xl bg-[#0A1128]/70 border border-[#1E2B4D]">
              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
                Ritmo Diario Restante
              </span>
              <p className="text-xl sm:text-2xl font-bold text-amber-300 tabular-nums mt-1">
                ~${overallDailyAllowance.toLocaleString('en-US', { minimumFractionDigits: 2 })}/día
              </p>
              <span className="text-[11px] text-slate-500 mt-0.5 block">
                Límite diario recomendado
              </span>
            </div>
          </div>

          {/* Barra de Progreso Global */}
          <div className="mt-5 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Consumo general del mes</span>
              <span className={`font-bold tabular-nums ${
                overallPercentage > 100 ? 'text-rose-400' : overallPercentage >= 80 ? 'text-amber-400' : 'text-emerald-400'
              }`}>
                {overallPercentage}%
              </span>
            </div>
            <div className="w-full bg-[#0A1128] rounded-full h-3 p-0.5 border border-[#1E2B4D] overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  overallPercentage > 100
                    ? 'bg-rose-500'
                    : overallPercentage >= 80
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(Math.max(overallPercentage, 2), 100)}%` }}
              />
            </div>
          </div>

          {/* Alerta de categorías excedidas si aplica */}
          {overbudgetItems.length > 0 && (
            <div className="mt-4 p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0" />
              <div className="text-xs text-rose-200">
                <strong>Atención:</strong> Tienes {overbudgetItems.length} categoría(s) excedida(s) de presupuesto ({overbudgetItems.map(i => i.categoryName).join(', ')}). Considera ajustar los límites o moderar gastos en esas áreas.
              </div>
            </div>
          )}
        </section>

        {/* ============================================================ */}
        {/* 1. SECCIÓN DE PRESUPUESTOS POR CATEGORÍA                    */}
        {/* ============================================================ */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-100 flex items-center gap-2">
                <Target className="w-5 h-5 text-emerald-400" />
                <span>Presupuestos Mensuales</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Control de gastos por categoría para mantener el equilibrio financiero en el hogar.
              </p>
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
              {budgets.map((b) => {
                const isOver = b.isOverbudget || b.spentAmount > b.limitAmount;
                const overAmount = isOver ? b.spentAmount - b.limitAmount : 0;

                return (
                  <div
                    key={b.id}
                    className={`mint-card p-5 space-y-3.5 relative group hover:border-[#2D3E6B] transition-colors border ${
                      isOver ? 'border-rose-500/40 bg-gradient-to-br from-[#101A36] to-rose-950/20' : 'border-[#1E2B4D]'
                    }`}
                  >
                    {/* Botones de acción (Editar y Eliminar) */}
                    <div className="absolute top-3.5 right-3.5 flex items-center gap-1">
                      <button
                        onClick={() => setSelectedBudgetForEdit(b)}
                        className="p-1 rounded-lg text-slate-400 hover:text-emerald-300 hover:bg-[#162347] transition-colors cursor-pointer"
                        title="Modificar límite mensual"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteBudget(b.id)}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-[#162347] transition-colors cursor-pointer"
                        title="Eliminar presupuesto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between pr-16">
                      <div className="flex items-center gap-2.5">
                        <span className="text-xl">{b.categoryIcon || '📊'}</span>
                        <div>
                          <h3 className="text-sm font-semibold text-slate-100">{b.categoryName}</h3>
                          <p className="text-xs text-slate-400 mt-0.5 tabular-nums">
                            Gastado: ${Number(b.spentAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })} / Límite: ${Number(b.limitAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                      </div>

                      {/* Badge con porcentaje real sin tope */}
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-lg border tabular-nums ${
                          isOver
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                            : b.percentage >= 80
                            ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                            : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                        }`}
                      >
                        {b.percentage}%
                      </span>
                    </div>

                    {/* Progress Bar Visual */}
                    <div className="w-full bg-[#0A1128] rounded-full h-2.5 p-0.5 border border-[#1E2B4D] overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isOver
                            ? 'bg-rose-500'
                            : b.percentage >= 80
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(Math.max(b.percentage, 3), 100)}%` }}
                      />
                    </div>

                    {/* Línea de detalle y ritmo diario */}
                    <div className="flex items-center justify-between text-[11px] pt-1">
                      {isOver ? (
                        <span className="text-rose-400 font-semibold flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          Excedido por ${overAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                      ) : (
                        <span className="text-slate-400 tabular-nums">
                          Disponible: <strong className="text-emerald-400">${Number(b.remainingAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong>
                        </span>
                      )}

                      {!isOver && b.dailyRemaining > 0 && (
                        <span className="text-slate-400 tabular-nums">
                          Ritmo: <strong className="text-slate-300">~${Number(b.dailyRemaining).toFixed(0)}/día</strong> rest.
                        </span>
                      )}
                    </div>

                    {/* Compromiso recurrente de suscripciones atadas a este presupuesto */}
                    {Number(b.committedRecurringAmount) > 0 && (
                      <div className="flex items-center justify-between text-[11px] px-2.5 py-1.5 rounded-lg bg-[#0A1128] border border-[#1E2B4D]/70 text-slate-400">
                        <span className="flex items-center gap-1.5 text-indigo-300 font-medium">
                          <span>🔄</span>
                          <span>Compromiso fijo recurrente:</span>
                        </span>
                        <span className="tabular-nums font-semibold text-slate-200">
                          ${Number(b.committedRecurringAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })}/mes
                          <span className="text-[10px] text-slate-500 font-normal ml-1">
                            ({b.recurringSubscriptionsCount} {b.recurringSubscriptionsCount === 1 ? 'servicio' : 'servicios'})
                          </span>
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ============================================================ */}
        {/* 2. SECCIÓN DE METAS DE AHORRO                                */}
        {/* ============================================================ */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-100 flex items-center gap-2">
                <PiggyBank className="w-5 h-5 text-amber-400" />
                <span>Metas de Ahorro Familiares</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Planificación y seguimiento de fondos para emergencias, viajes, compras y proyectos del hogar.
              </p>
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
              No tienes metas de ahorro activas. ¡Comienza una para alcanzar los sueños y metas de tu familia!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {goals.map((g) => (
                <div
                  key={g.id}
                  className="mint-card p-5 space-y-4 relative overflow-hidden border border-[#1E2B4D] flex flex-col justify-between"
                >
                  {/* Botones de acción en la esquina */}
                  <div className="absolute top-3.5 right-3.5 flex items-center gap-1">
                    <button
                      onClick={() => setSelectedGoalForEdit(g)}
                      className="p-1 rounded-lg text-slate-400 hover:text-amber-300 hover:bg-[#162347] transition-colors cursor-pointer"
                      title="Editar meta"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteGoal(g.id)}
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-[#162347] transition-colors cursor-pointer"
                      title="Eliminar meta"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between pr-16">
                      <h3 className="text-sm font-semibold text-slate-100 truncate">{g.name}</h3>
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-full tabular-nums ${
                          g.isCompleted
                            ? 'text-emerald-300 bg-emerald-500/20 border border-emerald-500/30'
                            : 'text-amber-300 bg-amber-500/10 border border-amber-500/30'
                        }`}
                      >
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

                    {/* Progress Bar */}
                    <div className="w-full bg-[#0A1128] rounded-full h-2.5 p-0.5 border border-[#1E2B4D] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all duration-500"
                        style={{ width: `${Math.min(Math.max(g.percentage, 3), 100)}%` }}
                      />
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-[#1E2B4D] text-xs">
                      {g.daysRemaining !== null && (
                        <div className="flex justify-between text-slate-400">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" /> Plazo:
                          </span>
                          <span className="font-medium text-slate-300 tabular-nums">
                            {g.daysRemaining === 0 ? '¡Vence hoy!' : `Faltan ${g.daysRemaining} días`}
                          </span>
                        </div>
                      )}

                      {g.suggestedMonthly > 0 && !g.isCompleted && (
                        <div className="flex justify-between text-slate-400">
                          <span>Ahorro mensual sugerido:</span>
                          <span className="font-semibold text-amber-300 tabular-nums">
                            ${Number(g.suggestedMonthly).toLocaleString('en-US', { minimumFractionDigits: 2 })}/mes
                          </span>
                        </div>
                      )}

                      {g.targetDate && (
                        <div className="flex justify-between text-slate-400">
                          <span>Fecha objetivo:</span>
                          <span className="font-medium text-slate-300 tabular-nums">
                            {new Date(g.targetDate).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Botón de Aportar Fondos */}
                  <div className="pt-2">
                    <button
                      onClick={() => setSelectedGoalForContribute(g)}
                      className="w-full py-2 px-3 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Aportar Fondos</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Modal Crear Presupuesto */}
      {showBudgetModal && (
        <div className="fixed inset-0 bg-[#0A1128]/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="mint-card w-full max-w-md p-6 relative border border-[#1E2B4D] shadow-2xl animate-in fade-in zoom-in-95 duration-150">
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
                <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1.5">
                  Categoría
                </label>
                <select
                  value={bCategoryId}
                  onChange={(e) => setBCategoryId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A1128] border border-[#1E2B4D] text-slate-100 text-sm focus:outline-none focus:border-emerald-400 cursor-pointer transition-colors"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.icon} {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1.5">
                  Límite Mensual ($)
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
                    value={bLimitAmount}
                    onChange={(e) => setBLimitAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-8 pr-3.5 py-2.5 rounded-xl bg-[#0A1128] border border-[#1E2B4D] text-slate-100 font-bold text-base focus:outline-none focus:border-emerald-400 tabular-nums transition-colors"
                  />
                </div>
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

      {/* Modal Crear Meta */}
      {showGoalModal && (
        <div className="fixed inset-0 bg-[#0A1128]/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="mint-card w-full max-w-md p-6 relative border border-[#1E2B4D] shadow-2xl animate-in fade-in zoom-in-95 duration-150">
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
                <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1.5">
                  Nombre de la Meta
                </label>
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
                <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1.5">
                  Monto Objetivo ($)
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
                    value={gTargetAmount}
                    onChange={(e) => setGTargetAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-8 pr-3.5 py-2.5 rounded-xl bg-[#0A1128] border border-[#1E2B4D] text-slate-100 font-bold text-base focus:outline-none focus:border-emerald-400 tabular-nums transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1.5">
                  Monto Inicial Ahorrado ($)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-bold">
                    $
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    value={gCurrentAmount}
                    onChange={(e) => setGCurrentAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-8 pr-3.5 py-2.5 rounded-xl bg-[#0A1128] border border-[#1E2B4D] text-slate-100 text-sm focus:outline-none focus:border-emerald-400 tabular-nums transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1.5">
                  Fecha Objetivo (Opcional)
                </label>
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

      {/* Modal Editar Presupuesto */}
      <EditBudgetModal
        isOpen={!!selectedBudgetForEdit}
        onClose={() => setSelectedBudgetForEdit(null)}
        budget={selectedBudgetForEdit}
        onConfirm={handleUpdateBudget}
      />

      {/* Modal Editar Meta */}
      <EditGoalModal
        isOpen={!!selectedGoalForEdit}
        onClose={() => setSelectedGoalForEdit(null)}
        goal={selectedGoalForEdit}
        onConfirm={handleUpdateGoal}
      />

      {/* Modal Aportar a Meta */}
      <ContributeGoalModal
        isOpen={!!selectedGoalForContribute}
        onClose={() => setSelectedGoalForContribute(null)}
        goal={selectedGoalForContribute}
        accounts={accounts}
        onConfirm={handleContributeGoal}
      />
    </div>
  );
}
