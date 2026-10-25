'use client';

import React, { useState, useEffect } from 'react';
import { PiggyBank, X, Check, Calendar } from 'lucide-react';

interface EditGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  goal: {
    id: string;
    name: string;
    targetAmount: number;
    currentAmount: number;
    targetDate?: string | null;
  } | null;
  onConfirm: (goalId: string, data: { name?: string; targetAmount?: number; targetDate?: string }) => Promise<void>;
}

export default function EditGoalModal({
  isOpen,
  onClose,
  goal,
  onConfirm,
}: EditGoalModalProps) {
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (goal) {
      setName(goal.name);
      setTargetAmount(goal.targetAmount.toString());
      if (goal.targetDate) {
        // Format ISO date string as YYYY-MM-DD for HTML input[type="date"]
        const d = new Date(goal.targetDate);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        setTargetDate(`${yyyy}-${mm}-${dd}`);
      } else {
        setTargetDate('');
      }
      setError(null);
    }
  }, [goal]);

  if (!isOpen || !goal) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedTarget = parseFloat(targetAmount);
    if (!name.trim()) {
      setError('El nombre de la meta es requerido.');
      return;
    }
    if (isNaN(parsedTarget) || parsedTarget <= 0) {
      setError('El monto objetivo debe ser mayor a cero.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await onConfirm(goal.id, {
        name: name.trim(),
        targetAmount: parsedTarget,
        targetDate: targetDate ? targetDate : undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Error al actualizar la meta.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#0A1128]/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="mint-card w-full max-w-md p-6 relative border border-[#1E2B4D] shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between mb-5 pb-3 border-b border-[#1E2B4D]">
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <PiggyBank className="w-5 h-5 text-amber-400" />
            <span>Editar Meta de Ahorro</span>
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
          <div>
            <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1.5">
              Nombre de la Meta
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Vacaciones Familiares"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A1128] border border-[#1E2B4D] text-slate-100 text-sm focus:outline-none focus:border-emerald-400 transition-colors"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1.5">
              Monto Objetivo ($)
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
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-8 pr-3.5 py-2.5 rounded-xl bg-[#0A1128] border border-[#1E2B4D] text-slate-100 font-bold text-base focus:outline-none focus:border-emerald-400 tabular-nums transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1.5">
              Fecha Límite Objetivo (Opcional)
            </label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A1128] border border-[#1E2B4D] text-slate-100 text-sm focus:outline-none focus:border-emerald-400 transition-colors"
            />
          </div>

          {/* Estado de ahorro actual */}
          <div className="p-3 rounded-xl bg-[#0A1128] border border-[#1E2B4D] text-xs text-slate-300 flex items-center justify-between">
            <span>Ahorro acumulado actual:</span>
            <span className="font-bold text-amber-400 tabular-nums">
              ${Number(goal.currentAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
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
