'use client';

import React, { useState, useEffect } from 'react';
import { PiggyBank, X, Check, ArrowRight, Wallet, Sparkles } from 'lucide-react';

interface ContributeGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  goal: {
    id: string;
    name: string;
    targetAmount: number;
    currentAmount: number;
    remainingAmount: number;
    percentage: number;
  } | null;
  accounts: any[];
  onConfirm: (goalId: string, data: { amount: number; accountId?: string; notes?: string }) => Promise<void>;
}

export default function ContributeGoalModal({
  isOpen,
  onClose,
  goal,
  accounts,
  onConfirm,
}: ContributeGoalModalProps) {
  const [amount, setAmount] = useState('');
  const [deductFromAccount, setDeductFromAccount] = useState(true);
  const [accountId, setAccountId] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (goal) {
      setAmount('');
      setNotes('');
      setError(null);
      if (accounts.length > 0 && !accountId) {
        setAccountId(accounts[0].id);
      }
    }
  }, [goal, accounts, accountId]);

  if (!isOpen || !goal) return null;

  const parsedAmount = parseFloat(amount) || 0;
  const projectedAmount = (goal.currentAmount || 0) + parsedAmount;
  const projectedPercentage =
    goal.targetAmount > 0 ? Math.min(100, Math.round((projectedAmount / goal.targetAmount) * 100)) : 0;

  const selectedAccount = accounts.find((a) => a.id === accountId);
  const insufficientFunds =
    deductFromAccount && selectedAccount && Number(selectedAccount.balance) < parsedAmount;

  const quickAmounts = [10, 25, 50, 100];
  if (goal.remainingAmount > 0 && !quickAmounts.includes(goal.remainingAmount)) {
    quickAmounts.push(goal.remainingAmount);
  }

  const handleQuickAdd = (val: number) => {
    setAmount(val.toString());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (parsedAmount <= 0) {
      setError('Ingresa un monto válido mayor a cero.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await onConfirm(goal.id, {
        amount: parsedAmount,
        accountId: deductFromAccount && accountId ? accountId : undefined,
        notes: notes.trim() || undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Error al registrar el aporte a la meta.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#0A1128]/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="mint-card w-full max-w-lg p-6 relative border border-[#1E2B4D] shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between mb-5 pb-3 border-b border-[#1E2B4D]">
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <PiggyBank className="w-5 h-5 text-amber-400" />
            <span>Aportar a Meta de Ahorro</span>
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
          {/* Tarjeta de estado actual de la meta */}
          <div className="p-3.5 rounded-xl bg-[#0A1128] border border-[#1E2B4D] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200">{goal.name}</span>
              <span className="text-xs font-semibold text-amber-400 tabular-nums">
                {goal.percentage}% completado
              </span>
            </div>

            <div className="w-full bg-[#162347] rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-amber-500 to-emerald-400 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(goal.percentage, 100)}%` }}
              />
            </div>

            <div className="flex justify-between text-[11px] text-slate-400 tabular-nums">
              <span>Actual: ${Number(goal.currentAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              <span>Objetivo: ${Number(goal.targetAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

          {/* Monto del Aporte */}
          <div>
            <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1.5">
              Monto a Aportar ($)
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
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-8 pr-3.5 py-2.5 rounded-xl bg-[#0A1128] border border-[#1E2B4D] text-slate-100 font-bold text-lg focus:outline-none focus:border-amber-400 tabular-nums transition-colors"
              />
            </div>

            {/* Chips rápidos */}
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              <span className="text-[10px] text-slate-400 mr-1">Rápido:</span>
              {quickAmounts.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => handleQuickAdd(q)}
                  className="px-2 py-0.5 rounded-lg bg-[#162347] hover:bg-amber-500/20 text-slate-300 hover:text-amber-300 border border-[#1E2B4D] text-[11px] font-medium transition-all cursor-pointer tabular-nums"
                >
                  {q === goal.remainingAmount ? `Restante ($${q})` : `+$${q}`}
                </button>
              ))}
            </div>
          </div>

          {/* Deducción automática de cuenta */}
          <div className="p-3.5 rounded-xl bg-[#0A1128] border border-[#1E2B4D] space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={deductFromAccount}
                onChange={(e) => setDeductFromAccount(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-500 bg-[#101A36] border-[#1E2B4D] focus:ring-0 focus:ring-offset-0 cursor-pointer"
              />
              <span className="text-xs font-semibold text-slate-200">
                Descontar este monto de una cuenta bancaria o efectivo
              </span>
            </label>

            {deductFromAccount && accounts.length > 0 && (
              <div>
                <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1">
                  Cuenta de Origen
                </label>
                <select
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#101A36] border border-[#1E2B4D] text-slate-100 text-xs focus:outline-none focus:border-emerald-400 cursor-pointer"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} — Saldo: ${Number(a.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </option>
                  ))}
                </select>

                {insufficientFunds && (
                  <p className="text-[11px] text-amber-400 mt-1.5 flex items-center gap-1">
                    <span>⚠️</span> El monto del aporte excede el saldo actual de esta cuenta.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Notas / Descripción */}
          <div>
            <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1.5">
              Nota o Concepto (Opcional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={`Aporte a ${goal.name}`}
              className="w-full px-3.5 py-2 rounded-xl bg-[#0A1128] border border-[#1E2B4D] text-slate-100 text-xs focus:outline-none focus:border-amber-400 transition-colors"
            />
          </div>

          {/* Preview del nuevo progreso */}
          {parsedAmount > 0 && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Nuevo total tras aporte:
              </span>
              <span className="font-bold tabular-nums">
                ${projectedAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })} ({projectedPercentage}%)
              </span>
            </div>
          )}

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
              disabled={loading || parsedAmount <= 0}
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <div className="w-3.5 h-3.5 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Confirmar Aporte</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
