'use client';

import React, { useState } from 'react';
import { X, Building2, Briefcase, Calendar, Sparkles } from 'lucide-react';

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
  const [currency] = useState('USD');

  // Configuración de Nómina
  const [payrollAmount, setPayrollAmount] = useState('');
  const [payrollFrequency, setPayrollFrequency] = useState<'MONTHLY' | 'BIWEEKLY'>('BIWEEKLY');
  const [payrollDay1, setPayrollDay1] = useState('15');
  const [payrollDay2, setPayrollDay2] = useState('30');
  const [payrollAutoDeposit, setPayrollAutoDeposit] = useState(true);

  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    try {
      const isPayroll = type === 'PAYROLL';
      const parsedPayrollAmount = parseFloat(payrollAmount);

      await onSubmit({
        name: name.trim(),
        type,
        balance: parseFloat(balance) || 0,
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
      });

      setName('');
      setBalance('0');
      setPayrollAmount('');
      setType('BANK_ACCOUNT');
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#0A1128]/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="mint-card w-full max-w-lg p-6 relative border border-[#1E2B4D] shadow-2xl animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5 pb-3 border-b border-[#1E2B4D]">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-slate-100">Nueva Cuenta Financiera</h3>
          </div>
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
              Tipo de Cuenta
            </label>
            <select
              value={type}
              onChange={(e) => {
                setType(e.target.value);
                if (e.target.value === 'PAYROLL' && !name) {
                  setName('Cuenta de Nómina');
                }
              }}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A1128] border border-[#1E2B4D] text-slate-100 text-sm focus:outline-none focus:border-emerald-400 cursor-pointer transition-colors"
            >
              <option value="BANK_ACCOUNT" className="bg-[#101A36]">🏦 Cuenta Bancaria Corriente / Débito</option>
              <option value="PAYROLL" className="bg-[#101A36]">💼 Cuenta de Nómina (Ingreso Automático)</option>
              <option value="CASH" className="bg-[#101A36]">💵 Efectivo</option>
              <option value="CREDIT_CARD" className="bg-[#101A36]">💳 Tarjeta de Crédito</option>
              <option value="SAVINGS" className="bg-[#101A36]">🐷 Cuenta de Ahorros</option>
              <option value="INVESTMENT" className="bg-[#101A36]">📈 Inversión / Otros</option>
            </select>
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
              placeholder="Ej. Nómina Santander, Banco Principal, Efectivo"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A1128] border border-[#1E2B4D] text-slate-100 text-sm focus:outline-none focus:border-emerald-400 transition-colors"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1.5">
              Saldo Inicial ($)
            </label>
            <input
              type="number"
              step="0.01"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              placeholder="0.00"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A1128] border border-[#1E2B4D] text-slate-100 text-sm focus:outline-none focus:border-emerald-400 tabular-nums transition-colors"
            />
          </div>

          {/* Configuración específica de Cuenta de Nómina */}
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
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              {submitting ? 'Creando...' : 'Crear Cuenta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
