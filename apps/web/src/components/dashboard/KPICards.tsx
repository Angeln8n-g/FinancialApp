'use client';

import React from 'react';

interface KPICardsProps {
  summary: {
    totalBalance?: number | string;
    monthlyIncome?: number | string;
    monthlyExpense?: number | string;
  };
}

export default function KPICards({ summary }: KPICardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="glass-card p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10 text-5xl">💰</div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Balance Consolidado</p>
        <h2 className="text-3xl font-black text-white tracking-tight">
          ${Number(summary.totalBalance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </h2>
        <p className="text-xs text-slate-400 mt-2">Suma de todas las cuentas activas</p>
      </div>

      <div className="glass-card p-6 border-emerald-500/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10 text-5xl">📈</div>
        <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1">Ingresos del Mes</p>
        <h2 className="text-3xl font-black text-emerald-400 tracking-tight">
          +${Number(summary.monthlyIncome || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </h2>
        <p className="text-xs text-slate-400 mt-2">Entradas registradas</p>
      </div>

      <div className="glass-card p-6 border-rose-500/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10 text-5xl">📉</div>
        <p className="text-xs font-semibold text-rose-400 uppercase tracking-wider mb-1">Gastos del Mes</p>
        <h2 className="text-3xl font-black text-rose-400 tracking-tight">
          -${Number(summary.monthlyExpense || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </h2>
        <p className="text-xs text-slate-400 mt-2">Salidas registradas</p>
      </div>
    </div>
  );
}
