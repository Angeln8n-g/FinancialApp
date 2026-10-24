'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import {
  Calendar,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  ArrowDownRight,
  ArrowUpRight,
  Landmark,
  X,
  CheckCircle2,
  Clock
} from 'lucide-react';

export default function CalendarPage() {
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [household, setHousehold] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const now = new Date();
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(now.getMonth()); // 0-indexed

  const [transactions, setTransactions] = useState<any[]>([]);
  const [reminders, setReminders] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState('ALL');

  // Modal Detalle Día
  const [selectedDayNumber, setSelectedDayNumber] = useState<number | null>(null);
  const [showDayModal, setShowDayModal] = useState(false);

  // Modal Registrar Movimiento en Fecha
  const [showAddTxModal, setShowAddTxModal] = useState(false);
  const [addTxType, setAddTxType] = useState<'EXPENSE' | 'INCOME'>('EXPENSE');
  const [addTxAmount, setAddTxAmount] = useState('');
  const [addTxDesc, setAddTxDesc] = useState('');
  const [addTxAccountId, setAddTxAccountId] = useState('');
  const [addTxCategoryId, setAddTxCategoryId] = useState('');

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  const getToken = () => typeof window !== 'undefined' ? localStorage.getItem('hogariq_token') : null;

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const daysOfWeek = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  const fetchData = async () => {
    const token = getToken();
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [resTx, resRem, resAcc, resCat] = await Promise.all([
        fetch(`${API_URL}/api/transactions`, { headers }),
        fetch(`${API_URL}/api/reminders`, { headers }),
        fetch(`${API_URL}/api/accounts`, { headers }),
        fetch(`${API_URL}/api/categories`, { headers }),
      ]);

      if (resTx.ok) setTransactions(await resTx.json());
      if (resRem.ok) setReminders(await resRem.json());
      if (resAcc.ok) {
        const accs = await resAcc.json();
        setAccounts(accs);
        if (accs.length > 0 && !addTxAccountId) setAddTxAccountId(accs[0].id);
      }
      if (resCat.ok) {
        const cats = await resCat.json();
        setCategories(cats);
        if (cats.length > 0 && !addTxCategoryId) setAddTxCategoryId(cats[0].id);
      }
    } catch (err) {
      console.error('Error cargando calendario financiero:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const u = localStorage.getItem('hogariq_user');
    const h = localStorage.getItem('hogariq_household');
    if (u) setCurrentUser(JSON.parse(u));
    if (h) setHousehold(JSON.parse(h));
    fetchData();
  }, []);

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();
  const firstDayOfWeekIndex = (firstDayOfWeek + 6) % 7;

  const getFormattedDateString = (day: number) => {
    const m = (currentMonth + 1).toString().padStart(2, '0');
    const d = day.toString().padStart(2, '0');
    return `${currentYear}-${m}-${d}`;
  };

  const handleCreateTxForDay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDayNumber || !addTxAmount || !addTxAccountId) return;

    const token = getToken();
    const dateStr = getFormattedDateString(selectedDayNumber);

    try {
      const res = await fetch(`${API_URL}/api/transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          accountId: addTxAccountId,
          categoryId: addTxCategoryId || undefined,
          type: addTxType,
          amount: parseFloat(addTxAmount),
          description: addTxDesc || undefined,
          date: new Date(`${dateStr}T12:00:00Z`).toISOString(),
        }),
      });

      if (res.ok) {
        setShowAddTxModal(false);
        setAddTxAmount('');
        setAddTxDesc('');
        fetchData();
      }
    } catch (err) {
      console.error('Error creando transacción en el calendario:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A1128] text-slate-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-3 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  // Filtrado general por cuenta
  const filteredTxs = selectedAccountId === 'ALL'
    ? transactions
    : transactions.filter(t => t.accountId === selectedAccountId);

  // Transacciones y recordatorios del día seleccionado en modal
  const selectedDateStr = selectedDayNumber ? getFormattedDateString(selectedDayNumber) : '';
  const dayTxs = filteredTxs.filter(t => t.date && t.date.startsWith(selectedDateStr));
  const dayReminders = reminders.filter(r => r.dueDate && r.dueDate.startsWith(selectedDateStr));

  return (
    <div className="min-h-screen bg-[#0A1128] text-slate-100 pb-20 lg:pb-12">
      <Navbar user={currentUser} household={household} />

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {/* Cabecera & Controles de Mes */}
        <div className="mint-card p-6 border border-[#1E2B4D] flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-400" />
              <span>Calendario Financiero</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Visualiza tus gastos diarios, ingresos y próximos vencimientos de servicios.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Filtro por Cuenta */}
            <div className="relative">
              <select
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                className="px-3.5 py-2 rounded-xl bg-[#0A1128] border border-[#1E2B4D] text-xs font-medium text-slate-200 focus:outline-none focus:border-emerald-400 cursor-pointer"
              >
                <option value="ALL">Todas las Cuentas</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id} className="bg-[#101A36]">{acc.name}</option>
                ))}
              </select>
            </div>

            {/* Controles de Navegación de Mes */}
            <div className="flex items-center space-x-1 bg-[#0A1128] p-1 rounded-xl border border-[#1E2B4D]">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 rounded-lg bg-[#162347] hover:bg-[#1D2D5A] text-slate-200 hover:text-white text-xs cursor-pointer transition-colors"
                title="Mes Anterior"
                aria-label="Mes Anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 text-xs font-semibold text-emerald-300 min-w-[130px] text-center">
                {monthNames[currentMonth]} {currentYear}
              </span>
              <button
                onClick={handleNextMonth}
                className="p-1.5 rounded-lg bg-[#162347] hover:bg-[#1D2D5A] text-slate-200 hover:text-white text-xs cursor-pointer transition-colors"
                title="Mes Siguiente"
                aria-label="Mes Siguiente"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Grilla del Calendario Mensual */}
        <div className="mint-card p-4 sm:p-6 border border-[#1E2B4D] overflow-x-auto">
          {/* Encabezado Días de la Semana */}
          <div className="grid grid-cols-7 gap-2 min-w-[700px] mb-2 text-center">
            {daysOfWeek.map((day) => (
              <div key={day} className="py-2 text-[11px] font-semibold uppercase tracking-wider text-emerald-400 bg-[#0A1128] rounded-lg border border-[#1E2B4D]">
                {day}
              </div>
            ))}
          </div>

          {/* Celda Días */}
          <div className="grid grid-cols-7 gap-2 min-w-[700px]">
            {/* Celdas vacías antes del día 1 */}
            {Array.from({ length: firstDayOfWeekIndex }).map((_, idx) => (
              <div key={`empty-${idx}`} className="h-28 rounded-xl bg-[#0A1128]/30 border border-[#1E2B4D]/30 opacity-20" />
            ))}

            {/* Celdas de Días del Mes */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const dateStr = getFormattedDateString(dayNum);
              const isToday =
                now.getDate() === dayNum &&
                now.getMonth() === currentMonth &&
                now.getFullYear() === currentYear;

              // Transacciones del día
              const txsForDay = filteredTxs.filter(t => t.date && t.date.startsWith(dateStr));
              const activeTxs = txsForDay.filter(t => !t.isVoided);

              let dayExpense = 0;
              let dayIncome = 0;
              for (const t of activeTxs) {
                if (t.type === 'EXPENSE') dayExpense += Number(t.amount);
                if (t.type === 'INCOME') dayIncome += Number(t.amount);
              }

              // Recordatorios del día
              const remsForDay = reminders.filter(r => r.dueDate && r.dueDate.startsWith(dateStr));
              const pendingRems = remsForDay.filter(r => !r.isPaid);

              return (
                <div
                  key={dayNum}
                  onClick={() => {
                    setSelectedDayNumber(dayNum);
                    setShowDayModal(true);
                  }}
                  className={`h-28 rounded-xl p-2.5 bg-[#101A36] border transition-all cursor-pointer flex flex-col justify-between hover:border-emerald-500/50 hover:bg-[#162347] ${
                    isToday ? 'border-emerald-500 bg-emerald-950/20 shadow-md shadow-emerald-950/30' : 'border-[#1E2B4D]'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center tabular-nums ${isToday ? 'bg-emerald-500 text-[#0A1128] font-bold' : 'text-slate-300'}`}>
                      {dayNum}
                    </span>
                    {pendingRems.length > 0 && (
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1 tabular-nums">
                        <Clock className="w-2.5 h-2.5" />
                        {pendingRems.length}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1 my-auto">
                    {dayIncome > 0 && (
                      <div className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 truncate tabular-nums">
                        +${dayIncome.toLocaleString('en-US', { minimumFractionDigits: 0 })}
                      </div>
                    )}
                    {dayExpense > 0 && (
                      <div className="text-[10px] font-bold text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20 truncate tabular-nums">
                        -${dayExpense.toLocaleString('en-US', { minimumFractionDigits: 0 })}
                      </div>
                    )}
                  </div>

                  <div className="text-[9px] text-slate-400 font-medium text-right tabular-nums">
                    {activeTxs.length > 0 ? `${activeTxs.length} movs` : ''}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Detalle del Día */}
        {showDayModal && selectedDayNumber && (
          <div className="fixed inset-0 bg-[#0A1128]/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="mint-card w-full max-w-lg p-6 relative border border-[#1E2B4D] shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#1E2B4D]">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Detalle del Día</span>
                  <h3 className="text-base font-bold text-slate-100">
                    {selectedDayNumber} de {monthNames[currentMonth]} {currentYear}
                  </h3>
                </div>
                <button
                  onClick={() => setShowDayModal(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-[#162347] transition-colors cursor-pointer"
                  aria-label="Cerrar"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Recordatorios del día */}
              {dayReminders.length > 0 && (
                <div className="mb-4 space-y-2">
                  <h4 className="text-[11px] font-semibold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Vencimientos y Recordatorios ({dayReminders.length})</span>
                  </h4>
                  {dayReminders.map((r) => (
                    <div key={r.id} className="p-3 rounded-xl bg-[#0A1128] border border-amber-500/30 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-slate-100">{r.title}</p>
                        <p className="text-[10px] text-slate-400">Estado: {r.isPaid ? 'Pagado' : 'Pendiente'}</p>
                      </div>
                      <span className="text-xs font-bold text-amber-300 tabular-nums">${Number(r.amount).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Transacciones del día */}
              <div className="space-y-2">
                <h4 className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                  Movimientos Registrados ({dayTxs.length})
                </h4>
                {dayTxs.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400 border border-dashed border-[#1E2B4D] rounded-xl">
                    No hay movimientos registrados en esta fecha.
                  </div>
                ) : (
                  dayTxs.map((tx) => (
                    <div key={tx.id} className={`p-3 rounded-xl bg-[#0A1128] border border-[#1E2B4D] flex items-center justify-between ${tx.isVoided ? 'opacity-50' : ''}`}>
                      <div className="flex items-center space-x-2.5">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center border ${
                          tx.type === 'INCOME'
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                            : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                        }`}>
                          {tx.type === 'INCOME' ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                        </div>
                        <div>
                          <p className={`text-xs font-semibold ${tx.isVoided ? 'line-through text-slate-400' : 'text-slate-100'}`}>
                            {tx.description || tx.category?.name || 'Movimiento'}
                          </p>
                          <p className="text-[10px] text-slate-400">{tx.account?.name}</p>
                        </div>
                      </div>
                      <span className={`text-xs font-bold tabular-nums ${tx.isVoided ? 'line-through text-slate-500' : tx.type === 'INCOME' ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {tx.type === 'INCOME' ? '+' : '-'}${Number(tx.amount).toFixed(2)}
                      </span>
                    </div>
                  ))
                )}
              </div>

              {/* Botón Agregar en esta fecha */}
              <div className="pt-4 mt-4 border-t border-[#1E2B4D] flex gap-2">
                <button
                  onClick={() => setShowDayModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-[#162347] text-xs font-medium text-slate-300 hover:bg-[#1D2D5A] hover:text-slate-100 transition-colors cursor-pointer"
                >
                  Cerrar
                </button>
                <button
                  onClick={() => {
                    setShowDayModal(false);
                    setShowAddTxModal(true);
                  }}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white rounded-xl shadow-sm transition-all cursor-pointer"
                >
                  + Registrar en esta Fecha
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Registrar Movimiento en Fecha Seleccionada */}
        {showAddTxModal && selectedDayNumber && (
          <div className="fixed inset-0 bg-[#0A1128]/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="mint-card w-full max-w-md p-6 relative border border-[#1E2B4D] shadow-2xl">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#1E2B4D]">
                <h3 className="text-base font-bold text-slate-100">
                  Registrar Movimiento ({selectedDayNumber} {monthNames[currentMonth]})
                </h3>
                <button
                  onClick={() => setShowAddTxModal(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-[#162347] transition-colors cursor-pointer"
                  aria-label="Cerrar"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateTxForDay} className="space-y-4">
                <div className="grid grid-cols-2 gap-2 p-1 bg-[#0A1128] rounded-xl border border-[#1E2B4D]">
                  <button
                    type="button"
                    onClick={() => setAddTxType('EXPENSE')}
                    className={`py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      addTxType === 'EXPENSE'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <ArrowDownRight className="w-3.5 h-3.5 text-rose-400" />
                    Gasto (-)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAddTxType('INCOME')}
                    className={`py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      addTxType === 'INCOME'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
                    Ingreso (+)
                  </button>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1.5">Monto ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={addTxAmount}
                    onChange={(e) => setAddTxAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A1128] border border-[#1E2B4D] text-slate-100 font-bold focus:outline-none focus:border-emerald-400 tabular-nums transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1.5">Descripción</label>
                  <input
                    type="text"
                    value={addTxDesc}
                    onChange={(e) => setAddTxDesc(e.target.value)}
                    placeholder="Ej. Supermercado, Factura Luz"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A1128] border border-[#1E2B4D] text-slate-100 text-xs focus:outline-none focus:border-emerald-400 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1.5">Cuenta</label>
                  <select
                    value={addTxAccountId}
                    onChange={(e) => setAddTxAccountId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A1128] border border-[#1E2B4D] text-slate-100 text-xs focus:outline-none focus:border-emerald-400 cursor-pointer transition-colors"
                  >
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id} className="bg-[#101A36]">{acc.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1.5">Categoría</label>
                  <select
                    value={addTxCategoryId}
                    onChange={(e) => setAddTxCategoryId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A1128] border border-[#1E2B4D] text-slate-100 text-xs focus:outline-none focus:border-emerald-400 cursor-pointer transition-colors"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id} className="bg-[#101A36]">{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-2 pt-3 border-t border-[#1E2B4D]">
                  <button
                    type="button"
                    onClick={() => setShowAddTxModal(false)}
                    className="flex-1 py-2.5 rounded-xl bg-[#162347] text-xs font-medium text-slate-300 hover:bg-[#1D2D5A] hover:text-slate-100 transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white rounded-xl shadow-sm transition-all cursor-pointer"
                  >
                    Guardar Registro
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
