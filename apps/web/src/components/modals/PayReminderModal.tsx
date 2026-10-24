'use client';

import React, { useState } from 'react';

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
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glass-card w-full max-w-md p-6 relative border border-emerald-500/40">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white flex items-center space-x-2">
            <span>✅</span>
            <span>Marcar y Pagar Recordatorio</span>
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white cursor-pointer text-xl">✕</button>
        </div>

        <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 mb-4 text-xs space-y-1">
          <p className="text-slate-400">Concepto: <strong className="text-white">{reminder.title}</strong></p>
          <p className="text-slate-400">Monto: <strong className="text-emerald-400">${Number(reminder.amount).toFixed(2)}</strong></p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
              ¿De qué cuenta deseas descontar el dinero?
            </label>
            <select
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} (${Number(a.balance).toFixed(2)})
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold cursor-pointer shadow-lg disabled:opacity-50"
            >
              {submitting ? 'Procesando...' : '✓ Confirmar y Descontar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
