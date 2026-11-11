'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Building2,
  Briefcase,
  Check,
  Trash2,
  CreditCard,
  Target,
  Clock,
  Calendar,
  Bell,
  TrendingDown,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';

interface EditAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  account: any | null;
  onConfirm: (accountId: string, data: any) => Promise<void>;
  onDelete?: (accountId: string) => Promise<void>;
}

export default function EditAccountModal({
  isOpen,
  onClose,
  account,
  onConfirm,
  onDelete,
}: EditAccountModalProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState('BANK_ACCOUNT');
  const [currency, setCurrency] = useState('USD');

  // Configuración de Nómina
  const [payrollAmount, setPayrollAmount] = useState('');
  const [payrollFrequency, setPayrollFrequency] = useState<'MONTHLY' | 'BIWEEKLY'>('BIWEEKLY');
  const [payrollDay1, setPayrollDay1] = useState('15');
  const [payrollDay2, setPayrollDay2] = useState('30');
  const [payrollAutoDeposit, setPayrollAutoDeposit] = useState(true);

  // Configuración de Tarjeta de Crédito y Compromiso Vinculado
  const [debtTotalAmount, setDebtTotalAmount] = useState('');
  const [debtRemainingAmount, setDebtRemainingAmount] = useState('');
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

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (account) {
      setName(account.name || '');
      setType(account.type || 'BANK_ACCOUNT');
      setCurrency(account.currency || 'USD');
      setPayrollAmount(account.payrollAmount ? account.payrollAmount.toString() : '');
      setPayrollFrequency(account.payrollFrequency || 'BIWEEKLY');
      setPayrollDay1(account.payrollDay1 ? account.payrollDay1.toString() : '15');
      setPayrollDay2(account.payrollDay2 ? account.payrollDay2.toString() : '30');
      setPayrollAutoDeposit(account.payrollAutoDeposit ?? true);

      // Cargar datos de la deuda vinculada si existen
      const linkedDebt = account.debts && account.debts.length > 0 ? account.debts[0] : null;
      if (linkedDebt) {
        setDebtTotalAmount(linkedDebt.totalAmount != null ? linkedDebt.totalAmount.toString() : '');
        setDebtRemainingAmount(linkedDebt.remainingAmount != null ? linkedDebt.remainingAmount.toString() : '');
        setDebtInterestRate(linkedDebt.interestRate != null ? linkedDebt.interestRate.toString() : '0');
        setDebtCutoffDay(linkedDebt.cutoffDay != null ? linkedDebt.cutoffDay.toString() : '');
        setDebtPaymentDueDay(linkedDebt.paymentDueDay != null ? linkedDebt.paymentDueDay.toString() : '');
        setDebtMinimumPayment(linkedDebt.minimumPayment != null ? linkedDebt.minimumPayment.toString() : '');
        setDebtMitigationStrategy(linkedDebt.mitigationStrategy || 'CUSTOM');
        if (linkedDebt.targetPayoffDate) {
          const d = new Date(linkedDebt.targetPayoffDate);
          setDebtTargetPayoffDate(d.toISOString().split('T')[0]);
        } else {
          setDebtTargetPayoffDate('');
        }
        setDebtMonthlyTargetPayment(
          linkedDebt.monthlyTargetPayment != null ? linkedDebt.monthlyTargetPayment.toString() : '',
        );
        setDebtAlertDaysBefore(
          linkedDebt.alertDaysBefore != null ? linkedDebt.alertDaysBefore.toString() : '3',
        );
        setDebtAutoAlert(linkedDebt.autoAlert !== false);
        setDebtNotes(linkedDebt.notes || '');
      } else {
        setDebtTotalAmount('');
        setDebtRemainingAmount('');
        setDebtInterestRate('0');
        setDebtCutoffDay('');
        setDebtPaymentDueDay('');
        setDebtMinimumPayment('');
        setDebtMitigationStrategy('CUSTOM');
        setDebtTargetPayoffDate('');
        setDebtMonthlyTargetPayment('');
        setDebtAlertDaysBefore('3');
        setDebtAutoAlert(true);
        setDebtNotes('');
      }

      setError(null);
    }
  }, [account]);

  if (!isOpen || !account) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('El nombre de la cuenta es requerido.');
      return;
    }

    const isCreditCard = type === 'CREDIT_CARD';
    const isPayroll = type === 'PAYROLL';

    if (isCreditCard) {
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

    setLoading(true);
    setError(null);
    try {
      const parsedAmount = parseFloat(payrollAmount);

      const payload: any = {
        name: name.trim(),
        type,
        currency,
      };

      if (isPayroll) {
        payload.payrollAmount = !isNaN(parsedAmount) && parsedAmount > 0 ? parsedAmount : null;
        payload.payrollFrequency = payrollFrequency;
        payload.payrollDay1 = parseInt(payrollDay1) || 15;
        payload.payrollDay2 = payrollFrequency === 'BIWEEKLY' ? parseInt(payrollDay2) || 30 : null;
        payload.payrollAutoDeposit = payrollAutoDeposit;
      } else {
        payload.payrollAmount = null;
        payload.payrollAutoDeposit = false;
      }

      if (isCreditCard) {
        payload.debtTotalAmount = debtTotalAmount ? parseFloat(debtTotalAmount) : undefined;
        payload.debtRemainingAmount = debtRemainingAmount ? parseFloat(debtRemainingAmount) : undefined;
        payload.debtInterestRate = debtInterestRate ? parseFloat(debtInterestRate) : 0;
        payload.debtCutoffDay = debtCutoffDay ? parseInt(debtCutoffDay, 10) : undefined;
        payload.debtPaymentDueDay = debtPaymentDueDay ? parseInt(debtPaymentDueDay, 10) : undefined;
        payload.debtMinimumPayment = debtMinimumPayment ? parseFloat(debtMinimumPayment) : undefined;
        payload.debtMitigationStrategy = debtMitigationStrategy;
        payload.debtTargetPayoffDate = debtTargetPayoffDate || undefined;
        payload.debtMonthlyTargetPayment = debtMonthlyTargetPayment ? parseFloat(debtMonthlyTargetPayment) : undefined;
        payload.debtAlertDaysBefore = parseInt(debtAlertDaysBefore, 10) || 3;
        payload.debtAutoAlert = debtAutoAlert;
        payload.debtNotes = debtNotes.trim() || undefined;
      }

      await onConfirm(account.id, payload);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Error al actualizar la cuenta.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    if (!confirm(`¿Eliminar la cuenta "${account.name}"? Los movimientos asociados permanecerán en el historial.`)) {
      return;
    }
    setLoading(true);
    try {
      await onDelete(account.id);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Error al eliminar la cuenta.');
      setLoading(false);
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
            <h3 className="text-base font-bold text-slate-100">Configurar Cuenta</h3>
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
          {/* Tarjeta informativa de saldo actual */}
          <div className="p-3.5 rounded-xl bg-[#0A1128] border border-[#1E2B4D] flex items-center justify-between">
            <div>
              <p className="text-[11px] text-slate-400">
                {type === 'CREDIT_CARD' ? 'Saldo contable actual (Pasivo)' : 'Saldo actual registrado'}
              </p>
              <p className={`text-lg font-bold tabular-nums ${Number(account.balance) < 0 ? 'text-rose-400' : 'text-slate-100'}`}>
                ${Number(account.balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
            </div>
            {account.lastPayrollDeposit && (
              <div className="text-right">
                <span className="text-[10px] text-slate-500 block">Último abono de nómina</span>
                <span className="text-xs text-emerald-400 font-semibold tabular-nums">
                  {new Date(account.lastPayrollDeposit).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1.5">
              Nombre de la Cuenta
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Nómina Principal, Santander"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A1128] border border-[#1E2B4D] text-slate-100 text-sm focus:outline-none focus:border-emerald-400 transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1.5">
                Tipo de Cuenta
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A1128] border border-[#1E2B4D] text-slate-100 text-sm focus:outline-none focus:border-emerald-400 cursor-pointer transition-colors"
              >
                <option value="BANK_ACCOUNT" className="bg-[#101A36]">🏦 Bancaria / Débito</option>
                <option value="CREDIT_CARD" className="bg-[#101A36]">💳 Tarjeta de Crédito (Deuda Vinculada)</option>
                <option value="PAYROLL" className="bg-[#101A36]">💼 Nómina (Auto)</option>
                <option value="CASH" className="bg-[#101A36]">💵 Efectivo</option>
                <option value="SAVINGS" className="bg-[#101A36]">🐷 Ahorros</option>
                <option value="INVESTMENT" className="bg-[#101A36]">📈 Inversión / Otros</option>
              </select>
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

          {/* Configuración de Tarjeta de Crédito vinculada */}
          {type === 'CREDIT_CARD' && (
            <div className="p-4 rounded-2xl bg-[#0A1128] border border-amber-500/30 space-y-3.5 relative overflow-hidden">
              <div className="flex items-center justify-between pb-2 border-b border-[#1E2B4D]">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-slate-100">
                    Datos del Compromiso y Deuda Vinculada
                  </span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  Sincronizado
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 uppercase tracking-wider mb-1">
                    Límite Total de Crédito ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={debtTotalAmount}
                    onChange={(e) => setDebtTotalAmount(e.target.value)}
                    placeholder="Ej. 50000.00"
                    className="w-full px-3 py-1.5 rounded-xl bg-[#101A36] border border-[#1E2B4D] text-slate-100 text-xs focus:outline-none focus:border-amber-400 tabular-nums font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 uppercase tracking-wider mb-1">
                    Tasa de Interés Anual (% APR)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={debtInterestRate}
                    onChange={(e) => setDebtInterestRate(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-1.5 rounded-xl bg-[#101A36] border border-[#1E2B4D] text-slate-100 text-xs focus:outline-none focus:border-amber-400 tabular-nums"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                    placeholder="15"
                    className="w-full px-3 py-1.5 rounded-xl bg-[#101A36] border border-[#1E2B4D] text-slate-100 text-xs focus:outline-none focus:border-amber-400 tabular-nums font-semibold"
                  />
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
                    placeholder="5"
                    className="w-full px-3 py-1.5 rounded-xl bg-[#101A36] border border-[#1E2B4D] text-slate-100 text-xs focus:outline-none focus:border-amber-400 tabular-nums font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-300 uppercase tracking-wider mb-1">
                  Pago Mínimo Estimado ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={debtMinimumPayment}
                  onChange={(e) => setDebtMinimumPayment(e.target.value)}
                  placeholder="1500.00"
                  className="w-full px-3 py-1.5 rounded-xl bg-[#101A36] border border-[#1E2B4D] text-slate-100 text-xs focus:outline-none focus:border-amber-400 tabular-nums"
                />
              </div>

              <div className="pt-2 border-t border-[#1E2B4D] flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={debtAutoAlert}
                    onChange={(e) => setDebtAutoAlert(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 bg-[#101A36] border-[#1E2B4D] focus:ring-0 cursor-pointer"
                  />
                  <span className="text-xs text-slate-200 font-medium flex items-center gap-1.5">
                    <Bell className="w-3.5 h-3.5 text-amber-400" />
                    Recordatorio automático en calendario
                  </span>
                </label>
                {debtAutoAlert && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-slate-400">Avisar</span>
                    <input
                      type="number"
                      min="1"
                      max="15"
                      value={debtAlertDaysBefore}
                      onChange={(e) => setDebtAlertDaysBefore(e.target.value)}
                      className="w-12 px-2 py-0.5 rounded-lg bg-[#101A36] border border-[#1E2B4D] text-center text-xs text-slate-100 tabular-nums"
                    />
                    <span className="text-[11px] text-slate-400">días antes</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Configuración de Nómina si es tipo PAYROLL */}
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

          <div className="flex items-center justify-between pt-3 border-t border-[#1E2B4D]">
            {onDelete && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                className="px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                Eliminar
              </button>
            )}

            <div className="flex items-center space-x-3 ml-auto">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 rounded-xl bg-[#162347] text-slate-300 text-xs font-medium hover:bg-[#1D2D5A] hover:text-slate-100 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                {loading ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
