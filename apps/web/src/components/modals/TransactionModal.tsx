'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  ArrowDownRight,
  ArrowUpRight,
  ArrowRightLeft,
  Calendar,
  Search,
  Check,
  Plus,
  Zap,
  Sparkles
} from 'lucide-react';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: any[];
  categories: any[];
  initialType?: 'EXPENSE' | 'INCOME' | 'TRANSFER';
  onSubmit: (data: {
    accountId: string;
    destinationAccountId?: string;
    categoryId?: string;
    type: 'EXPENSE' | 'INCOME' | 'TRANSFER';
    amount: number;
    description: string;
    date?: string;
  }) => Promise<void>;
}

export default function TransactionModal({
  isOpen,
  onClose,
  accounts,
  categories,
  initialType = 'EXPENSE',
  onSubmit,
}: TransactionModalProps) {
  const [type, setType] = useState<'EXPENSE' | 'INCOME' | 'TRANSFER'>(initialType);
  const [amount, setAmount] = useState('');
  const [accountId, setAccountId] = useState(accounts[0]?.id || '');
  const [destinationAccountId, setDestinationAccountId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [dateMode, setDateMode] = useState<'today' | 'yesterday' | 'custom'>('today');
  const [customDate, setCustomDate] = useState(new Date().toISOString().split('T')[0]);
  const [categorySearch, setCategorySearch] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successToast, setSuccessToast] = useState('');

  const amountInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setType(initialType);
      if (accounts.length > 0 && !accountId) setAccountId(accounts[0].id);
      if (accounts.length > 1 && !destinationAccountId) {
        setDestinationAccountId(accounts.find((a) => a.id !== accounts[0]?.id)?.id || '');
      }
      if (categories.length > 0 && !categoryId) setCategoryId(categories[0].id);
      setSuccessToast('');
      // Autofoco inmediato en el monto
      setTimeout(() => amountInputRef.current?.focus(), 50);
    }
  }, [isOpen, initialType, accounts, categories]);

  // Manejador de atajos de teclado dentro del modal
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleSave(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, amount, accountId, destinationAccountId, categoryId, description, type, dateMode, customDate]);

  if (!isOpen) return null;

  const getComputedDate = () => {
    if (dateMode === 'today') return new Date().toISOString();
    if (dateMode === 'yesterday') {
      const d = new Date();
      d.setDate(d.getDate() - 1);
      return d.toISOString();
    }
    return new Date(`${customDate}T12:00:00Z`).toISOString();
  };

  const handleSave = async (keepOpen = false) => {
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0 || !accountId) return;

    if (type === 'TRANSFER' && (!destinationAccountId || destinationAccountId === accountId)) {
      alert('Por favor selecciona una cuenta de destino diferente a la de origen');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        accountId,
        destinationAccountId: type === 'TRANSFER' ? destinationAccountId : undefined,
        categoryId: type !== 'TRANSFER' ? (categoryId || undefined) : undefined,
        type,
        amount: numAmount,
        description: description.trim(),
        date: getComputedDate(),
      });

      if (keepOpen) {
        setAmount('');
        setDescription('');
        setSuccessToast(`¡${type === 'INCOME' ? 'Ingreso' : type === 'TRANSFER' ? 'Transferencia' : 'Gasto'} de $${numAmount.toFixed(2)} guardado! Listo para el siguiente.`);
        setTimeout(() => setSuccessToast(''), 3500);
        setTimeout(() => amountInputRef.current?.focus(), 50);
      } else {
        setAmount('');
        setDescription('');
        onClose();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddAmount = (extra: number) => {
    const current = parseFloat(amount) || 0;
    setAmount((current + extra).toString());
    amountInputRef.current?.focus();
  };

  // Filtrado de categorías para búsqueda instantánea
  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(categorySearch.toLowerCase())
  );

  const selectedCategoryObj = categories.find((c) => c.id === categoryId);

  return (
    <div className="fixed inset-0 bg-[#0A1128]/85 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="mint-card w-full max-w-lg p-5 sm:p-6 relative border border-[#1E2B4D] shadow-2xl my-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#1E2B4D]">
          <div className="flex items-center space-x-2">
            <Zap className="w-4 h-4 text-emerald-400" />
            <h3 className="text-base font-bold text-slate-100">Registro Rápido de Movimiento</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-[#162347] transition-colors cursor-pointer"
            aria-label="Cerrar (Esc)"
            title="Cerrar (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Success Feedback Toast for Continuous Mode */}
        {successToast && (
          <div className="mb-4 p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-medium">{successToast}</span>
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSave(false);
          }}
          className="space-y-4"
        >
          {/* Selector de Tipo (3 Pestañas: Gasto, Ingreso, Transferir) */}
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#0A1128] rounded-xl border border-[#1E2B4D]">
            <button
              type="button"
              onClick={() => setType('EXPENSE')}
              className={`py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                type === 'EXPENSE'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ArrowDownRight className="w-3.5 h-3.5 text-rose-400" />
              <span>Gasto (-)</span>
            </button>
            <button
              type="button"
              onClick={() => setType('INCOME')}
              className={`py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                type === 'INCOME'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
              <span>Ingreso (+)</span>
            </button>
            <button
              type="button"
              onClick={() => setType('TRANSFER')}
              className={`py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                type === 'TRANSFER'
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ArrowRightLeft className="w-3.5 h-3.5 text-sky-400" />
              <span>Transferir (⇆)</span>
            </button>
          </div>

          {/* Campo Monto & Píldoras de Incremento Rápido */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                Monto ($)
              </label>
              <div className="flex items-center gap-1">
                {[5, 10, 20, 50, 100].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => handleAddAmount(val)}
                    className="px-2 py-0.5 rounded-md bg-[#162347] hover:bg-[#1D2D5A] text-slate-300 text-[10px] font-semibold border border-[#1E2B4D] cursor-pointer tabular-nums transition-colors"
                  >
                    +{val}
                  </button>
                ))}
                {amount && (
                  <button
                    type="button"
                    onClick={() => setAmount('')}
                    className="px-1.5 py-0.5 text-[10px] text-slate-500 hover:text-rose-400 cursor-pointer"
                  >
                    Borrar
                  </button>
                )}
              </div>
            </div>

            <div className="relative">
              <span className="absolute left-4 top-2 text-2xl font-bold text-slate-500 pointer-events-none">$</span>
              <input
                ref={amountInputRef}
                type="number"
                step="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[#0A1128] border border-[#1E2B4D] text-2xl font-bold text-slate-100 focus:outline-none focus:border-emerald-400 tabular-nums transition-colors"
              />
            </div>
          </div>

          {/* Selector de Cuentas */}
          {type === 'TRANSFER' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1.5">
                  Desde (Origen)
                </label>
                <select
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#0A1128] border border-[#1E2B4D] text-slate-100 text-xs focus:outline-none focus:border-emerald-400 cursor-pointer"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id} className="bg-[#101A36]">
                      {a.name} (${Number(a.balance).toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1.5">
                  Hacia (Destino)
                </label>
                <select
                  value={destinationAccountId}
                  onChange={(e) => setDestinationAccountId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#0A1128] border border-[#1E2B4D] text-slate-100 text-xs focus:outline-none focus:border-sky-400 cursor-pointer"
                >
                  {accounts
                    .filter((a) => a.id !== accountId)
                    .map((a) => (
                      <option key={a.id} value={a.id} className="bg-[#101A36]">
                        {a.name} (${Number(a.balance).toFixed(2)})
                      </option>
                    ))}
                </select>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1.5">
                Cuenta
              </label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A1128] border border-[#1E2B4D] text-slate-100 text-xs focus:outline-none focus:border-emerald-400 cursor-pointer transition-colors"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id} className="bg-[#101A36]">
                    {a.name} (${Number(a.balance).toFixed(2)})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Selector Visual de Categorías con Búsqueda (Solo para Gasto/Ingreso) */}
          {type !== 'TRANSFER' && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                  Categoría
                </label>
                {selectedCategoryObj && (
                  <span className="text-xs font-semibold text-emerald-400">
                    {selectedCategoryObj.name}
                  </span>
                )}
              </div>

              {/* Categorías más frecuentes / chips rápidos */}
              <div className="flex flex-wrap gap-1.5 mb-2">
                {categories.slice(0, 6).map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setCategoryId(cat.id);
                      setCategorySearch('');
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer flex items-center gap-1.5 ${
                      categoryId === cat.id
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
                        : 'bg-[#0A1128] text-slate-400 border-[#1E2B4D] hover:bg-[#162347]'
                    }`}
                  >
                    <span>{cat.name}</span>
                  </button>
                ))}
              </div>

              {/* Input buscador con menú desplegable estilizado si se desea buscar otra */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  value={categorySearch}
                  onChange={(e) => setCategorySearch(e.target.value)}
                  placeholder="Buscar otra categoría..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[#0A1128] border border-[#1E2B4D] text-slate-200 text-xs focus:outline-none focus:border-emerald-400"
                />
              </div>

              {categorySearch && (
                <div className="mt-1.5 max-h-36 overflow-y-auto custom-scrollbar p-1 rounded-xl bg-[#0A1128] border border-[#1E2B4D] grid grid-cols-2 gap-1 z-10">
                  {filteredCategories.length === 0 ? (
                    <p className="col-span-2 text-center text-[11px] text-slate-500 py-2">No encontrada</p>
                  ) : (
                    filteredCategories.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setCategoryId(c.id);
                          setCategorySearch('');
                        }}
                        className={`p-2 rounded-lg text-xs text-left transition-colors flex items-center justify-between ${
                          categoryId === c.id
                            ? 'bg-emerald-500/20 text-emerald-300 font-bold'
                            : 'hover:bg-[#162347] text-slate-300'
                        }`}
                      >
                        <span className="truncate">{c.name}</span>
                        {categoryId === c.id && <Check className="w-3 h-3 text-emerald-400" />}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {/* Selector de Fecha Rápida */}
          <div>
            <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1.5">
              Fecha
            </label>
            <div className="flex items-center gap-2">
              <div className="grid grid-cols-3 gap-1.5 flex-1">
                <button
                  type="button"
                  onClick={() => setDateMode('today')}
                  className={`py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                    dateMode === 'today'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-semibold'
                      : 'bg-[#0A1128] text-slate-400 border-[#1E2B4D] hover:bg-[#162347]'
                  }`}
                >
                  Hoy
                </button>
                <button
                  type="button"
                  onClick={() => setDateMode('yesterday')}
                  className={`py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                    dateMode === 'yesterday'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-semibold'
                      : 'bg-[#0A1128] text-slate-400 border-[#1E2B4D] hover:bg-[#162347]'
                  }`}
                >
                  Ayer
                </button>
                <button
                  type="button"
                  onClick={() => setDateMode('custom')}
                  className={`py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                    dateMode === 'custom'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-semibold'
                      : 'bg-[#0A1128] text-slate-400 border-[#1E2B4D] hover:bg-[#162347]'
                  }`}
                >
                  Otra Fecha
                </button>
              </div>

              {dateMode === 'custom' && (
                <input
                  type="date"
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg bg-[#0A1128] border border-[#1E2B4D] text-slate-100 text-xs focus:outline-none focus:border-emerald-400"
                />
              )}
            </div>
          </div>

          {/* Descripción / Detalle */}
          <div>
            <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1.5">
              Descripción o Detalle (Opcional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ej. Almuerzo de trabajo, Gasolina, Supermercado"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A1128] border border-[#1E2B4D] text-slate-100 text-xs focus:outline-none focus:border-emerald-400 transition-colors"
            />
          </div>

          {/* Acciones del Modal con Modo Continuo */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-[#1E2B4D]">
            <div className="hidden sm:flex items-center text-[10px] text-slate-500 gap-2">
              <span>↵ Guardar</span>
              <span>•</span>
              <span>⌘↵ Guardar y seguir</span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-2 rounded-xl bg-[#162347] text-slate-300 text-xs font-medium hover:bg-[#1D2D5A] hover:text-slate-100 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={submitting || !amount || parseFloat(amount) <= 0}
                onClick={() => handleSave(true)}
                className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-[#162347] hover:bg-[#1D2D5A] text-emerald-300 border border-emerald-500/30 text-xs font-semibold shadow-sm transition-all cursor-pointer disabled:opacity-40 flex items-center justify-center gap-1.5"
                title="Guarda este movimiento y deja listo el formulario para registrar el siguiente"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Guardar y añadir otro</span>
              </button>
              <button
                type="submit"
                disabled={submitting || !amount || parseFloat(amount) <= 0}
                className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer disabled:opacity-40"
              >
                {submitting ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
