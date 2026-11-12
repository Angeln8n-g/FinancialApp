'use client';

import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  ShieldCheck,
  AlertTriangle,
  AlertCircle,
  Sliders,
  Calendar,
  Sparkles,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Wallet,
  Zap
} from 'lucide-react';

interface CashFlowProjectionProps {
  summary: {
    totalBalance?: number;
    monthlyIncome?: number;
    monthlyExpense?: number;
    safeDaily?: number;
  };
  accounts: any[];
  reminders: any[];
  subscriptions: any[];
  debts: any[];
  selectedCurrency?: string;
}

export default function CashFlowProjection({
  summary,
  accounts,
  reminders,
  subscriptions,
  debts,
  selectedCurrency = 'USD',
}: CashFlowProjectionProps) {
  const [horizonDays, setHorizonDays] = useState<30 | 60>(30);
  const [expenseCutPercent, setExpenseCutPercent] = useState<number>(0);
  const [extraIncome, setExtraIncome] = useState<number>(0);
  const [expandedDetails, setExpandedDetails] = useState<boolean>(false);

  const totalBalance = Number(summary?.totalBalance || 0);
  const monthlyIncome = Number(summary?.monthlyIncome || 0);
  const monthlyExpense = Number(summary?.monthlyExpense || 0);

  // 1. Cálculo de Salud Financiera Familiar (0 - 100)
  const healthScoreAnalysis = useMemo(() => {
    let score = 0;
    const recommendations: string[] = [];

    // Pilar A: Tasa de Ahorro Neto (Máx 30 pts)
    const netSavings = monthlyIncome - monthlyExpense;
    const savingsRate = monthlyIncome > 0 ? (netSavings / monthlyIncome) * 100 : 0;
    if (savingsRate >= 25) {
      score += 30;
      recommendations.push('Excelente tasa de ahorro (+25%). Canaliza el excedente a inversiones o metas.');
    } else if (savingsRate >= 15) {
      score += 24;
      recommendations.push('Buen ritmo de ahorro (15-24%). Mantén controlados los gastos hormiga.');
    } else if (savingsRate > 0) {
      score += 15;
      recommendations.push('Ahorro moderado. Evalúa reducir suscripciones prescindibles para elevar el margen.');
    } else {
      score += 5;
      recommendations.push('Déficit operativo este mes: los gastos superan los ingresos.');
    }

    // Pilar B: Colchón de Liquidez / Pista de Aterrizaje (Máx 30 pts)
    const monthlyBurn = monthlyExpense > 0 ? monthlyExpense : 1000;
    const runwayMonths = totalBalance / monthlyBurn;
    if (runwayMonths >= 6) {
      score += 30;
      recommendations.push('Fondo de emergencia robusto: cubre más de 6 meses de gastos del hogar.');
    } else if (runwayMonths >= 3) {
      score += 24;
      recommendations.push(`Colchón financiero saludable (${runwayMonths.toFixed(1)} meses de cobertura).`);
    } else if (runwayMonths >= 1) {
      score += 15;
      recommendations.push(`Colchón ajustado (${runwayMonths.toFixed(1)} meses). Prioriza elevar la reserva de seguridad.`);
    } else {
      score += 5;
      recommendations.push('Liquidez crítica: menos de 1 mes de gastos cubierto. Evita gastos variables no urgentes.');
    }

    // Pilar C: Carga de Deuda Mensual (Máx 20 pts)
    const totalDebtCommitments = debts.reduce(
      (sum, d) => sum + (Number(d.minimumPayment) || Number(d.amount) * 0.05),
      0
    );
    const dtiRatio = monthlyIncome > 0 ? (totalDebtCommitments / monthlyIncome) * 100 : 0;
    if (debts.length === 0 || dtiRatio < 10) {
      score += 20;
    } else if (dtiRatio <= 25) {
      score += 15;
    } else if (dtiRatio <= 40) {
      score += 10;
      recommendations.push('La deuda mensual absorbe más del 25% del ingreso. Considera amortizar anticipadamente.');
    } else {
      score += 4;
      recommendations.push('Elevada carga de deuda (+40% del ingreso). Revisa el método bola de nieve.');
    }

    // Pilar D: Solvencia Inmediata de Compromisos a 30 días (Máx 20 pts)
    const upcomingCommitments = reminders
      .filter((r) => !r.isPaid)
      .reduce((s, r) => s + Number(r.amount || 0), 0);
    if (totalBalance >= upcomingCommitments * 2) {
      score += 20;
    } else if (totalBalance >= upcomingCommitments) {
      score += 15;
    } else {
      score += 5;
      recommendations.push('Atención: Las cuentas por pagar de los próximos 30 días superan la liquidez disponible.');
    }

    const finalScore = Math.min(100, Math.max(10, Math.round(score)));

    let statusText = 'Saludable';
    let statusColor = 'text-emerald-400';
    let badgeClass = 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
    let icon = ShieldCheck;

    if (finalScore >= 85) {
      statusText = 'Excelente';
      statusColor = 'text-emerald-400';
      badgeClass = 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
      icon = ShieldCheck;
    } else if (finalScore >= 70) {
      statusText = 'Saludable';
      statusColor = 'text-teal-400';
      badgeClass = 'bg-teal-500/15 text-teal-300 border-teal-500/30';
      icon = TrendingUp;
    } else if (finalScore >= 50) {
      statusText = 'Atención';
      statusColor = 'text-amber-400';
      badgeClass = 'bg-amber-500/15 text-amber-300 border-amber-500/30';
      icon = AlertTriangle;
    } else {
      statusText = 'Vulnerable';
      statusColor = 'text-rose-400';
      badgeClass = 'bg-rose-500/15 text-rose-300 border-rose-500/30';
      icon = AlertCircle;
    }

    return {
      score: finalScore,
      statusText,
      statusColor,
      badgeClass,
      icon,
      runwayMonths,
      recommendations: recommendations.slice(0, 3),
    };
  }, [totalBalance, monthlyIncome, monthlyExpense, debts, reminders]);

  // 2. Simulación Predictiva Día por Día (Next 30 o 60 días)
  const simulation = useMemo(() => {
    const today = new Date();
    const days = horizonDays;
    const baseDailyBurn = monthlyExpense > 0 ? monthlyExpense / 30 : 0;
    const adjustedDailyBurn = baseDailyBurn * (1 - expenseCutPercent / 100);

    let baselineRunning = totalBalance;
    let simulatedRunning = totalBalance;
    let lowestBaseline = totalBalance;
    let lowestBaselineDate: Date | null = null;

    const dataPoints: Array<{
      dayIndex: number;
      dateStr: string;
      baselineBalance: number;
      simulatedBalance: number;
    }> = [];

    // Mapeo de recordatorios por día relativo
    const remindersByDay: Record<number, number> = {};
    reminders.forEach((r) => {
      if (r.dueDate && !r.isPaid) {
        const d = new Date(r.dueDate);
        const diff = Math.floor((d.getTime() - today.getTime()) / (1000 * 3600 * 24));
        if (diff >= 0 && diff < days) {
          remindersByDay[diff] = (remindersByDay[diff] || 0) + Number(r.amount || 0);
        }
      }
    });

    for (let i = 0; i < days; i++) {
      const curDate = new Date(today);
      curDate.setDate(today.getDate() + i);

      const dayOfMonth = curDate.getDate();
      const isPayrollDay = dayOfMonth === 15 || dayOfMonth === 30 || (dayOfMonth === 28 && curDate.getMonth() === 1);

      // Inflows
      const dailyIncomePortion = isPayrollDay ? monthlyIncome / 2 : 0;
      const extraDailyPortion = isPayrollDay ? extraIncome / 2 : 0;

      // Outflows
      const dayReminders = remindersByDay[i] || 0;

      baselineRunning = baselineRunning + dailyIncomePortion - baseDailyBurn - dayReminders;
      simulatedRunning = simulatedRunning + dailyIncomePortion + extraDailyPortion - adjustedDailyBurn - dayReminders;

      if (baselineRunning < lowestBaseline) {
        lowestBaseline = baselineRunning;
        lowestBaselineDate = curDate;
      }

      dataPoints.push({
        dayIndex: i,
        dateStr: curDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }),
        baselineBalance: Math.round(baselineRunning),
        simulatedBalance: Math.round(simulatedRunning),
      });
    }

    const endBaseline = dataPoints[dataPoints.length - 1]?.baselineBalance ?? baselineRunning;
    const endSimulated = dataPoints[dataPoints.length - 1]?.simulatedBalance ?? simulatedRunning;
    const netGain = endSimulated - endBaseline;

    const safetyBuffer = Math.max(300, monthlyExpense * 0.1);
    const hasDeficitRisk = lowestBaseline < safetyBuffer;

    return {
      dataPoints,
      lowestBaseline,
      lowestBaselineDate,
      endBaseline,
      endSimulated,
      netGain,
      hasDeficitRisk,
      safetyBuffer,
    };
  }, [totalBalance, monthlyIncome, monthlyExpense, reminders, horizonDays, expenseCutPercent, extraIncome]);

  const StatusIcon = healthScoreAnalysis.icon;

  return (
    <div className="mint-card p-5 sm:p-6 space-y-5 border border-[#1E2B4D]">
      {/* Header & Quick Horizon Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1E2B4D]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-100 flex items-center gap-2">
              <span>Flujo de Caja Predictivo & Salud Familiar</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-semibold">
                IA Predictiva
              </span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Proyección de liquidez diaria y solidez financiera a {horizonDays} días vista.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-1.5 bg-[#0A1128] p-1 rounded-xl border border-[#1E2B4D] self-start sm:self-auto">
          <button
            onClick={() => setHorizonDays(30)}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              horizonDays === 30
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            30 Días
          </button>
          <button
            onClick={() => setHorizonDays(60)}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              horizonDays === 60
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            60 Días
          </button>
        </div>
      </div>

      {/* KPI Gauge Strip: Score + Pista + Saldo Proyectado */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Score Card */}
        <div className="p-4 rounded-xl mint-card border border-[#1E2B4D] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Salud Financiera
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className={`text-3xl font-extrabold tabular-nums ${healthScoreAnalysis.statusColor}`}>
                {healthScoreAnalysis.score}
              </span>
              <span className="text-xs text-slate-400 font-medium">/100</span>
            </div>
            <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border mt-1.5 ${healthScoreAnalysis.badgeClass}`}>
              <StatusIcon className="w-3 h-3" />
              <span>{healthScoreAnalysis.statusText}</span>
            </span>
          </div>

          <div className="w-14 h-14 rounded-full border-4 border-emerald-500/20 border-t-emerald-400 flex items-center justify-center font-bold text-xs text-slate-200 shrink-0">
            {healthScoreAnalysis.score}%
          </div>
        </div>

        {/* Pista de Aterrizaje / Runway */}
        <div className="p-4 rounded-xl mint-card border border-[#1E2B4D]">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Pista de Aterrizaje (Runway)
          </span>
          <p className="text-2xl font-bold text-slate-100 mt-1 tabular-nums">
            {healthScoreAnalysis.runwayMonths.toFixed(1)}{' '}
            <span className="text-xs font-normal text-slate-400">meses</span>
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {healthScoreAnalysis.runwayMonths >= 3
              ? '✓ Colchón holgado para imprevistos'
              : '⚠️ Colchón bajo: construir fondo de emergencia'}
          </span>
        </div>

        {/* Saldo Final Proyectado */}
        <div className="p-4 rounded-xl mint-card border border-[#1E2B4D]">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Saldo al Día +{horizonDays}
          </span>
          <p className={`text-2xl font-bold mt-1 tabular-nums ${simulation.endBaseline >= 0 ? 'text-slate-100' : 'text-rose-400'}`}>
            ${simulation.endBaseline.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {simulation.netGain > 0 ? (
              <span className="text-emerald-400 font-semibold">
                +${simulation.netGain.toFixed(2)} con tu simulación
              </span>
            ) : (
              `Estimado con ritmo de gasto actual`
            )}
          </span>
        </div>
      </div>

      {/* Alerta Preventiva de Déficit de Liquidez */}
      {simulation.hasDeficitRisk && (
        <div className="p-3.5 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-200">
            <span className="font-bold text-amber-300 block text-xs">
              Alerta de Liquidez Preventiva
            </span>
            <p className="mt-0.5 text-slate-300">
              Se proyecta un punto bajo de <strong>${simulation.lowestBaseline.toFixed(2)}</strong> alrededor del{' '}
              <strong>{simulation.lowestBaselineDate?.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}</strong>, 
              por debajo de tu colchón de seguridad (${simulation.safetyBuffer.toFixed(0)}). 
              Te sugerimos postergar compras variables para esa semana o adelantar cobros.
            </p>
          </div>
        </div>
      )}

      {/* Mini Visualizador de Proyección (Sparkline / Barras de Muestreo) */}
      <div className="p-4 rounded-xl bg-[#0A1128] border border-[#1E2B4D] space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-slate-300 uppercase tracking-wider text-[10px]">
            Evolución Proyectada ({horizonDays} Días)
          </span>
          <div className="flex items-center gap-3 text-[11px]">
            <span className="flex items-center gap-1.5 text-slate-400">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-500 inline-block" />
              Base actual
            </span>
            {expenseCutPercent > 0 || extraIncome > 0 ? (
              <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />
                Con escenario simulado
              </span>
            ) : null}
          </div>
        </div>

        {/* Barras de muestra en 7 intervalos */}
        <div className="grid grid-cols-7 gap-2 pt-2 items-end h-28">
          {simulation.dataPoints
            .filter((_, idx, arr) => idx % Math.ceil(arr.length / 7) === 0 || idx === arr.length - 1)
            .slice(0, 7)
            .map((dp, idx) => {
              const maxVal = Math.max(
                1,
                ...simulation.dataPoints.map((p) => Math.max(p.baselineBalance, p.simulatedBalance))
              );
              const baseHeight = Math.max(10, Math.min(100, (dp.baselineBalance / maxVal) * 100));
              const simHeight = Math.max(10, Math.min(100, (dp.simulatedBalance / maxVal) * 100));

              return (
                <div key={idx} className="flex flex-col items-center h-full justify-end group">
                  <div className="w-full flex items-end justify-center gap-1 h-20">
                    <div
                      style={{ height: `${baseHeight}%` }}
                      className="w-3 rounded-t bg-slate-600/80 group-hover:bg-slate-500 transition-all"
                      title={`Base: $${dp.baselineBalance}`}
                    />
                    {(expenseCutPercent > 0 || extraIncome > 0) && (
                      <div
                        style={{ height: `${simHeight}%` }}
                        className="w-3 rounded-t bg-emerald-500/90 group-hover:bg-emerald-400 transition-all shadow-sm"
                        title={`Simulado: $${dp.simulatedBalance}`}
                      />
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 tabular-nums">
                    {dp.dateStr}
                  </span>
                </div>
              );
            })}
        </div>
      </div>

      {/* Simulador Interactivo "What-If" */}
      <div className="p-4 rounded-xl mint-card border border-[#1E2B4D] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-emerald-400" />
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Simulador de Escenarios ("What-If")
            </h4>
          </div>
          {(expenseCutPercent > 0 || extraIncome > 0) && (
            <button
              onClick={() => {
                setExpenseCutPercent(0);
                setExtraIncome(0);
              }}
              className="text-[11px] text-emerald-400 hover:underline cursor-pointer"
            >
              Restablecer
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Slider Recorte de Gastos */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Recorte de Gastos Variables:</span>
              <span className="font-bold text-emerald-400 tabular-nums">-{expenseCutPercent}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="40"
              step="5"
              value={expenseCutPercent}
              onChange={(e) => setExpenseCutPercent(parseInt(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-[#0A1128] rounded-lg"
            />
            <span className="text-[10px] text-slate-500 block">
              Ahorro de ~${((monthlyExpense * (expenseCutPercent / 100))).toFixed(0)}/mes en ocio o compras
            </span>
          </div>

          {/* Slider Ingreso Adicional */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Ingreso Adicional Estimado:</span>
              <span className="font-bold text-emerald-400 tabular-nums">+${extraIncome}</span>
            </div>
            <input
              type="range"
              min="0"
              max="1500"
              step="50"
              value={extraIncome}
              onChange={(e) => setExtraIncome(parseInt(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-[#0A1128] rounded-lg"
            />
            <span className="text-[10px] text-slate-500 block">
              Horas extra, ventas secundarias o bono familiar
            </span>
          </div>
        </div>

        {(expenseCutPercent > 0 || extraIncome > 0) && (
          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                Con este escenario sumarás <strong>+${simulation.netGain.toFixed(2)}</strong> a tu cuenta a fin de mes.
              </span>
            </div>
            <span className="font-bold text-xs uppercase px-2 py-0.5 rounded bg-emerald-600 text-white shrink-0">
              Impacto Positivo
            </span>
          </div>
        )}
      </div>

      {/* Recomendaciones Personalizadas Expandibles */}
      <div className="pt-1">
        <button
          onClick={() => setExpandedDetails(!expandedDetails)}
          className="w-full py-2 px-3 rounded-xl mint-card border border-[#1E2B4D] hover:bg-[#162347] transition-colors flex items-center justify-between text-xs font-semibold text-slate-300 cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Recomendaciones personalizadas del Asesor HogarIQ ({healthScoreAnalysis.recommendations.length})</span>
          </span>
          {expandedDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {expandedDetails && (
          <div className="mt-2 p-3.5 rounded-xl bg-[#0A1128] border border-[#1E2B4D] space-y-2 text-xs animate-fadeIn">
            {healthScoreAnalysis.recommendations.map((rec, idx) => (
              <div key={idx} className="flex items-start gap-2 text-slate-300">
                <span className="text-emerald-400 font-bold">•</span>
                <span>{rec}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
