'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

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
  const handleExportPdf = async () => {
    const token = getToken();
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/api/reports/pdf`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const htmlText = await res.text();
        const win = window.open('', '_blank');
        if (win) {
          win.document.write(htmlText);
          win.document.close();
        }
      }
    } catch (err) {
      console.error('Error generando PDF:', err);
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
    <div className="min-h-screen bg-[#0f172a] text-slate-100 pb-20 lg:pb-12">
      <Navbar />

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="text-xl font-extrabold text-white">Reportes & Analítica Financiera</h1>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleExportPdf}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white cursor-pointer flex items-center space-x-2 transition-colors shadow-md"
            >
              <span>📄</span>
              <span>Informe PDF Ejecutivo</span>
            </button>
            <button
              onClick={handleExportCsv}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 cursor-pointer flex items-center space-x-2 transition-colors"
            >
              <span>📥</span>
              <span>Exportar CSV</span>
            </button>
          </div>
        </div>
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
