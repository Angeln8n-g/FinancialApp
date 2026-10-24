'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
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
  X
} from 'lucide-react';

export default function PatrimonyPage() {
  const router = useRouter();

  const [patrimony, setPatrimony] = useState<any>({ totalAssets: 0, totalLiabilities: 0, netWorth: 0, assetsList: [], liabilitiesList: [] });
  const [loading, setLoading] = useState(true);

  // Modal Activo
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [aName, setAName] = useState('');
  const [aType, setAType] = useState('VEHICLE');
  const [aValue, setAValue] = useState('');

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  const getToken = () => typeof window !== 'undefined' ? localStorage.getItem('hogariq_token') : null;

  const fetchData = async () => {
    const token = getToken();
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/patrimony/net-worth`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setPatrimony(await res.json());
      }
    } catch (err) {
      console.error('Error cargando patrimonio:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getToken();
    if (!token || !aName) return;

    try {
      const res = await fetch(`${API_URL}/api/patrimony/assets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: aName,
          type: aType,
          value: parseFloat(aValue),
        }),
      });

      if (res.ok) {
        setShowAssetModal(false);
        setAName('');
        setAValue('');
        fetchData();
      }
    } catch (err) {
      console.error('Error creando activo:', err);
    }
  };

  const handleDeleteAsset = async (id: string) => {
    if (id === 'acc-summary') return;
    if (!confirm('¿Eliminar este activo del patrimonio?')) return;
    const token = getToken();
    try {
      const res = await fetch(`${API_URL}/api/patrimony/assets/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) fetchData();
    } catch (err) {
      console.error('Error eliminando activo:', err);
    }
  };

  const getAssetIcon = (type: string) => {
    switch (type) {
      case 'VEHICLE':
        return <Car className="w-4 h-4 text-emerald-400" />;
      case 'REAL_ESTATE':
        return <Home className="w-4 h-4 text-emerald-400" />;
      case 'CRYPTO':
        return <Coins className="w-4 h-4 text-amber-400" />;
      case 'INVESTMENT':
        return <BarChart2 className="w-4 h-4 text-sky-400" />;
      default:
        return <Landmark className="w-4 h-4 text-emerald-400" />;
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

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-10">
        {/* TARJETA KPI PATRIMONIO NETO */}
        <div className="mint-card p-6 sm:p-8 border border-[#1E2B4D] relative overflow-hidden bg-gradient-to-r from-[#101A36] via-[#121E40] to-[#101A36]">
          <p className="text-xs font-medium text-emerald-400 uppercase tracking-widest mb-1.5">
            Patrimonio Neto Familiar Consolidado
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-100 tracking-tight tabular-nums">
            ${Number(patrimony.netWorth || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-8 pt-6 border-t border-[#1E2B4D]">
            <div className="flex items-center space-x-4">
              <div className="w-11 h-11 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20 shadow-sm">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Activos</p>
                <p className="text-2xl font-bold text-emerald-400 tabular-nums">
                  +${Number(patrimony.totalAssets || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="w-11 h-11 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center border border-rose-500/20 shadow-sm">
                <TrendingDown className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Pasivos</p>
                <p className="text-2xl font-bold text-rose-400 tabular-nums">
                  -${Number(patrimony.totalLiabilities || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* DESGLOSE ACTIVOS VS PASIVOS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Activos */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-100 flex items-center space-x-2">
                <Landmark className="w-4 h-4 text-emerald-400" />
                <span>Activos (Propiedades, Vehículos, Cuentas)</span>
              </h3>
              <button
                onClick={() => setShowAssetModal(true)}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white shadow-sm flex items-center gap-1.5 cursor-pointer transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Registrar Activo</span>
              </button>
            </div>

            <div className="space-y-3">
              {patrimony.assetsList?.map((a: any) => (
                <div key={a.id} className="mint-card p-4 flex items-center justify-between relative group hover:border-[#2D3E6B] transition-colors">
                  {a.id !== 'acc-summary' && (
                    <button
                      onClick={() => handleDeleteAsset(a.id)}
                      className="absolute top-3.5 right-3.5 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                      title="Eliminar activo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}

                  <div className="flex items-center space-x-3 pr-7">
                    <div className="w-9 h-9 rounded-xl bg-[#162347] border border-[#1E2B4D] flex items-center justify-center">
                      {getAssetIcon(a.type)}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-100">{a.name}</p>
                      <p className="text-[10px] text-slate-400 uppercase font-medium">{a.type.replace('_', ' ')}</p>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-emerald-400 tabular-nums">
                    +${Number(a.value).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Pasivos */}
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-slate-100 flex items-center space-x-2">
              <Building2 className="w-4 h-4 text-rose-400" />
              <span>Pasivos (Hipotecas y Préstamos)</span>
            </h3>

            <div className="space-y-3">
              {patrimony.liabilitiesList?.map((l: any) => (
                <div key={l.id} className="mint-card p-4 flex items-center justify-between border border-rose-500/20">
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                      <TrendingDown className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-100">{l.name}</p>
                      <p className="text-[10px] text-slate-400 uppercase font-medium">PASIVO</p>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-rose-400 tabular-nums">
                    -${Number(l.value).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Modal Nuevo Activo */}
      {showAssetModal && (
        <div className="fixed inset-0 bg-[#0A1128]/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="mint-card w-full max-w-md p-6 relative border border-[#1E2B4D] shadow-2xl">
            <div className="flex items-center justify-between mb-5 pb-3 border-b border-[#1E2B4D]">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Landmark className="w-4 h-4 text-emerald-400" />
                <span>Registrar Nuevo Activo</span>
              </h3>
              <button
                onClick={() => setShowAssetModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-[#162347] transition-colors cursor-pointer"
                aria-label="Cerrar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateAsset} className="space-y-4">
              <div>
                <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1.5">Nombre del Activo</label>
                <input
                  type="text"
                  required
                  value={aName}
                  onChange={(e) => setAName(e.target.value)}
                  placeholder="Ej. Casa Familiar, Vehículo, Portafolio Inversión"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A1128] border border-[#1E2B4D] text-slate-100 text-sm focus:outline-none focus:border-emerald-400 transition-colors"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1.5">Tipo de Activo</label>
                <select
                  value={aType}
                  onChange={(e) => setAType(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A1128] border border-[#1E2B4D] text-slate-100 text-sm focus:outline-none focus:border-emerald-400 cursor-pointer transition-colors"
                >
                  <option value="REAL_ESTATE" className="bg-[#101A36]">Inmueble / Propiedad</option>
                  <option value="VEHICLE" className="bg-[#101A36]">Vehículo</option>
                  <option value="INVESTMENT" className="bg-[#101A36]">Inversión / Fondo</option>
                  <option value="CRYPTO" className="bg-[#101A36]">Criptomonedas</option>
                  <option value="CASH_OTHER" className="bg-[#101A36]">Efectivo u Otro</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1.5">Valor Estimado ($)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={aValue}
                  onChange={(e) => setAValue(e.target.value)}
                  placeholder="Ej. 75000.00"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A1128] border border-[#1E2B4D] text-slate-100 font-bold text-base focus:outline-none focus:border-emerald-400 tabular-nums transition-colors"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-[#1E2B4D]">
                <button
                  type="button"
                  onClick={() => setShowAssetModal(false)}
                  className="px-4 py-2 rounded-xl bg-[#162347] text-slate-300 text-xs font-medium hover:bg-[#1D2D5A] hover:text-slate-100 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
                >
                  Guardar Activo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
