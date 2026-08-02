'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';

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
  const getToken = () => localStorage.getItem('hogariq_token');

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
    } catch (e) {
      console.error('Error cargando datos del calendario:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const uStr = localStorage.getItem('hogariq_user');
    const hStr = localStorage.getItem('hogariq_household');

    if (!uStr || !getToken()) {
      router.push('/login');
      return;
    }

    setCurrentUser(JSON.parse(uStr));
    if (hStr) setHousehold(JSON.parse(hStr));

    fetchData();
  }, []);

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(y => y - 1);
    } else {
      setCurrentMonth(m => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(y => y + 1);
    } else {
      setCurrentMonth(m => m + 1);
    }
  };

  // Cálculo de grilla de calendario
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfWeekIndex = (new Date(currentYear, currentMonth, 1).getDay() + 6) % 7; // Lun=0, Dom=6

  const getFormattedDateString = (dayNum: number) => {
    const m = (currentMonth + 1).toString().padStart(2, '0');
    const d = dayNum.toString().padStart(2, '0');
    return `${currentYear}-${m}-${d}`;
  };

  const handleCreateTxForDay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDayNumber || !addTxAmount) return;
    const token = getToken();
    const targetDate = getFormattedDateString(selectedDayNumber);

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
          description: addTxDesc || `Registro el ${selectedDayNumber} de ${monthNames[currentMonth]}`,
          date: new Date(targetDate).toISOString(),
        }),
      });

      if (res.ok) {
        setShowAddTxModal(false);
        setAddTxAmount('');
        setAddTxDesc('');
        fetchData();
      }
    } catch (err) {
      console.error('Error registrando transacción:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] text-slate-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent" />
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
    <div className="min-h-screen bg-[#0f172a] text-slate-100 pb-20 lg:pb-12">
      <Navbar user={currentUser} household={household} />

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {/* Cabecera & Controles de Mes */}
        <div className="glass-card p-6 border border-purple-500/30 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-400">
              Vista Amplia de Flujo de Caja
            </span>
            <h1 className="text-2xl font-black text-white tracking-tight">
              📅 Calendario Financiero
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Visualiza tus gastos diarios, ingresos acumulados y próximos vencimientos de servicios.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Filtro por Cuenta */}
            <select
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-semibold text-slate-200 focus:outline-none focus:border-purple-500"
            >
              <option value="ALL">🏦 Todas las Cuentas</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>{acc.name}</option>
              ))}
            </select>

            {/* Controles de Navegación de Mes */}
            <div className="flex items-center space-x-2 bg-slate-900 p-1.5 rounded-xl border border-slate-700">
              <button
                onClick={handlePrevMonth}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs cursor-pointer transition-colors"
              >
                ◀ Mes Anterior
              </button>
              <span className="px-4 text-sm font-extrabold text-purple-300 min-w-[140px] text-center">
                {monthNames[currentMonth]} {currentYear}
              </span>
              <button
                onClick={handleNextMonth}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs cursor-pointer transition-colors"
              >
                Mes Siguiente ▶
              </button>
            </div>
          </div>
        </div>

        {/* Grilla del Calendario Mensual */}
        <div className="glass-card p-4 sm:p-6 border border-slate-800 overflow-x-auto">
          {/* Encabezado Días de la Semana */}
          <div className="grid grid-cols-7 gap-2 min-w-[700px] mb-2 text-center">
            {daysOfWeek.map((day) => (
              <div key={day} className="py-2 text-xs font-extrabold uppercase tracking-wider text-purple-400 bg-slate-900/60 rounded-lg border border-slate-800">
                {day}
              </div>
            ))}
          </div>

          {/* Celda Días */}
          <div className="grid grid-cols-7 gap-2 min-w-[700px]">
            {/* Celdas vacías antes del día 1 */}
            {Array.from({ length: firstDayOfWeekIndex }).map((_, idx) => (
              <div key={`empty-${idx}`} className="h-28 rounded-xl bg-slate-950/30 border border-slate-900 opacity-30" />
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
                  className={`h-28 rounded-xl p-2 bg-slate-900/80 border transition-all cursor-pointer flex flex-col justify-between hover:border-purple-500 hover:scale-[1.02] ${
                    isToday ? 'border-purple-500 bg-purple-950/20 shadow-md shadow-purple-950/50' : 'border-slate-800'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${isToday ? 'bg-purple-600 text-white font-black' : 'text-slate-300'}`}>
                      {dayNum}
                    </span>
                    {pendingRems.length > 0 && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        ⏰ {pendingRems.length}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1 my-auto">
                    {dayIncome > 0 && (
                      <div className="text-[10px] font-extrabold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 truncate">
                        +${dayIncome.toLocaleString('en-US', { minimumFractionDigits: 0 })}
                      </div>
                    )}
                    {dayExpense > 0 && (
                      <div className="text-[10px] font-extrabold text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20 truncate">
                        -${dayExpense.toLocaleString('en-US', { minimumFractionDigits: 0 })}
                      </div>
                    )}
                  </div>

                  <div className="text-[9px] text-slate-500 font-semibold text-right">
                    {activeTxs.length > 0 ? `${activeTxs.length} movs` : ''}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Detalle del Día */}
        {showDayModal && selectedDayNumber && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="glass-card w-full max-w-lg p-6 relative border border-purple-500/40 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
                <div>
                  <span className="text-[10px] font-bold uppercase text-purple-400">Detalle del Día</span>
                  <h3 className="text-lg font-bold text-white">
                    {selectedDayNumber} de {monthNames[currentMonth]} {currentYear}
                  </h3>
                </div>
                <button onClick={() => setShowDayModal(false)} className="text-slate-400 hover:text-white cursor-pointer text-xl">✕</button>
              </div>

              {/* Recordatorios del día */}
              {dayReminders.length > 0 && (
                <div className="mb-4 space-y-2">
                  <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider">⏰ Vencimientos y Recordatorios ({dayReminders.length})</h4>
                  {dayReminders.map((r) => (
                    <div key={r.id} className="p-3 rounded-xl bg-slate-900 border border-amber-500/30 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-white">{r.title}</p>
                        <p className="text-[10px] text-slate-400">Estado: {r.isPaid ? '✓ Pagado' : '⏳ Pendiente'}</p>
                      </div>
                      <span className="text-xs font-bold text-amber-300">${Number(r.amount).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Transacciones del día */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">💸 Movimientos Registrados ({dayTxs.length})</h4>
                {dayTxs.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400 border border-dashed border-slate-800 rounded-xl">
                    No hay movimientos registrados en esta fecha.
                  </div>
                ) : (
                  dayTxs.map((tx) => (
                    <div key={tx.id} className={`p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between ${tx.isVoided ? 'opacity-50' : ''}`}>
                      <div className="flex items-center space-x-2">
                        <span className="text-base">{tx.category?.icon || (tx.type === 'INCOME' ? '💰' : '💸')}</span>
                        <div>
                          <p className={`text-xs font-bold ${tx.isVoided ? 'line-through text-slate-400' : 'text-white'}`}>
                            {tx.description || tx.category?.name || 'Movimiento'}
                          </p>
                          <p className="text-[10px] text-slate-400">{tx.account?.name}</p>
                        </div>
                      </div>
                      <span className={`text-xs font-black ${tx.isVoided ? 'line-through text-slate-500' : tx.type === 'INCOME' ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {tx.type === 'INCOME' ? '+' : '-'}${Number(tx.amount).toFixed(2)}
                      </span>
                    </div>
                  ))
                )}
              </div>

              {/* Botón Agregar en esta fecha */}
              <div className="pt-4 mt-4 border-t border-slate-800 flex gap-2">
                <button
                  onClick={() => setShowDayModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-xs font-bold text-slate-300"
                >
                  Cerrar
                </button>
                <button
                  onClick={() => {
                    setShowDayModal(false);
                    setShowAddTxModal(true);
                  }}
                  className="flex-1 py-2.5 glow-button text-xs font-bold text-white rounded-xl cursor-pointer"
                >
                  + Registrar en esta Fecha
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Registrar Movimiento en Fecha Seleccionada */}
        {showAddTxModal && selectedDayNumber && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="glass-card w-full max-w-md p-6 relative border border-purple-500/40">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">
                  Registrar Movimiento ({selectedDayNumber} {monthNames[currentMonth]})
                </h3>
                <button onClick={() => setShowAddTxModal(false)} className="text-slate-400 hover:text-white cursor-pointer text-xl">✕</button>
              </div>

              <form onSubmit={handleCreateTxForDay} className="space-y-4">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setAddTxType('EXPENSE')}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-colors ${addTxType === 'EXPENSE' ? 'bg-rose-600 text-white border-rose-500' : 'bg-slate-900 text-slate-400 border-slate-800'}`}
                  >
                    📉 Gasto (-)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAddTxType('INCOME')}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-colors ${addTxType === 'INCOME' ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-slate-900 text-slate-400 border-slate-800'}`}
                  >
                    📈 Ingreso (+)
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Monto ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={addTxAmount}
                    onChange={(e) => setAddTxAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-bold focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Descripción</label>
                  <input
                    type="text"
                    value={addTxDesc}
                    onChange={(e) => setAddTxDesc(e.target.value)}
                    placeholder="Ej. Supermercado / Salario"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Cuenta</label>
                  <select
                    value={addTxAccountId}
                    onChange={(e) => setAddTxAccountId(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-purple-500"
                  >
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>{acc.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Categoría</label>
                  <select
                    value={addTxCategoryId}
                    onChange={(e) => setAddTxCategoryId(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-purple-500"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddTxModal(false)}
                    className="flex-1 py-2.5 rounded-xl bg-slate-800 text-xs font-bold text-slate-300"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 glow-button text-xs font-bold text-white rounded-xl cursor-pointer"
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
