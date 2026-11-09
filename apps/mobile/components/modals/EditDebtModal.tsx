import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Switch,
} from 'react-native';
import {
  X,
  Sparkles,
  Calendar,
  Bell,
  Clock,
  Target,
  TrendingDown,
  CreditCard,
  AlertTriangle,
} from 'lucide-react-native';
import { FamilyMint } from '@/constants/Colors';
import { fetchWithAuth } from '@/constants/Api';

interface EditDebtModalProps {
  visible: boolean;
  onClose: () => void;
  debt: any | null;
  onSuccess: () => void;
}

export default function EditDebtModal({
  visible,
  onClose,
  debt,
  onSuccess,
}: EditDebtModalProps) {
  const [contactName, setContactName] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [remainingAmount, setRemainingAmount] = useState('');
  const [interestRate, setInterestRate] = useState('0');
  const [dueDate, setDueDate] = useState('');
  const [targetPayoffDate, setTargetPayoffDate] = useState('');
  const [monthlyTargetPayment, setMonthlyTargetPayment] = useState('');
  const [mitigationStrategy, setMitigationStrategy] = useState<'AVALANCHE' | 'SNOWBALL' | 'CUSTOM'>('CUSTOM');
  const [notes, setNotes] = useState('');

  // Fechas operativas, cortes y alertas
  const [cutoffDay, setCutoffDay] = useState('');
  const [paymentDueDay, setPaymentDueDay] = useState('');
  const [minimumPayment, setMinimumPayment] = useState('');
  const [alertDaysBefore, setAlertDaysBefore] = useState('3');
  const [autoAlert, setAutoAlert] = useState(true);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (debt) {
      setContactName(debt.contactName || debt.creditor || debt.name || '');
      setTotalAmount(debt.totalAmount != null ? String(debt.totalAmount) : '');
      setRemainingAmount(String(debt.remainingAmount != null ? debt.remainingAmount : debt.amount || ''));
      setInterestRate(String(debt.interestRate != null ? debt.interestRate : '0'));
      
      if (debt.dueDate) {
        setDueDate(debt.dueDate.split('T')[0]);
      } else {
        setDueDate('');
      }

      if (debt.targetPayoffDate) {
        setTargetPayoffDate(debt.targetPayoffDate.split('T')[0]);
      } else {
        setTargetPayoffDate('');
      }

      setMonthlyTargetPayment(debt.monthlyTargetPayment != null ? String(debt.monthlyTargetPayment) : '');
      setMitigationStrategy(debt.mitigationStrategy || 'CUSTOM');
      setNotes(debt.notes || '');

      setCutoffDay(debt.cutoffDay != null ? String(debt.cutoffDay) : '');
      setPaymentDueDay(debt.paymentDueDay != null ? String(debt.paymentDueDay) : '');
      setMinimumPayment(debt.minimumPayment != null ? String(debt.minimumPayment) : '');
      setAlertDaysBefore(debt.alertDaysBefore != null ? String(debt.alertDaysBefore) : '3');
      setAutoAlert(debt.autoAlert !== false);
    }
  }, [debt]);

  // Cálculo en tiempo real de sugerencia mensual según fecha objetivo
  const parsedRemaining = parseFloat(remainingAmount.replace(',', '.')) || 0;
  let suggestedMonthly: number | null = null;
  let monthsUntilTarget = 0;

  if (targetPayoffDate && parsedRemaining > 0) {
    const targetDate = new Date(targetPayoffDate);
    const now = new Date();
    const diffDays = Math.ceil((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays > 0) {
      monthsUntilTarget = Math.max(1, Math.ceil(diffDays / 30.4375));
      suggestedMonthly = Math.round((parsedRemaining / monthsUntilTarget) * 100) / 100;
    }
  }

  const handleSubmit = async () => {
    if (!debt || !contactName.trim()) {
      Alert.alert('Nombre Requerido', 'Ingresa el nombre del acreedor o crédito.');
      return;
    }

    const total = parseFloat(totalAmount.replace(',', '.'));
    const rem = parseFloat(remainingAmount.replace(',', '.'));
    const rate = parseFloat(interestRate.replace(',', '.')) || 0;
    const targetMonthly = parseFloat(monthlyTargetPayment.replace(',', '.'));
    const minPay = parseFloat(minimumPayment.replace(',', '.'));

    const cDay = parseInt(cutoffDay, 10);
    if (cutoffDay.trim() && (isNaN(cDay) || cDay < 1 || cDay > 31)) {
      Alert.alert('Día de Corte Inválido', 'El día de corte debe ser un número entre 1 y 31.');
      return;
    }

    const pDay = parseInt(paymentDueDay, 10);
    if (paymentDueDay.trim() && (isNaN(pDay) || pDay < 1 || pDay > 31)) {
      Alert.alert('Día Límite Inválido', 'El día límite de pago debe ser un número entre 1 y 31.');
      return;
    }

    setLoading(true);
    try {
      const payload: any = {
        contactName: contactName.trim(),
        totalAmount: !isNaN(total) && total > 0 ? total : undefined,
        remainingAmount: isNaN(rem) ? 0 : rem,
        interestRate: rate,
        mitigationStrategy,
        notes: notes.trim() || undefined,
        cutoffDay: !isNaN(cDay) && cDay >= 1 && cDay <= 31 ? cDay : null,
        paymentDueDay: !isNaN(pDay) && pDay >= 1 && pDay <= 31 ? pDay : null,
        minimumPayment: !isNaN(minPay) && minPay > 0 ? minPay : null,
        alertDaysBefore: parseInt(alertDaysBefore, 10) || 3,
        autoAlert,
        dueDate: dueDate.trim() ? new Date(dueDate.trim()).toISOString() : null,
        targetPayoffDate: targetPayoffDate.trim() ? new Date(targetPayoffDate.trim()).toISOString() : null,
        monthlyTargetPayment: !isNaN(targetMonthly) && targetMonthly > 0 ? targetMonthly : null,
      };

      const res = await fetchWithAuth(`/api/debts/${debt.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        Alert.alert('Actualizado', 'Plan de deuda y fechas actualizadas correctamente.');
        onSuccess();
        onClose();
      } else {
        const err = await res.json().catch(() => ({}));
        Alert.alert('Error', err.message || 'No se pudo actualizar la deuda.');
      }
    } catch (e) {
      Alert.alert('Error', 'Error de conexión con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    if (!debt) return;
    Alert.alert('Eliminar Deuda', `¿Deseas eliminar permanentemente el registro de deuda de "${contactName}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            const res = await fetchWithAuth(`/api/debts/${debt.id}`, { method: 'DELETE' });
            if (res.ok) {
              onSuccess();
              onClose();
            } else {
              Alert.alert('Error', 'No se pudo eliminar el registro.');
            }
          } catch (e) {
            Alert.alert('Error', 'Error de conexión al eliminar.');
          }
        },
      },
    ]);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <CreditCard size={18} color={FamilyMint.primary} />
              <Text style={styles.title}>Editar Deuda, Fechas y Mitigación</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={18} color={FamilyMint.foregroundSubtle} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>
            {/* Acreedor */}
            <Text style={styles.label}>Acreedor o Institución</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: Banco Reservas, Préstamo Auto..."
              placeholderTextColor={FamilyMint.foregroundSubtle}
              value={contactName}
              onChangeText={setContactName}
            />

            {/* Montos */}
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Monto Original ($)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  placeholderTextColor={FamilyMint.foregroundSubtle}
                  value={totalAmount}
                  onChangeText={setTotalAmount}
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Saldo Pendiente ($)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  placeholderTextColor={FamilyMint.foregroundSubtle}
                  value={remainingAmount}
                  onChangeText={setRemainingAmount}
                />
              </View>
            </View>

            {/* Tasa de interés */}
            <Text style={styles.label}>Tasa de Interés Anual (%)</Text>
            <TextInput
              style={styles.input}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor={FamilyMint.foregroundSubtle}
              value={interestRate}
              onChangeText={setInterestRate}
            />

            {/* 📅 SECCIÓN: FECHAS DE PAGO, CORTES Y ALERTAS AUTOMÁTICAS */}
            <View style={styles.operationalBox}>
              <View style={styles.operationalHeader}>
                <Bell size={16} color={FamilyMint.warning} />
                <Text style={styles.operationalTitle}>Fechas de Pago, Cortes y Alertas</Text>
              </View>

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.operationalLabel}>Día de Corte (1-31)</Text>
                  <TextInput
                    style={styles.operationalInput}
                    keyboardType="number-pad"
                    placeholder="Ej. 15"
                    placeholderTextColor={FamilyMint.foregroundSubtle}
                    value={cutoffDay}
                    onChangeText={setCutoffDay}
                    maxLength={2}
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.operationalLabel}>Día Límite Pago (1-31)</Text>
                  <TextInput
                    style={styles.operationalInput}
                    keyboardType="number-pad"
                    placeholder="Ej. 30"
                    placeholderTextColor={FamilyMint.foregroundSubtle}
                    value={paymentDueDay}
                    onChangeText={setPaymentDueDay}
                    maxLength={2}
                  />
                </View>
              </View>

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.operationalLabel}>Cuota Mínima ($)</Text>
                  <TextInput
                    style={styles.operationalInput}
                    keyboardType="decimal-pad"
                    placeholder="Ej. 150.00"
                    placeholderTextColor={FamilyMint.foregroundSubtle}
                    value={minimumPayment}
                    onChangeText={setMinimumPayment}
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.operationalLabel}>Vencimiento Puntual</Text>
                  <TextInput
                    style={styles.operationalInput}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={FamilyMint.foregroundSubtle}
                    value={dueDate}
                    onChangeText={setDueDate}
                  />
                </View>
              </View>

              {/* Alerta de pago automático y anticipación */}
              <View style={styles.alertRow}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.alertTitle}>Alerta Automática de Pago</Text>
                  <Text style={styles.alertSub}>Genera recordatorios en el calendario familiar</Text>
                </View>
                <Switch
                  value={autoAlert}
                  onValueChange={setAutoAlert}
                  trackColor={{ false: '#162347', true: 'rgba(245, 158, 11, 0.4)' }}
                  thumbColor={autoAlert ? FamilyMint.warning : FamilyMint.foregroundSubtle}
                />
              </View>

              {autoAlert && (
                <View style={{ marginTop: 8 }}>
                  <Text style={styles.operationalLabel}>Anticipación de Alerta</Text>
                  <View style={{ flexDirection: 'row', gap: 6, marginTop: 4 }}>
                    {['1', '3', '5', '7'].map((days) => {
                      const isSel = alertDaysBefore === days;
                      return (
                        <TouchableOpacity
                          key={days}
                          style={[styles.daysChip, isSel && styles.daysChipActive]}
                          onPress={() => setAlertDaysBefore(days)}
                        >
                          <Text style={[styles.daysChipText, isSel && styles.daysChipTextActive]}>
                            {days} {days === '1' ? 'día' : 'días'} antes
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}
            </View>

            {/* 🎯 SECCIÓN: ESTRATEGIA DE MITIGACIÓN Y PLAN */}
            <View style={styles.mitigationBox}>
              <View style={styles.mitigationHeader}>
                <Target size={16} color={FamilyMint.primary} />
                <Text style={styles.mitigationTitle}>Estrategia de Mitigación</Text>
              </View>

              <View style={{ flexDirection: 'row', gap: 6, marginBottom: 12 }}>
                {[
                  { id: 'AVALANCHE', label: 'Avalancha', desc: 'Mayor tasa %' },
                  { id: 'SNOWBALL', label: 'Bola de Nieve', desc: 'Menor saldo' },
                  { id: 'CUSTOM', label: 'Personalizado', desc: 'A tu ritmo' },
                ].map((s) => (
                  <TouchableOpacity
                    key={s.id}
                    style={[styles.strategyBtn, mitigationStrategy === s.id && styles.strategyBtnActive]}
                    onPress={() => setMitigationStrategy(s.id as any)}
                  >
                    <Text style={[styles.strategyBtnText, mitigationStrategy === s.id && styles.strategyBtnTextActive]}>
                      {s.label}
                    </Text>
                    <Text style={styles.strategyBtnDesc}>{s.desc}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.mitigationLabel}>Meta Saldado (YYYY-MM-DD)</Text>
                  <TextInput
                    style={styles.mitigationInput}
                    placeholder="2027-06-30"
                    placeholderTextColor={FamilyMint.foregroundSubtle}
                    value={targetPayoffDate}
                    onChangeText={setTargetPayoffDate}
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.mitigationLabel}>Aporte Mensual ($)</Text>
                  <TextInput
                    style={styles.mitigationInput}
                    keyboardType="decimal-pad"
                    placeholder="0.00"
                    placeholderTextColor={FamilyMint.foregroundSubtle}
                    value={monthlyTargetPayment}
                    onChangeText={setMonthlyTargetPayment}
                  />
                </View>
              </View>

              {/* Sugerencia de cuota en base al objetivo */}
              {suggestedMonthly !== null && suggestedMonthly > 0 && (
                <View style={styles.suggestBox}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={styles.suggestText}>
                      Cuota sugerida para saldar en {monthsUntilTarget} meses:
                    </Text>
                    <Text style={styles.suggestAmount}>
                      ${suggestedMonthly.toLocaleString('en-US', { minimumFractionDigits: 2 })}/mes
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.applyBtn}
                    onPress={() => setMonthlyTargetPayment(suggestedMonthly!.toString())}
                  >
                    <Text style={styles.applyBtnText}>Aplicar</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Notas */}
            <Text style={styles.label}>Notas y Términos</Text>
            <TextInput
              style={[styles.input, { minHeight: 60, textAlignVertical: 'top' }]}
              multiline
              numberOfLines={3}
              placeholder="Número de contrato, acuerdos, penalidades..."
              placeholderTextColor={FamilyMint.foregroundSubtle}
              value={notes}
              onChangeText={setNotes}
            />

            {/* Botones de acción */}
            <View style={styles.btnRow}>
              <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
                <Text style={styles.deleteBtnText}>Eliminar</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.submitBtn} disabled={loading} onPress={handleSubmit}>
                {loading ? (
                  <ActivityIndicator size="small" color="#0A1128" />
                ) : (
                  <Text style={styles.submitBtnText}>Guardar Cambios</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 10, 24, 0.85)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: FamilyMint.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderColor: FamilyMint.border,
    padding: 20,
    maxHeight: '92%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: FamilyMint.border,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: FamilyMint.surfaceElevated,
  },
  title: { fontSize: 16, fontWeight: '700', color: FamilyMint.foreground },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: FamilyMint.foregroundSubtle,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: FamilyMint.surfaceElevated,
    borderWidth: 1,
    borderColor: FamilyMint.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: FamilyMint.foreground,
    marginBottom: 12,
  },
  operationalBox: {
    padding: 14,
    borderRadius: 16,
    backgroundColor: FamilyMint.background,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.35)',
    marginBottom: 14,
  },
  operationalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  operationalTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: FamilyMint.warning,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  operationalLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: FamilyMint.foregroundMuted,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  operationalInput: {
    backgroundColor: FamilyMint.surface,
    borderWidth: 1,
    borderColor: FamilyMint.border,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    color: FamilyMint.foreground,
    marginBottom: 10,
  },
  alertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  alertTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: FamilyMint.foreground,
  },
  alertSub: {
    fontSize: 10,
    color: FamilyMint.foregroundSubtle,
    marginTop: 2,
  },
  daysChip: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: FamilyMint.surface,
    borderWidth: 1,
    borderColor: FamilyMint.border,
    alignItems: 'center',
  },
  daysChipActive: {
    borderColor: FamilyMint.warning,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
  },
  daysChipText: {
    fontSize: 10,
    fontWeight: '600',
    color: FamilyMint.foregroundSubtle,
  },
  daysChipTextActive: {
    color: FamilyMint.warning,
    fontWeight: '700',
  },
  mitigationBox: {
    padding: 14,
    borderRadius: 16,
    backgroundColor: FamilyMint.background,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.35)',
    marginBottom: 14,
  },
  mitigationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  mitigationTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: FamilyMint.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  mitigationLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: FamilyMint.foregroundMuted,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  mitigationInput: {
    backgroundColor: FamilyMint.surface,
    borderWidth: 1,
    borderColor: FamilyMint.border,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    color: FamilyMint.foreground,
  },
  strategyBtn: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 10,
    backgroundColor: FamilyMint.surface,
    borderWidth: 1,
    borderColor: FamilyMint.border,
    alignItems: 'center',
  },
  strategyBtnActive: {
    borderColor: FamilyMint.primary,
    backgroundColor: FamilyMint.primaryMuted,
  },
  strategyBtnText: { fontSize: 11, color: FamilyMint.foregroundMuted, fontWeight: '700' },
  strategyBtnTextActive: { color: FamilyMint.primary },
  strategyBtnDesc: { fontSize: 9, color: FamilyMint.foregroundSubtle, marginTop: 2 },
  suggestBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
  },
  suggestText: {
    fontSize: 11,
    color: FamilyMint.foregroundMuted,
  },
  suggestAmount: {
    fontSize: 13,
    fontWeight: '700',
    color: FamilyMint.primary,
    marginTop: 2,
  },
  applyBtn: {
    backgroundColor: FamilyMint.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  applyBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0A1128',
  },
  btnRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
  deleteBtn: {
    flex: 1,
    backgroundColor: FamilyMint.surfaceElevated,
    borderWidth: 1,
    borderColor: FamilyMint.expense,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  deleteBtnText: { color: FamilyMint.expense, fontWeight: '700', fontSize: 13 },
  submitBtn: {
    flex: 2,
    backgroundColor: FamilyMint.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: FamilyMint.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  submitBtnText: { color: '#0A1128', fontWeight: '700', fontSize: 13 },
});
