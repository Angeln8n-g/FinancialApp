'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ReportsPage() {
  const router = useRouter();

  const [distribution, setDistribution] = useState<any>({ totalExpense: 0, categoriesDistribution: [] });
  const [loading, setLoading] = useState(true);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  const getToken = () => localStorage.getItem('hogariq_token');

  const fetchDistribution = async () => {
    const token = getToken();
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/reports/expense-distribution`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setDistribution(await res.json());
      }
    } catch (err) {
      console.error('Error cargando reportes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDistribution();
  }, []);

  const handleExportCsv = async () => {
    const token = getToken();
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/api/reports/export`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `hogariq_transacciones_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
    } catch (err) {
      console.error('Error exportando CSV:', err);
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
            <h1 className="text-lg font-bold text-white leading-tight">Reportes & Analítica Financiera</h1>
          </div>

          <button
            onClick={handleExportCsv}
            className="px-4 py-2 rounded-xl glow-button text-xs font-bold text-white cursor-pointer flex items-center space-x-2"
          >
            <span>📥</span>
            <span>Exportar CSV</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* KPI Banner */}
        <div className="glass-card p-6 border border-purple-500/30 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total de Gastos Analizados</p>
            <h2 className="text-3xl font-black text-rose-400 mt-1">
              ${Number(distribution.totalExpense || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </h2>
          </div>
          <div className="text-right">
            <span className="text-xs font-bold text-purple-300 bg-purple-600/20 border border-purple-500/30 px-3 py-1.5 rounded-xl">
              {distribution.categoriesDistribution?.length || 0} Categorías Activas
            </span>
          </div>
        </div>

        {/* Distribución por Categoría */}
        <div className="glass-card p-6 space-y-6">
          <h3 className="text-base font-bold text-white">Distribución de Gastos por Categoría</h3>

          {distribution.categoriesDistribution?.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm">
              No hay suficientes datos de gastos registradas para generar el reporte.
            </div>
          ) : (
            <div className="space-y-6">
              {distribution.categoriesDistribution.map((item: any, idx: number) => (
                <div key={idx} className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="flex items-center space-x-2 text-slate-200">
                      <span className="text-base">{item.icon}</span>
                      <span>{item.name}</span>
                    </span>
                    <span className="text-slate-100">
                      ${Number(item.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })} ({item.percentage}%)
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-800">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.max(item.percentage, 4)}%`,
                        backgroundColor: item.color || '#8b5cf6',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
