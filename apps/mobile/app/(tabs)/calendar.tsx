import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  Modal,
  RefreshControl,
} from 'react-native';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  ArrowDownRight,
  ArrowUpRight,
  Filter,
  X,
} from 'lucide-react-native';
import { fetchWithAuth } from '@/constants/Api';
import { FamilyMint } from '@/constants/Colors';
import TransactionModal from '@/components/modals/TransactionModal';

export default function MobileCalendarScreen() {
  const now = new Date();
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(now.getMonth());

  const [transactions, setTransactions] = useState<any[]>([]);
  const [reminders, setReminders] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  // Filtros
  const [selectedAccountId, setSelectedAccountId] = useState<string>('ALL');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('ALL');

  // Selección de Día y Modales
  const [selectedDayNumber, setSelectedDayNumber] = useState<number | null>(null);
  const [showDayModal, setShowDayModal] = useState(false);
  const [showAddTxModal, setShowAddTxModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
  ];

  const daysOfWeek = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  const loadData = async () => {
    try {
      const [resTx, resRem, resAcc, resCat] = await Promise.all([
        fetchWithAuth('/api/transactions'),
        fetchWithAuth('/api/reminders'),
        fetchWithAuth('/api/accounts'),
        fetchWithAuth('/api/categories'),
      ]);

      if (resTx.ok) {
        const txData = await resTx.json();
        if (Array.isArray(txData)) setTransactions(txData);
      }
      if (resRem.ok) {
        const remData = await resRem.json();
        if (Array.isArray(remData)) setReminders(remData);
      }
      if (resAcc.ok) {
        const accData = await resAcc.json();
        if (Array.isArray(accData)) setAccounts(accData);
      }
      if (resCat.ok) {
        const catData = await resCat.json();
        if (Array.isArray(catData)) setCategories(catData);
      }
    } catch (e) {
      console.log('Error cargando calendario móvil:', e);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfWeekIndex = (new Date(currentYear, currentMonth, 1).getDay() + 6) % 7;

  const getFormattedDateString = (dayNum: number) => {
    const m = (currentMonth + 1).toString().padStart(2, '0');
    const d = dayNum.toString().padStart(2, '0');
    return `${currentYear}-${m}-${d}`;
  };

  // Filtrado de Transacciones según Cuenta y Categoría seleccionada
  const filteredTransactions = transactions.filter((t) => {
    if (selectedAccountId !== 'ALL' && t.accountId !== selectedAccountId) return false;
    if (selectedCategoryId !== 'ALL' && t.categoryId !== selectedCategoryId) return false;
    return true;
  });

  const selectedDateStr = selectedDayNumber ? getFormattedDateString(selectedDayNumber) : '';
  const dayTxs = filteredTransactions.filter((t) => t.date && t.date.startsWith(selectedDateStr));
  const dayReminders = reminders.filter((r) => r.dueDate && r.dueDate.startsWith(selectedDateStr));

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            loadData();
          }}
          tintColor={FamilyMint.primary}
        />
      }
    >
      {/* Header */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.screenTitle}>Calendario Financiero</Text>
          <Text style={styles.screenSub}>Flujo de caja diario y compromisos</Text>
        </View>
      </View>

      {/* Selector de Mes */}
      <View style={styles.monthSelectorRow}>
        <TouchableOpacity style={styles.monthBtn} onPress={handlePrevMonth}>
          <ChevronLeft size={18} color={FamilyMint.foreground} />
        </TouchableOpacity>
        <Text style={styles.monthTitle}>
          {monthNames[currentMonth]} {currentYear}
        </Text>
        <TouchableOpacity style={styles.monthBtn} onPress={handleNextMonth}>
          <ChevronRight size={18} color={FamilyMint.foreground} />
        </TouchableOpacity>
      </View>

      {/* Filtros por Cuenta */}
      <View style={{ marginBottom: 12 }}>
        <Text style={styles.filterLabel}>Filtrar por Cuenta:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
          <TouchableOpacity
            style={[styles.filterChip, selectedAccountId === 'ALL' && styles.filterChipActive]}
            onPress={() => setSelectedAccountId('ALL')}
          >
            <Text style={[styles.filterChipText, selectedAccountId === 'ALL' && styles.filterChipTextActive]}>
              Todas
            </Text>
          </TouchableOpacity>
          {accounts.map((acc) => (
            <TouchableOpacity
              key={acc.id}
              style={[styles.filterChip, selectedAccountId === acc.id && styles.filterChipActive]}
              onPress={() => setSelectedAccountId(acc.id)}
            >
              <Text style={[styles.filterChipText, selectedAccountId === acc.id && styles.filterChipTextActive]}>
                {acc.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Cabecera de Días de la Semana */}
      <View style={styles.weekHeaderRow}>
        {daysOfWeek.map((d, idx) => (
          <Text key={idx} style={styles.weekHeaderText}>
            {d}
          </Text>
        ))}
      </View>

      {/* Matriz del Calendario */}
      <View style={styles.calendarGrid}>
        {Array.from({ length: firstDayOfWeekIndex }).map((_, idx) => (
          <View key={`empty-${idx}`} style={styles.emptyDayCell} />
        ))}

        {Array.from({ length: daysInMonth }).map((_, i) => {
          const dayNum = i + 1;
          const dateStr = getFormattedDateString(dayNum);
          const isToday =
            now.getDate() === dayNum &&
            now.getMonth() === currentMonth &&
            now.getFullYear() === currentYear;

          const activeTxs = filteredTransactions.filter(
            (t) => t.date && t.date.startsWith(dateStr) && !t.isVoided
          );
          let dayExpense = 0;
          let dayIncome = 0;
          for (const t of activeTxs) {
            if (t.type === 'EXPENSE') dayExpense += Number(t.amount);
            if (t.type === 'INCOME') dayIncome += Number(t.amount);
          }

          const remsForDay = reminders.filter(
            (r) => r.dueDate && r.dueDate.startsWith(dateStr) && !r.isPaid
          );

          return (
            <TouchableOpacity
              key={dayNum}
              style={[styles.dayCell, isToday && styles.todayCell]}
              onPress={() => {
                setSelectedDayNumber(dayNum);
                setShowDayModal(true);
              }}
            >
              <View style={styles.dayHeaderRow}>
                <Text style={[styles.dayNumberText, isToday && styles.todayNumberText]}>
                  {dayNum}
                </Text>
                {remsForDay.length > 0 && <Clock size={10} color={FamilyMint.warning} />}
              </View>

              <View style={styles.amountsCol}>
                {dayIncome > 0 && (
                  <Text style={styles.incomeText}>+${Math.round(dayIncome)}</Text>
                )}
                {dayExpense > 0 && (
                  <Text style={styles.expenseText}>-${Math.round(dayExpense)}</Text>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Modal Detalle del Día */}
      <Modal visible={showDayModal} transparent animationType="slide" onRequestClose={() => setShowDayModal(false)}>
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeaderRow}>
              <View>
                <Text style={styles.modalTitle}>
                  {selectedDayNumber} de {monthNames[currentMonth]} {currentYear}
                </Text>
                <Text style={styles.modalSub}>{selectedDateStr}</Text>
              </View>

              <TouchableOpacity onPress={() => setShowDayModal(false)}>
                <X size={20} color={FamilyMint.foregroundSubtle} />
              </TouchableOpacity>
            </View>

            {/* Botón Añadir Movimiento en este día */}
            <TouchableOpacity
              style={styles.addTxDayBtn}
              onPress={() => {
                setShowDayModal(false);
                setShowAddTxModal(true);
              }}
            >
              <Plus size={16} color="#0A1128" />
              <Text style={styles.addTxDayBtnText}>Añadir Movimiento en esta Fecha</Text>
            </TouchableOpacity>

            <ScrollView style={{ maxHeight: 280 }} showsVerticalScrollIndicator={false}>
              {/* Recordatorios */}
              {dayReminders.length > 0 && (
                <View style={{ marginBottom: 14 }}>
                  <Text style={styles.subHeader}>Recordatorios y Vencimientos ({dayReminders.length})</Text>
                  {dayReminders.map((r) => (
                    <View key={r.id} style={styles.detailCard}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.detailTitle}>{r.title}</Text>
                        <Text style={styles.detailSub}>{r.isPaid ? 'Pagado' : 'Pendiente'}</Text>
                      </View>
                      <Text style={[styles.detailAmount, { color: FamilyMint.primary }]}>
                        ${Number(r.amount).toFixed(2)}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Transacciones */}
              <Text style={styles.subHeader}>Movimientos ({dayTxs.length})</Text>
              {dayTxs.length === 0 ? (
                <Text style={styles.emptyDetailText}>
                  Sin movimientos registrados en este día.
                </Text>
              ) : (
                dayTxs.map((tx) => (
                  <View key={tx.id} style={styles.detailCard}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <Text style={[styles.detailTitle, tx.isVoided && { textDecorationLine: 'line-through' }]}>
                        {tx.description || tx.title || 'Movimiento'}
                      </Text>
                      <Text style={styles.detailSub}>
                        {tx.account?.name || 'Cuenta'} {tx.category ? `• ${tx.category?.name || tx.category}` : ''}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.detailAmount,
                        tx.type === 'INCOME' ? { color: FamilyMint.income } : { color: FamilyMint.expense },
                      ]}
                    >
                      {tx.type === 'INCOME' ? '+' : '-'}${Number(tx.amount).toFixed(2)}
                    </Text>
                  </View>
                ))
              )}
            </ScrollView>

            <TouchableOpacity style={styles.closeBtn} onPress={() => setShowDayModal(false)}>
              <Text style={styles.closeBtnText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal para Crear Transacción en la Fecha Seleccionada */}
      <TransactionModal
        visible={showAddTxModal}
        onClose={() => setShowAddTxModal(false)}
        accounts={accounts}
        categories={categories}
        initialDate={selectedDateStr}
        initialType="EXPENSE"
        onSuccess={() => loadData()}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: FamilyMint.background },
  contentContainer: { padding: 16, paddingTop: 48, paddingBottom: 40 },
  headerRow: { marginBottom: 16 },
  screenTitle: { fontSize: 20, fontWeight: '800', color: FamilyMint.foreground },
  screenSub: { fontSize: 12, color: FamilyMint.foregroundSubtle, marginTop: 2 },
  monthSelectorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: FamilyMint.surface,
    padding: 8,
    borderRadius: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: FamilyMint.border,
  },
  monthTitle: { fontSize: 15, fontWeight: '700', color: FamilyMint.foreground },
  monthBtn: { padding: 8, backgroundColor: FamilyMint.surfaceElevated, borderRadius: 8 },
  filterLabel: { fontSize: 11, fontWeight: '700', color: FamilyMint.foregroundSubtle, marginBottom: 6, textTransform: 'uppercase' },
  chipsScroll: { flexDirection: 'row' },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: FamilyMint.surface,
    borderWidth: 1,
    borderColor: FamilyMint.border,
    marginRight: 8,
  },
  filterChipActive: { borderColor: FamilyMint.primary, backgroundColor: FamilyMint.primaryMuted },
  filterChipText: { fontSize: 11, color: FamilyMint.foregroundMuted },
  filterChipTextActive: { color: FamilyMint.primary, fontWeight: '700' },
  weekHeaderRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 8, marginTop: 4 },
  weekHeaderText: { width: '13.5%', textAlign: 'center', color: FamilyMint.foregroundSubtle, fontSize: 11, fontWeight: '700' },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  emptyDayCell: { width: '13.5%', height: 60, opacity: 0.1 },
  dayCell: {
    width: '13.5%',
    height: 64,
    backgroundColor: FamilyMint.surface,
    borderRadius: 10,
    padding: 4,
    borderWidth: 1,
    borderColor: FamilyMint.border,
    justifyContent: 'space-between',
  },
  todayCell: { borderColor: FamilyMint.primary, backgroundColor: FamilyMint.primaryMuted },
  dayHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dayNumberText: { fontSize: 10, color: FamilyMint.foreground, fontWeight: '700' },
  todayNumberText: { color: FamilyMint.primary },
  amountsCol: { marginTop: 2 },
  incomeText: { fontSize: 8, color: FamilyMint.income, fontWeight: '700' },
  expenseText: { fontSize: 8, color: FamilyMint.expense, fontWeight: '700' },
  modalBg: { flex: 1, backgroundColor: 'rgba(5, 10, 24, 0.85)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: FamilyMint.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    borderColor: FamilyMint.border,
    padding: 20,
    maxHeight: '90%',
  },
  modalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  modalTitle: { fontSize: 17, fontWeight: '700', color: FamilyMint.foreground },
  modalSub: { fontSize: 11, color: FamilyMint.foregroundSubtle },
  addTxDayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: FamilyMint.primary,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  addTxDayBtnText: { color: '#0A1128', fontWeight: '700', fontSize: 13 },
  subHeader: { fontSize: 12, fontWeight: '700', color: FamilyMint.primary, marginBottom: 8 },
  detailCard: {
    backgroundColor: FamilyMint.surfaceElevated,
    padding: 12,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: FamilyMint.border,
  },
  detailTitle: { fontSize: 13, fontWeight: '600', color: FamilyMint.foreground },
  detailSub: { fontSize: 11, color: FamilyMint.foregroundSubtle, marginTop: 2 },
  detailAmount: { fontSize: 13, fontWeight: '700' },
  emptyDetailText: { fontSize: 12, color: FamilyMint.foregroundSubtle, textAlign: 'center', marginVertical: 14 },
  closeBtn: {
    marginTop: 12,
    backgroundColor: FamilyMint.surfaceElevated,
    borderWidth: 1,
    borderColor: FamilyMint.border,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  closeBtnText: { color: FamilyMint.foreground, fontWeight: '600', fontSize: 13 },
});
