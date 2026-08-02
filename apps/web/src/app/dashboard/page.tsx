'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { io } from 'socket.io-client';
import Logo from '@/components/Logo';
import Navbar from '@/components/Navbar';

export default function DashboardPage() {
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [household, setHousehold] = useState<any>(null);
  const [summary, setSummary] = useState<any>({ totalBalance: 0, monthlyIncome: 0, monthlyExpense: 0 });
  const [accounts, setAccounts] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [reminders, setReminders] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [debts, setDebts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modales
  const [showTxModal, setShowTxModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [showPayReminderModal, setShowPayReminderModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);

  // Pago de Recordatorio
  const [payingReminder, setPayingReminder] = useState<any>(null);
  const [selectedPayAccountId, setSelectedPayAccountId] = useState('');

  // Formulario Transacción
  const [txType, setTxType] = useState<'EXPENSE' | 'INCOME' | 'TRANSFER'>('EXPENSE');
  const [txAmount, setTxAmount] = useState('');
  const [txAccountId, setTxAccountId] = useState('');
  const [txCategoryId, setTxCategoryId] = useState('');
  const [txDescription, setTxDescription] = useState('');

  // Formulario Cuenta
  const [accName, setAccName] = useState('');
  const [accType, setAccType] = useState('BANK_ACCOUNT');
  const [accBalance, setAccBalance] = useState('');

  // Formulario Recordatorio
  const [remTitle, setRemTitle] = useState('');
  const [remAmount, setRemAmount] = useState('');
  const [remDueDate, setRemDueDate] = useState('');
  const [remSubscriptionId, setRemSubscriptionId] = useState('');
  const [remDebtId, setRemDebtId] = useState('');

  // IA Local Estados
  const [naturalText, setNaturalText] = useState('');
  const [aiParsing, setAiParsing] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [anomalies, setAnomalies] = useState<any[]>([]);

  // Chat RAG Estados
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string }>>([
    { sender: 'ai', text: '¡Hola! Soy tu asistente financiero privado de HogarIQ. ¿Qué deseas consultar sobre tus finanzas hoy?' },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  const getToken = () => localStorage.getItem('hogariq_token');

  const fetchData = async () => {
    const token = getToken();
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const headers = { Authorization: `Bearer ${token}` };

      const [resSum, resAcc, resTx, resCat, resRem, resAnom, resSubs, resDebts] = await Promise.all([
        fetch(`${API_URL}/api/transactions/summary`, { headers }),
        fetch(`${API_URL}/api/accounts`, { headers }),
        fetch(`${API_URL}/api/transactions?limit=10`, { headers }),
        fetch(`${API_URL}/api/categories`, { headers }),
        fetch(`${API_URL}/api/reminders`, { headers }),
        fetch(`${API_URL}/api/ai/anomalies`, { headers }),
        fetch(`${API_URL}/api/subscriptions`, { headers }),
        fetch(`${API_URL}/api/debts`, { headers }),
      ]);

      if (resSum.ok) setSummary(await resSum.json());
      if (resAcc.ok) {
        const accs = await resAcc.json();
        setAccounts(accs);
        if (accs.length > 0) {
          if (!txAccountId) setTxAccountId(accs[0].id);
          if (!selectedPayAccountId) setSelectedPayAccountId(accs[0].id);
        }
      }
      if (resTx.ok) setTransactions(await resTx.json());
      if (resCat.ok) {
        const cats = await resCat.json();
        setCategories(cats);
        if (cats.length > 0 && !txCategoryId) setTxCategoryId(cats[0].id);
      }
      if (resRem.ok) setReminders(await resRem.json());
      if (resSubs.ok) {
        const subData = await resSubs.json();
        setSubscriptions(subData.subscriptions || []);
      }
      if (resDebts.ok) setDebts(await resDebts.json());
    } catch (err) {
      console.error('Error cargando datos:', err);
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

    setUser(JSON.parse(uStr));
    if (hStr) setHousehold(JSON.parse(hStr));

    fetchData();
  }, []);

  // ⚡ Sincronización WebSockets en tiempo real
  useEffect(() => {
    if (household?.id) {
      const socket = io(API_URL);
      socket.emit('join_household', { householdId: household.id });

      socket.on('household_data_changed', (data) => {
        console.log('⚡ Cambio en tiempo real detectado:', data);
        fetchData();
      });

      return () => {
        socket.disconnect();
      };
    }
  }, [household?.id]);

  const handleLogout = () => {
    localStorage.removeItem('hogariq_token');
    localStorage.removeItem('hogariq_user');
    localStorage.removeItem('hogariq_household');
    router.push('/login');
  };

  const handleToggleReminder = async (r: any) => {
    if (!r.isPaid) {
      setPayingReminder(r);
      setSelectedPayAccountId(accounts[0]?.id || '');
      setShowPayReminderModal(true);
      return;
    }

    const token = getToken();
    try {
      const res = await fetch(`${API_URL}/api/reminders/${r.id}/toggle`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) fetchData();
    } catch (err) {
      console.error('Error cambiando recordatorio:', err);
    }
  };

  const handleConfirmPayReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingReminder) return;
    const token = getToken();
    try {
      const res = await fetch(`${API_URL}/api/reminders/${payingReminder.id}/toggle`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ accountId: selectedPayAccountId }),
      });
      if (res.ok) {
        setShowPayReminderModal(false);
        setPayingReminder(null);
        fetchData();
      }
    } catch (err) {
      console.error('Error al confirmar pago de recordatorio:', err);
    }
  };

  const handleCreateReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getToken();
    if (!token || !remTitle) return;

    try {
      const res = await fetch(`${API_URL}/api/reminders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: remTitle,
          amount: parseFloat(remAmount),
          dueDate: remDueDate,
          subscriptionId: remSubscriptionId || undefined,
          debtId: remDebtId || undefined,
        }),
      });

      if (res.ok) {
        setShowReminderModal(false);
        setRemTitle('');
        setRemAmount('');
        setRemDueDate('');
        setRemSubscriptionId('');
        setRemDebtId('');
        fetchData();
      }
    } catch (err) {
      console.error('Error creando recordatorio:', err);
    }
  };

  const handleDeleteReminder = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const token = getToken();
    try {
      const res = await fetch(`${API_URL}/api/reminders/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) fetchData();
    } catch (err) {
      console.error('Error eliminando recordatorio:', err);
    }
  };

  // 🤖 1. IA Parsing de Lenguaje Natural
  const handleParseNatural = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!naturalText.trim()) return;

    setAiParsing(true);
    const token = getToken();

    try {
      const res = await fetch(`${API_URL}/api/ai/parse-natural`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text: naturalText }),
      });

      if (res.ok) {
        const parsed = await res.json();
        setTxAmount(parsed.amount.toString());
        setTxType(parsed.type);
        setTxDescription(parsed.description);

        if (parsed.categoryName && categories.length > 0) {
          const matchedCat = categories.find(c => c.name.toLowerCase().includes(parsed.categoryName.toLowerCase()));
          if (matchedCat) setTxCategoryId(matchedCat.id);
        }

        setNaturalText('');
        setShowTxModal(true);
      }
    } catch (err) {
      console.error('Error procesando IA:', err);
    } finally {
      setAiParsing(false);
    }
  };

  // 📷 2. IA OCR Procesador de Recibos
  const handleOcrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setOcrLoading(true);
    const token = getToken();

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Image = reader.result as string;
      try {
        const res = await fetch(`${API_URL}/api/ai/ocr`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ imageBase64: base64Image }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.parsed) {
            setTxAmount(data.parsed.amount.toString());
            setTxType(data.parsed.type);
            setTxDescription(data.parsed.description);
          }
        }
      } catch (err) {
        console.error('Error procesando OCR:', err);
      } finally {
        setOcrLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // 💬 3. Chat RAG Financiero Privado
  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = chatInput;
    setChatInput('');
    setChatMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
    setChatLoading(true);

    const token = getToken();

    try {
      const res = await fetch(`${API_URL}/api/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: userMsg }),
      });

      if (res.ok) {
        const data = await res.json();
        setChatMessages(prev => [...prev, { sender: 'ai', text: data.reply }]);
      }
    } catch (err) {
      setChatMessages(prev => [...prev, { sender: 'ai', text: 'Error al conectar con la IA local.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getToken();
    if (!token || !txAccountId) return;

    try {
      const res = await fetch(`${API_URL}/api/transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          accountId: txAccountId,
          categoryId: txCategoryId || undefined,
          type: txType,
          amount: parseFloat(txAmount),
          description: txDescription,
        }),
      });

      if (res.ok) {
        setShowTxModal(false);
        setTxAmount('');
        setTxDescription('');
        fetchData();
      }
    } catch (err) {
      console.error('Error creando transacción:', err);
    }
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getToken();
    if (!token || !accName) return;

    try {
      const res = await fetch(`${API_URL}/api/accounts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: accName,
          type: accType,
          balance: parseFloat(accBalance || '0'),
        }),
      });

      if (res.ok) {
        setShowAccountModal(false);
        setAccName('');
        setAccBalance('');
        fetchData();
      }
    } catch (err) {
      console.error('Error creando cuenta:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] text-slate-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 pb-20 lg:pb-12">
      {/* Navbar Responsive (Desktop Tabs + Mobile Hamburger Drawer + Mobile Bottom Bar) */}
      <Navbar
        user={user}
        household={household}
        unreadNotifications={reminders.filter(r => !r.isPaid).length}
        onOpenChat={() => setShowChatModal(true)}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 py-6 sm:py-8 space-y-8">
        {/* 🚀 1. HERO ACTION PANEL: REGISTRO RÁPIDO DE GASTOS E INGRESOS (UX DESTACADA) */}
        <section className="glass-card p-5 sm:p-6 border-2 border-purple-500/40 shadow-2xl relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-900">
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-1 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[10px] font-extrabold uppercase tracking-wider">
                  Acción Principal
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Registro Rápido de Movimientos
                </h2>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Registra tus gastos o ingresos en un clic o escribe a la IA Privada del hogar.
              </p>
            </div>

            {/* Botones Gigantes de Acción Directa */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setTxType('EXPENSE');
                  setShowTxModal(true);
                }}
                className="flex-1 sm:flex-none px-5 py-3.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-extrabold text-sm shadow-lg shadow-rose-950/50 flex items-center justify-center space-x-2 cursor-pointer transition-all hover:scale-105"
              >
                <span className="text-lg">📉</span>
                <span>Registrar Gasto (-)</span>
              </button>

              <button
                onClick={() => {
                  setTxType('INCOME');
                  setShowTxModal(true);
                }}
                className="flex-1 sm:flex-none px-5 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-sm shadow-lg shadow-emerald-950/50 flex items-center justify-center space-x-2 cursor-pointer transition-all hover:scale-105"
              >
                <span className="text-lg">📈</span>
                <span>Registrar Ingreso (+)</span>
              </button>
            </div>
          </div>

          {/* Entrada de Lenguaje Natural con IA Privada */}
          <form onSubmit={handleParseNatural} className="pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-stretch gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                value={naturalText}
                onChange={(e) => setNaturalText(e.target.value)}
                placeholder='⚡ O escribe en lenguaje natural: Ej. "Compré 45$ en supermercado Mercadona"'
                className="w-full pl-4 pr-10 py-3 rounded-xl bg-slate-950/80 border border-purple-500/30 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-purple-400 transition-colors shadow-inner"
              />
            </div>
            <button
              type="submit"
              disabled={aiParsing || !naturalText.trim()}
              className="px-5 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all disabled:opacity-50 flex items-center justify-center space-x-2 shrink-0 cursor-pointer shadow-md"
            >
              <span>{aiParsing ? 'Procesando...' : '⚡ Procesar con IA'}</span>
            </button>
          </form>
        </section>

        {/* KPI Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 text-5xl">💰</div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Balance Consolidado</p>
            <h2 className="text-3xl font-black text-white tracking-tight">
              ${Number(summary.totalBalance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </h2>
            <p className="text-xs text-slate-400 mt-2">Suma de todas las cuentas activas</p>
          </div>

          <div className="glass-card p-6 border-emerald-500/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 text-5xl">📈</div>
            <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1">Ingresos del Mes</p>
            <h2 className="text-3xl font-black text-emerald-400 tracking-tight">
              +${Number(summary.monthlyIncome || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </h2>
            <p className="text-xs text-slate-400 mt-2">Entradas registradas</p>
          </div>

          <div className="glass-card p-6 border-rose-500/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 text-5xl">📉</div>
            <p className="text-xs font-semibold text-rose-400 uppercase tracking-wider mb-1">Gastos del Mes</p>
            <h2 className="text-3xl font-black text-rose-400 tracking-tight">
              -${Number(summary.monthlyExpense || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </h2>
            <p className="text-xs text-slate-400 mt-2">Salidas registradas</p>
          </div>
        </div>

        {/* ⚠️ ALERTAS PROACTIVAS DE IA: FUGAS DE DINERO Y ANOMALÍAS */}
        {anomalies.length > 0 && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 space-y-2">
            <div className="flex items-center space-x-2 text-amber-400 font-extrabold text-xs uppercase tracking-wider">
              <span>⚠️ Alerta de Inteligencia Privada - Desviación de Gastos:</span>
            </div>
            {anomalies.map((anom, idx) => (
              <p key={idx} className="text-xs font-semibold leading-relaxed">
                • {anom.advice}
              </p>
            ))}
          </div>
        )}

        {/* ⏰ RECORDATORIOS DE PAGO PRÓXIMOS */}
        <div className="glass-card p-6 border border-purple-500/20 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <span>⏰</span>
              <span>Recordatorios de Pago Próximos</span>
            </h3>
            <div className="flex items-center space-x-3">
              <span className="text-xs text-slate-400">{reminders.filter(r => !r.isPaid).length} pendientes</span>
              <button
                onClick={() => setShowReminderModal(true)}
                className="px-3 py-1 rounded-lg bg-purple-600/30 hover:bg-purple-600/50 text-purple-300 border border-purple-500/40 text-xs font-bold transition-colors cursor-pointer"
              >
                + Nuevo Recordatorio
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {reminders.map((r) => (
              <div
                key={r.id}
                onClick={() => handleToggleReminder(r)}
                className={`p-4 rounded-xl border transition-all cursor-pointer relative group ${r.isPaid ? 'bg-slate-900/40 border-slate-800 opacity-60' : 'bg-slate-800/80 border-slate-700 hover:border-purple-500'}`}
              >
                <button
                  onClick={(e) => handleDeleteReminder(e, r.id)}
                  className="absolute top-2 right-2 text-slate-500 hover:text-rose-400 text-xs font-bold cursor-pointer"
                  title="Eliminar recordatorio"
                >
                  🗑️
                </button>

                <div className="flex items-center justify-between mb-2 pr-4">
                  <span className="text-xs font-bold text-white">{r.title}</span>
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${r.isPaid ? 'bg-emerald-500 text-white' : 'border border-slate-600 text-slate-400'}`}>
                    {r.isPaid ? '✓' : ''}
                  </span>
                </div>
                <p className={`text-base font-black ${r.isPaid ? 'text-slate-500 line-through' : 'text-purple-300'}`}>
                  ${Number(r.amount).toLocaleString()}
                </p>
                <p className="text-[10px] text-slate-400 mt-1">
                  Vence: {new Date(r.dueDate).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Action Banner */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-gradient-to-r from-purple-900/40 via-slate-900 to-slate-900 border border-purple-500/30">
          <div>
            <h3 className="text-base font-bold text-white">¿Nuevo movimiento financiero?</h3>
            <p className="text-xs text-slate-400">Registra un gasto o ingreso en segundos para mantener las cuentas al día.</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowAccountModal(true)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700 transition-colors cursor-pointer"
            >
              + Nueva Cuenta
            </button>
            <button
              onClick={() => setShowTxModal(true)}
              className="px-5 py-2.5 rounded-xl glow-button text-xs font-bold text-white cursor-pointer"
            >
              + Registrar Movimiento
            </button>
          </div>
        </div>

        {/* Accounts & Transactions Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cuentas */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Cuentas Financieras</h3>
              <span className="text-xs text-slate-400 font-semibold">{accounts.length} activas</span>
            </div>

            {accounts.length === 0 ? (
              <div className="glass-card p-6 text-center text-slate-400 text-sm">
                No tienes cuentas registradas.{' '}
                <button onClick={() => setShowAccountModal(true)} className="text-purple-400 font-semibold underline cursor-pointer">
                  Crea una aquí
                </button>
              </div>
            ) : (
              accounts.map((acc) => (
                <div key={acc.id} className="glass-card p-4 flex items-center justify-between hover:border-slate-600 transition-all">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-xl">
                      {acc.type === 'CASH' ? '💵' : acc.type === 'CREDIT_CARD' ? '💳' : '🏦'}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{acc.name}</p>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">{acc.type}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-base font-bold ${Number(acc.balance) < 0 ? 'text-rose-400' : 'text-slate-100'}`}>
                      ${Number(acc.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-[10px] text-slate-400">{acc.currency}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Transacciones Recientes */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Últimos Movimientos</h3>
              <span className="text-xs text-slate-400 font-semibold">{transactions.length} registros</span>
            </div>

            {transactions.length === 0 ? (
              <div className="glass-card p-8 text-center text-slate-400 text-sm">
                No hay movimientos registrados aún en este hogar.
              </div>
            ) : (
              <div className="space-y-3">
                {transactions.map((tx) => (
                  <div key={tx.id} className="glass-card p-4 flex items-center justify-between hover:bg-slate-800/40 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-800/80 flex items-center justify-center text-lg border border-slate-700">
                        {tx.category?.icon || (tx.type === 'INCOME' ? '💰' : '💸')}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">{tx.description || tx.category?.name || 'Movimiento'}</p>
                        <p className="text-xs text-slate-400">
                          {tx.account?.name} • {new Date(tx.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-base font-black ${tx.type === 'INCOME' ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {tx.type === 'INCOME' ? '+' : '-'}${Number(tx.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </p>
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">{tx.type}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modal Nuevo Recordatorio */}
      {showReminderModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-md p-6 relative border border-purple-500/40">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white">Nuevo Recordatorio de Pago</h3>
              <button onClick={() => setShowReminderModal(false)} className="text-slate-400 hover:text-white cursor-pointer text-xl">✕</button>
            </div>

            <form onSubmit={handleCreateReminder} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Elegir desde Suscripción o Deuda (Opcional)</label>
                <select
                  onChange={(e) => {
                    const val = e.target.value;
                    if (!val) {
                      setRemSubscriptionId('');
                      setRemDebtId('');
                      return;
                    }
                    const [type, id] = val.split(':');
                    if (type === 'SUB') {
                      const sub = subscriptions.find(s => s.id === id);
                      if (sub) {
                        setRemTitle(`Suscripción: ${sub.name}`);
                        setRemAmount(sub.cost.toString());
                        if (sub.nextBillingDate) {
                          setRemDueDate(new Date(sub.nextBillingDate).toISOString().split('T')[0]);
                        }
                        setRemSubscriptionId(sub.id);
                        setRemDebtId('');
                      }
                    } else if (type === 'DEBT') {
                      const d = debts.find(debt => debt.id === id);
                      if (d) {
                        setRemTitle(`Deuda: ${d.contactName}`);
                        setRemAmount(d.remainingAmount.toString());
                        if (d.dueDate) {
                          setRemDueDate(new Date(d.dueDate).toISOString().split('T')[0]);
                        }
                        setRemDebtId(d.id);
                        setRemSubscriptionId('');
                      }
                    }
                  }}
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-purple-500 text-xs"
                >
                  <option value="">-- Ingreso manual --</option>
                  {subscriptions.length > 0 && (
                    <optgroup label="📺 Suscripciones Recurrentes">
                      {subscriptions.map(s => (
                        <option key={s.id} value={`SUB:${s.id}`}>
                          {s.name} - ${Number(s.cost).toFixed(2)}/mes
                        </option>
                      ))}
                    </optgroup>
                  )}
                  {debts.length > 0 && (
                    <optgroup label="💸 Deudas y Préstamos">
                      {debts.map(d => (
                        <option key={d.id} value={`DEBT:${d.id}`}>
                          {d.contactName} - RD${Number(d.remainingAmount).toLocaleString()} pendiente
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Título del Pago</label>
                <input
                  type="text"
                  required
                  value={remTitle}
                  onChange={(e) => setRemTitle(e.target.value)}
                  placeholder="Ej. Pago de luz, Pago del colegio, Hipoteca"
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Monto ($)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={remAmount}
                  onChange={(e) => setRemAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white font-bold text-lg focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Fecha de Vencimiento</label>
                <input
                  type="date"
                  required
                  value={remDueDate}
                  onChange={(e) => setRemDueDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowReminderModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl glow-button text-white text-xs font-bold cursor-pointer"
                >
                  Guardar Recordatorio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirmar Pago de Recordatorio */}
      {showPayReminderModal && payingReminder && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-md p-6 relative border border-emerald-500/40">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <span>💳</span>
                <span>Confirmar Pago de Recordatorio</span>
              </h3>
              <button onClick={() => setShowPayReminderModal(false)} className="text-slate-400 hover:text-white cursor-pointer text-xl">✕</button>
            </div>

            <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 mb-5">
              <p className="text-xs text-slate-400">Recordatorio a pagar:</p>
              <p className="text-base font-bold text-white mt-0.5">{payingReminder.title}</p>
              <p className="text-xl font-black text-emerald-400 mt-1">
                ${Number(payingReminder.amount).toLocaleString()}
              </p>
            </div>

            <form onSubmit={handleConfirmPayReminder} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                  ¿Desde cuál cuenta se realizó el pago?
                </label>
                <select
                  required
                  value={selectedPayAccountId}
                  onChange={(e) => setSelectedPayAccountId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-emerald-500 text-sm font-semibold"
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({acc.type}) - Saldo: ${Number(acc.balance).toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowPayReminderModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold cursor-pointer shadow-lg"
                >
                  ✓ Confirmar y Descontar Pago
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 💬 MODAL CHAT IA PRIVADO */}
      {showChatModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-xl p-6 flex flex-col h-[550px] relative border border-purple-500/40">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <span className="text-2xl">🤖</span>
                <div>
                  <h3 className="text-base font-bold text-white">Chat Financiero IA Contextual</h3>
                  <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">● Procesamiento Local y Privado</span>
                </div>
              </div>
              <button onClick={() => setShowChatModal(false)} className="text-slate-400 hover:text-white cursor-pointer text-xl">✕</button>
            </div>

            {/* Area de Mensajes */}
            <div className="flex-1 overflow-y-auto py-4 space-y-3 custom-scrollbar">
              {chatMessages.map((m, idx) => (
                <div key={idx} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-3.5 rounded-2xl text-xs leading-relaxed ${m.sender === 'user' ? 'bg-purple-600 text-white rounded-br-none' : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-bl-none'}`}>
                    {m.text}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex justify-start">
                  <div className="bg-slate-800 border border-slate-700 p-3 rounded-2xl text-xs text-purple-400 animate-pulse">
                    Thinking / Analizando tus datos locales...
                  </div>
                </div>
              )}
            </div>

            {/* Input Chat */}
            <form onSubmit={handleSendChatMessage} className="pt-3 border-t border-slate-800 flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Pregúntame sobre tus gastos o presupuesto..."
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-purple-500"
              />
              <button
                type="submit"
                disabled={chatLoading || !chatInput.trim()}
                className="px-4 py-2.5 glow-button text-xs font-bold text-white rounded-xl cursor-pointer disabled:opacity-50"
              >
                Enviar
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Registrar Movimiento */}
      {showTxModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-lg p-6 relative">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Registrar Movimiento</h3>
              <button onClick={() => setShowTxModal(false)} className="text-slate-400 hover:text-white cursor-pointer text-xl">✕</button>
            </div>

            {/* 📷 OCR Escáner de Recibos */}
            <div className="mb-4 p-3 rounded-xl bg-purple-900/20 border border-purple-500/30 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-purple-300">📷 Escanear Recibo / Ticket</p>
                <p className="text-[10px] text-slate-400">Extrae el monto y concepto automáticamente</p>
              </div>
              <label className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors">
                {ocrLoading ? 'Procesando...' : 'Subir Foto'}
                <input type="file" accept="image/*" onChange={handleOcrUpload} className="hidden" />
              </label>
            </div>

            <form onSubmit={handleCreateTransaction} className="space-y-4">
              {/* Tipo Selector */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-900/80 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setTxType('EXPENSE')}
                  className={`py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer ${txType === 'EXPENSE' ? 'bg-rose-500 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  Gasto (-)
                </button>
                <button
                  type="button"
                  onClick={() => setTxType('INCOME')}
                  className={`py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer ${txType === 'INCOME' ? 'bg-emerald-500 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  Ingreso (+)
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Monto ($)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={txAmount}
                  onChange={(e) => setTxAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-2xl font-black text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Cuenta</label>
                <select
                  value={txAccountId}
                  onChange={(e) => setTxAccountId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:border-purple-500"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} (${Number(a.balance).toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Categoría</label>
                <select
                  value={txCategoryId}
                  onChange={(e) => setTxCategoryId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:border-purple-500"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.icon} {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Descripción</label>
                <input
                  type="text"
                  value={txDescription}
                  onChange={(e) => setTxDescription(e.target.value)}
                  placeholder="Ej. Almuerzo de trabajo"
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowTxModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl glow-button text-white text-xs font-bold cursor-pointer"
                >
                  Guardar Movimiento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Nueva Cuenta */}
      {showAccountModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-md p-6 relative">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white">Nueva Cuenta Financiera</h3>
              <button onClick={() => setShowAccountModal(false)} className="text-slate-400 hover:text-white cursor-pointer text-xl">✕</button>
            </div>

            <form onSubmit={handleCreateAccount} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Nombre de la Cuenta</label>
                <input
                  type="text"
                  required
                  value={accName}
                  onChange={(e) => setAccName(e.target.value)}
                  placeholder="Ej. Banco BBVA, Tarjeta Visa, Efectivo"
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Tipo de Cuenta</label>
                <select
                  value={accType}
                  onChange={(e) => setAccType(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:border-purple-500"
                >
                  <option value="BANK_ACCOUNT">Cuenta Bancaria</option>
                  <option value="CASH">Efectivo</option>
                  <option value="CREDIT_CARD">Tarjeta de Crédito</option>
                  <option value="SAVINGS">Cuenta de Ahorros</option>
                  <option value="INVESTMENT">Inversión</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Saldo Inicial ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={accBalance}
                  onChange={(e) => setAccBalance(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAccountModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl glow-button text-white text-xs font-bold cursor-pointer"
                >
                  Crear Cuenta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
