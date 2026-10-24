'use client';

import React, { useState } from 'react';
import { CalendarClock, X } from 'lucide-react';

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
    <div className="fixed inset-0 bg-[#0A1128]/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="mint-card w-full max-w-md p-6 relative border border-[#1E2B4D] shadow-2xl">
        <div className="flex items-center justify-between mb-5 pb-3 border-b border-[#1E2B4D]">
          <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
            <CalendarClock className="w-4 h-4 text-emerald-400" />
            <span>Nuevo Recordatorio de Pago</span>
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
              Concepto / Título
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej. Factura Eléctrica, Alquiler, Internet"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A1128] border border-[#1E2B4D] text-slate-100 text-sm focus:outline-none focus:border-emerald-400 transition-colors"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1.5">
              Monto ($)
            </label>
            <input
              type="number"
              step="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full px-4 py-2.5 rounded-xl bg-[#0A1128] border border-[#1E2B4D] text-2xl font-bold text-slate-100 focus:outline-none focus:border-emerald-400 tabular-nums transition-colors"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1.5">
              Fecha de Vencimiento
            </label>
            <input
              type="date"
              required
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A1128] border border-[#1E2B4D] text-slate-100 text-sm focus:outline-none focus:border-emerald-400 transition-colors"
            />
          </div>

          {debts.length > 0 && (
            <div>
              <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1.5">
                Vincular a Deuda (Opcional)
              </label>
              <select
                value={debtId}
                onChange={(e) => setDebtId(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-[#0A1128] border border-[#1E2B4D] text-slate-200 text-xs focus:outline-none focus:border-emerald-400 cursor-pointer transition-colors"
              >
                <option value="" className="bg-[#101A36]">Ninguna</option>
                {debts.map((d) => (
                  <option key={d.id} value={d.id} className="bg-[#101A36]">
                    {d.contactName} - ${Number(d.remainingAmount).toLocaleString()} pendiente
                  </option>
                ))}
              </select>
            </div>
          )}

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
              {submitting ? 'Guardando...' : 'Crear Recordatorio'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
