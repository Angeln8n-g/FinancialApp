'use client';

import React, { useState } from 'react';
import { CheckCircle2, X } from 'lucide-react';

interface PayReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  reminder: any;
  accounts: any[];
  onConfirm: (reminderId: string, accountId: string) => Promise<void>;
}

export default function PayReminderModal({
  isOpen,
  onClose,
  reminder,
  accounts,
  onConfirm,
}: PayReminderModalProps) {
  const [selectedAccountId, setSelectedAccountId] = useState(accounts[0]?.id || '');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !reminder) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccountId) return;

    setSubmitting(true);
    try {
      await onConfirm(reminder.id, selectedAccountId);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#0A1128]/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="mint-card w-full max-w-md p-6 relative border border-emerald-500/30 shadow-2xl">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#1E2B4D]">
          <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Confirmar Pago de Recordatorio</span>
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
          <p className="text-slate-400">Concepto: <strong className="text-slate-100 font-semibold">{reminder.title}</strong></p>
          <p className="text-slate-400">Monto: <strong className="text-emerald-400 font-bold tabular-nums">${Number(reminder.amount).toFixed(2)}</strong></p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1.5">
              ¿De qué cuenta deseas descontar el dinero?
            </label>
            <select
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A1128] border border-[#1E2B4D] text-slate-100 text-sm focus:outline-none focus:border-emerald-400 cursor-pointer transition-colors"
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id} className="bg-[#101A36]">
                  {a.name} (${Number(a.balance).toFixed(2)})
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end space-x-3 pt-3 border-t border-[#1E2B4D]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#162347] text-slate-300 text-xs font-medium hover:bg-[#1D2D5A] hover:text-slate-100 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              {submitting ? 'Procesando...' : 'Confirmar y Descontar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
