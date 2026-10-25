'use client';

import React, { useState, useEffect } from 'react';
import { Pencil, X, Sparkles, Target, Calendar, TrendingDown, AlertTriangle } from 'lucide-react';

interface EditDebtModalProps {
  isOpen: boolean;
  onClose: () => void;
  debt: {
    id: string;
    contactName: string;
    totalAmount: number;
    remainingAmount: number;
    interestRate: number;
    targetPayoffDate?: string | null;
    monthlyTargetPayment?: number | null;
    mitigationStrategy?: 'AVALANCHE' | 'SNOWBALL' | 'CUSTOM' | null;
    notes?: string | null;
  } | null;
  onConfirm: (
    debtId: string,
    data: {
      contactName?: string;
      totalAmount?: number;
      remainingAmount?: number;
      interestRate?: number;
      targetPayoffDate?: string | null;
      monthlyTargetPayment?: number | null;
      mitigationStrategy?: 'AVALANCHE' | 'SNOWBALL' | 'CUSTOM';
      notes?: string | null;
    },
  ) => Promise<void>;
}

export default function EditDebtModal({
  isOpen,
  onClose,
  debt,
  onConfirm,
}: EditDebtModalProps) {
  const [contactName, setContactName] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [remainingAmount, setRemainingAmount] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [targetPayoffDate, setTargetPayoffDate] = useState('');
  const [monthlyTargetPayment, setMonthlyTargetPayment] = useState('');
  const [mitigationStrategy, setMitigationStrategy] = useState<'AVALANCHE' | 'SNOWBALL' | 'CUSTOM'>('CUSTOM');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (debt) {
      setContactName(debt.contactName || '');
      setTotalAmount(debt.totalAmount != null ? debt.totalAmount.toString() : '');
      setRemainingAmount(debt.remainingAmount != null ? debt.remainingAmount.toString() : '');
      setInterestRate(debt.interestRate != null ? debt.interestRate.toString() : '0');
      if (debt.targetPayoffDate) {
        const d = new Date(debt.targetPayoffDate);
        setTargetPayoffDate(d.toISOString().split('T')[0]);
      } else {
        setTargetPayoffDate('');
      }
      setMonthlyTargetPayment(
        debt.monthlyTargetPayment != null ? debt.monthlyTargetPayment.toString() : '',
      );
      setMitigationStrategy(debt.mitigationStrategy || 'CUSTOM');
      setNotes(debt.notes || '');
      setError(null);
    }
  }, [debt]);

  if (!isOpen || !debt) return null;

  // Calculo en tiempo real de sugerencia mensual según fecha objetivo
  const parsedRemaining = parseFloat(remainingAmount) || 0;
  let suggestedMonthly: number | null = null;
  let monthsUntilTarget = 0;

  if (targetPayoffDate && parsedRemaining > 0) {
    const targetDate = new Date(targetPayoffDate);
    const now = new Date();
    const diffDays = Math.ceil((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays > 0) {
      monthsUntilTarget = Math.max(1, Math.ceil(diffDays / 30.4375));
      suggestedMonthly = Math.round((parsedRemaining / monthsUntilTarget) * 100) / 100;
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim()) {
      setError('El nombre o acreedor es obligatorio.');
      return;
    }
    const parsedTotal = parseFloat(totalAmount);
    const parsedRem = parseFloat(remainingAmount);
    if (isNaN(parsedTotal) || parsedTotal <= 0) {
      setError('El monto total debe ser mayor a 0.');
      return;
    }
    if (isNaN(parsedRem) || parsedRem < 0) {
      setError('El monto pendiente no puede ser negativo.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await onConfirm(debt.id, {
        contactName: contactName.trim(),
        totalAmount: parsedTotal,
        remainingAmount: parsedRem,
        interestRate: parseFloat(interestRate) || 0,
        targetPayoffDate: targetPayoffDate ? targetPayoffDate : null,
        monthlyTargetPayment: monthlyTargetPayment ? parseFloat(monthlyTargetPayment) : null,
        mitigationStrategy,
        notes: notes.trim() || null,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Error actualizando la deuda.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#0A1128]/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="mint-card w-full max-w-lg p-6 relative border border-[#1E2B4D] shadow-2xl animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5 pb-3 border-b border-[#1E2B4D]">
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Pencil className="w-5 h-5 text-emerald-400" />
            <span>Editar Deuda y Plan de Mitigación</span>
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
              Acreedor / Institución / Contacto
            </label>
            <input
              type="text"
              required
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A1128] border border-[#1E2B4D] text-slate-100 text-sm focus:outline-none focus:border-emerald-400 transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1.5">
                Monto Total Original ($)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-bold">
                  $
                </span>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(e.target.value)}
                  className="w-full pl-8 pr-3.5 py-2.5 rounded-xl bg-[#0A1128] border border-[#1E2B4D] text-slate-100 font-bold text-sm focus:outline-none focus:border-emerald-400 tabular-nums transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1.5">
                Saldo Pendiente Actual ($)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-bold">
                  $
                </span>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={remainingAmount}
                  onChange={(e) => setRemainingAmount(e.target.value)}
                  className="w-full pl-8 pr-3.5 py-2.5 rounded-xl bg-[#0A1128] border border-[#1E2B4D] text-slate-100 font-bold text-sm focus:outline-none focus:border-emerald-400 tabular-nums transition-colors"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1.5">
              Tasa de Interés (% Anual / Costo Financiero)
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                value={interestRate}
                onChange={(e) => setInterestRate(e.target.value)}
                placeholder="0.00"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A1128] border border-[#1E2B4D] text-slate-100 text-sm focus:outline-none focus:border-emerald-400 tabular-nums transition-colors"
              />
              <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400 text-xs font-semibold">
                %
              </span>
            </div>
          </div>

          {/* Sección de Plan de Mitigación */}
          <div className="p-4 rounded-xl bg-[#0A1128] border border-emerald-500/30 space-y-4">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs uppercase tracking-wider">
              <Target className="w-4 h-4 text-emerald-400" />
              <span>Plan de Mitigación y Saldado Objetivo</span>
            </div>

            {/* Estrategia de Pago */}
            <div>
              <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-2">
                Estrategia de Amortización
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setMitigationStrategy('AVALANCHE')}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    mitigationStrategy === 'AVALANCHE'
                      ? 'bg-rose-500/15 border-rose-500/50 text-rose-300'
                      : 'bg-[#101A36] border-[#1E2B4D] text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <p className="text-xs font-bold flex items-center gap-1">
                    <TrendingDown className="w-3.5 h-3.5" />
                    Avalancha
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">Mayor tasa %</p>
                </button>

                <button
                  type="button"
                  onClick={() => setMitigationStrategy('SNOWBALL')}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    mitigationStrategy === 'SNOWBALL'
                      ? 'bg-cyan-500/15 border-cyan-500/50 text-cyan-300'
                      : 'bg-[#101A36] border-[#1E2B4D] text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <p className="text-xs font-bold flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    Bola de Nieve
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">Menor saldo</p>
                </button>

                <button
                  type="button"
                  onClick={() => setMitigationStrategy('CUSTOM')}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    mitigationStrategy === 'CUSTOM'
                      ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300'
                      : 'bg-[#101A36] border-[#1E2B4D] text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <p className="text-xs font-bold flex items-center gap-1">
                    <Target className="w-3.5 h-3.5" />
                    Personalizado
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">A tu ritmo</p>
                </button>
              </div>
            </div>

            {/* Fecha Objetivo de Saldado */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Fecha Objetivo de Saldado</span>
                </label>
                <input
                  type="date"
                  value={targetPayoffDate}
                  onChange={(e) => setTargetPayoffDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#101A36] border border-[#1E2B4D] text-slate-100 text-xs focus:outline-none focus:border-emerald-400 transition-colors"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1.5">
                  Cuota Mensual Comprometida ($)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 text-xs font-bold">
                    $
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    value={monthlyTargetPayment}
                    onChange={(e) => setMonthlyTargetPayment(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-7 pr-3.5 py-2.5 rounded-xl bg-[#101A36] border border-[#1E2B4D] text-slate-100 text-xs font-bold focus:outline-none focus:border-emerald-400 tabular-nums transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Sugerencia de cuota en base al objetivo */}
            {suggestedMonthly !== null && suggestedMonthly > 0 && (
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs">
                <span className="text-slate-300">
                  Cuota sugerida para saldar en {monthsUntilTarget} meses:{' '}
                  <strong className="text-emerald-400 tabular-nums">
                    ${suggestedMonthly.toLocaleString('en-US', { minimumFractionDigits: 2 })}/mes
                  </strong>
                </span>
                <button
                  type="button"
                  onClick={() => setMonthlyTargetPayment(suggestedMonthly!.toString())}
                  className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold transition-colors cursor-pointer"
                >
                  Aplicar cuota
                </button>
              </div>
            )}
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1.5">
              Notas o Detalles del Préstamo
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Número de contrato, contacto del asesor, detalles de penalización..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A1128] border border-[#1E2B4D] text-slate-100 text-xs focus:outline-none focus:border-emerald-400 transition-colors resize-none"
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
              ) : (
                'Guardar Cambios'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
