'use client';

import React, { useState } from 'react';

interface ReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  debts?: any[];
  subscriptions?: any[];
  onSubmit: (data: {
    title: string;
    amount: number;
    dueDate: string;
    debtId?: string;
    subscriptionId?: string;
  }) => Promise<void>;
}

export default function ReminderModal({
  isOpen,
  onClose,
  debts = [],
  subscriptions = [],
  onSubmit,
}: ReminderModalProps) {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [debtId, setDebtId] = useState('');
  const [subscriptionId, setSubscriptionId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !amount || !dueDate) return;

    setSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        amount: parseFloat(amount),
        dueDate,
        debtId: debtId || undefined,
        subscriptionId: subscriptionId || undefined,
      });
      setTitle('');
      setAmount('');
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glass-card w-full max-w-md p-6 relative">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white flex items-center space-x-2">
            <span>⏰</span>
            <span>Nuevo Recordatorio de Pago</span>
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white cursor-pointer text-xl">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Concepto / Título</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej. Factura Eléctrica, Alquiler, Colegiatura"
              className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Monto ($)</label>
            <input
              type="number"
              step="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-2xl font-black text-white focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Fecha de Vencimiento</label>
            <input
              type="date"
              required
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-purple-500"
            />
          </div>

          {debts.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Vincular a Deuda (Opcional)</label>
              <select
                value={debtId}
                onChange={(e) => setDebtId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-purple-500"
              >
                <option value="">Ninguna</option>
                {debts.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.contactName} - ${Number(d.remainingAmount).toLocaleString()} pendiente
                  </option>
                ))}
              </select>
            </div>
          )}

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
              className="px-5 py-2.5 rounded-xl glow-button text-white text-xs font-bold cursor-pointer disabled:opacity-50"
            >
              {submitting ? 'Guardando...' : 'Crear Recordatorio'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
