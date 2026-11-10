import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  View,
  Text,
  RefreshControl,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Bell,
  LogOut,
  Home,
  ChevronDown,
  ChevronUp,
  Plus,
  ArrowDownRight,
  ArrowUpRight,
  ArrowRightLeft,
  Camera,
  Check,
  Circle,
  Edit3,
  Trash2,
  Briefcase,
  Building2,
  CreditCard,
  Wallet,
  ShieldCheck,
  Zap,
  Sparkles,
  CloudOff,
  RefreshCw,
  Bot,
} from 'lucide-react-native';
import {
  API_URL,
  fetchWithAuth,
  getUser,
  getHousehold,
  logout,
  subscribeOfflineQueue,
  flushOfflineQueue,
  getOfflineQueueCount,
} from '@/constants/Api';
import { FamilyMint } from '@/constants/Colors';
import Logo from '@/components/Logo';
import HouseholdSelectorModal from '@/components/HouseholdSelectorModal';
import TransactionModal from '@/components/modals/TransactionModal';
import AccountModal from '@/components/modals/AccountModal';
import EditAccountModal from '@/components/modals/EditAccountModal';
import ReceiptScanModal from '@/components/modals/ReceiptScanModal';
import TelegramBotModal from '@/components/modals/TelegramBotModal';
import { useHouseholdSocket } from '@/hooks/useHouseholdSocket';

export default function MobileDashboardScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUserState] = useState<any>(null);
  const [household, setHouseholdState] = useState<any>(null);

  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [showStsBreakdown, setShowStsBreakdown] = useState(false);
  const [summary, setSummary] = useState({ totalBalance: 0, monthlyIncome: 0, monthlyExpense: 0 });
  const [reminders, setReminders] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [myAllowance, setMyAllowance] = useState<any>(null);
  const [userRole, setUserRole] = useState<string>('COLLABORATOR');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [depositingAccId, setDepositingAccId] = useState<string | null>(null);

  // Modales Principales
  const [showHouseholdModal, setShowHouseholdModal] = useState(false);
  const [showTxModal, setShowTxModal] = useState(false);
  const [txInitialType, setTxInitialType] = useState<'EXPENSE' | 'INCOME' | 'TRANSFER'>('EXPENSE');
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showEditAccountModal, setShowEditAccountModal] = useState(false);
  const [selectedAccountForEdit, setSelectedAccountForEdit] = useState<any>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showTelegramModal, setShowTelegramModal] = useState(false);

  // Modales Secundarios
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [showEditReminderModal, setShowEditReminderModal] = useState(false);
  const [showVoidTxModal, setShowVoidTxModal] = useState(false);
  const [showEditTxModal, setShowEditTxModal] = useState(false);
  const [payingReminder, setPayingReminder] = useState<any>(null);
  const [selectedPayAccountId, setSelectedPayAccountId] = useState('');
  const [selectedReminder, setSelectedReminder] = useState<any>(null);
  const [selectedTxForVoid, setSelectedTxForVoid] = useState<any>(null);
  const [selectedTxForEdit, setSelectedTxForEdit] = useState<any>(null);
  const [voidReason, setVoidReason] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editTxDescription, setEditTxDescription] = useState('');
  const [editTxAmount, setEditTxAmount] = useState('');
  const [editTxReason, setEditTxReason] = useState('');

  // Registro Express en Lenguaje Natural
  const [quickText, setQuickText] = useState('');
  const [quickSubmitting, setQuickSubmitting] = useState(false);

  // Motor Offline-First
  const [offlineCount, setOfflineCount] = useState(0);
  const [syncingOffline, setSyncingOffline] = useState(false);

  const getAccountTypeName = (type: string) => {
    switch (type) {
      case 'PAYROLL': return 'Nómina';
      case 'SAVINGS': return 'Ahorro';
      case 'CHECKING': return 'Corriente';
      case 'CASH': return 'Efectivo';
      case 'CREDIT_CARD': return 'Tarjeta';
      case 'INVESTMENT': return 'Inversión';
      default: return type;
    }
  };

  const handleTriggerPayrollDeposit = (acc: any) => {
    const amount = Number(acc.payrollAmount || 0);
    Alert.alert(
      'Acreditar Nómina',
      `¿Deseas acreditar el depósito de nómina por $${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })} en "${acc.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Acreditar',
          onPress: async () => {
            try {
              setDepositingAccId(acc.id);
              const res = await fetchWithAuth(`/api/accounts/${acc.id}/payroll/deposit`, {
                method: 'POST',
              });
              const data = await res.json();
              if (res.ok) {
                Alert.alert(
                  '¡Nómina Acreditada!',
                  data.message || `Depósito de $${amount.toLocaleString()} acreditado con éxito.`
                );
                loadData();
              } else {
                Alert.alert('Error', data.message || 'No se pudo procesar el depósito de nómina.');
              }
            } catch (e: any) {
              Alert.alert('Error', e.message || 'Error de conexión.');
            } finally {
              setDepositingAccId(null);
            }
          },
        },
      ]
    );
  };

  const handleConfirmEditTx = async () => {
    if (!selectedTxForEdit || !editTxReason.trim()) {
      Alert.alert('Error', 'Debes ingresar el motivo obligatorio de edición.');
      return;
    }
    try {
      const res = await fetchWithAuth(`/api/transactions/${selectedTxForEdit.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: editTxDescription.trim(),
          amount: parseFloat(editTxAmount),
          editReason: editTxReason.trim(),
        }),
      });
      if (res.ok) {
        setShowEditTxModal(false);
        setSelectedTxForEdit(null);
        Alert.alert('Movimiento Editado', 'La transacción fue actualizada con su motivo de auditoría.');
        loadData();
      } else {
        const err = await res.json();
        Alert.alert('Error', err.message || 'No se pudo editar el movimiento.');
      }
    } catch (e) {
      Alert.alert('Error', 'Error de conexión al editar.');
    }
  };

  const handleConfirmVoidTx = async () => {
    if (!selectedTxForVoid || !voidReason.trim()) {
      Alert.alert('Error', 'Debes ingresar el motivo obligatorio de anulación.');
      return;
    }
    try {
      const res = await fetchWithAuth(`/api/transactions/${selectedTxForVoid.id}/void`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voidReason: voidReason.trim() }),
      });
      if (res.ok) {
        setShowVoidTxModal(false);
        setSelectedTxForVoid(null);
        setVoidReason('');
        Alert.alert('Movimiento Anulado', 'El dinero se ha revertido a la cuenta correctamente.');
        loadData();
      } else {
        const err = await res.json();
        Alert.alert('Error', err.message || 'No se pudo anular la transacción.');
      }
    } catch (e) {
      Alert.alert('Error', 'No se pudo anular el movimiento.');
    }
  };

  const loadData = async (curr = selectedCurrency) => {
    try {
      const u = getUser();
      const h = getHousehold();
      setUserState(u);
      setHouseholdState(h);

      const [resSum, resTx, resRem, resMem, resAllow, resAcc, resNotif, resCat] = await Promise.all([
        fetchWithAuth(`/api/transactions/summary?currency=${curr}`),
        fetchWithAuth('/api/transactions?limit=10'),
        fetchWithAuth('/api/reminders'),
        fetchWithAuth('/api/household/members'),
        fetchWithAuth('/api/allowances'),
        fetchWithAuth('/api/accounts'),
        fetchWithAuth('/api/notifications'),
        fetchWithAuth('/api/categories'),
      ]);

      if (resSum.ok) setSummary(await resSum.json());
      if (resTx.ok) {
        const txData = await resTx.json();
        if (Array.isArray(txData)) setTransactions(txData);
      }
      if (resRem.ok) {
        const remData = await resRem.json();
        if (Array.isArray(remData)) setReminders(remData);
      }
      if (resMem.ok) {
        const members = await resMem.json();
        const me = members.find((m: any) => m.userId === u?.id);
        if (me) setUserRole(me.role);
      }
      if (resAllow.ok) {
        const allows = await resAllow.json();
        if (Array.isArray(allows) && allows.length > 0) {
          setMyAllowance(allows[0]);
        }
      }
      if (resAcc.ok) {
        const accData = await resAcc.json();
        if (Array.isArray(accData)) {
          setAccounts(accData);
          if (accData.length > 0) setSelectedPayAccountId(accData[0].id);
        }
      }
      if (resNotif.ok) {
        const notifData = await resNotif.json();
        if (Array.isArray(notifData)) setNotifications(notifData);
      }
      if (resCat.ok) {
        const catData = await resCat.json();
        if (Array.isArray(catData)) setCategories(catData);
      }
    } catch (err) {
      console.log('Error conectando con la API:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
    const unsub = subscribeOfflineQueue((cnt) => {
      setOfflineCount(cnt);
    });
    return () => {
      unsub();
    };
  }, []);

  const handleSyncOffline = async () => {
    setSyncingOffline(true);
    try {
      const res = await flushOfflineQueue();
      if (res.synced > 0) {
        Alert.alert('¡Sincronizado!', `Se sincronizaron ${res.synced} operaciones con éxito.`);
        loadData();
      } else if (res.remaining > 0) {
        Alert.alert('Sin Conexión', 'No se pudo conectar al servidor. Se mantendrán guardadas localmente.');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Error al sincronizar.');
    } finally {
      setSyncingOffline(false);
    }
  };

  // Sincronización en tiempo real y revalidación en foco del hogar
  useHouseholdSocket(household?.id, () => {
    loadData();
  });

  const handleLogout = () => {
    Alert.alert('Cerrar Sesión', '¿Deseas salir de la aplicación?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Cerrar Sesión',
        style: 'destructive',
        onPress: () => {
          logout();
          router.replace('/login' as any);
        },
      },
    ]);
  };

  const handleToggleReminder = (r: any) => {
    if (!r.isPaid) {
      setPayingReminder(r);
      setSelectedPayAccountId(accounts[0]?.id || '');
      setShowPayModal(true);
    } else {
      fetchWithAuth(`/api/reminders/${r.id}/toggle`, { method: 'PUT' })
        .then(() => loadData())
        .catch((err) => console.log('Error desmarcando recordatorio:', err));
    }
  };

  const handleConfirmPayReminder = async () => {
    if (!payingReminder) return;
    try {
      const res = await fetchWithAuth(`/api/reminders/${payingReminder.id}/toggle`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId: selectedPayAccountId }),
      });

      if (res.ok) {
        setShowPayModal(false);
        setPayingReminder(null);
        Alert.alert('Pago Registrado', `Se descontó el pago de "${payingReminder.title}" correctamente.`);
        loadData();
      }
    } catch (err) {
      Alert.alert('Error', 'No se pudo completar el registro del pago.');
    }
  };

  const handleOpenEditReminder = (r: any) => {
    setSelectedReminder(r);
    setEditTitle(r.title);
    setEditAmount(String(r.amount));
    setShowEditReminderModal(true);
  };

  const handleConfirmEditReminder = async () => {
    if (!selectedReminder) return;
    try {
      const res = await fetchWithAuth(`/api/reminders/${selectedReminder.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle.trim(),
          amount: parseFloat(editAmount),
        }),
      });

      if (res.ok) {
        setShowEditReminderModal(false);
        setSelectedReminder(null);
        loadData();
      }
    } catch (err) {
      Alert.alert('Error', 'No se pudo editar el recordatorio.');
    }
  };

  const handleDeleteReminder = (id: string) => {
    Alert.alert('Eliminar Recordatorio', '¿Estás seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            const res = await fetchWithAuth(`/api/reminders/${id}`, { method: 'DELETE' });
            if (res.ok) loadData();
          } catch (err) {
            console.log(err);
          }
        },
      },
    ]);
  };

  const openNewTx = (type: 'EXPENSE' | 'INCOME' | 'TRANSFER') => {
    setTxInitialType(type);
    setShowTxModal(true);
  };

  const handleCurrencyChange = (curr: string) => {
    setSelectedCurrency(curr);
    loadData(curr);
  };

  const handleQuickEntrySubmit = async () => {
    if (!quickText.trim()) return;
    setQuickSubmitting(true);
    try {
      const res = await fetchWithAuth('/api/quick-entry/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: quickText.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setQuickText('');
        const c = data.candidate;
        Alert.alert(
          '¡Registro Express! ⚡',
          `"${c.description}"\n${c.type === 'INCOME' ? '+' : '-'}$${c.amount.toFixed(2)} en ${c.categoryName || 'General'} (${c.accountName})${c.isShared ? '\n🤝 Gasto Compartido 50/50' : ''}`
        );
        loadData();
      } else {
        Alert.alert('No se pudo registrar', data.message || 'Verifica el texto ingresado.');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Error de conexión.');
    } finally {
      setQuickSubmitting(false);
    }
  };

  const pendingCount = reminders.filter((r) => !r.isPaid).length;
  const unreadNotifsCount = notifications.filter((n) => !n.isRead).length;

  const baseCurr = selectedCurrency || (summary as any)?.baseCurrency || 'USD';
  const currencySymbols: Record<string, string> = {
    USD: '$',
    EUR: '€',
    DOP: 'RD$',
    MXN: '$',
    COP: '$',
    ARS: '$',
    CLP: '$',
    PEN: 'S/',
    GBP: '£',
    BRL: 'R$',
    CAD: '$',
    USDT: '₮',
  };
  const sym = currencySymbols[baseCurr] || '$';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={async () => {
            setRefreshing(true);
            if (offlineCount > 0) {
              await flushOfflineQueue();
            }
            loadData();
          }}
          tintColor={FamilyMint.primary}
        />
      }
    >
      {/* Header Mobile con Logo, Selector de Hogar, Notificaciones y Logout */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Logo size="sm" showText={true} />
          
          {/* Selector de Hogar Interactivo */}
          <TouchableOpacity
            style={styles.householdSelectorBtn}
            onPress={() => setShowHouseholdModal(true)}
            activeOpacity={0.7}
          >
            <Home size={12} color={FamilyMint.primary} />
            <Text style={styles.householdSelectorText} numberOfLines={1}>
              {household?.name || 'Mi Hogar'}
            </Text>
            <ChevronDown size={12} color={FamilyMint.foregroundSubtle} />
          </TouchableOpacity>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {/* Botón de Notificaciones */}
          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={() => setShowNotifModal(true)}
          >
            <Bell size={18} color={FamilyMint.foreground} />
            {unreadNotifsCount > 0 && (
              <View style={styles.notifBadge}>
                <Text style={styles.notifBadgeText}>{unreadNotifsCount}</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Botón Cerrar Sesión */}
          <TouchableOpacity style={styles.headerIconBtn} onPress={handleLogout}>
            <LogOut size={18} color={FamilyMint.foregroundSubtle} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Banner de Sincronización Offline-First */}
      {offlineCount > 0 && (
        <View style={styles.offlineBanner}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
            <CloudOff size={20} color="#F59E0B" />
            <View style={{ flex: 1 }}>
              <Text style={styles.offlineBannerTitle}>
                {offlineCount} {offlineCount === 1 ? 'operación local pendiente' : 'operaciones locales pendientes'}
              </Text>
              <Text style={styles.offlineBannerSub}>
                Guardado en tu dispositivo. Listo para sincronizar.
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.offlineSyncBtn}
            disabled={syncingOffline}
            onPress={handleSyncOffline}
          >
            {syncingOffline ? (
              <ActivityIndicator size="small" color="#0A1128" />
            ) : (
              <>
                <RefreshCw size={12} color="#0A1128" />
                <Text style={styles.offlineSyncBtnText}>Sincronizar</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* ⚡ Registro Express en Lenguaje Natural */}
      <View style={{ backgroundColor: FamilyMint.surface, borderWidth: 1, borderColor: FamilyMint.border, borderRadius: 14, padding: 6, flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
        <TextInput
          style={{ flex: 1, color: FamilyMint.foreground, fontSize: 13, paddingHorizontal: 10, paddingVertical: 6 }}
          placeholder="⚡ Express: ej. Almuerzo 15 tarjeta 50/50"
          placeholderTextColor={FamilyMint.foregroundSubtle}
          value={quickText}
          onChangeText={setQuickText}
          onSubmitEditing={handleQuickEntrySubmit}
          returnKeyType="done"
        />
        <TouchableOpacity
          style={{ backgroundColor: FamilyMint.primary, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, opacity: quickSubmitting || !quickText.trim() ? 0.4 : 1 }}
          disabled={quickSubmitting || !quickText.trim()}
          onPress={handleQuickEntrySubmit}
        >
          {quickSubmitting ? (
            <ActivityIndicator size="small" color="#0A1128" />
          ) : (
            <Zap size={14} color="#0A1128" />
          )}
        </TouchableOpacity>
      </View>

      {/* 🤖 Botón & Guía de Conexión con Telegram */}
      <TouchableOpacity
        onPress={() => setShowTelegramModal(true)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'rgba(56, 189, 248, 0.08)',
          borderWidth: 1,
          borderColor: 'rgba(56, 189, 248, 0.25)',
          borderRadius: 14,
          paddingHorizontal: 12,
          paddingVertical: 10,
          marginTop: 8,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
          <View style={{ width: 30, height: 30, borderRadius: 9, backgroundColor: 'rgba(56, 189, 248, 0.18)', alignItems: 'center', justifyContent: 'center' }}>
            <Bot size={17} color="#38BDF8" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: FamilyMint.foreground }}>
              Conectar Bot de Telegram 🤖
            </Text>
            <Text style={{ fontSize: 11, color: FamilyMint.foregroundMuted }} numberOfLines={1}>
              Guía paso a paso para registrar gastos por chat
            </Text>
          </View>
        </View>
        <View style={{ backgroundColor: 'rgba(56, 189, 248, 0.15)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: '#38BDF8' }}>Ver Guía</Text>
        </View>
      </TouchableOpacity>

      {/* Botones de Registro Rápido e Inteligente (Paridad Web al 100%) */}
      <View style={{ flexDirection: 'row', gap: 8, marginVertical: 12 }}>
        <TouchableOpacity
          onPress={() => openNewTx('EXPENSE')}
          style={[styles.quickAddBtn, { backgroundColor: FamilyMint.expenseBg, borderColor: 'rgba(244, 63, 94, 0.3)' }]}
        >
          <ArrowDownRight size={16} color={FamilyMint.expense} />
          <Text style={[styles.quickAddText, { color: FamilyMint.expense }]}>Gasto</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => openNewTx('INCOME')}
          style={[styles.quickAddBtn, { backgroundColor: FamilyMint.incomeBg, borderColor: 'rgba(16, 185, 129, 0.3)' }]}
        >
          <ArrowUpRight size={16} color={FamilyMint.income} />
          <Text style={[styles.quickAddText, { color: FamilyMint.income }]}>Ingreso</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => openNewTx('TRANSFER')}
          style={[styles.quickAddBtn, { backgroundColor: FamilyMint.infoBg, borderColor: 'rgba(56, 189, 248, 0.3)' }]}
        >
          <ArrowRightLeft size={16} color={FamilyMint.info} />
          <Text style={[styles.quickAddText, { color: FamilyMint.info }]}>Transf.</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setShowReceiptModal(true)}
          style={[styles.quickAddBtn, { backgroundColor: 'rgba(16, 185, 129, 0.15)', borderColor: 'rgba(16, 185, 129, 0.4)' }]}
        >
          <Camera size={16} color={FamilyMint.primary} />
          <Text style={[styles.quickAddText, { color: FamilyMint.primary }]}>OCR 🧾</Text>
        </TouchableOpacity>
      </View>

      {/* Selector de Divisas de Consolidación (Tiempo Real) */}
      <View style={styles.currencySelectorContainer}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, paddingHorizontal: 2 }}>
          <Text style={styles.currencySelectorLabel}>Moneda de Consolidación:</Text>
          <View style={styles.currencyActiveBadge}>
            <Text style={styles.currencyActiveBadgeText}>{selectedCurrency} ({sym})</Text>
          </View>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.currencyPillsScroll}>
          {['USD', 'EUR', 'DOP', 'MXN', 'COP', 'ARS', 'CLP', 'PEN', 'GBP', 'BRL', 'CAD', 'USDT'].map((curr) => {
            const isCurrActive = selectedCurrency === curr;
            const cSym = currencySymbols[curr] || '$';
            return (
              <TouchableOpacity
                key={curr}
                onPress={() => handleCurrencyChange(curr)}
                style={[styles.currencyPill, isCurrActive && styles.currencyPillActive]}
              >
                <Text style={[styles.currencyPillText, isCurrActive && styles.currencyPillTextActive]}>
                  {curr} <Text style={{ fontSize: 10, opacity: 0.8 }}>({cSym})</Text>
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* KPI Cards: Safe to Spend + Balance + Ingresos/Gastos */}
      <View style={styles.kpiContainer}>
        {/* Tarjeta Destacada: Safe-to-Spend (Disponible Real Diario) */}
        <View style={[styles.kpiCardMain, { borderColor: (summary as any)?.safeToSpend?.healthStatus === 'CRITICAL' ? 'rgba(244, 63, 94, 0.4)' : (summary as any)?.safeToSpend?.healthStatus === 'MODERATE' ? 'rgba(245, 158, 11, 0.4)' : 'rgba(16, 185, 129, 0.4)', backgroundColor: '#101A36' }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <ShieldCheck size={14} color={FamilyMint.primary} />
              <Text style={[styles.kpiTitle, { color: FamilyMint.primary, marginBottom: 0 }]}>DISPONIBLE HOY (SAFE-TO-SPEND)</Text>
            </View>
            <View style={{
              backgroundColor: (summary as any)?.safeToSpend?.healthStatus === 'CRITICAL' ? 'rgba(244, 63, 94, 0.15)' : (summary as any)?.safeToSpend?.healthStatus === 'MODERATE' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
              paddingHorizontal: 8,
              paddingVertical: 2,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: (summary as any)?.safeToSpend?.healthStatus === 'CRITICAL' ? 'rgba(244, 63, 94, 0.3)' : (summary as any)?.safeToSpend?.healthStatus === 'MODERATE' ? 'rgba(245, 158, 11, 0.3)' : 'rgba(16, 185, 129, 0.3)'
            }}>
              <Text style={{
                fontSize: 10,
                fontWeight: '700',
                color: (summary as any)?.safeToSpend?.healthStatus === 'CRITICAL' ? FamilyMint.expense : (summary as any)?.safeToSpend?.healthStatus === 'MODERATE' ? '#F59E0B' : FamilyMint.primary
              }}>
                {(summary as any)?.safeToSpend?.healthStatus === 'CRITICAL' ? 'Atención' : (summary as any)?.safeToSpend?.healthStatus === 'MODERATE' ? 'Ajustado' : 'Saludable'}
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 6, gap: 4 }}>
            <Text style={[styles.kpiValueMain, { color: '#F8FAFC' }]}>
              {sym}{((summary as any)?.safeToSpend?.safeToSpendDaily || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
            <Text style={{ fontSize: 13, color: FamilyMint.foregroundSubtle, fontWeight: '600' }}>/ día</Text>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: 'rgba(30, 43, 77, 0.6)' }}>
            <Text style={{ fontSize: 11, color: FamilyMint.foregroundMuted }}>
              Mes libre ({baseCurr}): <Text style={{ color: FamilyMint.foreground, fontWeight: '600' }}>{sym}{((summary as any)?.safeToSpend?.safeToSpendMonth || 0).toLocaleString('en-US', { minimumFractionDigits: 0 })}</Text>
            </Text>
            <TouchableOpacity
              onPress={() => setShowStsBreakdown(!showStsBreakdown)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}
            >
              <Text style={{ fontSize: 11, color: FamilyMint.primary, fontWeight: '600' }}>
                {showStsBreakdown ? 'Ocultar' : 'Ver desglose'}
              </Text>
              {showStsBreakdown ? (
                <ChevronUp size={13} color={FamilyMint.primary} />
              ) : (
                <ChevronDown size={13} color={FamilyMint.primary} />
              )}
            </TouchableOpacity>
          </View>

          {/* Cajón Desplegable con Desglose Exacto Safe-to-Spend */}
          {showStsBreakdown && (
            <View style={styles.stsBreakdownBox}>
              <View style={styles.stsBreakdownRow}>
                <Text style={styles.stsBreakdownLabel}>Saldo Líquido Total:</Text>
                <Text style={styles.stsBreakdownValue}>
                  {sym}{Number((summary as any)?.safeToSpend?.liquidBalance || summary.totalBalance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </Text>
              </View>
              <View style={styles.stsBreakdownRow}>
                <Text style={[styles.stsBreakdownLabel, { color: FamilyMint.expense }]}>(-) Recordatorios pendientes:</Text>
                <Text style={[styles.stsBreakdownValue, { color: FamilyMint.expense }]}>
                  -{sym}{Number((summary as any)?.safeToSpend?.breakdown?.pendingRemindersTotal || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </Text>
              </View>
              <View style={styles.stsBreakdownRow}>
                <Text style={[styles.stsBreakdownLabel, { color: FamilyMint.expense }]}>(-) Suscripciones mes:</Text>
                <Text style={[styles.stsBreakdownValue, { color: FamilyMint.expense }]}>
                  -{sym}{Number((summary as any)?.safeToSpend?.breakdown?.pendingSubscriptionsTotal || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </Text>
              </View>
              <View style={styles.stsBreakdownRow}>
                <Text style={[styles.stsBreakdownLabel, { color: FamilyMint.expense }]}>(-) Deudas próximas:</Text>
                <Text style={[styles.stsBreakdownValue, { color: FamilyMint.expense }]}>
                  -{sym}{Number((summary as any)?.safeToSpend?.breakdown?.upcomingDebtsTotal || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </Text>
              </View>

              <View style={[styles.stsBreakdownRow, { borderTopWidth: 1, borderTopColor: 'rgba(255, 255, 255, 0.08)', paddingTop: 6, marginTop: 4 }]}>
                <Text style={[styles.stsBreakdownLabel, { fontWeight: '700', color: FamilyMint.foreground }]}>
                  Disponible Neto Mes:
                </Text>
                <Text style={[styles.stsBreakdownValue, { fontWeight: '700', color: FamilyMint.primary }]}>
                  {sym}{Number((summary as any)?.safeToSpend?.safeToSpendMonth || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </Text>
              </View>

              <Text style={styles.stsFormulaText}>
                Fórmula: (Saldo Líquido - Compromisos) / {((summary as any)?.safeToSpend?.daysRemaining || 1)} días restantes
              </Text>
            </View>
          )}
        </View>

        <View style={styles.kpiCardMain}>
          <Text style={styles.kpiTitle}>BALANCE CONSOLIDADO ({baseCurr})</Text>
          <Text style={styles.kpiValueMain}>
            {sym}{summary.totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Text>
          <Text style={styles.kpiSub}>Suma de todas las cuentas convertidas a {baseCurr}</Text>
        </View>

        <View style={styles.kpiRow}>
          <View style={[styles.kpiCardHalf, styles.incomeCard]}>
            <Text style={styles.incomeTitle}>INGRESOS MES</Text>
            <Text style={styles.incomeValue}>
              +{sym}{summary.monthlyIncome.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
          </View>

          <View style={[styles.kpiCardHalf, styles.expenseCard]}>
            <Text style={styles.expenseTitle}>GASTOS MES</Text>
            <Text style={styles.expenseValue}>
              -{sym}{summary.monthlyExpense.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
          </View>
        </View>
      </View>

      {/* CUENTAS & NÓMINA */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Cuentas & Nómina</Text>
        <TouchableOpacity
          style={styles.addAccountBtn}
          onPress={() => setShowAccountModal(true)}
        >
          <Plus size={14} color={FamilyMint.primary} />
          <Text style={styles.addAccountBtnText}>Nueva Cuenta</Text>
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
        {accounts.map((acc) => {
          const isPayroll = acc.type === 'PAYROLL';
          const pAmount = Number(acc.payrollAmount || 0);
          const pFreq = acc.payrollFrequency === 'BIWEEKLY' ? 'Quincenal' : 'Mensual';

          return (
            <View key={acc.id} style={[styles.accountCard, isPayroll && styles.accountCardPayroll]}>
              <View style={styles.accountCardHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                  {isPayroll ? (
                    <Briefcase size={16} color={FamilyMint.primary} />
                  ) : (
                    <Building2 size={16} color={FamilyMint.foregroundMuted} />
                  )}
                  <Text style={styles.accountCardName} numberOfLines={1}>{acc.name}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <View style={[styles.accountTypeBadge, isPayroll && styles.payrollBadge]}>
                    <Text style={[styles.accountTypeBadgeText, isPayroll && styles.payrollBadgeText]}>
                      {isPayroll ? 'Nómina' : getAccountTypeName(acc.type)}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => {
                      setSelectedAccountForEdit(acc);
                      setShowEditAccountModal(true);
                    }}
                    style={styles.editAccountPencilBtn}
                  >
                    <Edit3 size={12} color={FamilyMint.foregroundMuted} />
                  </TouchableOpacity>
                </View>
              </View>

              <Text style={styles.accountBalanceLabel}>Saldo Disponible ({acc.currency || 'USD'})</Text>
              <Text style={styles.accountBalanceValue}>
                ${Number(acc.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </Text>

              {isPayroll && (
                <View style={styles.payrollInfoBox}>
                  <Text style={styles.payrollInfoText}>
                    {pFreq} • Salario: ${pAmount.toLocaleString('en-US', { minimumFractionDigits: 0 })}
                  </Text>
                  <Text style={acc.payrollAutoDeposit ? styles.payrollAutoBadge : styles.payrollManualBadge}>
                    {acc.payrollAutoDeposit ? '● Auto-abono activo' : '○ Abono manual'}
                  </Text>

                  <TouchableOpacity
                    style={[styles.payrollDepositBtn, depositingAccId === acc.id && { opacity: 0.6 }]}
                    onPress={() => handleTriggerPayrollDeposit(acc)}
                    disabled={depositingAccId === acc.id}
                  >
                    {depositingAccId === acc.id ? (
                      <ActivityIndicator size="small" color="#0A1128" />
                    ) : (
                      <Text style={styles.payrollDepositBtnText}>Acreditar Nómina</Text>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>

      {/* RECORDATORIOS DE PAGO */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recordatorios de Pago</Text>
        <Text style={styles.sectionBadge}>{pendingCount} pendientes</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
        {reminders.map((r) => (
          <View key={r.id} style={[styles.reminderCard, r.isPaid && styles.reminderPaid]}>
            <View style={styles.reminderHeader}>
              <TouchableOpacity style={{ flex: 1 }} onPress={() => handleToggleReminder(r)}>
                <Text style={styles.reminderTitle} numberOfLines={1}>{r.title}</Text>
              </TouchableOpacity>
              {r.isPaid ? (
                <Check size={16} color={FamilyMint.primary} />
              ) : (
                <Circle size={16} color={FamilyMint.foregroundSubtle} />
              )}
            </View>

            <TouchableOpacity onPress={() => handleToggleReminder(r)}>
              <Text style={[styles.reminderAmount, r.isPaid && styles.reminderAmountPaid]}>
                ${Number(r.amount).toLocaleString()}
              </Text>
              <Text style={styles.reminderDate}>Vence: {new Date(r.dueDate).toLocaleDateString()}</Text>
            </TouchableOpacity>

            <View style={styles.cardActionsRow}>
              <TouchableOpacity onPress={() => handleOpenEditReminder(r)}>
                <Edit3 size={13} color={FamilyMint.foregroundMuted} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDeleteReminder(r.id)}>
                <Trash2 size={13} color={FamilyMint.expense} />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* TRANSACCIONES RECIENTES */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Últimos Movimientos</Text>
        <Text style={styles.sectionBadge}>{transactions.length} registros</Text>
      </View>

      {transactions.map((tx) => (
        <View key={tx.id} style={[styles.txCard, tx.isVoided && { opacity: 0.5 }]}>
          <View style={styles.txLeft}>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <Text style={[styles.txTitle, tx.isVoided && { textDecorationLine: 'line-through', color: FamilyMint.foregroundSubtle }]}>
                  {tx.title || tx.description || 'Movimiento'}
                </Text>
                {tx.isVoided && (
                  <View style={{ backgroundColor: FamilyMint.expenseBg, paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4 }}>
                    <Text style={{ color: FamilyMint.expense, fontSize: 9, fontWeight: '700' }}>Anulado</Text>
                  </View>
                )}
                {!tx.isVoided && tx.isEdited && (
                  <View style={{ backgroundColor: FamilyMint.warningBg, paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4 }}>
                    <Text style={{ color: FamilyMint.warning, fontSize: 9, fontWeight: '700' }}>Editado</Text>
                  </View>
                )}
              </View>

              <Text style={styles.txSub}>
                {tx.account?.name || 'Cuenta'} {tx.category ? `• ${tx.category?.name || tx.category}` : ''}
              </Text>

              {tx.isEdited && tx.editReason && !tx.isVoided && (
                <Text style={{ fontSize: 10, color: FamilyMint.warning, fontStyle: 'italic', marginTop: 2 }}>
                  Motivo: "{tx.editReason}"
                </Text>
              )}
              {tx.isVoided && tx.voidReason && (
                <Text style={{ fontSize: 10, color: FamilyMint.expense, fontStyle: 'italic', marginTop: 2 }}>
                  Motivo anulación: "{tx.voidReason}"
                </Text>
              )}
            </View>
          </View>

          <View style={{ alignItems: 'flex-end', gap: 4 }}>
            <Text
              style={[
                styles.txAmount,
                tx.isVoided && { textDecorationLine: 'line-through', color: FamilyMint.foregroundSubtle },
                tx.type === 'INCOME' && !tx.isVoided && { color: FamilyMint.income },
              ]}
            >
              {tx.type === 'INCOME' ? '+' : '-'}${Number(tx.amount).toFixed(2)}
            </Text>

            {!tx.isVoided && (
              <View style={{ flexDirection: 'row', gap: 6 }}>
                <TouchableOpacity
                  onPress={() => {
                    setSelectedTxForEdit(tx);
                    setEditTxDescription(tx.title || tx.description || '');
                    setEditTxAmount(String(tx.amount || ''));
                    setEditTxReason('');
                    setShowEditTxModal(true);
                  }}
                  style={styles.actionBtnSmall}
                >
                  <Edit3 size={11} color={FamilyMint.foregroundMuted} />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    setSelectedTxForVoid(tx);
                    setVoidReason('');
                    setShowVoidTxModal(true);
                  }}
                  style={styles.actionBtnSmall}
                >
                  <Trash2 size={11} color={FamilyMint.expense} />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      ))}

      {/* Modales Reutilizables */}
      <HouseholdSelectorModal
        visible={showHouseholdModal}
        onClose={() => setShowHouseholdModal(false)}
        onSwitched={() => loadData()}
      />

      <TransactionModal
        visible={showTxModal}
        onClose={() => setShowTxModal(false)}
        accounts={accounts}
        categories={categories}
        initialType={txInitialType}
        onSuccess={() => loadData()}
      />

      <AccountModal
        visible={showAccountModal}
        onClose={() => setShowAccountModal(false)}
        onSuccess={() => loadData()}
      />

      <EditAccountModal
        visible={showEditAccountModal}
        onClose={() => {
          setShowEditAccountModal(false);
          setSelectedAccountForEdit(null);
        }}
        account={selectedAccountForEdit}
        onSuccess={() => loadData()}
      />

      <ReceiptScanModal
        visible={showReceiptModal}
        onClose={() => setShowReceiptModal(false)}
        accounts={accounts}
        categories={categories}
        onSuccess={() => loadData()}
      />

      <TelegramBotModal
        visible={showTelegramModal}
        onClose={() => setShowTelegramModal(false)}
      />

      {/* Modal Notificaciones */}
      <Modal visible={showNotifModal} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Notificaciones</Text>
              <TouchableOpacity onPress={() => setShowNotifModal(false)}>
                <Text style={{ color: FamilyMint.foregroundSubtle, fontSize: 18 }}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 320 }}>
              {notifications.length === 0 ? (
                <Text style={{ color: FamilyMint.foregroundSubtle, fontSize: 12, textAlign: 'center', marginVertical: 20 }}>
                  No tienes notificaciones pendientes.
                </Text>
              ) : (
                notifications.map((n) => (
                  <View key={n.id} style={[styles.notifItem, n.isRead && { opacity: 0.5 }]}>
                    <Text style={styles.notifItemTitle}>{n.title}</Text>
                    <Text style={styles.notifItemBody}>{n.body}</Text>
                    <Text style={{ color: FamilyMint.foregroundSubtle, fontSize: 9, marginTop: 4 }}>
                      {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal Editar Recordatorio */}
      <Modal visible={showEditReminderModal} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Editar Recordatorio</Text>
            <TextInput
              style={styles.modalInput}
              value={editTitle}
              onChangeText={setEditTitle}
              placeholder="Título"
              placeholderTextColor={FamilyMint.foregroundSubtle}
            />
            <TextInput
              style={styles.modalInput}
              value={editAmount}
              onChangeText={setEditAmount}
              placeholder="Monto"
              keyboardType="numeric"
              placeholderTextColor={FamilyMint.foregroundSubtle}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowEditReminderModal(false)}>
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleConfirmEditReminder}>
                <Text style={styles.saveBtnText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Pagar Recordatorio */}
      <Modal visible={showPayModal} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Pagar y Descontar</Text>
            <Text style={{ color: FamilyMint.foregroundMuted, fontSize: 13, marginBottom: 12 }}>
              ¿De qué cuenta deseas debitar ${payingReminder?.amount}?
            </Text>
            {accounts.map((a) => (
              <TouchableOpacity
                key={a.id}
                style={[
                  styles.accountSelectRow,
                  selectedPayAccountId === a.id && styles.accountSelectRowActive,
                ]}
                onPress={() => setSelectedPayAccountId(a.id)}
              >
                <Text style={{ color: FamilyMint.foreground, fontWeight: '600', fontSize: 13 }}>{a.name}</Text>
                <Text style={{ color: FamilyMint.foregroundMuted, fontSize: 12 }}>${Number(a.balance).toFixed(2)}</Text>
              </TouchableOpacity>
            ))}
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowPayModal(false)}>
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleConfirmPayReminder}>
                <Text style={styles.saveBtnText}>Confirmar Pago</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Anular Transacción */}
      <Modal visible={showVoidTxModal} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <Text style={[styles.modalTitle, { color: FamilyMint.expense }]}>Anular Transacción</Text>
            <Text style={{ color: FamilyMint.foregroundMuted, fontSize: 12, marginBottom: 10 }}>
              Ingresa el motivo obligatorio para la auditoría contable:
            </Text>
            <TextInput
              style={styles.modalInput}
              value={voidReason}
              onChangeText={setVoidReason}
              placeholder="Ej: Registro duplicado, error en monto..."
              placeholderTextColor={FamilyMint.foregroundSubtle}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowVoidTxModal(false)}>
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: FamilyMint.expense }]}
                onPress={handleConfirmVoidTx}
              >
                <Text style={[styles.saveBtnText, { color: '#FFFFFF' }]}>Anular Movimiento</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Editar Transacción */}
      <Modal visible={showEditTxModal} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Editar Movimiento</Text>
            <TextInput
              style={styles.modalInput}
              value={editTxDescription}
              onChangeText={setEditTxDescription}
              placeholder="Descripción"
              placeholderTextColor={FamilyMint.foregroundSubtle}
            />
            <TextInput
              style={styles.modalInput}
              value={editTxAmount}
              onChangeText={setEditTxAmount}
              placeholder="Monto"
              keyboardType="numeric"
              placeholderTextColor={FamilyMint.foregroundSubtle}
            />
            <TextInput
              style={styles.modalInput}
              value={editTxReason}
              onChangeText={setEditTxReason}
              placeholder="Motivo del cambio (Obligatorio) *"
              placeholderTextColor={FamilyMint.foregroundSubtle}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowEditTxModal(false)}>
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: FamilyMint.warning }]}
                onPress={handleConfirmEditTx}
              >
                <Text style={[styles.saveBtnText, { color: '#0A1128' }]}>Guardar Edición</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: FamilyMint.background },
  contentContainer: { padding: 16, paddingTop: 48, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  householdSelectorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: FamilyMint.surfaceElevated,
    borderWidth: 1,
    borderColor: FamilyMint.border,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  householdSelectorText: {
    fontSize: 11,
    fontWeight: '600',
    color: FamilyMint.primary,
    maxWidth: 160,
  },
  headerIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: FamilyMint.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: FamilyMint.border,
  },
  notifBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    backgroundColor: FamilyMint.expense,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  notifBadgeText: { color: '#ffffff', fontSize: 9, fontWeight: 'bold' },
  quickAddBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  quickAddText: { fontWeight: '700', fontSize: 14 },
  kpiContainer: { marginBottom: 20 },
  kpiCardMain: {
    backgroundColor: FamilyMint.surface,
    borderRadius: 20,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: FamilyMint.border,
  },
  kpiTitle: { fontSize: 10, fontWeight: '700', color: FamilyMint.foregroundSubtle, letterSpacing: 1, marginBottom: 4 },
  kpiValueMain: { fontSize: 32, fontWeight: '900', color: FamilyMint.foreground },
  kpiSub: { fontSize: 11, color: FamilyMint.foregroundSubtle, marginTop: 4 },
  kpiRow: { flexDirection: 'row', gap: 12 },
  kpiCardHalf: { flex: 1, backgroundColor: FamilyMint.surface, borderRadius: 16, padding: 14, borderWidth: 1 },
  incomeCard: { borderColor: 'rgba(16, 185, 129, 0.2)' },
  incomeTitle: { fontSize: 10, fontWeight: '700', color: FamilyMint.income },
  incomeValue: { fontSize: 18, fontWeight: '700', color: FamilyMint.income, marginTop: 2 },
  expenseCard: { borderColor: 'rgba(244, 63, 94, 0.2)' },
  expenseTitle: { fontSize: 10, fontWeight: '700', color: FamilyMint.expense },
  expenseValue: { fontSize: 18, fontWeight: '700', color: FamilyMint.expense, marginTop: 2 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, marginTop: 8 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: FamilyMint.foreground },
  sectionBadge: { fontSize: 11, color: FamilyMint.foregroundSubtle },
  addAccountBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: FamilyMint.primaryMuted,
    borderWidth: 1,
    borderColor: FamilyMint.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  addAccountBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: FamilyMint.primary,
  },
  horizontalScroll: { marginBottom: 20 },
  accountCard: {
    width: 220,
    backgroundColor: FamilyMint.surface,
    borderRadius: 16,
    padding: 14,
    marginRight: 12,
    borderWidth: 1,
    borderColor: FamilyMint.border,
  },
  accountCardPayroll: {
    borderColor: 'rgba(16, 185, 129, 0.4)',
    backgroundColor: FamilyMint.surfaceElevated,
  },
  accountCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  accountCardName: { fontSize: 13, fontWeight: '700', color: FamilyMint.foreground, flex: 1 },
  accountTypeBadge: {
    backgroundColor: FamilyMint.surfaceElevated,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  payrollBadge: { backgroundColor: FamilyMint.primaryMuted, borderWidth: 1, borderColor: FamilyMint.primary },
  accountTypeBadgeText: { color: FamilyMint.foregroundSubtle, fontSize: 10, fontWeight: '600' },
  payrollBadgeText: { color: FamilyMint.primary, fontSize: 10, fontWeight: '700' },
  accountBalanceLabel: { fontSize: 10, color: FamilyMint.foregroundSubtle },
  accountBalanceValue: { fontSize: 18, fontWeight: '900', color: FamilyMint.foreground, marginTop: 2 },
  payrollInfoBox: {
    backgroundColor: FamilyMint.surfaceElevated,
    padding: 8,
    borderRadius: 8,
    marginTop: 8,
  },
  payrollInfoText: { fontSize: 10, color: FamilyMint.foregroundMuted, fontWeight: '500' },
  payrollAutoBadge: { fontSize: 9, color: FamilyMint.income, fontWeight: '700', marginTop: 3 },
  payrollManualBadge: { fontSize: 9, color: FamilyMint.foregroundSubtle, marginTop: 3 },
  payrollDepositBtn: {
    backgroundColor: FamilyMint.primary,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 8,
  },
  payrollDepositBtnText: { color: '#0A1128', fontSize: 10, fontWeight: '700' },
  reminderCard: {
    width: 145,
    backgroundColor: FamilyMint.surface,
    borderRadius: 14,
    padding: 12,
    marginRight: 10,
    borderWidth: 1,
    borderColor: FamilyMint.border,
  },
  reminderPaid: { opacity: 0.5 },
  reminderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  reminderTitle: { fontSize: 11, fontWeight: '700', color: FamilyMint.foreground },
  reminderAmount: { fontSize: 16, fontWeight: '800', color: FamilyMint.primary },
  reminderAmountPaid: { color: FamilyMint.foregroundSubtle, textDecorationLine: 'line-through' },
  reminderDate: { fontSize: 9, color: FamilyMint.foregroundSubtle, marginTop: 4 },
  cardActionsRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 8, paddingTop: 6, borderTopWidth: 1, borderTopColor: FamilyMint.border },
  txCard: {
    backgroundColor: FamilyMint.surface,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: FamilyMint.border,
  },
  txLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', marginRight: 8 },
  txTitle: { fontSize: 13, fontWeight: '700', color: FamilyMint.foreground },
  txSub: { fontSize: 11, color: FamilyMint.foregroundSubtle, marginTop: 2 },
  txAmount: { fontSize: 14, fontWeight: '700', color: FamilyMint.expense },
  actionBtnSmall: { padding: 6, borderRadius: 6, backgroundColor: FamilyMint.surfaceElevated, borderWidth: 1, borderColor: FamilyMint.border },
  modalBg: { flex: 1, backgroundColor: 'rgba(5, 10, 24, 0.85)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: FamilyMint.surface, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: FamilyMint.border },
  modalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: FamilyMint.foreground },
  modalInput: { backgroundColor: FamilyMint.surfaceElevated, borderRadius: 10, padding: 12, color: FamilyMint.foreground, marginBottom: 12, borderWidth: 1, borderColor: FamilyMint.border },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 10 },
  cancelBtn: { padding: 10, borderRadius: 8, backgroundColor: FamilyMint.surfaceElevated, borderWidth: 1, borderColor: FamilyMint.border },
  cancelBtnText: { color: FamilyMint.foregroundMuted, fontSize: 12, fontWeight: '600' },
  saveBtn: { padding: 10, borderRadius: 8, backgroundColor: FamilyMint.primary },
  saveBtnText: { color: '#0A1128', fontSize: 12, fontWeight: '700' },
  notifItem: { backgroundColor: FamilyMint.surfaceElevated, padding: 12, borderRadius: 10, marginBottom: 8, borderWidth: 1, borderColor: FamilyMint.border },
  notifItemTitle: { fontSize: 12, fontWeight: '700', color: FamilyMint.foreground },
  notifItemBody: { fontSize: 11, color: FamilyMint.foregroundMuted, marginTop: 2 },
  accountSelectRow: { padding: 12, borderRadius: 10, backgroundColor: FamilyMint.surfaceElevated, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', borderWidth: 1, borderColor: FamilyMint.border },
  accountSelectRowActive: { borderColor: FamilyMint.primary, backgroundColor: FamilyMint.primaryMuted },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
    borderRadius: 14,
    padding: 12,
    marginTop: 8,
    marginBottom: 4,
  },
  offlineBannerTitle: { fontSize: 13, fontWeight: '700', color: '#F59E0B' },
  offlineBannerSub: { fontSize: 11, color: FamilyMint.foregroundSubtle, marginTop: 2 },
  offlineSyncBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F59E0B',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    marginLeft: 8,
  },
  offlineSyncBtnText: { color: '#0A1128', fontWeight: '800', fontSize: 12 },
  editAccountPencilBtn: {
    padding: 4,
    borderRadius: 6,
    backgroundColor: FamilyMint.surfaceElevated,
    borderWidth: 1,
    borderColor: FamilyMint.border,
  },
  currencySelectorContainer: {
    backgroundColor: FamilyMint.surface,
    borderWidth: 1,
    borderColor: FamilyMint.border,
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
  },
  currencySelectorLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: FamilyMint.foregroundMuted,
  },
  currencyActiveBadge: {
    backgroundColor: FamilyMint.primaryMuted,
    borderWidth: 1,
    borderColor: FamilyMint.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  currencyActiveBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: FamilyMint.primary,
  },
  currencyPillsScroll: {
    marginTop: 2,
  },
  currencyPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: FamilyMint.surfaceElevated,
    borderWidth: 1,
    borderColor: FamilyMint.border,
    marginRight: 6,
  },
  currencyPillActive: {
    backgroundColor: FamilyMint.primary,
    borderColor: FamilyMint.primary,
  },
  currencyPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: FamilyMint.foregroundMuted,
  },
  currencyPillTextActive: {
    color: '#0A1128',
    fontWeight: '800',
  },
  stsBreakdownBox: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(30, 43, 77, 0.7)',
    gap: 5,
  },
  stsBreakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stsBreakdownLabel: {
    fontSize: 11,
    color: FamilyMint.foregroundMuted,
  },
  stsBreakdownValue: {
    fontSize: 11,
    fontWeight: '600',
    color: FamilyMint.foreground,
  },
  stsFormulaText: {
    fontSize: 10,
    color: FamilyMint.foregroundSubtle,
    fontStyle: 'italic',
    marginTop: 4,
    textAlign: 'center',
  },
});
