'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { BarChart3, FileText, Download, PieChart } from 'lucide-react';

export default function ReportsPage() {
  const router = useRouter();

  const [distribution, setDistribution] = useState<any>({ totalExpense: 0, categoriesDistribution: [] });
  const [loading, setLoading] = useState(true);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  const getToken = () => typeof window !== 'undefined' ? localStorage.getItem('hogariq_token') : null;

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
      <div className="min-h-screen bg-[#0A1128] text-slate-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-3 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A1128] text-slate-100 pb-20 lg:pb-12">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-emerald-400" />
              <span>Reportes & Analítica Financiera</span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">Monitoreo del flujo de efectivo y distribución de consumo del hogar.</p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleExportPdf}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white cursor-pointer flex items-center space-x-1.5 transition-all shadow-sm"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Informe PDF</span>
            </button>
            <button
              onClick={handleExportCsv}
              className="px-3.5 py-2 rounded-xl bg-[#162347] hover:bg-[#1D2D5A] border border-[#1E2B4D] text-xs font-medium text-slate-200 cursor-pointer flex items-center space-x-1.5 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar CSV</span>
            </button>
          </div>
        </div>

        {/* KPI Banner */}
        <div className="mint-card p-6 border border-[#1E2B4D] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total de Gastos Analizados</p>
            <h2 className="text-3xl font-bold text-rose-400 mt-1 tabular-nums">
              ${Number(distribution.totalExpense || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </h2>
          </div>
          <div>
            <span className="text-xs font-semibold text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-3 py-1.5 rounded-xl inline-flex items-center gap-1.5">
              <PieChart className="w-3.5 h-3.5" />
              <span>{distribution.categoriesDistribution?.length || 0} Categorías Activas</span>
            </span>
          </div>
        </div>

        {/* Distribución por Categoría */}
        <div className="mint-card p-6 space-y-6 border border-[#1E2B4D]">
          <h3 className="text-sm font-semibold text-slate-100">Distribución de Gastos por Categoría</h3>

          {distribution.categoriesDistribution?.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              No hay suficientes datos de gastos registrados para generar el reporte de distribución.
            </div>
          ) : (
            <div className="space-y-5">
              {distribution.categoriesDistribution.map((item: any, idx: number) => (
                <div key={idx} className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="flex items-center space-x-2 text-slate-200">
                      <span>{item.name}</span>
                    </span>
                    <span className="text-slate-100 font-semibold tabular-nums">
                      ${Number(item.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })} ({item.percentage}%)
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-2.5 bg-[#0A1128] rounded-full overflow-hidden p-0.5 border border-[#1E2B4D]">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(Math.max(item.percentage, 3), 100)}%`,
                        backgroundColor: item.color || '#10B981',
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
