'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { io } from 'socket.io-client';

export default function DashboardPage() {
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [household, setHousehold] = useState<any>(null);
  const [summary, setSummary] = useState<any>({ totalBalance: 0, monthlyIncome: 0, monthlyExpense: 0 });
  const [accounts, setAccounts] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [reminders, setReminders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modales
  const [showTxModal, setShowTxModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);

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

  // IA Local Estados
  const [naturalText, setNaturalText] = useState('');
  const [aiParsing, setAiParsing] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);

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

      const [resSum, resAcc, resTx, resCat, resRem] = await Promise.all([
        fetch(`${API_URL}/api/transactions/summary`, { headers }),
        fetch(`${API_URL}/api/accounts`, { headers }),
        fetch(`${API_URL}/api/transactions`, { headers }),
        fetch(`${API_URL}/api/categories`, { headers }),
        fetch(`${API_URL}/api/reminders`, { headers }),
      ]);

      if (resSum.ok) setSummary(await resSum.json());
      if (resAcc.ok) {
        const accs = await resAcc.json();
        setAccounts(accs);
        if (accs.length > 0 && !txAccountId) setTxAccountId(accs[0].id);
      }
      if (resTx.ok) setTransactions(await resTx.json());
      if (resCat.ok) {
        const cats = await resCat.json();
        setCategories(cats);
        if (cats.length > 0 && !txCategoryId) setTxCategoryId(cats[0].id);
      }
      if (resRem.ok) setReminders(await resRem.json());
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

  const handleToggleReminder = async (id: string) => {
    const token = getToken();
    try {
      const res = await fetch(`${API_URL}/api/reminders/${id}/toggle`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) fetchData();
    } catch (err) {
      console.error('Error cambiando recordatorio:', err);
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
        }),
      });

      if (res.ok) {
        setShowReminderModal(false);
        setRemTitle('');
        setRemAmount('');
        setRemDueDate('');
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
    <div className="min-h-screen bg-[#0f172a] text-slate-100 pb-12">
      {/* Header Bar */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center border border-purple-500/30 text-xl font-bold">
                🏠
              </div>
              <div>
                <h1 className="text-lg font-bold text-white leading-tight">HogarIQ</h1>
                <p className="text-xs text-slate-400">{household?.name || 'Hogar'}</p>
              </div>
            </div>

            {/* Navigation Links */}
            <nav className="hidden lg:flex items-center space-x-2 border-l border-slate-800 pl-6">
              <Link href="/dashboard" className="px-3 py-1.5 rounded-lg bg-slate-800 text-xs font-bold text-purple-400 border border-purple-500/30">
                Dashboard
              </Link>
              <Link href="/dashboard/budgets" className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white transition-colors">
                🎯 Presupuestos & Metas
              </Link>
              <Link href="/dashboard/commitments" className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white transition-colors">
                💸 Deudas & Suscripciones
              </Link>
              <Link href="/dashboard/patrimony" className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white transition-colors">
                💎 Patrimonio Neto
              </Link>
              <Link href="/dashboard/family" className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white transition-colors">
                👨‍👩‍👧‍👦 Familia
              </Link>
              <Link href="/dashboard/reports" className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white transition-colors">
                📊 Reportes
              </Link>
            </nav>
          </div>

          <div className="flex items-center space-x-3">
            {/* 🔔 Notifications Bell */}
            <div className="relative">
              <button
                onClick={() => setShowChatModal(false)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 relative cursor-pointer border border-slate-700 transition-colors"
                title="Notificaciones de Alerta"
              >
                <span className="text-base">🔔</span>
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center">
                  {reminders.filter(r => !r.isPaid).length}
                </span>
              </button>
            </div>

            <button
              onClick={() => setShowChatModal(true)}
              className="px-3.5 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 text-xs font-bold border border-purple-500/30 flex items-center space-x-1.5 cursor-pointer transition-colors"
            >
              <span>🤖</span>
              <span className="hidden sm:inline">Chat IA Privado</span>
            </button>


            <div className="text-right hidden sm:block border-l border-slate-800 pl-3">
              <p className="text-sm font-semibold text-slate-200">{user?.fullName}</p>
              <span className="text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">
                {household?.role || 'MIEMBRO'}
              </span>
            </div>

            <button
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors border border-slate-700 cursor-pointer"
            >
              Salir
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* 🤖 BARRA DE ENTRADA INTELIGENTE POR LENGUAJE NATURAL */}
        <div className="glass-card p-4 relative overflow-hidden border border-purple-500/30">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex items-center space-x-2 text-purple-400 font-bold text-xs uppercase tracking-wider shrink-0">
              <span>⚡ Entrada IA:</span>
            </div>

            <form onSubmit={handleParseNatural} className="flex-1 flex items-center gap-2">
              <input
                type="text"
                value={naturalText}
                onChange={(e) => setNaturalText(e.target.value)}
                placeholder='Ej. "Ayer gasté 45$ en supermercado Mercadona con la tarjeta"'
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700 text-sm text-slate-100 focus:outline-none focus:border-purple-500"
              />
              <button
                type="submit"
                disabled={aiParsing || !naturalText.trim()}
                className="px-4 py-2.5 glow-button text-xs font-bold text-white rounded-xl shrink-0 cursor-pointer disabled:opacity-50"
              >
                {aiParsing ? 'Procesando...' : '⚡ Procesar con IA'}
              </button>
            </form>
          </div>
        </div>

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
                onClick={() => handleToggleReminder(r.id)}
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
