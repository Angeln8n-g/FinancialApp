'use client';

import React, { useState, useEffect } from 'react';
import { Target, X, Check } from 'lucide-react';

interface EditBudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  budget: {
    id: string;
    categoryName: string;
    categoryIcon?: string;
    limitAmount: number;
    spentAmount?: number;
  } | null;
  onConfirm: (budgetId: string, limitAmount: number) => Promise<void>;
}

export default function EditBudgetModal({
  isOpen,
  onClose,
  budget,
  onConfirm,
}: EditBudgetModalProps) {
  const [limitAmount, setLimitAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (budget) {
      setLimitAmount(budget.limitAmount.toString());
      setError(null);
    }
  }, [budget]);

  if (!isOpen || !budget) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(limitAmount);
    if (isNaN(parsed) || parsed <= 0) {
      setError('El límite mensual debe ser un número positivo.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await onConfirm(budget.id, parsed);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Error al actualizar el presupuesto.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#0A1128]/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="mint-card w-full max-w-md p-6 relative border border-[#1E2B4D] shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between mb-5 pb-3 border-b border-[#1E2B4D]">
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Target className="w-4 h-4 text-emerald-400" />
            <span>Editar Límite de Presupuesto</span>
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-[#162347] transition-colors cursor-pointer"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-3.5 rounded-xl bg-[#0A1128] border border-[#1E2B4D] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">{budget.categoryIcon || '📊'}</span>
              <div>
                <p className="text-xs font-semibold text-slate-200">{budget.categoryName}</p>
                <p className="text-[11px] text-slate-400">Categoría asignada</p>
              </div>
            </div>
            {budget.spentAmount !== undefined && (
              <div className="text-right">
                <span className="text-[11px] text-slate-400 block">Gastado este mes</span>
                <span className="text-xs font-bold text-slate-200 tabular-nums">
                  ${Number(budget.spentAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1.5">
              Nuevo Límite Mensual ($)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-bold">
                $
              </div>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                autoFocus
                value={limitAmount}
                onChange={(e) => setLimitAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-8 pr-3.5 py-2.5 rounded-xl bg-[#0A1128] border border-[#1E2B4D] text-slate-100 font-bold text-base focus:outline-none focus:border-emerald-400 tabular-nums transition-colors"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Ajusta el monto máximo que tu hogar planea gastar en esta categoría cada mes.
            </p>
          </div>

          {error && (
            <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-xl">
              {error}
            </p>
          )}

          <div className="flex justify-end space-x-3 pt-3 border-t border-[#1E2B4D]">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-xl bg-[#162347] text-slate-300 text-xs font-medium hover:bg-[#1D2D5A] hover:text-slate-100 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Guardar Cambios</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
