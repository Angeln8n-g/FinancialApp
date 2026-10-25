'use client';

import React, { useState, useEffect } from 'react';
import { ArrowDownRight, ArrowUpRight, Check, Zap, CornerDownLeft, Sparkles } from 'lucide-react';

interface QuickEntryBarProps {
  accounts: any[];
  categories: any[];
  onSubmit: (data: {
    accountId: string;
    categoryId?: string;
    type: 'EXPENSE' | 'INCOME';
    amount: number;
    description?: string;
    date?: string;
  }) => Promise<void>;
  onOpenModal?: (type: 'EXPENSE' | 'INCOME' | 'TRANSFER') => void;
}

export default function QuickEntryBar({
  accounts,
  categories,
  onSubmit,
  onOpenModal,
}: QuickEntryBarProps) {
  const [type, setType] = useState<'EXPENSE' | 'INCOME'>('EXPENSE');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [accountId, setAccountId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Seleccionar automáticamente la primera cuenta si no hay ninguna seleccionada
  useEffect(() => {
    if (accounts.length > 0 && !accountId) {
      setAccountId(accounts[0].id);
    }
  }, [accounts, accountId]);

  // Seleccionar automáticamente la primera categoría si hay disponibles
  useEffect(() => {
    if (categories.length > 0 && !categoryId) {
      setCategoryId(categories[0].id);
    }
  }, [categories, categoryId]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) return;
    if (!accountId) return;

    setLoading(true);
    try {
      await onSubmit({
        accountId,
        categoryId: categoryId || undefined,
        type,
        amount: parsedAmount,
        description: description.trim() || undefined,
        date: new Date().toISOString(),
      });

      setAmount('');
      setDescription('');
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch (err) {
      console.error('Error al registrar transacción rápida:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (!accounts || accounts.length === 0) {
    return null; // Si no hay cuentas configuradas aún, no mostrar barra rápida
  }

  return (
    <div className="bg-[#101A36] border border-[#1E2B4D] rounded-2xl p-4 sm:p-5 shadow-xl relative overflow-hidden">
      {/* Glow ambiental superior */}
      <div
        className={`absolute -top-12 left-1/4 w-96 h-24 blur-3xl pointer-events-none transition-colors duration-500 ${
          type === 'EXPENSE' ? 'bg-rose-500/10' : 'bg-emerald-500/10'
        }`}
      />

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Cabecera y Selector de Modo */}
        <div className="flex items-center justify-between lg:justify-start gap-3">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Zap className="w-4 h-4" />
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Registro Rápido
            </span>
          </div>

          <div className="flex items-center bg-[#0A1128] p-1 rounded-xl border border-[#1E2B4D]">
            <button
              type="button"
              onClick={() => setType('EXPENSE')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                type === 'EXPENSE'
                  ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ArrowDownRight className="w-3.5 h-3.5" />
              Gasto
            </button>
            <button
              type="button"
              onClick={() => setType('INCOME')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                type === 'INCOME'
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              Ingreso
            </button>
          </div>
        </div>

        {/* Atajos de teclado informativos */}
        <div className="hidden xl:flex items-center gap-2 text-[11px] text-slate-400">
          <span>Atajos rápidos:</span>
          <kbd className="px-1.5 py-0.5 rounded bg-[#0A1128] border border-[#1E2B4D] text-slate-300 font-mono text-[10px]">G</kbd> Gasto
          <kbd className="px-1.5 py-0.5 rounded bg-[#0A1128] border border-[#1E2B4D] text-slate-300 font-mono text-[10px]">I</kbd> Ingreso
          <kbd className="px-1.5 py-0.5 rounded bg-[#0A1128] border border-[#1E2B4D] text-slate-300 font-mono text-[10px]">T</kbd> Transferir
        </div>
      </div>

      {/* Formulario Inline */}
      <form onSubmit={handleSubmit} className="mt-3.5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2.5 items-center">
        {/* Input de Monto */}
        <div className="lg:col-span-3 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 font-medium">
            $
          </div>
          <input
            type="number"
            step="0.01"
            min="0.01"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="0.00"
            className="w-full pl-8 pr-3 py-2 bg-[#0A1128] border border-[#1E2B4D] rounded-xl text-white placeholder-slate-500 font-bold tabular-nums text-sm focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/60 transition-all"
          />
        </div>

        {/* Input de Descripción */}
        <div className="lg:col-span-3">
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={type === 'EXPENSE' ? '¿En qué gastaste? (ej. Café)' : '¿Origen del ingreso? (ej. Nómina)'}
            className="w-full px-3 py-2 bg-[#0A1128] border border-[#1E2B4D] rounded-xl text-white placeholder-slate-500 text-xs focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/60 transition-all"
          />
        </div>

        {/* Selector de Categoría */}
        <div className="lg:col-span-2">
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full px-3 py-2 bg-[#0A1128] border border-[#1E2B4D] rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500/60 transition-all cursor-pointer truncate"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id} className="bg-[#101A36] text-white">
                {c.icon} {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Selector de Cuenta */}
        <div className="lg:col-span-2">
          <select
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            className="w-full px-3 py-2 bg-[#0A1128] border border-[#1E2B4D] rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500/60 transition-all cursor-pointer truncate"
          >
            {accounts.map((a) => (
              <option key={a.id} value={a.id} className="bg-[#101A36] text-white">
                {a.name} (${Number(a.balance).toFixed(0)})
              </option>
            ))}
          </select>
        </div>

        {/* Botón de Enviar */}
        <div className="lg:col-span-2 flex items-center gap-2">
          <button
            type="submit"
            disabled={loading || !amount || parseFloat(amount) <= 0}
            className={`w-full py-2 px-3 rounded-xl font-semibold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-md ${
              success
                ? 'bg-emerald-500 text-white'
                : type === 'EXPENSE'
                ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/20'
                : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20'
            }`}
          >
            {success ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>¡Guardado!</span>
              </>
            ) : loading ? (
              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <CornerDownLeft className="w-3.5 h-3.5" />
                <span>Registrar</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
