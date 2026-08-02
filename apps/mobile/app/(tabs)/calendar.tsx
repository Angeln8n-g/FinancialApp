import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, View, Text, TouchableOpacity, Alert, Modal, TextInput } from 'react-native';
import { fetchWithAuth } from '@/constants/Api';

export default function MobileCalendarScreen() {
  const now = new Date();
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(now.getMonth());

  const [transactions, setTransactions] = useState<any[]>([]);
  const [reminders, setReminders] = useState<any[]>([]);

  const [selectedDayNumber, setSelectedDayNumber] = useState<number | null>(null);
  const [showDayModal, setShowDayModal] = useState(false);

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const daysOfWeek = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

  const loadData = async () => {
    try {
      const [resTx, resRem] = await Promise.all([
        fetchWithAuth('/api/transactions'),
        fetchWithAuth('/api/reminders'),
      ]);

      if (resTx.ok) {
        const txData = await resTx.json();
        if (Array.isArray(txData)) setTransactions(txData);
      }
      if (resRem.ok) {
        const remData = await resRem.json();
        if (Array.isArray(remData)) setReminders(remData);
      }
    } catch (e) {
      console.log('Error cargando calendario móvil:', e);
    }
  };

  useEffect(() => {
    loadData();
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

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfWeekIndex = (new Date(currentYear, currentMonth, 1).getDay() + 6) % 7;

  const getFormattedDateString = (dayNum: number) => {
    const m = (currentMonth + 1).toString().padStart(2, '0');
    const d = dayNum.toString().padStart(2, '0');
    return `${currentYear}-${m}-${d}`;
  };

  const selectedDateStr = selectedDayNumber ? getFormattedDateString(selectedDayNumber) : '';
  const dayTxs = transactions.filter(t => t.date && t.date.startsWith(selectedDateStr));
  const dayReminders = reminders.filter(r => r.dueDate && r.dueDate.startsWith(selectedDateStr));

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header & Month Selector */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.screenTitle}>Calendario Financiero</Text>
          <Text style={styles.screenSub}>Flujo de caja diario y vencimientos</Text>
        </View>
      </View>

      <View style={styles.monthSelectorRow}>
        <TouchableOpacity style={styles.monthBtn} onPress={handlePrevMonth}>
          <Text style={styles.monthBtnText}>◀</Text>
        </TouchableOpacity>
        <Text style={styles.monthTitle}>{monthNames[currentMonth]} {currentYear}</Text>
        <TouchableOpacity style={styles.monthBtn} onPress={handleNextMonth}>
          <Text style={styles.monthBtnText}>▶</Text>
        </TouchableOpacity>
      </View>

      {/* Week Headers */}
      <View style={styles.weekHeaderRow}>
        {daysOfWeek.map((d, idx) => (
          <Text key={idx} style={styles.weekHeaderText}>{d}</Text>
        ))}
      </View>

      {/* Calendar Grid */}
      <View style={styles.calendarGrid}>
        {/* Empty cells */}
        {Array.from({ length: firstDayOfWeekIndex }).map((_, idx) => (
          <View key={`empty-${idx}`} style={styles.emptyDayCell} />
        ))}

        {/* Month Day Cells */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const dayNum = i + 1;
          const dateStr = getFormattedDateString(dayNum);
          const isToday =
            now.getDate() === dayNum &&
            now.getMonth() === currentMonth &&
            now.getFullYear() === currentYear;

          const activeTxs = transactions.filter(t => t.date && t.date.startsWith(dateStr) && !t.isVoided);
          let dayExpense = 0;
          let dayIncome = 0;
          for (const t of activeTxs) {
            if (t.type === 'EXPENSE') dayExpense += Number(t.amount);
            if (t.type === 'INCOME') dayIncome += Number(t.amount);
          }

          const remsForDay = reminders.filter(r => r.dueDate && r.dueDate.startsWith(dateStr) && !r.isPaid);

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
                <Text style={[styles.dayNumberText, isToday && styles.todayNumberText]}>{dayNum}</Text>
                {remsForDay.length > 0 && <Text style={{ fontSize: 9 }}>⏰</Text>}
              </View>

              <View style={styles.amountsCol}>
                {dayIncome > 0 && <Text style={styles.incomeText}>+${Math.round(dayIncome)}</Text>}
                {dayExpense > 0 && <Text style={styles.expenseText}>-${Math.round(dayExpense)}</Text>}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Modal Detalle del Día */}
      <Modal visible={showDayModal} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>
                {selectedDayNumber} de {monthNames[currentMonth]} {currentYear}
              </Text>
              <TouchableOpacity onPress={() => setShowDayModal(false)}>
                <Text style={{ color: '#94a3b8', fontSize: 18 }}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Recordatorios */}
            {dayReminders.length > 0 && (
              <View style={{ marginBottom: 12 }}>
                <Text style={styles.subHeader}>⏰ Recordatorios y Vencimientos ({dayReminders.length})</Text>
                {dayReminders.map((r) => (
                  <View key={r.id} style={styles.detailCard}>
                    <Text style={styles.detailTitle}>{r.title}</Text>
                    <Text style={styles.detailAmount}>${Number(r.amount).toFixed(2)}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Transacciones */}
            <Text style={styles.subHeader}>💸 Movimientos ({dayTxs.length})</Text>
            <ScrollView style={{ maxHeight: 220 }}>
              {dayTxs.length === 0 ? (
                <Text style={{ color: '#94a3b8', fontSize: 12, textAlign: 'center', marginVertical: 12 }}>
                  Sin movimientos registrados en este día.
                </Text>
              ) : (
                dayTxs.map((tx) => (
                  <View key={tx.id} style={styles.detailCard}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <Text style={[styles.detailTitle, tx.isVoided && { textDecorationLine: 'line-through' }]}>
                        {tx.description || tx.title || 'Movimiento'}
                      </Text>
                      <Text style={{ color: '#94a3b8', fontSize: 10 }}>{tx.account?.name || 'Cuenta'}</Text>
                    </View>
                    <Text style={[styles.detailAmount, tx.type === 'INCOME' && { color: '#34d399' }]}>
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090d16' },
  contentContainer: { padding: 16, paddingTop: 48, paddingBottom: 40 },
  headerRow: { marginBottom: 16 },
  screenTitle: { fontSize: 20, fontWeight: 'bold', color: '#ffffff' },
  screenSub: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  monthSelectorRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1e293b', padding: 10, borderRadius: 14, marginBottom: 16 },
  monthTitle: { fontSize: 15, fontWeight: 'bold', color: '#c084fc' },
  monthBtn: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#334155', borderRadius: 8 },
  monthBtnText: { color: '#ffffff', fontWeight: 'bold', fontSize: 12 },
  weekHeaderRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 8 },
  weekHeaderText: { width: '13%', textAlign: 'center', color: '#c084fc', fontSize: 11, fontWeight: 'bold' },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  emptyDayCell: { width: '13.5%', height: 60, opacity: 0.2 },
  dayCell: { width: '13.5%', height: 64, backgroundColor: 'rgba(30, 41, 59, 0.8)', borderRadius: 10, padding: 4, borderWidth: 1, borderColor: '#1e293b', justifyContent: 'space-between' },
  todayCell: { borderColor: '#c084fc', backgroundColor: 'rgba(147, 51, 234, 0.2)' },
  dayHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dayNumberText: { fontSize: 10, color: '#cbd5e1', fontWeight: 'bold' },
  todayNumberText: { color: '#c084fc' },
  amountsCol: { marginTop: 2 },
  incomeText: { fontSize: 8, color: '#34d399', fontWeight: 'bold' },
  expenseText: { fontSize: 8, color: '#fb7185', fontWeight: 'bold' },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#0f172a', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#9333ea' },
  modalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 16, fontWeight: 'bold', color: '#ffffff' },
  subHeader: { fontSize: 12, fontWeight: 'bold', color: '#c084fc', marginTop: 8, marginBottom: 6 },
  detailCard: { backgroundColor: '#1e293b', padding: 10, borderRadius: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  detailTitle: { fontSize: 12, fontWeight: 'bold', color: '#ffffff' },
  detailAmount: { fontSize: 12, fontWeight: 'bold', color: '#fb7185' },
  closeBtn: { marginTop: 16, backgroundColor: '#334155', paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  closeBtnText: { color: '#ffffff', fontWeight: 'bold', fontSize: 12 },
});
