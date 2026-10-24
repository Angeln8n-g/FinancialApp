'use client';

import React, { useState } from 'react';

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
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glass-card w-full max-w-md p-6 relative border border-rose-500/40">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <span>🚫</span> Anular Transacción
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white cursor-pointer text-xl">✕</button>
        </div>

        <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 mb-4 text-xs space-y-1">
          <p className="text-slate-400">
            Movimiento: <strong className="text-white">{transaction.description || 'Sin descripción'}</strong>
          </p>
          <p className="text-slate-400">
            Monto: <strong className="text-rose-400">${Number(transaction.amount).toFixed(2)}</strong>
          </p>
          <p className="text-[11px] text-slate-500 mt-1">El monto se revertirá automáticamente a la cuenta de origen.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl space-y-1">
            <label className="block text-xs font-extrabold text-rose-300 uppercase">
              Motivo de la Anulación (Obligatorio) *
            </label>
            <input
              type="text"
              required
              value={voidReason}
              onChange={(e) => setVoidReason(e.target.value)}
              placeholder="Ej. Registro duplicado por error"
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-rose-500/50 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-400"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-slate-800 text-xs font-bold text-slate-300 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white rounded-xl cursor-pointer disabled:opacity-50"
            >
              {submitting ? 'Anulando...' : '🚫 Confirmar Anulación'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
