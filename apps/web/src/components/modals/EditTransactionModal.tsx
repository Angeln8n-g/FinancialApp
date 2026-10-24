'use client';

import React, { useState, useEffect } from 'react';

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
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glass-card w-full max-w-md p-6 relative border border-amber-500/40">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <span>✏️</span> Editar Transacción
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white cursor-pointer text-xl">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Monto ($)</label>
            <input
              type="number"
              step="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-bold focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Descripción</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-amber-500 text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Cuenta</label>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-amber-500 text-xs"
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>{acc.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Categoría</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-amber-500 text-xs"
            >
              <option value="">Sin Categoría</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
              ))}
            </select>
          </div>

          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-1">
            <label className="block text-xs font-extrabold text-amber-300 uppercase">
              Motivo / Razón del Cambio (Obligatorio) *
            </label>
            <input
              type="text"
              required
              value={editReason}
              onChange={(e) => setEditReason(e.target.value)}
              placeholder="Ej. Ajuste de valor según recibo físico"
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-amber-500/50 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
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
              className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-500 text-xs font-bold text-white rounded-xl cursor-pointer disabled:opacity-50"
            >
              {submitting ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
