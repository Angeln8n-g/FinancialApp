'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import {
  BarChart3,
  FileText,
  Download,
  PieChart,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  ShieldCheck,
  Calendar,
  Activity,
  Sparkles,
  Printer,
} from 'lucide-react';

export default function ReportsPage() {
  const router = useRouter();

  const [distribution, setDistribution] = useState<any>({ totalExpense: 0, categoriesDistribution: [] });
  const [cashflow, setCashflow] = useState<any>(null);
  const [projectionDays, setProjectionDays] = useState<number>(30);
  const [cashflowLoading, setCashflowLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'analytics' | 'executive'>('analytics');
  const [householdName, setHouseholdName] = useState('Hogar Principal');

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  const getToken = () => typeof window !== 'undefined' ? localStorage.getItem('hogariq_token') : null;

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hStr = localStorage.getItem('hogariq_household');
      if (hStr) {
        try {
          const h = JSON.parse(hStr);
          if (h?.name) setHouseholdName(h.name);
        } catch (_) {}
      }
    }
  }, []);

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

  const fetchCashflow = async (days: number = projectionDays) => {
    const token = getToken();
    if (!token) return;
    setCashflowLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/reports/cashflow-projection?days=${days}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setCashflow(await res.json());
      }
    } catch (e) {
      console.error('Error cargando proyección de flujo:', e);
    } finally {
      setCashflowLoading(false);
    }
  };

  useEffect(() => {
    fetchDistribution();
    fetchCashflow(30);
  }, []);

  const handleDaysChange = (days: number) => {
    setProjectionDays(days);
    fetchCashflow(days);
  };

  const handleExportCsv = async () => {
    const token = getToken();
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/api/reports/export`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const text = await res.text();
        const blob = new Blob(['\uFEFF' + text], { type: 'text/csv;charset=utf-8;' });
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
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
              <span>Exportar CSV / Excel</span>
            </button>
          </div>
        </div>

        {/* Selector de Modo: Analítica Interactiva vs Extracto Mensual Ejecutivo */}
        <div className="flex items-center space-x-1 p-1 bg-[#0A1128] rounded-xl border border-[#1E2B4D] w-fit no-print">
          <button
            onClick={() => setViewMode('analytics')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'analytics'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Analítica Interactiva</span>
          </button>
          <button
            onClick={() => setViewMode('executive')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'executive'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Extracto Mensual Ejecutivo</span>
          </button>
        </div>

        {viewMode === 'executive' ? (
          /* 📋 VISTA INFORME EJECUTIVO IMPRIMIBLE */
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl mint-card border border-[#1E2B4D] no-print">
              <div>
                <span className="text-xs font-bold text-slate-200 block">Extracto Financiero de Alta Resolución</span>
                <span className="text-[11px] text-slate-400">
                  Formato de banca privada listo para imprimir o exportar como documento PDF oficial.
                </span>
              </div>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 cursor-pointer shadow-md transition-all self-start sm:self-auto"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir / Guardar en PDF</span>
              </button>
            </div>

            {/* Documento Imprimible */}
            <div className="printable-statement mint-card p-6 sm:p-8 border border-[#1E2B4D] space-y-6 shadow-xl">
              {/* Header Documento */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#1E2B4D] gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🏛️</span>
                    <div>
                      <h2 className="text-xl font-bold tracking-tight text-slate-100">HogarIQ • Family Office</h2>
                      <p className="text-xs text-slate-400">Informe Mensual de Rendición de Cuentas y Posición Patrimonial</p>
                    </div>
                  </div>
                </div>
                <div className="text-left sm:text-right text-xs text-slate-400 space-y-1">
                  <p><strong className="text-slate-200">Hogar:</strong> {householdName}</p>
                  <p><strong className="text-slate-200">Período:</strong> {new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}</p>
                  <p><strong className="text-slate-200">Fecha de Emisión:</strong> {new Date().toLocaleDateString('es-ES')}</p>
                </div>
              </div>

              {/* KPI Strip Ejecutivo */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl mint-card border border-[#1E2B4D]">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Gasto Total Analizado</span>
                  <p className="text-2xl font-bold text-rose-400 mt-1 tabular-nums">
                    ${Number(distribution.totalExpense || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                  <span className="text-[10px] text-slate-400">{distribution.categoriesDistribution?.length || 0} categorías de gasto</span>
                </div>

                <div className="p-4 rounded-xl mint-card border border-[#1E2B4D]">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Burn Rate Diario</span>
                  <p className="text-2xl font-bold text-slate-100 mt-1 tabular-nums">
                    ${Number(cashflow?.dailyBurnRate || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                  <span className="text-[10px] text-slate-400">Ritmo de consumo medio</span>
                </div>

                <div className="p-4 rounded-xl mint-card border border-[#1E2B4D]">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Estado de Liquidez</span>
                  <p className="text-2xl font-bold text-emerald-400 mt-1">
                    {cashflow?.alert === 'HEALTHY' ? 'Saludable' : 'Atención'}
                  </p>
                  <span className="text-[10px] text-slate-400">Punto mínimo proyectado: ${Number(cashflow?.projectedMinBalance || 0).toFixed(2)}</span>
                </div>
              </div>

              {/* Tabla Desglose de Categorías */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Desglose de Consumo por Categoría
                </h4>
                <div className="border border-[#1E2B4D] rounded-xl overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-[#0A1128] text-slate-400 font-semibold border-b border-[#1E2B4D]">
                      <tr>
                        <th className="p-3">Categoría</th>
                        <th className="p-3 text-right">Monto</th>
                        <th className="p-3 text-right">% del Gasto Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1E2B4D]">
                      {distribution.categoriesDistribution?.map((cat: any, idx: number) => (
                        <tr key={idx} className="hover:bg-[#162347]/40">
                          <td className="p-3 font-medium text-slate-200 flex items-center gap-2">
                            <span>{cat.icon || '🏷️'}</span>
                            <span>{cat.name}</span>
                          </td>
                          <td className="p-3 text-right font-bold tabular-nums text-rose-400">
                            ${Number(cat.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="p-3 text-right text-slate-300 font-semibold tabular-nums">
                            {cat.percentage}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Compromisos Próximos */}
              {cashflow?.upcomingCommitments && cashflow.upcomingCommitments.length > 0 && (
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Obligaciones y Compromisos Fijos Próximos
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {cashflow.upcomingCommitments.map((c: any, idx: number) => (
                      <div key={idx} className="p-2.5 rounded-lg border border-[#1E2B4D] flex justify-between items-center mint-card">
                        <div>
                          <p className="font-semibold text-slate-200">{c.name}</p>
                          <span className="text-[10px] text-slate-400">{new Date(c.date).toLocaleDateString()}</span>
                        </div>
                        <span className="font-bold text-rose-400 tabular-nums">-${Number(c.amount).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Pie Oficial del Extracto */}
              <div className="pt-6 border-t border-[#1E2B4D] flex flex-col sm:flex-row justify-between items-center text-[11px] text-slate-400 gap-2">
                <span>Extracto oficial certificado de control financiero familiar HogarIQ.</span>
                <span>Firma Responsable del Hogar: ___________________________</span>
              </div>
            </div>
          </div>
        ) : (
          <>
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

        {/* 📈 PROYECCIÓN DE FLUJO DE CAJA (CASHFLOW RUNWAY) */}
        <section className="mint-card p-6 border border-[#1E2B4D] space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                <h2 className="text-base font-bold text-white">
                  Proyección de Flujo de Caja & Pista de Aterrizaje (Runway)
                </h2>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Simulación del saldo futuro basada en compromisos fijos (suscripciones, deudas, recordatorios) y ritmo de gasto diario.
              </p>
            </div>

            {/* Selector de Horizonte 30 vs 60 días */}
            <div className="flex items-center space-x-1 bg-[#0A1128] p-1 rounded-xl border border-[#1E2B4D] self-start sm:self-auto">
              <button
                onClick={() => handleDaysChange(30)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  projectionDays === 30
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                30 Días
              </button>
              <button
                onClick={() => handleDaysChange(60)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  projectionDays === 60
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                60 Días
              </button>
            </div>
          </div>

          {cashflowLoading ? (
            <div className="py-12 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-500 border-t-transparent" />
            </div>
          ) : cashflow ? (
            <>
              {/* Alerta de Salud Financiera */}
              <div
                className={`p-4 rounded-xl border flex items-center justify-between gap-3 text-xs font-semibold ${
                  cashflow.alert === 'HEALTHY'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : cashflow.alert === 'DEFICIT_RISK'
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {cashflow.alert === 'HEALTHY' ? (
                    <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                  )}
                  <div>
                    <span className="font-bold uppercase tracking-wider text-[11px] block">
                      {cashflow.alert === 'HEALTHY'
                        ? '🟢 Estado Saludable'
                        : cashflow.alert === 'DEFICIT_RISK'
                        ? '🟡 Atención Requerida'
                        : '🔴 Riesgo de Déficit'}
                    </span>
                    <p className="text-xs font-normal mt-0.5">
                      {cashflow.alert === 'HEALTHY'
                        ? `Tu saldo disponible cubre con holgura los próximos ${projectionDays} días manteniendo tu ritmo actual.`
                        : cashflow.alert === 'DEFICIT_RISK'
                        ? `El saldo proyectado alcanzará un punto mínimo de $${cashflow.projectedMinBalance.toFixed(2)} el ${new Date(cashflow.projectedMinDate).toLocaleDateString()}. Considera pausar gastos opcionales.`
                        : `Alerta: Tu runway estimado es de ${cashflow.runwayDays} días antes de que los egresos fijos superen tu liquidez.`}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[10px] text-slate-400 uppercase">Runway Estimado</span>
                  <p className="text-lg font-bold tabular-nums">
                    {cashflow.runwayDays > 180 ? '> 6 meses' : `${cashflow.runwayDays} días`}
                  </p>
                </div>
              </div>

              {/* Grid 4 KPIs de Flujo */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-[#0A1128] border border-[#1E2B4D]">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Saldo Inicial</span>
                  <p className="text-xl font-bold text-white mt-1 tabular-nums">
                    ${Number(cashflow.currentBalance || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <span className="text-[10px] text-slate-500">Liquidez actual</span>
                </div>

                <div className="p-3.5 rounded-xl bg-[#0A1128] border border-[#1E2B4D]">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Burn Rate Diario</span>
                  <p className="text-xl font-bold text-rose-400 mt-1 tabular-nums">
                    ${Number(cashflow.dailyBurnRate || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <span className="text-[10px] text-slate-500">Gasto medio por día</span>
                </div>

                <div className="p-3.5 rounded-xl bg-[#0A1128] border border-[#1E2B4D]">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Punto Mínimo</span>
                  <p className={`text-xl font-bold mt-1 tabular-nums ${cashflow.projectedMinBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    ${Number(cashflow.projectedMinBalance || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <span className="text-[10px] text-slate-500">{new Date(cashflow.projectedMinDate).toLocaleDateString()}</span>
                </div>

                <div className="p-3.5 rounded-xl bg-[#0A1128] border border-[#1E2B4D]">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Compromisos Fijos</span>
                  <p className="text-xl font-bold text-amber-300 mt-1 tabular-nums">
                    {cashflow.upcomingCommitments?.length || 0}
                  </p>
                  <span className="text-[10px] text-slate-500">Pagos en el período</span>
                </div>
              </div>

              {/* SVG Gráfico de Trayectoria Proyectada */}
              {cashflow.projectedPoints && cashflow.projectedPoints.length > 0 && (
                <div className="p-4 rounded-xl bg-[#0A1128] border border-[#1E2B4D] space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-300 uppercase tracking-wider">Trayectoria Diaria Proyectada</span>
                    <span className="text-slate-400 text-[11px] font-mono">
                      Inicio: ${cashflow.currentBalance.toFixed(0)} → Final: ${cashflow.projectedPoints[cashflow.projectedPoints.length - 1]?.projectedBalance.toFixed(0)}
                    </span>
                  </div>

                  {(() => {
                    const points = cashflow.projectedPoints;
                    const vals = points.map((p: any) => p.projectedBalance);
                    const min = Math.min(...vals);
                    const max = Math.max(...vals);
                    const padding = (max - min) * 0.1 || 10;
                    const plotMin = min - padding;
                    const plotMax = max + padding;
                    const range = plotMax - plotMin || 1;

                    const width = 800;
                    const height = 140;

                    const coords = points.map((p: any, idx: number) => {
                      const x = (idx / (points.length - 1)) * width;
                      const y = height - ((p.projectedBalance - plotMin) / range) * height;
                      return { x, y, ...p };
                    });

                    const pathD = coords.reduce((acc: string, pt: any, idx: number) => {
                      return `${acc} ${idx === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
                    }, '');

                    const areaD = `${pathD} L ${width},${height} L 0,${height} Z`;

                    return (
                      <div className="w-full overflow-hidden">
                        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-36" preserveAspectRatio="none">
                          <defs>
                            <linearGradient id="cashflowGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#10B981" stopOpacity="0.3" />
                              <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
                            </linearGradient>
                          </defs>

                          {/* Línea horizontal de $0 si está dentro del rango */}
                          {plotMin < 0 && plotMax > 0 && (
                            <line
                              x1="0"
                              y1={height - ((0 - plotMin) / range) * height}
                              x2={width}
                              y2={height - ((0 - plotMin) / range) * height}
                              stroke="#F43F5E"
                              strokeDasharray="4 4"
                              strokeWidth="1.5"
                            />
                          )}

                          {/* Relleno con gradiente */}
                          <path d={areaD} fill="url(#cashflowGrad)" />

                          {/* Línea principal */}
                          <path d={pathD} fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" />

                          {/* Puntos de impacto relevante (cuando hay egreso fijo) */}
                          {coords.filter((c: any) => c.knownOutflows > 0).map((c: any, idx: number) => (
                            <circle
                              key={idx}
                              cx={c.x}
                              cy={c.y}
                              r="4"
                              fill="#F59E0B"
                              stroke="#0A1128"
                              strokeWidth="2"
                            />
                          ))}
                        </svg>

                        <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono mt-1 pt-1 border-t border-slate-800">
                          <span>Hoy ({new Date().toLocaleDateString([], { month: 'short', day: 'numeric' })})</span>
                          <span>Día +{Math.round(projectionDays / 2)}</span>
                          <span>Día +{projectionDays} ({new Date(points[points.length - 1]?.date).toLocaleDateString([], { month: 'short', day: 'numeric' })})</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Lista de Compromisos Próximos Detectados */}
              {cashflow.upcomingCommitments && cashflow.upcomingCommitments.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-300 uppercase tracking-wider">
                      Compromisos Fijos Próximos en este período
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Impactan directamente la proyección
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {cashflow.upcomingCommitments.slice(0, 6).map((c: any, idx: number) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-[#0A1128] border border-[#1E2B4D] flex items-center justify-between text-xs"
                      >
                        <div>
                          <p className="font-semibold text-white">{c.name}</p>
                          <span className="text-[10px] text-slate-400 capitalize">
                            {c.type === 'subscription' ? '📺 Suscripción recurrente' : c.type === 'debt' ? '💳 Cuota de Deuda' : '⏰ Recordatorio'} • {new Date(c.date).toLocaleDateString()}
                          </span>
                        </div>
                        <span className="text-amber-400 font-bold tabular-nums">
                          -${Number(c.amount).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="text-xs text-slate-400">No se pudo cargar la proyección de flujo.</p>
          )}
        </section>

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
        </>
      )}
      </main>
    </div>
  );
}
