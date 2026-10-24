'use client';

import React, { useState, useEffect } from 'react';
import { Pencil, X } from 'lucide-react';

interface EditTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: any;
  accounts: any[];
  categories: any[];
  onConfirm: (
    txId: string,
    data: {
      amount: number;
      description: string;
      accountId: string;
      categoryId?: string;
      editReason: string;
    },
  ) => Promise<void>;
}

export default function EditTransactionModal({
  isOpen,
  onClose,
  transaction,
  accounts,
  categories,
  onConfirm,
}: EditTransactionModalProps) {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [accountId, setAccountId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [editReason, setEditReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (transaction) {
      setAmount(transaction.amount?.toString() || '');
      setDescription(transaction.description || '');
      setAccountId(transaction.accountId || accounts[0]?.id || '');
      setCategoryId(transaction.categoryId || '');
      setEditReason('');
    }
  }, [transaction, accounts]);

  if (!isOpen || !transaction) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !editReason.trim()) return;

    setSubmitting(true);
    try {
      await onConfirm(transaction.id, {
        amount: parseFloat(amount),
        description: description.trim(),
        accountId,
        categoryId: categoryId || undefined,
        editReason: editReason.trim(),
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#0A1128]/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="mint-card w-full max-w-md p-6 relative border border-amber-500/30 shadow-2xl">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#1E2B4D]">
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Pencil className="w-4 h-4 text-amber-400" />
            <span>Editar Transacción</span>
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
              Monto ($)
            </label>
            <input
              type="number"
              step="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A1128] border border-[#1E2B4D] text-slate-100 font-bold focus:outline-none focus:border-amber-400 tabular-nums transition-colors"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1.5">
              Descripción
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A1128] border border-[#1E2B4D] text-slate-100 text-xs focus:outline-none focus:border-amber-400 transition-colors"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1.5">
              Cuenta
            </label>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-[#0A1128] border border-[#1E2B4D] text-slate-100 text-xs focus:outline-none focus:border-amber-400 cursor-pointer transition-colors"
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id} className="bg-[#101A36]">
                  {acc.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1.5">
              Categoría
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-[#0A1128] border border-[#1E2B4D] text-slate-100 text-xs focus:outline-none focus:border-amber-400 cursor-pointer transition-colors"
            >
              <option value="" className="bg-[#101A36]">Sin Categoría</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id} className="bg-[#101A36]">
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-1.5">
            <label className="block text-[11px] font-bold text-amber-300 uppercase tracking-wider">
              Motivo / Razón del Cambio (Obligatorio) *
            </label>
            <input
              type="text"
              required
              value={editReason}
              onChange={(e) => setEditReason(e.target.value)}
              placeholder="Ej. Ajuste según comprobante fiscal"
              className="w-full px-3 py-2 rounded-lg bg-[#0A1128] border border-amber-500/40 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400"
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
              className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-500 text-xs font-semibold text-white rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              {submitting ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
