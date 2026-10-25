'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import AssetModal from '@/components/modals/AssetModal';
import UpdateValuationModal from '@/components/modals/UpdateValuationModal';
import { apiFetch, getUser, getHousehold, getToken } from '@/lib/api';
import {
  Landmark,
  TrendingUp,
  TrendingDown,
  Car,
  Home,
  Coins,
  BarChart2,
  Building2,
  Trash2,
  Plus,
  Pencil,
  ShieldCheck,
  Wallet,
  Calendar,
  Sparkles,
  ArrowRight,
  Scale,
  Layers,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

export default function PatrimonyPage() {
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [household, setHousehold] = useState<any>(null);
  const [patrimony, setPatrimony] = useState<any>({
    totalAssets: 0,
    liquidAssets: 0,
    fixedAssets: 0,
    totalLiabilities: 0,
    netWorth: 0,
    liquidNetWorth: 0,
    solvencyRatio: 1,
    debtToAssetRatio: 0,
    totalAppreciation: 0,
    assetAllocation: [],
    assetsList: [],
    accountsList: [],
    liabilitiesList: [],
  });
  const [debts, setDebts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState('ALL');

  // Modales
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [selectedAssetForEdit, setSelectedAssetForEdit] = useState<any>(null);

  const [showValuationModal, setShowValuationModal] = useState(false);
  const [selectedAssetForValuation, setSelectedAssetForValuation] = useState<any>(null);

  const fetchData = useCallback(async () => {
    if (!getToken()) {
      router.push('/login');
      return;
    }

    try {
      const [resPatrimony, resDebts] = await Promise.all([
        apiFetch('/api/patrimony/net-worth').catch(() => ({
          totalAssets: 0,
          liquidAssets: 0,
          fixedAssets: 0,
          totalLiabilities: 0,
          netWorth: 0,
          liquidNetWorth: 0,
          solvencyRatio: 1,
          debtToAssetRatio: 0,
          totalAppreciation: 0,
          assetAllocation: [],
          assetsList: [],
          accountsList: [],
          liabilitiesList: [],
        })),
        apiFetch('/api/debts').catch(() => []),
      ]);

      setPatrimony(resPatrimony);
      setDebts(Array.isArray(resDebts) ? resDebts : []);
    } catch (err) {
      console.error('Error cargando patrimonio:', err);
    } finally {
      setLoading(false);
    }
  }, [router]);

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

  // Manejo de Crear o Editar Activo
  const handleOpenCreateAsset = () => {
    setSelectedAssetForEdit(null);
    setShowAssetModal(true);
  };

  const handleOpenEditAsset = (asset: any) => {
    setSelectedAssetForEdit(asset);
    setShowAssetModal(true);
  };

  const handleConfirmAsset = async (data: any) => {
    if (selectedAssetForEdit) {
      await apiFetch(`/api/patrimony/assets/${selectedAssetForEdit.id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    } else {
      await apiFetch('/api/patrimony/assets', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    }
    await fetchData();
  };

  // Manejo de Actualizar Tasación
  const handleOpenValuation = (asset: any) => {
    setSelectedAssetForValuation(asset);
    setShowValuationModal(true);
  };

  const handleConfirmValuation = async (
    assetId: string,
    data: { value: number; notes?: string; valuationDate?: string },
  ) => {
    await apiFetch(`/api/patrimony/assets/${assetId}/valuation`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    await fetchData();
  };

  // Manejo de Eliminar Activo
  const handleDeleteAsset = async (id: string, name: string) => {
    if (!confirm(`¿Eliminar el activo "${name}" del patrimonio?`)) return;
    try {
      await apiFetch(`/api/patrimony/assets/${id}`, {
        method: 'DELETE',
      });
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Error eliminando el activo');
    }
  };

  const getAssetIcon = (type: string) => {
    switch (type) {
      case 'VEHICLE':
        return <Car className="w-4 h-4 text-amber-400" />;
      case 'REAL_ESTATE':
        return <Home className="w-4 h-4 text-emerald-400" />;
      case 'CRYPTO':
        return <Coins className="w-4 h-4 text-violet-400" />;
      case 'INVESTMENT':
        return <BarChart2 className="w-4 h-4 text-sky-400" />;
      default:
        return <Wallet className="w-4 h-4 text-teal-400" />;
    }
  };

  const getCategoryLabel = (type: string) => {
    switch (type) {
      case 'REAL_ESTATE':
        return 'Inmuebles';
      case 'VEHICLE':
        return 'Vehículos';
      case 'INVESTMENT':
        return 'Inversiones';
      case 'CRYPTO':
        return 'Criptomonedas';
      case 'CASH_ACCOUNTS':
        return 'Cuentas Bancarias';
      case 'CASH_OTHER':
        return 'Otros Bienes';
      default:
        return type;
    }
  };

  const getCategoryColor = (type: string) => {
    switch (type) {
      case 'REAL_ESTATE':
        return 'bg-emerald-500';
      case 'VEHICLE':
        return 'bg-amber-500';
      case 'INVESTMENT':
        return 'bg-sky-500';
      case 'CRYPTO':
        return 'bg-violet-500';
      case 'CASH_ACCOUNTS':
        return 'bg-teal-400';
      default:
        return 'bg-slate-400';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A1128] text-slate-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-3 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  // Filtrado de activos
  const filteredAssets = (patrimony.assetsList || []).filter((a: any) => {
    if (selectedFilter === 'ALL') return true;
    if (selectedFilter === 'LIQUID') {
      return ['INVESTMENT', 'CRYPTO', 'CASH_OTHER'].includes(a.type);
    }
    return a.type === selectedFilter;
  });

  // Interpretación de Solvencia
  const solvency = patrimony.solvencyRatio;
  let solvencyBadge = {
    label: 'Solvencia Sólida',
    class: 'text-emerald-300 bg-emerald-500/15 border-emerald-500/30',
  };
  if (solvency < 1.2) {
    solvencyBadge = {
      label: 'Solvencia Ajustada',
      class: 'text-rose-300 bg-rose-500/15 border-rose-500/30',
    };
  } else if (solvency < 2.0) {
    solvencyBadge = {
      label: 'Solvencia Estable',
      class: 'text-amber-300 bg-amber-500/15 border-amber-500/30',
    };
  }

  // Interpretación de Apalancamiento
  const leverage = patrimony.debtToAssetRatio;
  let leverageBadge = {
    label: 'Bajo Riesgo',
    class: 'text-emerald-300 bg-emerald-500/15 border-emerald-500/30',
  };
  if (leverage > 55) {
    leverageBadge = {
      label: 'Apalancamiento Alto',
      class: 'text-rose-300 bg-rose-500/15 border-rose-500/30',
    };
  } else if (leverage >= 35) {
    leverageBadge = {
      label: 'Apalancamiento Moderado',
      class: 'text-amber-300 bg-amber-500/15 border-amber-500/30',
    };
  }

  return (
    <div className="min-h-screen bg-[#0A1128] text-slate-100 pb-20 lg:pb-12">
      <Navbar user={user} household={household} />

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* ============================================================ */}
        {/* 1. CABECERA & ACCIÓN PRINCIPAL                               */}
        {/* ============================================================ */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
              <Landmark className="w-6 h-6 text-emerald-400" />
              <span>Patrimonio Familiar y Salud Financiera</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Control de activos tangibles, inversiones, cuentas bancarias, plusvalías y cálculo de solvencia.
            </p>
          </div>

          <button
            onClick={handleOpenCreateAsset}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm flex items-center gap-2 cursor-pointer transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Activo</span>
          </button>
        </div>

        {/* ============================================================ */}
        {/* 2. TARJETA KPI PATRIMONIO NETO CONSOLIDADO                   */}
        {/* ============================================================ */}
        <div className="mint-card p-6 sm:p-8 border border-[#1E2B4D] relative overflow-hidden bg-gradient-to-br from-[#101A36] via-[#101A36] to-[#0D152F] space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                <span>Patrimonio Neto Familiar Consolidado</span>
              </p>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-100 tracking-tight tabular-nums mt-1">
                ${Number(patrimony.netWorth || 0).toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className={`text-xs font-bold border px-3 py-1 rounded-full ${solvencyBadge.class}`}>
                {solvencyBadge.label} ({patrimony.solvencyRatio}x)
              </span>
              <span className={`text-xs font-bold border px-3 py-1 rounded-full ${leverageBadge.class}`}>
                {leverageBadge.label} ({patrimony.debtToAssetRatio}%)
              </span>
            </div>
          </div>

          {/* Cuadrícula de 4 Métricas Estratégicas */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-[#1E2B4D]">
            <div>
              <p className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">Total Activos</p>
              <p className="text-xl sm:text-2xl font-bold text-emerald-400 tabular-nums">
                +${Number(patrimony.totalAssets || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Fijos: ${Number(patrimony.fixedAssets || 0).toLocaleString('en-US', { minimumFractionDigits: 0 })} | Líquidos: ${Number(patrimony.liquidAssets || 0).toLocaleString('en-US', { minimumFractionDigits: 0 })}
              </p>
            </div>

            <div>
              <p className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">Total Pasivos</p>
              <p className="text-xl sm:text-2xl font-bold text-rose-400 tabular-nums">
                -${Number(patrimony.totalLiabilities || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">
                {patrimony.liabilitiesList?.length || 0} deudas e hipotecas
              </p>
            </div>

            <div>
              <p className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">Patrimonio Líquido</p>
              <p
                className={`text-xl sm:text-2xl font-bold tabular-nums ${
                  Number(patrimony.liquidNetWorth) >= 0 ? 'text-cyan-400' : 'text-amber-400'
                }`}
              >
                ${Number(patrimony.liquidNetWorth || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">Disponibilidad neta inmediata</p>
            </div>

            <div>
              <p className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">Plusvalía Acumulada</p>
              <p
                className={`text-xl sm:text-2xl font-bold tabular-nums ${
                  Number(patrimony.totalAppreciation) >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {Number(patrimony.totalAppreciation) >= 0 ? '+' : ''}$
                {Number(patrimony.totalAppreciation || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">Ganancia sobre costo de compra</p>
            </div>
          </div>

          {/* Barra Visual: Activos vs Pasivos */}
          {Number(patrimony.totalAssets) > 0 && (
            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>Relación Activos vs Deuda</span>
                <span className="tabular-nums">
                  Apalancamiento: <strong className="text-slate-200">{patrimony.debtToAssetRatio}%</strong>
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-[#0A1128] overflow-hidden flex border border-[#1E2B4D]/60">
                <div
                  className="h-full bg-emerald-500 transition-all duration-500"
                  style={{
                    width: `${Math.max(
                      0,
                      100 - Math.min(100, Number(patrimony.debtToAssetRatio || 0)),
                    )}%`,
                  }}
                  title="Patrimonio Libre (Equity)"
                />
                <div
                  className="h-full bg-rose-500 transition-all duration-500"
                  style={{
                    width: `${Math.min(100, Number(patrimony.debtToAssetRatio || 0))}%`,
                  }}
                  title="Deuda Comprometida"
                />
              </div>
            </div>
          )}
        </div>

        {/* ============================================================ */}
        {/* 3. DISTRIBUCIÓN DE ACTIVOS (ASSET ALLOCATION BAR)            */}
        {/* ============================================================ */}
        {patrimony.assetAllocation?.length > 0 && Number(patrimony.totalAssets) > 0 && (
          <div className="mint-card p-5 border border-[#1E2B4D] space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-400" />
                <span>Distribución y Asignación de Activos (Asset Allocation)</span>
              </h3>
              <span className="text-xs text-slate-400">100% de la cartera</span>
            </div>

            {/* Barra Segmentada */}
            <div className="w-full h-3 rounded-full bg-[#0A1128] overflow-hidden flex border border-[#1E2B4D]/60 p-0.5">
              {patrimony.assetAllocation.map((alloc: any) => {
                if (alloc.percentage <= 0) return null;
                return (
                  <div
                    key={alloc.type}
                    className={`h-full ${getCategoryColor(alloc.type)} first:rounded-l-full last:rounded-r-full transition-all duration-500`}
                    style={{ width: `${alloc.percentage}%` }}
                    title={`${getCategoryLabel(alloc.type)}: ${alloc.percentage}% ($${alloc.amount.toLocaleString()})`}
                  />
                );
              })}
            </div>

            {/* Chips de Leyenda Interactiva */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              {patrimony.assetAllocation.map((alloc: any) => {
                if (alloc.amount <= 0) return null;
                return (
                  <button
                    key={alloc.type}
                    onClick={() =>
                      setSelectedFilter(selectedFilter === alloc.type ? 'ALL' : alloc.type)
                    }
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs transition-colors cursor-pointer ${
                      selectedFilter === alloc.type
                        ? 'bg-[#162347] border-emerald-500/50 text-slate-100'
                        : 'bg-[#0A1128] border-[#1E2B4D] text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span className={`w-2.5 h-2.5 rounded-full ${getCategoryColor(alloc.type)}`} />
                    <span className="font-medium">{getCategoryLabel(alloc.type)}:</span>
                    <strong className="text-slate-200 tabular-nums">{alloc.percentage}%</strong>
                    <span className="text-[10px] text-slate-400 tabular-nums">
                      (${alloc.amount.toLocaleString('en-US', { minimumFractionDigits: 0 })})
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* 4. SECCIÓN DE ACTIVOS Y BIENES FAMILIARES                    */}
        {/* ============================================================ */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <Home className="w-5 h-5 text-emerald-400" />
                <span>Bienes, Inmuebles e Inversiones</span>
              </h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 tabular-nums">
                {patrimony.assetsList?.length || 0} registrados
              </span>
            </div>

            {/* Filtros de Categoría */}
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: 'ALL', label: 'Todos' },
                { id: 'REAL_ESTATE', label: 'Inmuebles' },
                { id: 'VEHICLE', label: 'Vehículos' },
                { id: 'INVESTMENT', label: 'Inversiones' },
                { id: 'CRYPTO', label: 'Cripto' },
                { id: 'LIQUID', label: 'Líquidos' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setSelectedFilter(f.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    selectedFilter === f.id
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-[#101A36] text-slate-400 hover:text-slate-200 border border-[#1E2B4D]'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {filteredAssets.length === 0 ? (
            <div className="mint-card p-8 text-center text-slate-400 text-xs">
              No se encontraron activos para la categoría seleccionada.{' '}
              <button
                onClick={handleOpenCreateAsset}
                className="text-emerald-400 underline font-semibold cursor-pointer ml-1"
              >
                Registrar un activo ahora
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredAssets.map((a: any) => {
                const hasAppreciation = a.appreciationAmount !== null;
                const isGain = (a.appreciationAmount || 0) >= 0;
                const hasDebt = !!a.linkedDebt;

                return (
                  <div
                    key={a.id}
                    className="mint-card p-5 space-y-4 relative border border-[#1E2B4D] hover:border-emerald-500/40 transition-colors group flex flex-col justify-between"
                  >
                    <div>
                      {/* Botones de acción superiores */}
                      <div className="absolute top-3.5 right-3.5 flex items-center gap-1">
                        <button
                          onClick={() => handleOpenValuation(a)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-300 hover:bg-[#162347] transition-colors cursor-pointer"
                          title="Actualizar tasación / valor de mercado"
                        >
                          <TrendingUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenEditAsset(a)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-300 hover:bg-[#162347] transition-colors cursor-pointer"
                          title="Editar detalles del activo"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteAsset(a.id, a.name)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-[#162347] transition-colors cursor-pointer"
                          title="Eliminar activo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Cabecera del Activo */}
                      <div className="flex items-center space-x-3 pr-20">
                        <div className="w-10 h-10 rounded-xl bg-[#162347] border border-[#1E2B4D] flex items-center justify-center shrink-0">
                          {getAssetIcon(a.type)}
                        </div>
                        <div className="overflow-hidden">
                          <h3 className="text-sm font-semibold text-slate-100 truncate">{a.name}</h3>
                          <span className="text-[10px] text-slate-400 uppercase font-semibold">
                            {getCategoryLabel(a.type)}
                          </span>
                        </div>
                      </div>

                      {/* Valor Actual y Plusvalía */}
                      <div className="mt-4 space-y-1">
                        <p className="text-[11px] text-slate-400">Valor Estimado Actual</p>
                        <div className="flex items-baseline justify-between">
                          <p className="text-2xl font-bold text-emerald-400 tabular-nums">
                            ${Number(a.value).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </p>

                          {hasAppreciation && (
                            <span
                              className={`text-[11px] font-bold px-2 py-0.5 rounded-md border tabular-nums ${
                                isGain
                                  ? 'text-emerald-300 bg-emerald-500/10 border-emerald-500/25'
                                  : 'text-amber-300 bg-amber-500/10 border-amber-500/25'
                              }`}
                            >
                              {isGain ? '+' : ''}${a.appreciationAmount.toLocaleString()} ({isGain ? '+' : ''}
                              {a.appreciationPercentage}%)
                            </span>
                          )}
                        </div>

                        {a.purchasePrice != null && (
                          <p className="text-[10px] text-slate-400 tabular-nums">
                            Costo de compra:{' '}
                            <strong className="text-slate-300">
                              ${Number(a.purchasePrice).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </strong>
                            {a.acquisitionDate && (
                              <span> • {new Date(a.acquisitionDate).toLocaleDateString()}</span>
                            )}
                          </p>
                        )}
                      </div>

                      {/* Cálculo de Equity Neto (Valor - Deuda vinculada) */}
                      <div className="mt-3.5 p-2.5 rounded-xl bg-[#0A1128] border border-[#1E2B4D] text-xs space-y-1.5">
                        {hasDebt ? (
                          <>
                            <div className="flex items-center justify-between text-slate-400 text-[11px]">
                              <span className="flex items-center gap-1">
                                <Building2 className="w-3 h-3 text-rose-400" />
                                <span>{a.linkedDebt.contactName}:</span>
                              </span>
                              <span className="font-semibold text-rose-400 tabular-nums">
                                -${Number(a.linkedDebt.remainingAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                              </span>
                            </div>
                            <div className="flex items-center justify-between pt-1 border-t border-[#1E2B4D]/60 text-xs">
                              <span className="text-slate-300 font-medium">Equity Neto Real:</span>
                              <strong className="text-emerald-400 font-bold tabular-nums">
                                ${Number(a.netEquity).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                              </strong>
                            </div>
                          </>
                        ) : (
                          <div className="flex items-center justify-between text-[11px] text-emerald-400/90 font-medium">
                            <span className="flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              <span>100% Patrimonio Propio</span>
                            </span>
                            <span className="text-[10px] text-slate-500">Sin gravamen</span>
                          </div>
                        )}
                      </div>

                      {a.notes && (
                        <p className="text-[10px] text-slate-400 mt-2 italic line-clamp-1">
                          &quot;{a.notes}&quot;
                        </p>
                      )}
                    </div>

                    {/* Footer de la Tarjeta */}
                    <div className="pt-3 border-t border-[#1E2B4D] flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 text-[10px]">
                        {a.latestValuations?.length > 1
                          ? `${a.latestValuations.length} tasaciones registradas`
                          : 'Tasación inicial'}
                      </span>
                      <button
                        onClick={() => handleOpenValuation(a)}
                        className="text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer flex items-center gap-1"
                      >
                        <span>Revalorizar</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ============================================================ */}
        {/* 5. LIQUIDEZ EN CUENTAS BANCARIAS Y PASIVOS VINCULADOS         */}
        {/* ============================================================ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
          {/* Cuentas Bancarias / Efectivo */}
          <div className="mint-card p-5 border border-[#1E2B4D] space-y-3.5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <Wallet className="w-4 h-4 text-teal-400" />
                <span>Disponibilidad en Cuentas y Liquidez</span>
              </h3>
              <span className="text-xs font-bold text-teal-300 tabular-nums">
                ${(patrimony.accountsList || [])
                  .reduce((acc: number, a: any) => acc + Number(a.balance), 0)
                  .toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {(patrimony.accountsList || []).map((acc: any) => (
                <div
                  key={acc.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-[#0A1128] border border-[#1E2B4D] text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-[#162347] flex items-center justify-center text-teal-400 font-bold text-[10px]">
                      {acc.type === 'SAVINGS' ? 'AH' : acc.type === 'PAYROLL' ? 'NO' : 'CT'}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-100">{acc.name}</p>
                      <p className="text-[10px] text-slate-400 uppercase">{acc.type}</p>
                    </div>
                  </div>
                  <span className="font-bold text-slate-100 tabular-nums">
                    ${Number(acc.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Pasivos e Hipotecas Registradas */}
          <div className="mint-card p-5 border border-[#1E2B4D] space-y-3.5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-rose-400" />
                <span>Pasivos y Deudas que Restan Patrimonio</span>
              </h3>
              <Link
                href="/dashboard/commitments"
                className="text-xs text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-1"
              >
                <span>Gestionar</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {(patrimony.liabilitiesList || []).length === 0 ? (
                <p className="text-xs text-slate-400 p-4 text-center">
                  No hay pasivos registrados. ¡Excelente situación financiera!
                </p>
              ) : (
                (patrimony.liabilitiesList || []).map((l: any) => (
                  <div
                    key={l.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-[#0A1128] border border-rose-500/20 text-xs"
                  >
                    <div>
                      <p className="font-semibold text-slate-100">{l.name}</p>
                      <p className="text-[10px] text-slate-400">
                        {l.hasLinkedAsset ? 'Garantía con activo vinculado' : 'Préstamo no pignorado'}
                        {Number(l.interestRate) > 0 && ` • ${l.interestRate}% interés`}
                      </p>
                    </div>
                    <span className="font-bold text-rose-400 tabular-nums">
                      -${Number(l.value).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>

      {/* ============================================================ */}
      {/* MODAL CREAR / EDITAR ACTIVO                                  */}
      {/* ============================================================ */}
      <AssetModal
        isOpen={showAssetModal}
        onClose={() => {
          setShowAssetModal(false);
          setSelectedAssetForEdit(null);
        }}
        asset={selectedAssetForEdit}
        debts={debts}
        onConfirm={handleConfirmAsset}
      />

      {/* ============================================================ */}
      {/* MODAL ACTUALIZAR TASACIÓN                                    */}
      {/* ============================================================ */}
      <UpdateValuationModal
        isOpen={showValuationModal}
        onClose={() => {
          setShowValuationModal(false);
          setSelectedAssetForValuation(null);
        }}
        asset={selectedAssetForValuation}
        onConfirm={handleConfirmValuation}
      />
    </div>
  );
}
