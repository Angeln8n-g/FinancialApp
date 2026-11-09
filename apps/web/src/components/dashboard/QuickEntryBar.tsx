'use client';

import React, { useState, useEffect } from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  Check,
  Zap,
  CornerDownLeft,
  Sparkles,
  Bot,
  SlidersHorizontal,
} from 'lucide-react';
import TelegramBotModal from '../modals/TelegramBotModal';

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
  onRefresh?: () => void;
}

export default function QuickEntryBar({
  accounts,
  categories,
  onSubmit,
  onOpenModal,
  onRefresh,
}: QuickEntryBarProps) {
  // Modo: 'SMART' (lenguaje natural) o 'MANUAL' (inputs tradicionales)
  const [entryMode, setEntryMode] = useState<'SMART' | 'MANUAL'>('SMART');

  // Estados Modo Manual
  const [type, setType] = useState<'EXPENSE' | 'INCOME'>('EXPENSE');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [accountId, setAccountId] = useState('');
  const [categoryId, setCategoryId] = useState('');

  // Estados Modo Smart / Lenguaje Natural
  const [smartText, setSmartText] = useState('');
  const [candidate, setCandidate] = useState<any>(null);
  const [parsing, setParsing] = useState(false);

  // Estados de control & Modales
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showTelegramModal, setShowTelegramModal] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  const getToken = () => (typeof window !== 'undefined' ? localStorage.getItem('hogariq_token') : null);

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

  // Debounce parsing en modo Smart
  useEffect(() => {
    if (entryMode !== 'SMART' || !smartText.trim() || smartText.trim().length < 3) {
      setCandidate(null);
      return;
    }

    const timer = setTimeout(async () => {
      const token = getToken();
      if (!token) return;

      try {
        setParsing(true);
        const res = await fetch(`${API_URL}/api/quick-entry/parse`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ text: smartText }),
        });

        if (res.ok) {
          const data = await res.json();
          setCandidate(data.candidate);
        }
      } catch (e) {
        console.log('Error parseando entrada:', e);
      } finally {
        setParsing(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [smartText, entryMode]);

  const handleManualSubmit = async (e?: React.FormEvent) => {
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
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Error al registrar transacción rápida:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSmartSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!smartText.trim()) return;

    setLoading(true);
    const token = getToken();

    try {
      const res = await fetch(`${API_URL}/api/quick-entry/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text: smartText }),
      });

      if (res.ok) {
        setSmartText('');
        setCandidate(null);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 2000);
        if (onRefresh) onRefresh();
      } else {
        const err = await res.json();
        alert(err.message || 'No se pudo interpretar el gasto.');
      }
    } catch (err) {
      console.error('Error al ejecutar quick entry:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (entryMode === 'SMART') {
        handleSmartSubmit();
      } else {
        handleManualSubmit();
      }
    }
  };

  if (!accounts || accounts.length === 0) {
    return null;
  }

  return (
    <>
      <div className="bg-[#101A36] border border-[#1E2B4D] rounded-2xl p-4 sm:p-5 shadow-xl relative overflow-hidden">
        {/* Glow ambiental superior */}
        <div
          className={`absolute -top-12 left-1/4 w-96 h-24 blur-3xl pointer-events-none transition-colors duration-500 ${
            entryMode === 'SMART'
              ? 'bg-emerald-500/10'
              : type === 'EXPENSE'
              ? 'bg-rose-500/10'
              : 'bg-emerald-500/10'
          }`}
        />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Selector de Modo (Lenguaje Natural vs Manual) */}
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Zap className="w-4 h-4" />
            </span>
            <div className="flex items-center bg-[#0A1128] p-1 rounded-xl border border-[#1E2B4D]">
              <button
                type="button"
                onClick={() => setEntryMode('SMART')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  entryMode === 'SMART'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Express (Lenguaje Natural)</span>
              </button>
              <button
                type="button"
                onClick={() => setEntryMode('MANUAL')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  entryMode === 'MANUAL'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Manual</span>
              </button>
            </div>
          </div>

          {/* Botón Integración Telegram Bot */}
          <button
            type="button"
            onClick={() => setShowTelegramModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-300 text-xs font-bold transition-all self-start sm:self-auto cursor-pointer"
          >
            <Bot className="w-3.5 h-3.5" />
            <span>Conectar Bot Telegram</span>
          </button>
        </div>

        {/* MODO SMART: Input de Lenguaje Natural */}
        {entryMode === 'SMART' ? (
          <div className="mt-4 space-y-3">
            <div className="relative">
              <input
                type="text"
                value={smartText}
                onChange={(e) => setSmartText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Escribe en lenguaje natural: ej. Almuerzo 14.50 tarjeta 50/50 o Gasolina 45"
                className="w-full pl-4 pr-28 py-3 bg-[#0A1128] border border-[#1E2B4D] rounded-xl text-white placeholder-slate-500 text-xs sm:text-sm font-medium focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/60 transition-all"
              />

              <button
                type="button"
                onClick={handleSmartSubmit}
                disabled={loading || !smartText.trim()}
                className={`absolute right-1.5 top-1.5 bottom-1.5 px-4 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-md ${
                  success
                    ? 'bg-emerald-500 text-white'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                }`}
              >
                {success ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>¡Listo!</span>
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

            {/* Chips de Detección en Tiempo Real */}
            {candidate && (
              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-emerald-500/30 flex flex-wrap items-center gap-2 text-xs animate-in fade-in duration-200">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                  Detectado:
                </span>
                <span className="font-extrabold text-white tabular-nums bg-slate-800 px-2 py-0.5 rounded-md">
                  {candidate.type === 'INCOME' ? '+' : '-'}${candidate.amount.toFixed(2)}
                </span>
                <span className="text-slate-300 font-medium">"{candidate.description}"</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  📁 {candidate.categoryName || 'General'}
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/30">
                  💳 {candidate.accountName}
                </span>
                {candidate.isShared && (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 font-bold">
                    🤝 50/50 Pareja
                  </span>
                )}
              </div>
            )}
          </div>
        ) : (
          /* MODO MANUAL */
          <form
            onSubmit={handleManualSubmit}
            className="mt-3.5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2.5 items-center"
          >
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
                placeholder={
                  type === 'EXPENSE'
                    ? '¿En qué gastaste? (ej. Café)'
                    : '¿Origen del ingreso? (ej. Nómina)'
                }
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
        )}
      </div>

      {/* Modal Conexión Bot Telegram */}
      <TelegramBotModal
        isOpen={showTelegramModal}
        onClose={() => setShowTelegramModal(false)}
      />
    </>
  );
}
