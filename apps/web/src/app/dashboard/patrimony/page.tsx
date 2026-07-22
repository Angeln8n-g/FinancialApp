'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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

  const getToken = () => localStorage.getItem('hogariq_token');

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
            <h1 className="text-lg font-bold text-white leading-tight">Patrimonio Neto Familiar</h1>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 py-8 space-y-10">
        {/* 🏆 TARJETA KPI PATRIMONIO NETO */}
        <div className="glass-card p-8 border border-purple-500/40 relative overflow-hidden bg-gradient-to-r from-purple-950/40 via-slate-900 to-slate-900">
          <p className="text-xs font-bold text-purple-400 uppercase tracking-widest mb-1">Patrimonio Neto Consolidado</p>
          <h2 className="text-4xl font-black text-white tracking-tight">
            RD${Number(patrimony.netWorth || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-8 pt-6 border-t border-slate-800">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-2xl border border-emerald-500/30">
                💎
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase">Total Activos</p>
                <p className="text-2xl font-black text-emerald-400">
                  +RD${Number(patrimony.totalAssets || 0).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center text-2xl border border-rose-500/30">
                📉
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase">Total Pasivos</p>
                <p className="text-2xl font-black text-rose-400">
                  -RD${Number(patrimony.totalLiabilities || 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 📊 DESGLOSE ACTIVOS VS PASIVOS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Activos */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <span>💎</span>
                <span>Activos (Propiedades, Vehículos)</span>
              </h3>
              <button
                onClick={() => setShowAssetModal(true)}
                className="px-3.5 py-1.5 rounded-xl glow-button text-xs font-bold text-white cursor-pointer"
              >
                + Registrar Activo
              </button>
            </div>

            <div className="space-y-3">
              {patrimony.assetsList?.map((a: any) => (
                <div key={a.id} className="glass-card p-4 flex items-center justify-between border-emerald-500/20 relative group">
                  {a.id !== 'acc-summary' && (
                    <button
                      onClick={() => handleDeleteAsset(a.id)}
                      className="absolute top-3 right-3 text-slate-500 hover:text-rose-400 text-xs font-bold transition-colors cursor-pointer"
                      title="Eliminar activo"
                    >
                      🗑️
                    </button>
                  )}

                  <div className="flex items-center space-x-3 pr-6">
                    <div className="w-9 h-9 rounded-xl bg-emerald-950 flex items-center justify-center text-lg">
                      {a.type === 'VEHICLE' ? '🚗' : a.type === 'REAL_ESTATE' ? '🏠' : a.type === 'CRYPTO' ? '🪙' : '📈'}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{a.name}</p>
                      <p className="text-[10px] text-slate-400 uppercase font-semibold">{a.type}</p>
                    </div>
                  </div>
                  <p className="text-base font-black text-emerald-400">
                    +RD${Number(a.value).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Pasivos */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center space-x-2">
              <span>📉</span>
              <span>Pasivos (Hipotecas y Préstamos)</span>
            </h3>

            <div className="space-y-3">
              {patrimony.liabilitiesList?.map((l: any) => (
                <div key={l.id} className="glass-card p-4 flex items-center justify-between border-rose-500/20">
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-xl bg-rose-950 flex items-center justify-center text-lg">
                      🏦
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{l.name}</p>
                      <p className="text-[10px] text-slate-400 uppercase font-semibold">PASIVO</p>
                    </div>
                  </div>
                  <p className="text-base font-black text-rose-400">
                    -RD${Number(l.value).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Modal Nuevo Activo */}
      {showAssetModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-md p-6 relative border border-emerald-500/40">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white">Registrar Nuevo Activo</h3>
              <button onClick={() => setShowAssetModal(false)} className="text-slate-400 hover:text-white cursor-pointer text-xl">✕</button>
            </div>

            <form onSubmit={handleCreateAsset} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Nombre del Activo</label>
                <input
                  type="text"
                  required
                  value={aName}
                  onChange={(e) => setAName(e.target.value)}
                  placeholder="Ej. Casa Principal, Vehículo SUV, Portafolio Crypto"
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Tipo de Activo</label>
                <select
                  value={aType}
                  onChange={(e) => setAType(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:border-emerald-500"
                >
                  <option value="REAL_ESTATE">Inmueble / Casa</option>
                  <option value="VEHICLE">Vehículo</option>
                  <option value="INVESTMENT">Inversión / Fondo</option>
                  <option value="CRYPTO">Criptomonedas</option>
                  <option value="CASH_OTHER">Efectivo u Otro</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Valor Estimado (RD$)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={aValue}
                  onChange={(e) => setAValue(e.target.value)}
                  placeholder="Ej. 4500000"
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white font-bold text-lg focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAssetModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer"
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
