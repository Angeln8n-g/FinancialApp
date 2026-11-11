'use client';

import React, { useState } from 'react';
import {
  X,
  Building2,
  Briefcase,
  Calendar,
  Sparkles,
  CreditCard,
  Target,
  AlertTriangle,
  Bell,
  Clock,
  TrendingDown,
  ShieldCheck,
} from 'lucide-react';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    type: string;
    balance: number;
    currency: string;
    payrollAmount?: number;
    payrollFrequency?: 'MONTHLY' | 'BIWEEKLY';
    payrollDay1?: number;
    payrollDay2?: number;
    payrollAutoDeposit?: boolean;
    // Campos de Tarjeta de Crédito y Deuda Vinculada
    debtTotalAmount?: number;
    debtRemainingAmount?: number;
    debtInterestRate?: number;
    debtCutoffDay?: number;
    debtPaymentDueDay?: number;
    debtMinimumPayment?: number;
    debtMitigationStrategy?: 'AVALANCHE' | 'SNOWBALL' | 'CUSTOM';
    debtTargetPayoffDate?: string;
    debtMonthlyTargetPayment?: number;
    debtAlertDaysBefore?: number;
    debtAutoAlert?: boolean;
    debtNotes?: string;
  }) => Promise<void>;
}

export default function AccountModal({
  isOpen,
  onClose,
  onSubmit,
}: AccountModalProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState('BANK_ACCOUNT');
  const [balance, setBalance] = useState('0');
  const [currency, setCurrency] = useState('USD');

  // Configuración de Nómina
  const [payrollAmount, setPayrollAmount] = useState('');
  const [payrollFrequency, setPayrollFrequency] = useState<'MONTHLY' | 'BIWEEKLY'>('BIWEEKLY');
  const [payrollDay1, setPayrollDay1] = useState('15');
  const [payrollDay2, setPayrollDay2] = useState('30');
  const [payrollAutoDeposit, setPayrollAutoDeposit] = useState(true);

  // Configuración de Tarjeta de Crédito y Compromiso / Deuda
  const [debtTotalAmount, setDebtTotalAmount] = useState('');
  const [debtRemainingAmount, setDebtRemainingAmount] = useState('0');
  const [debtInterestRate, setDebtInterestRate] = useState('0');
  const [debtCutoffDay, setDebtCutoffDay] = useState('');
  const [debtPaymentDueDay, setDebtPaymentDueDay] = useState('');
  const [debtMinimumPayment, setDebtMinimumPayment] = useState('');
  const [debtMitigationStrategy, setDebtMitigationStrategy] = useState<'AVALANCHE' | 'SNOWBALL' | 'CUSTOM'>('CUSTOM');
  const [debtTargetPayoffDate, setDebtTargetPayoffDate] = useState('');
  const [debtMonthlyTargetPayment, setDebtMonthlyTargetPayment] = useState('');
  const [debtAlertDaysBefore, setDebtAlertDaysBefore] = useState('3');
  const [debtAutoAlert, setDebtAutoAlert] = useState(true);
  const [debtNotes, setDebtNotes] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Cálculo en tiempo real de sugerencia mensual si se define fecha meta para la tarjeta
  const parsedRemaining = parseFloat(debtRemainingAmount) || parseFloat(balance) || 0;
  let suggestedMonthly: number | null = null;
  if (debtTargetPayoffDate && parsedRemaining > 0) {
    const targetDate = new Date(debtTargetPayoffDate);
    const now = new Date();
    const diffDays = Math.ceil((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays > 0) {
      const months = Math.max(1, Math.ceil(diffDays / 30.4375));
      suggestedMonthly = Math.round((parsedRemaining / months) * 100) / 100;
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('El nombre de la cuenta es requerido.');
      return;
    }

    const isCreditCard = type === 'CREDIT_CARD';
    const isPayroll = type === 'PAYROLL';

    if (isCreditCard) {
      const total = parseFloat(debtTotalAmount);
      if (isNaN(total) || total <= 0) {
        setError('Para una tarjeta de crédito, debes indicar el Límite Total de Crédito (mayor a 0).');
        return;
      }

      const cDay = parseInt(debtCutoffDay, 10);
      if (debtCutoffDay.trim() && (isNaN(cDay) || cDay < 1 || cDay > 31)) {
        setError('El día de corte debe ser un número entre 1 y 31.');
        return;
      }

      const pDay = parseInt(debtPaymentDueDay, 10);
      if (debtPaymentDueDay.trim() && (isNaN(pDay) || pDay < 1 || pDay > 31)) {
        setError('El día límite de pago debe ser un número entre 1 y 31.');
        return;
      }
    }

    setError(null);
    setSubmitting(true);
    try {
      const parsedPayrollAmount = parseFloat(payrollAmount);
      const parsedRemainingAmount = isCreditCard
        ? (parseFloat(debtRemainingAmount) || 0)
        : (parseFloat(balance) || 0);

      await onSubmit({
        name: name.trim(),
        type,
        balance: isCreditCard ? (parsedRemainingAmount > 0 ? -Math.abs(parsedRemainingAmount) : 0) : (parseFloat(balance) || 0),
        currency,
        ...(isPayroll && !isNaN(parsedPayrollAmount) && parsedPayrollAmount > 0
          ? {
              payrollAmount: parsedPayrollAmount,
              payrollFrequency,
              payrollDay1: parseInt(payrollDay1) || 15,
              payrollDay2: payrollFrequency === 'BIWEEKLY' ? parseInt(payrollDay2) || 30 : undefined,
              payrollAutoDeposit,
            }
          : {}),
        ...(isCreditCard
          ? {
              debtTotalAmount: parseFloat(debtTotalAmount) || 0,
              debtRemainingAmount: parsedRemainingAmount,
              debtInterestRate: parseFloat(debtInterestRate) || 0,
              debtCutoffDay: debtCutoffDay ? parseInt(debtCutoffDay, 10) : undefined,
              debtPaymentDueDay: debtPaymentDueDay ? parseInt(debtPaymentDueDay, 10) : undefined,
              debtMinimumPayment: debtMinimumPayment ? parseFloat(debtMinimumPayment) : undefined,
              debtMitigationStrategy,
              debtTargetPayoffDate: debtTargetPayoffDate || undefined,
              debtMonthlyTargetPayment: debtMonthlyTargetPayment
                ? parseFloat(debtMonthlyTargetPayment)
                : suggestedMonthly || undefined,
              debtAlertDaysBefore: parseInt(debtAlertDaysBefore, 10) || 3,
              debtAutoAlert,
              debtNotes: debtNotes.trim() || undefined,
            }
          : {}),
      });

      // Reset
      setName('');
      setBalance('0');
      setPayrollAmount('');
      setDebtTotalAmount('');
      setDebtRemainingAmount('0');
      setDebtInterestRate('0');
      setDebtCutoffDay('');
      setDebtPaymentDueDay('');
      setDebtMinimumPayment('');
      setDebtTargetPayoffDate('');
      setDebtMonthlyTargetPayment('');
      setDebtNotes('');
      setType('BANK_ACCOUNT');
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Error al crear la cuenta.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#0A1128]/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="mint-card w-full max-w-xl p-6 relative border border-[#1E2B4D] shadow-2xl animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto custom-scrollbar">
        <div className="flex items-center justify-between mb-5 pb-3 border-b border-[#1E2B4D]">
          <div className="flex items-center gap-2">
            {type === 'CREDIT_CARD' ? (
              <CreditCard className="w-5 h-5 text-amber-400" />
            ) : type === 'PAYROLL' ? (
              <Briefcase className="w-5 h-5 text-emerald-400" />
            ) : (
              <Building2 className="w-5 h-5 text-emerald-400" />
            )}
            <div>
              <h3 className="text-base font-bold text-slate-100">
                {type === 'CREDIT_CARD' ? 'Nueva Tarjeta de Crédito (Compromiso Vinculado)' : 'Nueva Cuenta Financiera'}
              </h3>
              <p className="text-[11px] text-slate-400">
                {type === 'CREDIT_CARD'
                  ? 'Registra la tarjeta y enlaza automáticamente todos los datos de deuda y fechas de pago'
                  : 'Configura tus cuentas bancarias, nómina, efectivo o ahorros'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-[#162347] transition-colors cursor-pointer"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1.5">
              Tipo de Cuenta
            </label>
            <select
              value={type}
              onChange={(e) => {
                const newType = e.target.value;
                setType(newType);
                if (newType === 'PAYROLL' && !name) {
                  setName('Cuenta de Nómina');
                } else if (newType === 'CREDIT_CARD' && !name) {
                  setName('Tarjeta de Crédito');
                }
              }}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A1128] border border-[#1E2B4D] text-slate-100 text-sm focus:outline-none focus:border-emerald-400 cursor-pointer transition-colors"
            >
              <option value="BANK_ACCOUNT" className="bg-[#101A36]">🏦 Cuenta Bancaria Corriente / Débito</option>
              <option value="CREDIT_CARD" className="bg-[#101A36]">💳 Tarjeta de Crédito (Vinculada como Deuda)</option>
              <option value="PAYROLL" className="bg-[#101A36]">💼 Cuenta de Nómina (Ingreso Automático)</option>
              <option value="CASH" className="bg-[#101A36]">💵 Efectivo / Caja</option>
              <option value="SAVINGS" className="bg-[#101A36]">🐷 Cuenta de Ahorros</option>
              <option value="INVESTMENT" className="bg-[#101A36]">📈 Inversión / Otros</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1.5">
              Nombre de la {type === 'CREDIT_CARD' ? 'Tarjeta / Entidad Emisora' : 'Cuenta'}
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={
                type === 'CREDIT_CARD'
                  ? 'Ej. Visa Platinum Banreservas, Amex Oro, Mastercard Scotia'
                  : 'Ej. Nómina Santander, Banco Principal, Efectivo'
              }
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A1128] border border-[#1E2B4D] text-slate-100 text-sm focus:outline-none focus:border-emerald-400 transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1.5">
                {type === 'CREDIT_CARD' ? 'Saldo Actual Adeudado / Utilizado ($)' : 'Saldo Inicial ($)'}
              </label>
              <input
                type="number"
                step="0.01"
                value={type === 'CREDIT_CARD' ? debtRemainingAmount : balance}
                onChange={(e) => {
                  if (type === 'CREDIT_CARD') {
                    setDebtRemainingAmount(e.target.value);
                    setBalance(e.target.value);
                  } else {
                    setBalance(e.target.value);
                  }
                }}
                placeholder="0.00"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A1128] border border-[#1E2B4D] text-slate-100 text-sm focus:outline-none focus:border-emerald-400 tabular-nums transition-colors"
              />
              {type === 'CREDIT_CARD' && (
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Ingresa 0 si la tarjeta está en cero o el saldo al corte pendiente
                </span>
              )}
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1.5">
                Moneda
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A1128] border border-[#1E2B4D] text-slate-100 text-sm focus:outline-none focus:border-emerald-400 cursor-pointer transition-colors"
              >
                <option value="USD">🇺🇸 USD ($ Dólar)</option>
                <option value="EUR">🇪🇺 EUR (€ Euro)</option>
                <option value="DOP">🇩🇴 DOP (RD$ Peso Dom.)</option>
                <option value="MXN">🇲🇽 MXN ($ Peso Mex.)</option>
                <option value="COP">🇨🇴 COP ($ Peso Col.)</option>
                <option value="ARS">🇦🇷 ARS ($ Peso Arg.)</option>
                <option value="CLP">🇨🇱 CLP ($ Peso Ch.)</option>
                <option value="PEN">🇵🇪 PEN (S/ Sol)</option>
                <option value="GBP">🇬🇧 GBP (£ Libra)</option>
                <option value="BRL">🇧🇷 BRL (R$ Real)</option>
                <option value="USDT">🪙 USDT (Tether)</option>
              </select>
            </div>
          </div>

          {/* ============================================================== */}
          {/* SECCIÓN COMPLETA DE DEUDA Y COMPROMISOS (TARJETA DE CRÉDITO)   */}
          {/* ============================================================== */}
          {type === 'CREDIT_CARD' && (
            <div className="p-4 rounded-2xl bg-[#0A1128] border border-amber-500/30 space-y-4 relative overflow-hidden shadow-inner">
              <div className="flex items-center justify-between pb-3 border-b border-[#1E2B4D]">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-slate-100">
                    Condiciones de Deuda y Compromiso de Tarjeta
                  </span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  Compromiso Vinculado
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-200/90 leading-relaxed">
                Esta tarjeta se registrará como cuenta financiera y se sincronizará automáticamente como un compromiso en el módulo de <strong>Compromisos y Deudas</strong> para vigilar fechas de corte, límites de pago y evitar cargos por mora.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 uppercase tracking-wider mb-1">
                    Límite Total de Crédito ($) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    value={debtTotalAmount}
                    onChange={(e) => setDebtTotalAmount(e.target.value)}
                    placeholder="Ej. 50000.00"
                    className="w-full px-3 py-2 rounded-xl bg-[#101A36] border border-[#1E2B4D] text-slate-100 text-xs focus:outline-none focus:border-amber-400 tabular-nums font-semibold"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">Límite asignado por el banco</span>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-300 uppercase tracking-wider mb-1">
                    Tasa de Interés Anual (% APR)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={debtInterestRate}
                    onChange={(e) => setDebtInterestRate(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 rounded-xl bg-[#101A36] border border-[#1E2B4D] text-slate-100 text-xs focus:outline-none focus:border-amber-400 tabular-nums"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">Ej. 28% anual de financiamiento</span>
                </div>
              </div>

              {/* Fechas de Corte y Límite de Pago */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-sky-400" />
                    Día de Corte Mensual (1 - 31)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={debtCutoffDay}
                    onChange={(e) => setDebtCutoffDay(e.target.value)}
                    placeholder="Ej. 15"
                    className="w-full px-3 py-2 rounded-xl bg-[#101A36] border border-[#1E2B4D] text-slate-100 text-xs focus:outline-none focus:border-amber-400 tabular-nums font-semibold"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">Cierre de facturación de cada mes</span>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-rose-400" />
                    Día Límite de Pago (1 - 31)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={debtPaymentDueDay}
                    onChange={(e) => setDebtPaymentDueDay(e.target.value)}
                    placeholder="Ej. 5"
                    className="w-full px-3 py-2 rounded-xl bg-[#101A36] border border-[#1E2B4D] text-slate-100 text-xs focus:outline-none focus:border-amber-400 tabular-nums font-semibold"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">Fecha máxima sin cargos ni mora</span>
                </div>
              </div>

              {/* Pago Mínimo Regular */}
              <div>
                <label className="block text-[11px] font-medium text-slate-300 uppercase tracking-wider mb-1">
                  Pago Mínimo Estimado / Cuota Regular ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={debtMinimumPayment}
                  onChange={(e) => setDebtMinimumPayment(e.target.value)}
                  placeholder="Ej. 1500.00"
                  className="w-full px-3 py-2 rounded-xl bg-[#101A36] border border-[#1E2B4D] text-slate-100 text-xs focus:outline-none focus:border-amber-400 tabular-nums"
                />
              </div>

              {/* Estrategia de Desendeudamiento */}
              <div>
                <label className="block text-[11px] font-medium text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <TrendingDown className="w-3.5 h-3.5 text-amber-400" />
                  Estrategia de Mitigación / Amortización
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setDebtMitigationStrategy('AVALANCHE')}
                    className={`py-2 px-2 rounded-xl border text-[11px] font-semibold transition-all cursor-pointer text-center ${
                      debtMitigationStrategy === 'AVALANCHE'
                        ? 'bg-amber-500/25 text-amber-300 border-amber-500/50 shadow-sm'
                        : 'bg-[#101A36] text-slate-400 border-[#1E2B4D] hover:bg-[#162347]'
                    }`}
                  >
                    Avalancha (Mayor Interés)
                  </button>
                  <button
                    type="button"
                    onClick={() => setDebtMitigationStrategy('SNOWBALL')}
                    className={`py-2 px-2 rounded-xl border text-[11px] font-semibold transition-all cursor-pointer text-center ${
                      debtMitigationStrategy === 'SNOWBALL'
                        ? 'bg-amber-500/25 text-amber-300 border-amber-500/50 shadow-sm'
                        : 'bg-[#101A36] text-slate-400 border-[#1E2B4D] hover:bg-[#162347]'
                    }`}
                  >
                    Bola de Nieve (Menor Saldo)
                  </button>
                  <button
                    type="button"
                    onClick={() => setDebtMitigationStrategy('CUSTOM')}
                    className={`py-2 px-2 rounded-xl border text-[11px] font-semibold transition-all cursor-pointer text-center ${
                      debtMitigationStrategy === 'CUSTOM'
                        ? 'bg-amber-500/25 text-amber-300 border-amber-500/50 shadow-sm'
                        : 'bg-[#101A36] text-slate-400 border-[#1E2B4D] hover:bg-[#162347]'
                    }`}
                  >
                    Personalizado
                  </button>
                </div>
              </div>

              {/* Plan de Saldo Objetivo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-emerald-400" />
                    Fecha Meta para Saldar
                  </label>
                  <input
                    type="date"
                    value={debtTargetPayoffDate}
                    onChange={(e) => setDebtTargetPayoffDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#101A36] border border-[#1E2B4D] text-slate-100 text-xs focus:outline-none focus:border-amber-400 cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-300 uppercase tracking-wider mb-1">
                    Pago Mensual Proyectado ($)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      value={debtMonthlyTargetPayment || (suggestedMonthly ? suggestedMonthly.toString() : '')}
                      onChange={(e) => setDebtMonthlyTargetPayment(e.target.value)}
                      placeholder={suggestedMonthly ? `${suggestedMonthly}` : '0.00'}
                      className="w-full px-3 py-2 rounded-xl bg-[#101A36] border border-[#1E2B4D] text-slate-100 text-xs focus:outline-none focus:border-amber-400 tabular-nums font-semibold"
                    />
                    {suggestedMonthly && !debtMonthlyTargetPayment && (
                      <span className="absolute right-2 top-2 text-[10px] text-emerald-400 font-medium">
                        Sugerido
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Alertas Automáticas */}
              <div className="pt-2 border-t border-[#1E2B4D] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={debtAutoAlert}
                    onChange={(e) => setDebtAutoAlert(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 bg-[#101A36] border-[#1E2B4D] focus:ring-0 cursor-pointer"
                  />
                  <span className="text-xs text-slate-200 font-medium flex items-center gap-1.5">
                    <Bell className="w-3.5 h-3.5 text-amber-400" />
                    Recordatorio automático en el Calendario
                  </span>
                </label>

                {debtAutoAlert && (
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400">Avisar</span>
                    <input
                      type="number"
                      min="1"
                      max="15"
                      value={debtAlertDaysBefore}
                      onChange={(e) => setDebtAlertDaysBefore(e.target.value)}
                      className="w-14 px-2 py-1 rounded-lg bg-[#101A36] border border-[#1E2B4D] text-center text-xs text-slate-100 tabular-nums"
                    />
                    <span className="text-[11px] text-slate-400">días antes</span>
                  </div>
                )}
              </div>

              {/* Notas */}
              <div>
                <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1">
                  Notas Adicionales / Requisitos
                </label>
                <input
                  type="text"
                  value={debtNotes}
                  onChange={(e) => setDebtNotes(e.target.value)}
                  placeholder="Ej. Beneficio de 3% cashback en gasolina, seguro de viajes, etc."
                  className="w-full px-3 py-2 rounded-xl bg-[#101A36] border border-[#1E2B4D] text-slate-100 text-xs focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* SECCIÓN ESPECÍFICA DE CUENTA DE NÓMINA                        */}
          {/* ============================================================== */}
          {type === 'PAYROLL' && (
            <div className="p-4 rounded-xl bg-[#0A1128] border border-emerald-500/30 space-y-3.5 relative overflow-hidden">
              <div className="flex items-center justify-between pb-2 border-b border-[#1E2B4D]">
                <div className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-slate-100">
                    Configuración de Ingreso de Nómina
                  </span>
                </div>
                <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Automático
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1">
                  Monto Fijo por Pago ($)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 font-bold">
                    $
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={payrollAmount}
                    onChange={(e) => setPayrollAmount(e.target.value)}
                    placeholder="Ej. 1500.00"
                    className="w-full pl-8 pr-3.5 py-2 rounded-xl bg-[#101A36] border border-[#1E2B4D] text-slate-100 font-bold text-sm focus:outline-none focus:border-emerald-400 tabular-nums transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1.5">
                  Frecuencia de Cobro
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPayrollFrequency('BIWEEKLY')}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                      payrollFrequency === 'BIWEEKLY'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
                        : 'bg-[#101A36] text-slate-400 border-[#1E2B4D] hover:bg-[#162347]'
                    }`}
                  >
                    Quincenal (2 pagos/mes)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayrollFrequency('MONTHLY')}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                      payrollFrequency === 'MONTHLY'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
                        : 'bg-[#101A36] text-slate-400 border-[#1E2B4D] hover:bg-[#162347]'
                    }`}
                  >
                    Mensual (1 pago/mes)
                  </button>
                </div>
              </div>

              {payrollFrequency === 'BIWEEKLY' ? (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1">
                      1er Pago (Día del mes)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="15"
                      value={payrollDay1}
                      onChange={(e) => setPayrollDay1(e.target.value)}
                      placeholder="15"
                      className="w-full px-3 py-1.5 rounded-xl bg-[#101A36] border border-[#1E2B4D] text-slate-100 text-xs focus:outline-none focus:border-emerald-400 tabular-nums"
                    />
                    <span className="text-[10px] text-slate-500 mt-0.5 block">Ej. Día 15</span>
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1">
                      2do Pago (Día del mes)
                    </label>
                    <input
                      type="number"
                      min="16"
                      max="31"
                      value={payrollDay2}
                      onChange={(e) => setPayrollDay2(e.target.value)}
                      placeholder="30"
                      className="w-full px-3 py-1.5 rounded-xl bg-[#101A36] border border-[#1E2B4D] text-slate-100 text-xs focus:outline-none focus:border-emerald-400 tabular-nums"
                    />
                    <span className="text-[10px] text-slate-500 mt-0.5 block">Ej. Día 30 o fin de mes</span>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1">
                    Día de Pago del Mes
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={payrollDay1}
                    onChange={(e) => setPayrollDay1(e.target.value)}
                    placeholder="30"
                    className="w-full px-3 py-1.5 rounded-xl bg-[#101A36] border border-[#1E2B4D] text-slate-100 text-xs focus:outline-none focus:border-emerald-400 tabular-nums"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    Ej. Día 1, 15, 28, o 30 (se ajusta al último día en meses cortos)
                  </span>
                </div>
              )}

              <label className="flex items-center gap-2 pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={payrollAutoDeposit}
                  onChange={(e) => setPayrollAutoDeposit(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-500 bg-[#101A36] border-[#1E2B4D] focus:ring-0 cursor-pointer"
                />
                <span className="text-xs text-slate-300 font-medium">
                  Acreditar ingreso automáticamente en las fechas fijadas
                </span>
              </label>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-3 border-t border-[#1E2B4D]">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 rounded-xl bg-[#162347] text-slate-300 text-xs font-medium hover:bg-[#1D2D5A] hover:text-slate-100 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={`px-5 py-2 rounded-xl text-white text-xs font-semibold shadow-sm transition-all cursor-pointer disabled:opacity-50 ${
                type === 'CREDIT_CARD'
                  ? 'bg-amber-600 hover:bg-amber-500'
                  : 'bg-emerald-600 hover:bg-emerald-500'
              }`}
            >
              {submitting ? 'Guardando...' : type === 'CREDIT_CARD' ? 'Crear Tarjeta y Vincular Deuda' : 'Crear Cuenta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
