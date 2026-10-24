'use client';

import React from 'react';
import { Wallet, TrendingUp, TrendingDown } from 'lucide-react';

interface KPICardsProps {
  summary: {
    totalBalance?: number | string;
    monthlyIncome?: number | string;
    monthlyExpense?: number | string;
  };
}

export default function KPICards({ summary }: KPICardsProps) {
  const balance = Number(summary.totalBalance || 0);
  const income = Number(summary.monthlyIncome || 0);
  const expense = Number(summary.monthlyExpense || 0);
  const netSavings = income - expense;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      {/* 1. Balance Consolidado */}
      <div className="mint-card p-5 relative overflow-hidden">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
              Balance Consolidado
            </span>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-lg text-slate-400 font-medium">$</span>
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
          <span>Ahorro neto del mes</span>
          <span className={`font-semibold tabular-nums ${netSavings >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {netSavings >= 0 ? '+' : '-'}${Math.abs(netSavings).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* 2. Ingresos del Mes */}
      <div className="mint-card p-5 relative overflow-hidden">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-[11px] font-medium text-emerald-400 uppercase tracking-wider">
              Ingresos del Mes
            </span>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-lg text-emerald-500 font-medium">+$</span>
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
          <span>Entradas registradas</span>
          <span className="text-emerald-400/80 font-medium">Flujo positivo</span>
        </div>
      </div>

      {/* 3. Gastos del Mes */}
      <div className="mint-card p-5 relative overflow-hidden">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-[11px] font-medium text-rose-400 uppercase tracking-wider">
              Gastos del Mes
            </span>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-lg text-rose-500 font-medium">-$</span>
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
          <span>Salidas registradas</span>
          <span className="text-slate-400 font-medium">Consumo mensual</span>
        </div>
      </div>
    </div>
  );
}
