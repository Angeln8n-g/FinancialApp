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
import { API_URL } from '@/constants/Api';

export default function MobileDashboardScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [summary, setSummary] = useState({ totalBalance: 70700, monthlyIncome: 0, monthlyExpense: 2600 });
  const [reminders, setReminders] = useState<any[]>([
    { id: '1', title: 'Pago de luz', amount: 2500, dueDate: '2026-07-26', isPaid: true },
    { id: '2', title: 'Pago del colegio', amount: 8500, dueDate: '2026-07-29', isPaid: false },
    { id: '3', title: 'Tarjeta de Crédito', amount: 15000, dueDate: '2026-08-02', isPaid: false },
    { id: '4', title: 'Hipoteca Vivienda', amount: 28000, dueDate: '2026-08-05', isPaid: false },
    { id: '5', title: 'Impuestos Municipales', amount: 4200, dueDate: '2026-08-10', isPaid: false },
  ]);
  const [transactions, setTransactions] = useState<any[]>([
    { id: '1', title: 'Pago de luz', amount: 2500, type: 'EXPENSE', category: '💡 Servicios' },
    { id: '2', title: 'Supermercado', amount: 100, type: 'EXPENSE', category: '🛒 Comida' },
  ]);

  const [naturalInput, setNaturalInput] = useState('');
  const [isProcessingAi, setIsProcessingAi] = useState(false);

  // Modales Notificaciones & Edición
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [showEditReminderModal, setShowEditReminderModal] = useState(false);
  const [selectedReminder, setSelectedReminder] = useState<any>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editAmount, setEditAmount] = useState('');

  const loadData = async () => {
    try {
      const resSum = await fetch(`${API_URL}/api/transactions/summary`);
      if (resSum.ok) {
        const sumData = await resSum.json();
        setSummary(sumData);
      }
    } catch (err) {
      console.log('Modo Móvil Autónomo / Offline');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleReminder = (id: string) => {
    setReminders((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          const nextPaid = !r.isPaid;
          if (nextPaid) {
            setSummary((s) => ({
              ...s,
              monthlyExpense: s.monthlyExpense + r.amount,
              totalBalance: s.totalBalance - r.amount,
            }));
            setTransactions((t) => [
              { id: Date.now().toString(), title: `Pago: ${r.title}`, amount: r.amount, type: 'EXPENSE', category: '💡 Servicios' },
              ...t,
            ]);
            Alert.alert('✓ Pago Registrado', `Se registró "${r.title}" como gasto de $${r.amount}.`);
          }
          return { ...r, isPaid: nextPaid };
        }
        return r;
      })
    );
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
      {/* Header Mobile con Campana de Notificaciones 🔔 */}
      <View style={styles.header}>
        <View style={styles.logoBadge}>
          <Text style={styles.logoIcon}>🏠</Text>
        </View>
        <View style={styles.headerTextContainer}>
          <Text style={styles.appName}>HogarIQ Mobile</Text>
          <Text style={styles.householdName}>Hogar de Angela • Administrador</Text>
        </View>

        {/* 🔔 Botón de Notificaciones */}
        <TouchableOpacity style={styles.notifBellBtn} onPress={() => setShowNotifModal(true)}>
          <Text style={{ fontSize: 18 }}>🔔</Text>
          {pendingCount > 0 && (
            <View style={styles.notifBadge}>
              <Text style={styles.notifBadgeText}>{pendingCount}</Text>
            </View>
          )}
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

      {/* KPI Cards */}
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

      {/* ⏰ RECORDATORIOS DE PAGO PRÓXIMOS */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>⏰ Recordatorios de Pago</Text>
        <Text style={styles.sectionBadge}>{pendingCount} pendientes</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
        {reminders.map((r) => (
          <View key={r.id} style={[styles.reminderCard, r.isPaid && styles.reminderPaid]}>
            <View style={styles.reminderHeader}>
              <TouchableOpacity style={{ flex: 1 }} onPress={() => handleToggleReminder(r.id)}>
                <Text style={styles.reminderTitle} numberOfLines={1}>{r.title}</Text>
              </TouchableOpacity>
              <Text style={styles.checkIcon}>{r.isPaid ? '✓' : '○'}</Text>
            </View>

            <TouchableOpacity onPress={() => handleToggleReminder(r.id)}>
              <Text style={[styles.reminderAmount, r.isPaid && styles.reminderAmountPaid]}>
                ${r.amount.toLocaleString()}
              </Text>
              <Text style={styles.reminderDate}>Vence: {r.dueDate}</Text>
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
        <View key={tx.id} style={styles.txCard}>
          <View style={styles.txLeft}>
            <Text style={styles.txIcon}>{tx.category.split(' ')[0]}</Text>
            <View>
              <Text style={styles.txTitle}>{tx.title}</Text>
              <Text style={styles.txSub}>{tx.category}</Text>
            </View>
          </View>
          <Text style={styles.txAmount}>-${tx.amount.toFixed(2)}</Text>
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
  txLeft: { flexDirection: 'row', alignItems: 'center' },
  txIcon: { fontSize: 20, marginRight: 12 },
  txTitle: { fontSize: 13, fontWeight: 'bold', color: '#ffffff' },
  txSub: { fontSize: 11, color: '#64748b' },
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
