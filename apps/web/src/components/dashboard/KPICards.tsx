'use client';

import React, { useState } from 'react';
import { Wallet, TrendingUp, TrendingDown, ShieldCheck, AlertCircle, Info, CalendarClock } from 'lucide-react';

interface SafeToSpendData {
  liquidBalance?: number;
  pendingCommitments?: number;
  safeToSpendMonth?: number;
  safeToSpendDaily?: number;
  daysRemaining?: number;
  daysInMonth?: number;
  healthStatus?: 'HEALTHY' | 'MODERATE' | 'CRITICAL';
  breakdown?: {
    pendingRemindersTotal?: number;
    pendingSubscriptionsTotal?: number;
    upcomingDebtsTotal?: number;
  };
}

interface KPICardsProps {
  summary: {
    totalBalance?: number | string;
    monthlyIncome?: number | string;
    monthlyExpense?: number | string;
    baseCurrency?: string;
    safeToSpend?: SafeToSpendData;
  };
  selectedCurrency?: string;
  onCurrencyChange?: (currency: string) => void;
}

export default function KPICards({ summary, selectedCurrency = 'USD', onCurrencyChange }: KPICardsProps) {
  const [showBreakdown, setShowBreakdown] = useState(false);

  const baseCurrency = summary.baseCurrency || selectedCurrency;
  const currencySymbols: Record<string, string> = {
    USD: '$',
    EUR: '€',
    DOP: 'RD$',
    MXN: '$',
    COP: '$',
    ARS: '$',
    CLP: '$',
    PEN: 'S/',
    GBP: '£',
    BRL: 'R$',
    CAD: '$',
    USDT: '₮',
  };
  const sym = currencySymbols[baseCurrency] || '$';

  const balance = Number(summary.totalBalance || 0);
  const income = Number(summary.monthlyIncome || 0);
  const expense = Number(summary.monthlyExpense || 0);
  const netSavings = income - expense;

  const sts = summary.safeToSpend;
  const safeDaily = sts?.safeToSpendDaily ?? 0;
  const safeMonth = sts?.safeToSpendMonth ?? 0;
  const daysRemaining = sts?.daysRemaining ?? 1;
  const healthStatus = sts?.healthStatus || 'HEALTHY';
  const liquidBalance = sts?.liquidBalance ?? balance;
  const commitments = sts?.pendingCommitments ?? 0;

  const statusColors = {
    HEALTHY: {
      border: 'border-emerald-500/30',
      bgGlow: 'bg-emerald-500/10',
      badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
      badgeText: 'Saludable',
      iconColor: 'text-emerald-400',
    },
    MODERATE: {
      border: 'border-amber-500/30',
      bgGlow: 'bg-amber-500/10',
      badge: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
      badgeText: 'Ajustado',
      iconColor: 'text-amber-400',
    },
    CRITICAL: {
      border: 'border-rose-500/30',
      bgGlow: 'bg-rose-500/10',
      badge: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
      badgeText: 'Atención',
      iconColor: 'text-rose-400',
    },
  }[healthStatus];

  return (
    <div className="space-y-3">
      {/* Selector de Moneda de Consolidación */}
      {onCurrencyChange && (
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] font-medium text-slate-400">
            Vista consolidada multidivisa con tasas de cambio en tiempo real
          </span>
          <div className="flex items-center gap-1.5 bg-[#101A36] border border-[#1E2B4D] px-2.5 py-1 rounded-xl text-xs shadow-sm">
            <span className="text-[11px] text-slate-400 font-medium">Moneda Base:</span>
            <select
              value={baseCurrency}
              onChange={(e) => onCurrencyChange(e.target.value)}
              className="bg-transparent text-emerald-400 font-bold focus:outline-none cursor-pointer text-xs"
            >
              <option value="USD" className="bg-[#101A36] text-slate-100">🇺🇸 USD ($)</option>
              <option value="EUR" className="bg-[#101A36] text-slate-100">🇪🇺 EUR (€)</option>
              <option value="DOP" className="bg-[#101A36] text-slate-100">🇩🇴 DOP (RD$)</option>
              <option value="MXN" className="bg-[#101A36] text-slate-100">🇲🇽 MXN ($)</option>
              <option value="COP" className="bg-[#101A36] text-slate-100">🇨🇴 COP ($)</option>
              <option value="ARS" className="bg-[#101A36] text-slate-100">🇦🇷 ARS ($)</option>
              <option value="CLP" className="bg-[#101A36] text-slate-100">🇨🇱 CLP ($)</option>
              <option value="PEN" className="bg-[#101A36] text-slate-100">🇵🇪 PEN (S/)</option>
              <option value="GBP" className="bg-[#101A36] text-slate-100">🇬🇧 GBP (£)</option>
              <option value="BRL" className="bg-[#101A36] text-slate-100">🇧🇷 BRL (R$)</option>
              <option value="USDT" className="bg-[#101A36] text-slate-100">🪙 USDT (₮)</option>
            </select>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Safe-to-Spend (Disponible Real Diario) */}
        <div
          className={`mint-card p-5 relative overflow-hidden transition-all duration-200 ${statusColors.border} ${
            showBreakdown ? 'ring-1 ring-emerald-500/50' : ''
          }`}
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">
                  Disponible Hoy
                </span>
                <span
                  className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${statusColors.badge}`}
                >
                  {statusColors.badgeText}
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-lg text-slate-400 font-medium">{sym}</span>
                <span className="text-3xl font-bold text-slate-100 tracking-tight tabular-nums">
                  {safeDaily.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="text-xs text-slate-400 font-medium">/ día</span>
              </div>
            </div>
            <button
              onClick={() => setShowBreakdown(!showBreakdown)}
              title="Ver desglose de compromisos del mes"
              className="w-10 h-10 rounded-xl bg-[#162347] hover:bg-[#1D2D5A] border border-[#1E2B4D] flex items-center justify-center text-emerald-400 shadow-sm transition-colors cursor-pointer"
            >
              <ShieldCheck className="w-5 h-5" />
            </button>
          </div>
          <div className="mt-3 pt-3 border-t border-[#1E2B4D]/60 flex items-center justify-between text-xs text-slate-400">
            <span className="truncate">Mes libre: {sym}{safeMonth.toLocaleString('en-US', { minimumFractionDigits: 0 })}</span>
            <button
              onClick={() => setShowBreakdown(!showBreakdown)}
              className="text-[11px] text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1"
            >
              <Info className="w-3 h-3" />
              {showBreakdown ? 'Ocultar' : 'Detalle'}
            </button>
          </div>
        </div>

        {/* 2. Balance Consolidado */}
        <div className="mint-card p-5 relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                Balance Total
              </span>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-lg text-slate-400 font-medium">{sym}</span>
                <span className="text-3xl font-bold text-slate-100 tracking-tight tabular-nums">
                  {balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#162347] border border-[#1E2B4D] flex items-center justify-center text-emerald-400 shadow-sm">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-[#1E2B4D]/60 flex items-center justify-between text-xs text-slate-400">
            <span>Ahorro neto mes</span>
            <span className={`font-semibold tabular-nums ${netSavings >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {netSavings >= 0 ? '+' : '-'}{sym}{Math.abs(netSavings).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* 3. Ingresos del Mes */}
        <div className="mint-card p-5 relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-medium text-emerald-400 uppercase tracking-wider">
                Ingresos Mes
              </span>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-lg text-emerald-500 font-medium">+{sym}</span>
                <span className="text-3xl font-bold text-emerald-300 tracking-tight tabular-nums">
                  {income.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-sm">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-[#1E2B4D]/60 flex items-center justify-between text-xs text-slate-400">
            <span>Entradas</span>
            <span className="text-emerald-400/80 font-medium">Flujo positivo</span>
          </div>
        </div>

        {/* 4. Gastos del Mes */}
        <div className="mint-card p-5 relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-medium text-rose-400 uppercase tracking-wider">
                Gastos Mes
              </span>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-lg text-rose-500 font-medium">-{sym}</span>
                <span className="text-3xl font-bold text-rose-300 tracking-tight tabular-nums">
                  {expense.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shadow-sm">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-[#1E2B4D]/60 flex items-center justify-between text-xs text-slate-400">
            <span>Salidas</span>
            <span className="text-slate-400 font-medium">Consumo mensual</span>
          </div>
        </div>
      </div>

      {/* Desglose explicativo de Safe-to-Spend al expandir */}
      {showBreakdown && sts && (
        <div className="p-4 rounded-xl bg-[#101A36] border border-[#1E2B4D] animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 pb-3 border-b border-[#1E2B4D]">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-semibold text-slate-200 uppercase tracking-wide">
                ¿Cómo se calcula tu Disponible Real ({baseCurrency})?
              </span>
            </div>
            <span className="text-xs text-slate-400">
              Quedan <strong className="text-slate-200">{daysRemaining} días</strong> en el ciclo mensual
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-3 text-xs">
            <div className="p-3 rounded-lg bg-[#0A1128] border border-[#1E2B4D]">
              <span className="text-slate-400 block mb-1">1. Saldo Líquido Operativo</span>
              <span className="text-base font-bold text-slate-100 tabular-nums">
                {sym}{liquidBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
              <span className="text-[10px] text-slate-500 block mt-1">Cuentas bancarias y efectivo</span>
            </div>

            <div className="p-3 rounded-lg bg-[#0A1128] border border-rose-500/20">
              <span className="text-rose-400 block mb-1">2. Compromisos Pendientes</span>
              <span className="text-base font-bold text-rose-300 tabular-nums">
                -{sym}{commitments.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
              <span className="text-[10px] text-slate-500 block mt-1">
                Suscripciones ({sym}{sts.breakdown?.pendingSubscriptionsTotal?.toFixed(0) || '0'}), Deudas ({sym}
                {sts.breakdown?.upcomingDebtsTotal?.toFixed(0) || '0'}), Recordatorios ({sym}
                {sts.breakdown?.pendingRemindersTotal?.toFixed(0) || '0'})
              </span>
            </div>

            <div className="p-3 rounded-lg bg-[#0A1128] border border-emerald-500/20">
              <span className="text-emerald-400 block mb-1">3. Disponible Libre de Culpa</span>
              <span className="text-base font-bold text-emerald-300 tabular-nums">
                {sym}{safeMonth.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
              <span className="text-[10px] text-slate-400 block mt-1">
                = <strong className="text-emerald-300">{sym}{safeDaily.toFixed(2)}/día</strong> hasta fin de mes
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
