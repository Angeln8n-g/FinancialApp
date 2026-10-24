'use client';

import React, { useState } from 'react';
import { Ban, X } from 'lucide-react';

interface VoidTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: any;
  onConfirm: (txId: string, voidReason: string) => Promise<void>;
}

export default function VoidTransactionModal({
  isOpen,
  onClose,
  transaction,
  onConfirm,
}: VoidTransactionModalProps) {
  const [voidReason, setVoidReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !transaction) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!voidReason.trim()) return;

    setSubmitting(true);
    try {
      await onConfirm(transaction.id, voidReason.trim());
      setVoidReason('');
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#0A1128]/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="mint-card w-full max-w-md p-6 relative border border-rose-500/30 shadow-2xl">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#1E2B4D]">
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Ban className="w-4 h-4 text-rose-400" />
            <span>Anular Transacción</span>
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-[#162347] transition-colors cursor-pointer"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-3.5 bg-[#0A1128] rounded-xl border border-[#1E2B4D] mb-4 text-xs space-y-1.5">
          <p className="text-slate-400">
            Movimiento: <strong className="text-slate-100 font-semibold">{transaction.description || 'Sin descripción'}</strong>
          </p>
          <p className="text-slate-400">
            Monto: <strong className="text-rose-400 font-bold tabular-nums">${Number(transaction.amount).toFixed(2)}</strong>
          </p>
          <p className="text-[11px] text-slate-500">El monto se revertirá automáticamente en la cuenta de origen.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl space-y-1.5">
            <label className="block text-[11px] font-bold text-rose-300 uppercase tracking-wider">
              Motivo de la Anulación (Obligatorio) *
            </label>
            <input
              type="text"
              required
              value={voidReason}
              onChange={(e) => setVoidReason(e.target.value)}
              placeholder="Ej. Registro duplicado o error de digitación"
              className="w-full px-3 py-2 rounded-lg bg-[#0A1128] border border-rose-500/40 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-rose-400"
            />
          </div>

          <div className="flex gap-2 pt-3 border-t border-[#1E2B4D]">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-[#162347] text-xs font-medium text-slate-300 hover:bg-[#1D2D5A] hover:text-slate-100 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-xs font-semibold text-white rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              {submitting ? 'Anulando...' : 'Confirmar Anulación'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
