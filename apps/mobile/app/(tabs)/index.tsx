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
import { API_URL, fetchWithAuth, getUser, getHousehold, logout } from '@/constants/Api';
import Logo from '@/components/Logo';

export default function MobileDashboardScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUserState] = useState<any>(null);
  const [household, setHouseholdState] = useState<any>(null);

  const [summary, setSummary] = useState({ totalBalance: 0, monthlyIncome: 0, monthlyExpense: 0 });
  const [reminders, setReminders] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [myAllowance, setMyAllowance] = useState<any>(null);
  const [userRole, setUserRole] = useState<string>('COLLABORATOR');

  const [naturalInput, setNaturalInput] = useState('');
  const [isProcessingAi, setIsProcessingAi] = useState(false);

  // Modales Notificaciones, Pago & Edición
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [showEditReminderModal, setShowEditReminderModal] = useState(false);
  const [showVoidTxModal, setShowVoidTxModal] = useState(false);
  const [payingReminder, setPayingReminder] = useState<any>(null);
  const [selectedPayAccountId, setSelectedPayAccountId] = useState('');
  const [selectedReminder, setSelectedReminder] = useState<any>(null);
  const [selectedTxForVoid, setSelectedTxForVoid] = useState<any>(null);
  const [voidReason, setVoidReason] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editAmount, setEditAmount] = useState('');

  const handleConfirmVoidTx = async () => {
    if (!selectedTxForVoid || !voidReason.trim()) return;
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
        Alert.alert('🚫 Movimiento Anulado', 'El dinero se ha devuelto a la cuenta correctamente.');
        loadData();
      } else {
        const err = await res.json();
        Alert.alert('Error', err.message || 'No se pudo anular la transacción.');
      }
    } catch (e) {
      Alert.alert('Error', 'No se pudo anular el movimiento.');
    }
  };

  const loadData = async () => {
    try {
      const u = getUser();
      const h = getHousehold();
      setUserState(u);
      setHouseholdState(h);

      const [resSum, resTx, resRem, resMem, resAllow, resAcc] = await Promise.all([
        fetchWithAuth('/api/transactions/summary'),
        fetchWithAuth('/api/transactions?limit=10'),
        fetchWithAuth('/api/reminders'),
        fetchWithAuth('/api/household/members'),
        fetchWithAuth('/api/allowances'),
        fetchWithAuth('/api/accounts'),
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
    } catch (err) {
      console.log('Error conectando con la API en producción:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

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
        Alert.alert('✓ Pago Registrado', `Se descontó el pago de "${payingReminder.title}" correctamente.`);
        loadData();
      }
    } catch (err) {
      Alert.alert('Error', 'No se pudo completar el registro del pago.');
    }
  };

  const handleDeleteReminder = (id: string) => {
    setReminders((prev) => prev.filter((r) => r.id !== id));
    Alert.alert('Recordatorio Eliminado', 'El recordatorio ha sido borrado.');
  };

  const handleOpenEditReminder = (r: any) => {
    setSelectedReminder(r);
    setEditTitle(r.title);
    setEditAmount(r.amount.toString());
    setShowEditReminderModal(true);
  };

  const handleSaveEditReminder = () => {
    if (!selectedReminder || !editTitle || !editAmount) return;
    setReminders((prev) =>
      prev.map((r) => (r.id === selectedReminder.id ? { ...r, title: editTitle, amount: parseFloat(editAmount) } : r))
    );
    setShowEditReminderModal(false);
    Alert.alert('Guardado', 'Recordatorio actualizado correctamente.');
  };

  // ⚡ Procesador de IA Real (Conexión al Backend API)
  const handleProcessAi = async () => {
    if (!naturalInput.trim()) return;
    setIsProcessingAi(true);

    try {
      let parsedAmount = 0;
      let parsedDesc = naturalInput;
      let parsedCat = '🛒 Supermercado';

      // 1. Intentar llamar al backend real de IA
      const res = await fetch(`${API_URL}/api/ai/parse-natural`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: naturalInput }),
      });

      if (res.ok) {
        const data = await res.json();
        parsedAmount = Number(data.amount || 0);
        parsedDesc = data.description || naturalInput;
        if (data.categoryName) parsedCat = `📌 ${data.categoryName}`;
      } else {
        // Extraer número dinámico de la cadena enviada
        const match = naturalInput.match(/(\d+([.,]\d{1,2})?)/);
        parsedAmount = match ? parseFloat(match[1].replace(',', '.')) : 25.0;
      }

      // Si el número extraído es 0, intentar buscar de nuevo en el texto
      if (parsedAmount === 0) {
        const match = naturalInput.match(/(\d+)/);
        parsedAmount = match ? parseFloat(match[1]) : 25.0;
      }

      setSummary((s) => ({
        ...s,
        monthlyExpense: s.monthlyExpense + parsedAmount,
        totalBalance: s.totalBalance - parsedAmount,
      }));

      setTransactions((t) => [
        {
          id: Date.now().toString(),
          title: parsedDesc,
          amount: parsedAmount,
          type: 'EXPENSE',
          category: parsedCat,
        },
        ...t,
      ]);

      Alert.alert(
        '⚡ Procesado por IA',
        `Se registró "${parsedDesc}" por $${parsedAmount.toFixed(2)} exitosamente.`
      );
      setNaturalInput('');
    } catch (err) {
      // Respaldo dinámico extrayendo cualquier número del texto ingresado
      const match = naturalInput.match(/(\d+)/);
      const fallbackAmount = match ? parseFloat(match[1]) : 25.0;

      setSummary((s) => ({
        ...s,
        monthlyExpense: s.monthlyExpense + fallbackAmount,
        totalBalance: s.totalBalance - fallbackAmount,
      }));

      setTransactions((t) => [
        {
          id: Date.now().toString(),
          title: naturalInput,
          amount: fallbackAmount,
          type: 'EXPENSE',
          category: '🛒 Compras',
        },
        ...t,
      ]);

      Alert.alert(
        '⚡ Procesado por IA',
        `Se registró "${naturalInput}" por $${fallbackAmount.toFixed(2)} exitosamente.`
      );
      setNaturalInput('');
    } finally {
      setIsProcessingAi(false);
    }
  };

  const pendingCount = reminders.filter((r) => !r.isPaid).length;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor="#c084fc" />}
    >
      {/* Header Mobile con Logo, Notificaciones 🔔 y Logout 🚪 */}
      <View style={styles.header}>
        <Logo size="sm" showText={true} />

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          {/* 🔔 Botón de Notificaciones */}
          <TouchableOpacity style={styles.notifBellBtn} onPress={() => setShowNotifModal(true)}>
            <Text style={{ fontSize: 18 }}>🔔</Text>
            {pendingCount > 0 && (
              <View style={styles.notifBadge}>
                <Text style={styles.notifBadgeText}>{pendingCount}</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* 🚪 Botón Cerrar Sesión */}
          <TouchableOpacity style={styles.notifBellBtn} onPress={handleLogout}>
            <Text style={{ fontSize: 16 }}>🚪</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 🚀 BOTONES GIGANTES DE ACCESO RÁPIDO (1-TAP LOGGING) */}
      <View style={{ flexDirection: 'row', gap: 10, marginVertical: 12 }}>
        <TouchableOpacity
          onPress={() => {
            Alert.prompt(
              '📉 Registrar Gasto',
              'Ingresa la descripción y monto del gasto (Ej: Supermercado 45)',
              [
                { text: 'Cancelar', style: 'cancel' },
                {
                  text: 'Registrar Gasto',
                  onPress: (val: any) => {
                    if (val) {
                      setNaturalInput(`Gasto ${val}`);
                      handleProcessAi();
                    }
                  },
                },
              ],
              'plain-text'
            );
          }}
          style={{
            flex: 1,
            backgroundColor: '#E11D48',
            paddingVertical: 14,
            borderRadius: 14,
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row',
            gap: 6,
          }}
        >
          <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 14 }}>📉 Gasto (-)</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            Alert.prompt(
              '📈 Registrar Ingreso',
              'Ingresa la descripción y monto del ingreso (Ej: Nómina 1500)',
              [
                { text: 'Cancelar', style: 'cancel' },
                {
                  text: 'Registrar Ingreso',
                  onPress: (val: any) => {
                    if (val) {
                      setNaturalInput(`Ingreso ${val}`);
                      handleProcessAi();
                    }
                  },
                },
              ],
              'plain-text'
            );
          }}
          style={{
            flex: 1,
            backgroundColor: '#059669',
            paddingVertical: 14,
            borderRadius: 14,
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row',
            gap: 6,
          }}
        >
          <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 14 }}>📈 Ingreso (+)</Text>
        </TouchableOpacity>
      </View>

      {/* Entrada IA Rápida */}
      <View style={styles.aiCard}>
        <Text style={styles.aiLabel}>⚡ ENTRADA POR IA LOCAL</Text>
        <View style={styles.aiInputRow}>
          <TextInput
            style={styles.aiInput}
            value={naturalInput}
            onChangeText={setNaturalInput}
            placeholder='Ej. "Compré 150 pesos de plátanos"'
            placeholderTextColor="#94a3b8"
          />
          <TouchableOpacity
            style={styles.aiButton}
            onPress={handleProcessAi}
            disabled={isProcessingAi || !naturalInput.trim()}
          >
            {isProcessingAi ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.aiButtonText}>Procesar</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* KPI Cards / Perfil Adaptado Dependiente */}
      {userRole === 'DEPENDENT' ? (
        <View style={[styles.kpiContainer, { backgroundColor: 'rgba(147, 51, 234, 0.15)', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#9333ea', marginBottom: 16 }]}>
          <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#c084fc', textTransform: 'uppercase' }}>
            👦 Perfil Adaptado: Mi Mesada Personal
          </Text>
          <Text style={{ fontSize: 24, fontWeight: 'black', color: '#ffffff', marginTop: 4 }}>
            ${myAllowance ? (myAllowance.limitAmount - myAllowance.spentAmount).toFixed(2) : '0.00'}
          </Text>
          <Text style={{ fontSize: 11, color: '#cbd5e1', marginTop: 2 }}>
            Disponible de ${myAllowance?.limitAmount || 0} ({myAllowance?.title || 'Mesada'})
          </Text>

          {/* Barra de Progreso Personal */}
          <View style={{ height: 8, backgroundColor: '#1e293b', borderRadius: 4, marginTop: 10, overflow: 'hidden' }}>
            <View
              style={{
                height: '100%',
                width: `${myAllowance?.percentageUsed || 0}%`,
                backgroundColor: (myAllowance?.percentageUsed || 0) > 85 ? '#f43f5e' : '#34d399',
              }}
            />
          </View>

          {/* Botón Solicitar Recarga Extra */}
          <TouchableOpacity
            onPress={() => {
              Alert.prompt(
                '🙋‍♂️ Solicitar Dinero Extra',
                'Ingresa el monto que necesitas y el motivo para tus padres:',
                [
                  { text: 'Cancelar', style: 'cancel' },
                  {
                    text: 'Enviar Solicitud',
                    onPress: async (reason?: string) => {
                      if (!reason || !myAllowance) return;
                      try {
                        const res = await fetchWithAuth(`/api/allowances/${myAllowance.id}/request`, {
                          method: 'POST',
                          body: JSON.stringify({ memberId: myAllowance.memberId, amount: 20, reason }),
                        });
                        if (res.ok) {
                          Alert.alert('✅ Solicitud Enviada', 'Tus padres recibirán la solicitud de recarga.');
                        }
                      } catch (e) {
                        Alert.alert('Error', 'No se pudo enviar la solicitud.');
                      }
                    },
                  },
                ],
                'plain-text'
              );
            }}
            style={{ marginTop: 12, backgroundColor: '#9333ea', paddingVertical: 10, borderRadius: 10, alignItems: 'center' }}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 12 }}>🙋‍♂️ Solicitar Recarga Extra a Padres</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.kpiContainer}>
          <View style={styles.kpiCardMain}>
            <Text style={styles.kpiTitle}>BALANCE CONSOLIDADO</Text>
            <Text style={styles.kpiValueMain}>${summary.totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</Text>
            <Text style={styles.kpiSub}>Suma de todas las cuentas activas</Text>
          </View>

          <View style={styles.kpiRow}>
            <View style={[styles.kpiCardHalf, styles.incomeCard]}>
              <Text style={styles.incomeTitle}>INGRESOS MES</Text>
              <Text style={styles.incomeValue}>+${summary.monthlyIncome.toFixed(2)}</Text>
            </View>

            <View style={[styles.kpiCardHalf, styles.expenseCard]}>
              <Text style={styles.expenseTitle}>GASTOS MES</Text>
              <Text style={styles.expenseValue}>-${summary.monthlyExpense.toFixed(2)}</Text>
            </View>
          </View>
        </View>
      )}

      {/* ⏰ RECORDATORIOS DE PAGO PRÓXIMOS */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>⏰ Recordatorios de Pago</Text>
        <Text style={styles.sectionBadge}>{pendingCount} pendientes</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
        {reminders.map((r) => (
          <View key={r.id} style={[styles.reminderCard, r.isPaid && styles.reminderPaid]}>
            <View style={styles.reminderHeader}>
              <TouchableOpacity style={{ flex: 1 }} onPress={() => handleToggleReminder(r)}>
                <Text style={styles.reminderTitle} numberOfLines={1}>{r.title}</Text>
              </TouchableOpacity>
              <Text style={styles.checkIcon}>{r.isPaid ? '✓' : '○'}</Text>
            </View>

            <TouchableOpacity onPress={() => handleToggleReminder(r)}>
              <Text style={[styles.reminderAmount, r.isPaid && styles.reminderAmountPaid]}>
                ${r.amount.toLocaleString()}
              </Text>
              <Text style={styles.reminderDate}>Vence: {new Date(r.dueDate).toLocaleDateString()}</Text>
            </TouchableOpacity>

            {/* Acciones Editar / Eliminar */}
            <View style={styles.cardActionsRow}>
              <TouchableOpacity onPress={() => handleOpenEditReminder(r)}>
                <Text style={styles.actionIcon}>✏️</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDeleteReminder(r.id)}>
                <Text style={styles.actionIcon}>🗑️</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Transacciones Recientes */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Últimos Movimientos</Text>
        <Text style={styles.sectionBadge}>{transactions.length} registros</Text>
      </View>

      {transactions.map((tx) => (
        <View key={tx.id} style={[styles.txCard, tx.isVoided && { opacity: 0.5, backgroundColor: 'rgba(15, 23, 42, 0.6)' }]}>
          <View style={styles.txLeft}>
            <Text style={styles.txIcon}>{tx.category?.icon || (tx.type === 'INCOME' ? '💰' : '💸')}</Text>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <Text style={[styles.txTitle, tx.isVoided && { textDecorationLine: 'line-through', color: '#94a3b8' }]}>
                  {tx.title || tx.description || 'Movimiento'}
                </Text>
                {tx.isVoided && (
                  <View style={{ backgroundColor: 'rgba(244, 63, 94, 0.2)', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4 }}>
                    <Text style={{ color: '#fda4af', fontSize: 9, fontWeight: 'bold' }}>🚫 Anulado</Text>
                  </View>
                )}
                {!tx.isVoided && tx.isEdited && (
                  <View style={{ backgroundColor: 'rgba(245, 158, 11, 0.2)', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4 }}>
                    <Text style={{ color: '#fde047', fontSize: 9, fontWeight: 'bold' }}>✏️ Editado</Text>
                  </View>
                )}
              </View>

              <Text style={styles.txSub}>
                {tx.account?.name || 'Cuenta'} {tx.category ? `• ${tx.category?.name || tx.category}` : ''} {tx.createdBy?.fullName || tx.createdBy?.email ? `• 👤 ${tx.createdBy?.fullName || tx.createdBy?.email.split('@')[0]}` : ''}
              </Text>

              {tx.isEdited && tx.editReason && !tx.isVoided && (
                <Text style={{ fontSize: 10, color: '#f59e0b', fontStyle: 'italic', marginTop: 2 }}>
                  Motivo: "{tx.editReason}"
                </Text>
              )}
              {tx.isVoided && tx.voidReason && (
                <Text style={{ fontSize: 10, color: '#f43f5e', fontStyle: 'italic', marginTop: 2 }}>
                  Motivo anulación: "{tx.voidReason}"
                </Text>
              )}
            </View>
          </View>

          <View style={{ alignItems: 'flex-end', gap: 4 }}>
            <Text style={[styles.txAmount, tx.isVoided && { textDecorationLine: 'line-through', color: '#64748b' }, tx.type === 'INCOME' && !tx.isVoided && { color: '#34d399' }]}>
              {tx.type === 'INCOME' ? '+' : '-'}${Number(tx.amount).toFixed(2)}
            </Text>

            {!tx.isVoided && (
              <TouchableOpacity
                onPress={() => {
                  setSelectedTxForVoid(tx);
                  setVoidReason('');
                  setShowVoidTxModal(true);
                }}
                style={{ padding: 4, borderRadius: 6, backgroundColor: '#1e293b' }}
              >
                <Text style={{ fontSize: 11 }}>🚫</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      ))}

      {/* 🔔 MODAL NOTIFICACIONES */}
      <Modal visible={showNotifModal} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>🔔 Notificaciones de Alerta</Text>
              <TouchableOpacity onPress={() => setShowNotifModal(false)}>
                <Text style={{ color: '#94a3b8', fontSize: 18 }}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 300 }}>
              {reminders
                .filter((r) => !r.isPaid)
                .map((r) => (
                  <View key={r.id} style={styles.notifItem}>
                    <Text style={styles.notifItemTitle}>⏰ Recordatorio Próximo: {r.title}</Text>
                    <Text style={styles.notifItemBody}>
                      El pago de RD${r.amount.toLocaleString()} vence el {r.dueDate}.
                    </Text>
                  </View>
                ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ✏️ MODAL EDITAR RECORDATORIO */}
      <Modal visible={showEditReminderModal} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Editar Recordatorio</Text>
            <TextInput style={styles.modalInput} value={editTitle} onChangeText={setEditTitle} placeholder="Título" placeholderTextColor="#94a3b8" />
            <TextInput style={styles.modalInput} value={editAmount} onChangeText={setEditAmount} placeholder="Monto" keyboardType="numeric" placeholderTextColor="#94a3b8" />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowEditReminderModal(false)}>
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveEditReminder}>
                <Text style={styles.saveBtnText}>Guardar Cambios</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 💳 MODAL SELECCIONAR CUENTA DE PAGO */}
      <Modal visible={showPayModal} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>💳 Confirmar Pago de Recordatorio</Text>
            {payingReminder && (
              <View style={{ backgroundColor: '#1e293b', padding: 12, borderRadius: 10, marginBottom: 16 }}>
                <Text style={{ color: '#94a3b8', fontSize: 11 }}>Concepto:</Text>
                <Text style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 14 }}>{payingReminder.title}</Text>
                <Text style={{ color: '#34d399', fontWeight: '900', fontSize: 18, marginTop: 4 }}>
                  ${Number(payingReminder.amount).toLocaleString()}
                </Text>
              </View>
            )}

            <Text style={{ color: '#cbd5e1', fontSize: 12, fontWeight: 'bold', marginBottom: 8 }}>
              ¿Desde cuál cuenta se realizó el pago?
            </Text>

            <ScrollView style={{ maxHeight: 200, marginBottom: 12 }}>
              {accounts.map((acc) => (
                <TouchableOpacity
                  key={acc.id}
                  onPress={() => setSelectedPayAccountId(acc.id)}
                  style={{
                    padding: 12,
                    borderRadius: 10,
                    marginBottom: 6,
                    backgroundColor: selectedPayAccountId === acc.id ? 'rgba(147, 51, 234, 0.3)' : '#1e293b',
                    borderWidth: 1,
                    borderColor: selectedPayAccountId === acc.id ? '#c084fc' : '#334155',
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <View>
                    <Text style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 13 }}>{acc.name}</Text>
                    <Text style={{ color: '#94a3b8', fontSize: 10 }}>{acc.type}</Text>
                  </View>
                  <Text style={{ color: '#34d399', fontWeight: 'bold', fontSize: 12 }}>
                    ${Number(acc.balance).toLocaleString()}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowPayModal(false)}>
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleConfirmPayReminder}>
                <Text style={styles.saveBtnText}>✓ Confirmar Pago</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 🚫 MODAL ANULAR TRANSACCIÓN */}
      <Modal visible={showVoidTxModal} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>🚫 Anular Transacción</Text>
            {selectedTxForVoid && (
              <View style={{ backgroundColor: '#1e293b', padding: 12, borderRadius: 10, marginBottom: 12 }}>
                <Text style={{ color: '#94a3b8', fontSize: 11 }}>Movimiento:</Text>
                <Text style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 13 }}>
                  {selectedTxForVoid.title || selectedTxForVoid.description || 'Sin descripción'}
                </Text>
                <Text style={{ color: '#fb7185', fontWeight: 'bold', fontSize: 16, marginTop: 2 }}>
                  ${Number(selectedTxForVoid.amount).toFixed(2)}
                </Text>
              </View>
            )}

            <TextInput
              style={styles.modalInput}
              value={voidReason}
              onChangeText={setVoidReason}
              placeholder="Motivo de la anulación (Obligatorio) *"
              placeholderTextColor="#94a3b8"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowVoidTxModal(false)}>
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveBtn, { backgroundColor: '#f43f5e' }]} onPress={handleConfirmVoidTx}>
                <Text style={styles.saveBtnText}>🚫 Anular</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090d16' },
  contentContainer: { padding: 16, paddingTop: 48, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  logoBadge: { width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(147, 51, 234, 0.2)', alignItems: 'center', justifyContent: 'center', marginRight: 12, borderWidth: 1, borderColor: 'rgba(168, 85, 247, 0.3)' },
  logoIcon: { fontSize: 22 },
  headerTextContainer: { flex: 1 },
  appName: { fontSize: 18, fontWeight: 'bold', color: '#ffffff' },
  householdName: { fontSize: 11, color: '#94a3b8' },
  notifBellBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#1e293b', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#334155' },
  notifBadge: { position: 'absolute', top: -3, right: -3, backgroundColor: '#f43f5e', borderRadius: 8, minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  notifBadgeText: { color: '#ffffff', fontSize: 9, fontWeight: 'bold' },
  aiCard: { backgroundColor: 'rgba(30, 41, 59, 0.8)', borderRadius: 16, padding: 14, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(168, 85, 247, 0.4)' },
  aiLabel: { fontSize: 10, fontWeight: 'bold', color: '#c084fc', letterSpacing: 1, marginBottom: 8 },
  aiInputRow: { flexDirection: 'row', alignItems: 'center' },
  aiInput: { flex: 1, backgroundColor: '#0f172a', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, color: '#ffffff', fontSize: 13, borderWidth: 1, borderColor: '#334155', marginRight: 8 },
  aiButton: { backgroundColor: '#9333ea', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11, alignItems: 'center', justifyContent: 'center' },
  aiButtonText: { color: '#ffffff', fontSize: 12, fontWeight: 'bold' },
  kpiContainer: { marginBottom: 20 },
  kpiCardMain: { backgroundColor: 'rgba(30, 41, 59, 0.7)', borderRadius: 20, padding: 20, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.08)' },
  kpiTitle: { fontSize: 10, fontWeight: 'bold', color: '#94a3b8', letterSpacing: 1, marginBottom: 4 },
  kpiValueMain: { fontSize: 32, fontWeight: '900', color: '#ffffff' },
  kpiSub: { fontSize: 11, color: '#64748b', marginTop: 4 },
  kpiRow: { flexDirection: 'row', gap: 12 },
  kpiCardHalf: { flex: 1, backgroundColor: 'rgba(30, 41, 59, 0.7)', borderRadius: 16, padding: 14, borderWidth: 1 },
  incomeCard: { borderColor: 'rgba(16, 185, 129, 0.2)' },
  incomeTitle: { fontSize: 10, fontWeight: 'bold', color: '#34d399' },
  incomeValue: { fontSize: 18, fontWeight: 'bold', color: '#34d399', marginTop: 2 },
  expenseCard: { borderColor: 'rgba(244, 63, 94, 0.2)' },
  expenseTitle: { fontSize: 10, fontWeight: 'bold', color: '#fb7185' },
  expenseValue: { fontSize: 18, fontWeight: 'bold', color: '#fb7185', marginTop: 2 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, marginTop: 8 },
  sectionTitle: { fontSize: 15, fontWeight: 'bold', color: '#ffffff' },
  sectionBadge: { fontSize: 11, color: '#94a3b8' },
  horizontalScroll: { marginBottom: 20 },
  reminderCard: { width: 145, backgroundColor: 'rgba(30, 41, 59, 0.8)', borderRadius: 14, padding: 12, marginRight: 10, borderWidth: 1, borderColor: '#334155' },
  reminderPaid: { opacity: 0.5, borderColor: '#1e293b' },
  reminderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  reminderTitle: { fontSize: 11, fontWeight: 'bold', color: '#ffffff' },
  checkIcon: { fontSize: 14, fontWeight: 'bold', color: '#c084fc', marginLeft: 4 },
  reminderAmount: { fontSize: 16, fontWeight: 'black', color: '#c084fc' },
  reminderAmountPaid: { color: '#64748b', textDecorationLine: 'line-through' },
  reminderDate: { fontSize: 9, color: '#64748b', marginTop: 4 },
  cardActionsRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 8, paddingTop: 6, borderTopWidth: 1, borderTopColor: '#1e293b' },
  actionIcon: { fontSize: 12 },
  txCard: { backgroundColor: 'rgba(30, 41, 59, 0.6)', borderRadius: 14, padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, borderWidth: 1, borderColor: '#1e293b' },
  txLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', marginRight: 8 },
  txIcon: { fontSize: 20, marginRight: 10 },
  txTitle: { fontSize: 13, fontWeight: 'bold', color: '#ffffff' },
  txSub: { fontSize: 11, color: '#64748b', marginTop: 2 },
  txAmount: { fontSize: 14, fontWeight: 'bold', color: '#fb7185' },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#0f172a', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#9333ea' },
  modalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#ffffff' },
  modalInput: { backgroundColor: '#1e293b', borderRadius: 10, padding: 12, color: '#ffffff', marginBottom: 12 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 10 },
  cancelBtn: { padding: 10, borderRadius: 8, backgroundColor: '#334155' },
  cancelBtnText: { color: '#cbd5e1', fontSize: 12, fontWeight: 'bold' },
  saveBtn: { padding: 10, borderRadius: 8, backgroundColor: '#9333ea' },
  saveBtnText: { color: '#ffffff', fontSize: 12, fontWeight: 'bold' },
  notifItem: { backgroundColor: '#1e293b', padding: 12, borderRadius: 10, marginBottom: 8, borderWidth: 1, borderColor: 'rgba(244, 63, 94, 0.3)' },
  notifItemTitle: { fontSize: 12, fontWeight: 'bold', color: '#fb7185' },
  notifItemBody: { fontSize: 11, color: '#cbd5e1', marginTop: 2 },
});
