'use client';

import React, { useState, useEffect } from 'react';
import {
  Landmark,
  X,
  Home,
  Car,
  TrendingUp,
  Coins,
  Wallet,
  AlertTriangle,
  Building2,
  Calendar,
  Sparkles,
} from 'lucide-react';

interface AssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset?: any | null; // null for create mode, asset object for edit mode
  debts: any[];
  onConfirm: (data: {
    name: string;
    type: string;
    value?: number;
    purchasePrice?: number;
    acquisitionDate?: string | null;
    notes?: string;
    debtId?: string | null;
  }) => Promise<void>;
}

export default function AssetModal({
  isOpen,
  onClose,
  asset,
  debts,
  onConfirm,
}: AssetModalProps) {
  const isEdit = !!asset;

  const [name, setName] = useState('');
  const [type, setType] = useState('REAL_ESTATE');
  const [value, setValue] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [acquisitionDate, setAcquisitionDate] = useState('');
  const [debtId, setDebtId] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (asset) {
      setName(asset.name || '');
      setType(asset.type || 'REAL_ESTATE');
      setValue(asset.value != null ? asset.value.toString() : '');
      setPurchasePrice(asset.purchasePrice != null ? asset.purchasePrice.toString() : '');
      if (asset.acquisitionDate) {
        const d = new Date(asset.acquisitionDate);
        setAcquisitionDate(d.toISOString().split('T')[0]);
      } else {
        setAcquisitionDate('');
      }
      setDebtId(asset.debtId || '');
      setNotes(asset.notes || '');
      setError(null);
    } else {
      setName('');
      setType('REAL_ESTATE');
      setValue('');
      setPurchasePrice('');
      setAcquisitionDate('');
      setDebtId('');
      setNotes('');
      setError(null);
    }
  }, [asset, isOpen]);

  if (!isOpen) return null;

  const parsedValue = parseFloat(value) || 0;
  const parsedPurchase = parseFloat(purchasePrice) || 0;
  const selectedDebt = debts.find((d) => d.id === debtId);
  const debtRemaining = selectedDebt ? Number(selectedDebt.remainingAmount || selectedDebt.value || 0) : 0;
  const netEquity = parsedValue - debtRemaining;

  const hasAppreciation = parsedPurchase > 0 && parsedValue > 0;
  const diffAmount = parsedValue - parsedPurchase;
  const diffPercentage = hasAppreciation ? Math.round((diffAmount / parsedPurchase) * 1000) / 10 : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('El nombre del activo es obligatorio.');
      return;
    }

    if (!isEdit && (isNaN(parsedValue) || parsedValue <= 0)) {
      setError('El valor estimado actual debe ser mayor a 0.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await onConfirm({
        name: name.trim(),
        type,
        value: !isEdit ? parsedValue : undefined,
        purchasePrice: purchasePrice ? parseFloat(purchasePrice) : undefined,
        acquisitionDate: acquisitionDate ? acquisitionDate : undefined,
        debtId: debtId ? debtId : undefined,
        notes: notes.trim() || undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Error al guardar el activo.');
    } finally {
      setLoading(false);
    }
  };

  const assetTypes = [
    { id: 'REAL_ESTATE', label: 'Inmueble / Propiedad', icon: Home },
    { id: 'VEHICLE', label: 'Vehículo', icon: Car },
    { id: 'INVESTMENT', label: 'Inversión / Fondo', icon: TrendingUp },
    { id: 'CRYPTO', label: 'Criptomoneda', icon: Coins },
    { id: 'CASH_OTHER', label: 'Efectivo u Otro', icon: Wallet },
  ];

  return (
    <div className="fixed inset-0 bg-[#0A1128]/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="mint-card w-full max-w-lg p-6 relative border border-[#1E2B4D] shadow-2xl animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5 pb-3 border-b border-[#1E2B4D]">
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Landmark className="w-5 h-5 text-emerald-400" />
            <span>{isEdit ? 'Editar Activo Patrimonial' : 'Registrar Nuevo Activo'}</span>
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-[#162347] transition-colors cursor-pointer"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2 text-rose-300 text-xs">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1.5">
              Nombre o Identificador del Activo
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Casa Familiar Central, Toyota RAV4 2024, Fondo Indexado S&P"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A1128] border border-[#1E2B4D] text-slate-100 text-sm focus:outline-none focus:border-emerald-400 transition-colors"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1.5">
              Categoría de Activo
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {assetTypes.map((t) => {
                const Icon = t.icon;
                const isSelected = type === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setType(t.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2 ${
                      isSelected
                        ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300'
                        : 'bg-[#0A1128] border-[#1E2B4D] text-slate-400 hover:text-slate-200 hover:bg-[#162347]'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0 text-emerald-400" />
                    <span className="text-xs font-semibold leading-tight">{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {!isEdit && (
              <div>
                <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1.5">
                  Valor Estimado Actual ($)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-bold">
                    $
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder="Ej. 125000.00"
                    className="w-full pl-8 pr-3.5 py-2.5 rounded-xl bg-[#0A1128] border border-[#1E2B4D] text-slate-100 font-bold text-sm focus:outline-none focus:border-emerald-400 tabular-nums transition-colors"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1.5">
                Costo de Compra Original ($) <span className="text-slate-500 font-normal lowercase">(opcional)</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-bold">
                  $
                </span>
                <input
                  type="number"
                  step="0.01"
                  value={purchasePrice}
                  onChange={(e) => setPurchasePrice(e.target.value)}
                  placeholder="Ej. 100000.00"
                  className="w-full pl-8 pr-3.5 py-2.5 rounded-xl bg-[#0A1128] border border-[#1E2B4D] text-slate-100 font-bold text-sm focus:outline-none focus:border-emerald-400 tabular-nums transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                <span>Fecha de Adquisición</span>
              </label>
              <input
                type="date"
                value={acquisitionDate}
                onChange={(e) => setAcquisitionDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A1128] border border-[#1E2B4D] text-slate-100 text-xs focus:outline-none focus:border-emerald-400 transition-colors"
              />
            </div>
          </div>

          {/* Plusvalía / Depreciación Preview */}
          {hasAppreciation && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                diffAmount >= 0
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                  : 'bg-amber-500/10 border-amber-500/20 text-amber-300'
              }`}
            >
              <span>{diffAmount >= 0 ? 'Plusvalía estimada:' : 'Depreciación estimada:'}</span>
              <span className="font-bold tabular-nums">
                {diffAmount >= 0 ? '+' : ''}${diffAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })} ({diffPercentage > 0 ? '+' : ''}{diffPercentage}%)
              </span>
            </div>
          )}

          {/* Vinculación de Deuda / Hipoteca */}
          <div className="p-3.5 rounded-xl bg-[#0A1128] border border-emerald-500/30 space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
              <Building2 className="w-3.5 h-3.5" />
              <span>Pasivo o Hipoteca Vinculada (Opcional)</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Si este bien tiene una deuda asociada (ej. hipoteca, crédito automotriz), vincúlala para calcular el <strong>Equity Neto real</strong>.
            </p>
            <select
              value={debtId}
              onChange={(e) => setDebtId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#101A36] border border-[#1E2B4D] text-slate-100 text-xs focus:outline-none focus:border-emerald-400 cursor-pointer"
            >
              <option value="">Sin deuda asociada (100% propio)</option>
              {debts.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.contactName || d.name} — Saldo pendiente: ${Number(d.remainingAmount || d.value || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </option>
              ))}
            </select>

            {selectedDebt && parsedValue > 0 && (
              <div className="pt-2 border-t border-[#1E2B4D] flex items-center justify-between text-xs">
                <span className="text-slate-400">Equity Neto Estimado:</span>
                <span className="font-bold text-emerald-400 tabular-nums">
                  ${netEquity.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1.5">
              Notas, Matrícula o Ubicación
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Dirección, broker, número de póliza o placas..."
              className="w-full px-3.5 py-2 rounded-xl bg-[#0A1128] border border-[#1E2B4D] text-slate-100 text-xs focus:outline-none focus:border-emerald-400 transition-colors"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-3 border-t border-[#1E2B4D]">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-xl bg-[#162347] text-slate-300 text-xs font-medium hover:bg-[#1D2D5A] hover:text-slate-100 transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : isEdit ? (
                'Guardar Cambios'
              ) : (
                'Registrar Activo'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
