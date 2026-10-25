'use client';

import React, { useState, useEffect } from 'react';
import { TrendingUp, X, Calendar, AlertTriangle, History, ArrowRight } from 'lucide-react';

interface UpdateValuationModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: any | null;
  onConfirm: (
    assetId: string,
    data: { value: number; notes?: string; valuationDate?: string },
  ) => Promise<void>;
}

export default function UpdateValuationModal({
  isOpen,
  onClose,
  asset,
  onConfirm,
}: UpdateValuationModalProps) {
  const [newValue, setNewValue] = useState('');
  const [valuationDate, setValuationDate] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (asset) {
      setNewValue(asset.value != null ? asset.value.toString() : '');
      const today = new Date().toISOString().split('T')[0];
      setValuationDate(today);
      setNotes('');
      setError(null);
    }
  }, [asset, isOpen]);

  if (!isOpen || !asset) return null;

  const currentValue = Number(asset.value || 0);
  const parsedNewValue = parseFloat(newValue) || 0;
  const difference = parsedNewValue - currentValue;
  const percentageDiff =
    currentValue > 0 ? Math.round((difference / currentValue) * 1000) / 10 : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isNaN(parsedNewValue) || parsedNewValue < 0) {
      setError('Ingresa un valor monetario válido.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await onConfirm(asset.id, {
        value: parsedNewValue,
        notes: notes.trim() || undefined,
        valuationDate: valuationDate || undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Error actualizando la tasación.');
    } finally {
      setLoading(false);
    }
  };

  const historyValuations = asset.latestValuations || [];

  return (
    <div className="fixed inset-0 bg-[#0A1128]/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="mint-card w-full max-w-md p-6 relative border border-[#1E2B4D] shadow-2xl animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5 pb-3 border-b border-[#1E2B4D]">
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            <span>Actualizar Tasación del Activo</span>
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

        {/* Resumen del activo actual */}
        <div className="p-3.5 rounded-xl bg-[#0A1128] border border-[#1E2B4D] mb-4 space-y-1">
          <p className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">Activo Seleccionado</p>
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-100">{asset.name}</span>
            <span className="text-xs text-slate-400 tabular-nums">
              Valor actual: <strong className="text-slate-200">${currentValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong>
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1.5">
              Nuevo Valor Tasado / de Mercado ($)
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-bold">
                $
              </span>
              <input
                type="number"
                step="0.01"
                required
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                className="w-full pl-8 pr-3.5 py-2.5 rounded-xl bg-[#0A1128] border border-[#1E2B4D] text-slate-100 font-bold text-base focus:outline-none focus:border-emerald-400 tabular-nums transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
              <span>Fecha de la Tasación</span>
            </label>
            <input
              type="date"
              required
              value={valuationDate}
              onChange={(e) => setValuationDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A1128] border border-[#1E2B4D] text-slate-100 text-xs focus:outline-none focus:border-emerald-400 transition-colors"
            />
          </div>

          {/* Comparación en vivo */}
          {difference !== 0 && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                difference > 0
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                  : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
              }`}
            >
              <span>Ajuste respecto al valor previo:</span>
              <span className="font-bold tabular-nums">
                {difference > 0 ? '+' : ''}${difference.toLocaleString('en-US', { minimumFractionDigits: 2 })} ({percentageDiff > 0 ? '+' : ''}{percentageDiff}%)
              </span>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1.5">
              Motivo o Notas del Ajuste
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej. Tasación de corredor oficial, Depreciación anual..."
              className="w-full px-3.5 py-2 rounded-xl bg-[#0A1128] border border-[#1E2B4D] text-slate-100 text-xs focus:outline-none focus:border-emerald-400 transition-colors"
            />
          </div>

          {/* Historial de valoraciones previas */}
          {historyValuations.length > 0 && (
            <div className="pt-2 border-t border-[#1E2B4D] space-y-2">
              <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <History className="w-3 h-3 text-emerald-400" />
                <span>Historial Reciente de Tasaciones</span>
              </div>
              <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                {historyValuations.map((v: any) => (
                  <div
                    key={v.id}
                    className="flex items-center justify-between text-xs p-2 rounded-lg bg-[#0A1128] border border-[#1E2B4D]/60"
                  >
                    <div>
                      <span className="text-[10px] text-slate-400 block">
                        {new Date(v.valuationDate).toLocaleDateString()}
                      </span>
                      <span className="text-slate-300 text-[11px] line-clamp-1">
                        {v.notes || 'Ajuste de valor'}
                      </span>
                    </div>
                    <span className="font-semibold text-slate-100 tabular-nums">
                      ${Number(v.value).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

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
              ) : (
                'Guardar Nueva Tasación'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
