import React, { useState } from 'react';
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
} from 'react-native';
import { X, Building2 } from 'lucide-react-native';
import { FamilyMint } from '@/constants/Colors';
import { fetchWithAuth } from '@/constants/Api';

interface AccountModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const ACCOUNT_TYPES = [
  { id: 'BANK_ACCOUNT', label: 'Cuenta Bancaria' },
  { id: 'CREDIT_CARD', label: 'Tarjeta de Crédito' },
  { id: 'CASH', label: 'Efectivo / Caja' },
  { id: 'PAYROLL', label: 'Cuenta Nómina' },
  { id: 'SAVINGS', label: 'Ahorros' },
  { id: 'INVESTMENT', label: 'Inversión' },
];

export default function AccountModal({ visible, onClose, onSuccess }: AccountModalProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState('BANK_ACCOUNT');
  const [balance, setBalance] = useState('0');
  const [submitting, setSubmitting] = useState(false);

  // Campos de Nómina
  const [payrollAmount, setPayrollAmount] = useState('');
  const [payrollFrequency, setPayrollFrequency] = useState<'MONTHLY' | 'BIWEEKLY'>('BIWEEKLY');
  const [payrollDay1, setPayrollDay1] = useState('15');
  const [payrollDay2, setPayrollDay2] = useState('30');

  // Campos de Tarjeta de Crédito (Deuda Vinculada)
  const [debtTotalAmount, setDebtTotalAmount] = useState('');
  const [debtCutoffDay, setDebtCutoffDay] = useState('');
  const [debtPaymentDueDay, setDebtPaymentDueDay] = useState('');
  const [debtMinimumPayment, setDebtMinimumPayment] = useState('');
  const [debtInterestRate, setDebtInterestRate] = useState('0');

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('Nombre Requerido', 'Por favor ingresa un nombre para la cuenta.');
      return;
    }

    const parsedBalance = parseFloat(balance.replace(',', '.'));
    const isPayroll = type === 'PAYROLL';
    const isCreditCard = type === 'CREDIT_CARD';
    const parsedPayrollAmount = parseFloat(payrollAmount.replace(',', '.'));
    const parsedDebtTotal = parseFloat(debtTotalAmount.replace(',', '.'));

    if (isCreditCard && (isNaN(parsedDebtTotal) || parsedDebtTotal <= 0)) {
      Alert.alert('Límite de Crédito Requerido', 'Por favor ingresa el límite total de la tarjeta de crédito.');
      return;
    }

    const payload: any = {
      name: name.trim(),
      type,
      balance: isNaN(parsedBalance) ? 0 : parsedBalance,
      currency: 'USD',
    };

    if (isPayroll && !isNaN(parsedPayrollAmount) && parsedPayrollAmount > 0) {
      payload.payrollAmount = parsedPayrollAmount;
      payload.payrollFrequency = payrollFrequency;
      payload.payrollDay1 = parseInt(payrollDay1, 10) || 15;
      if (payrollFrequency === 'BIWEEKLY') {
        payload.payrollDay2 = parseInt(payrollDay2, 10) || 30;
      }
      payload.payrollAutoDeposit = true;
    }

    if (isCreditCard) {
      payload.debtTotalAmount = parsedDebtTotal;
      payload.debtRemainingAmount = isNaN(parsedBalance) ? 0 : parsedBalance;
      payload.debtInterestRate = parseFloat(debtInterestRate.replace(',', '.')) || 0;
      payload.debtCutoffDay = parseInt(debtCutoffDay, 10) || undefined;
      payload.debtPaymentDueDay = parseInt(debtPaymentDueDay, 10) || undefined;
      payload.debtMinimumPayment = parseFloat(debtMinimumPayment.replace(',', '.')) || undefined;
      payload.debtAutoAlert = true;
    }

    setSubmitting(true);
    try {
      const res = await fetchWithAuth('/api/accounts', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        Alert.alert('Éxito', 'Cuenta creada correctamente.');
        setName('');
        setBalance('0');
        setType('BANK_ACCOUNT');
        onSuccess();
        onClose();
      } else {
        const err = await res.json().catch(() => ({}));
        Alert.alert('Error', err.message || 'No se pudo crear la cuenta.');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Error de conexión.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Nueva Cuenta</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <X size={20} color={FamilyMint.foregroundSubtle} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
            <Text style={styles.label}>Nombre de la Cuenta</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: Banesco Principal, Caja Chica..."
              placeholderTextColor={FamilyMint.foregroundSubtle}
              value={name}
              onChangeText={setName}
            />

            <Text style={styles.label}>Tipo de Cuenta</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
              {ACCOUNT_TYPES.map((t) => {
                const isSelected = t.id === type;
                return (
                  <TouchableOpacity
                    key={t.id}
                    style={[styles.chip, isSelected && styles.chipActive]}
                    onPress={() => setType(t.id)}
                  >
                    <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                      {t.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <Text style={styles.label}>Saldo Inicial ($)</Text>
            <TextInput
              style={styles.input}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor={FamilyMint.foregroundSubtle}
              value={balance}
              onChangeText={setBalance}
            />

            {/* Configuración especial si es Tarjeta de Crédito */}
            {type === 'CREDIT_CARD' && (
              <View style={[styles.payrollBox, { borderColor: '#F59E0B' }]}>
                <Text style={[styles.payrollTitle, { color: '#F59E0B' }]}>💳 Compromiso y Deuda de Tarjeta</Text>
                
                <Text style={styles.label}>Límite Total de Crédito ($) *</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="decimal-pad"
                  placeholder="Ej: 50000.00"
                  placeholderTextColor={FamilyMint.foregroundSubtle}
                  value={debtTotalAmount}
                  onChangeText={setDebtTotalAmount}
                />

                <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>Día Corte (1-31)</Text>
                    <TextInput
                      style={styles.input}
                      keyboardType="number-pad"
                      placeholder="15"
                      placeholderTextColor={FamilyMint.foregroundSubtle}
                      value={debtCutoffDay}
                      onChangeText={setDebtCutoffDay}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>Día Límite Pago (1-31)</Text>
                    <TextInput
                      style={styles.input}
                      keyboardType="number-pad"
                      placeholder="5"
                      placeholderTextColor={FamilyMint.foregroundSubtle}
                      value={debtPaymentDueDay}
                      onChangeText={setDebtPaymentDueDay}
                    />
                  </View>
                </View>

                <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>Pago Mínimo ($)</Text>
                    <TextInput
                      style={styles.input}
                      keyboardType="decimal-pad"
                      placeholder="1500.00"
                      placeholderTextColor={FamilyMint.foregroundSubtle}
                      value={debtMinimumPayment}
                      onChangeText={setDebtMinimumPayment}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>Interés Anual (%)</Text>
                    <TextInput
                      style={styles.input}
                      keyboardType="decimal-pad"
                      placeholder="28"
                      placeholderTextColor={FamilyMint.foregroundSubtle}
                      value={debtInterestRate}
                      onChangeText={setDebtInterestRate}
                    />
                  </View>
                </View>
              </View>
            )}

            {/* Configuración especial si es Nómina */}
            {type === 'PAYROLL' && (
              <View style={styles.payrollBox}>
                <Text style={styles.payrollTitle}>💼 Configuración de Nómina</Text>
                
                <Text style={styles.label}>Monto por Cobro ($)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="decimal-pad"
                  placeholder="Ej: 1500.00"
                  placeholderTextColor={FamilyMint.foregroundSubtle}
                  value={payrollAmount}
                  onChangeText={setPayrollAmount}
                />

                <Text style={styles.label}>Frecuencia de Pago</Text>
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                  <TouchableOpacity
                    style={[styles.freqBtn, payrollFrequency === 'BIWEEKLY' && styles.freqBtnActive]}
                    onPress={() => setPayrollFrequency('BIWEEKLY')}
                  >
                    <Text style={[styles.freqBtnText, payrollFrequency === 'BIWEEKLY' && styles.freqBtnTextActive]}>
                      Quincenal (15 y 30)
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.freqBtn, payrollFrequency === 'MONTHLY' && styles.freqBtnActive]}
                    onPress={() => setPayrollFrequency('MONTHLY')}
                  >
                    <Text style={[styles.freqBtnText, payrollFrequency === 'MONTHLY' && styles.freqBtnTextActive]}>
                      Mensual (Fin de mes)
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <TouchableOpacity
              style={styles.submitBtn}
              disabled={submitting}
              onPress={handleSubmit}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#0A1128" />
              ) : (
                <Text style={styles.submitBtnText}>Crear Cuenta</Text>
              )}
            </TouchableOpacity>
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
    paddingHorizontal: 20,
    paddingTop: 18,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: FamilyMint.foreground,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: FamilyMint.foregroundSubtle,
    marginBottom: 6,
    textTransform: 'uppercase',
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
    marginBottom: 14,
  },
  chipsScroll: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  chip: {
    backgroundColor: FamilyMint.surfaceElevated,
    borderWidth: 1,
    borderColor: FamilyMint.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
  },
  chipActive: {
    backgroundColor: FamilyMint.primaryMuted,
    borderColor: FamilyMint.primary,
  },
  chipText: {
    fontSize: 12,
    color: FamilyMint.foregroundMuted,
  },
  chipTextActive: {
    color: FamilyMint.primary,
    fontWeight: '700',
  },
  payrollBox: {
    backgroundColor: FamilyMint.surfaceElevated,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
  },
  payrollTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: FamilyMint.primary,
    marginBottom: 10,
  },
  freqBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    backgroundColor: FamilyMint.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: FamilyMint.border,
  },
  freqBtnActive: {
    borderColor: FamilyMint.primary,
    backgroundColor: FamilyMint.primaryMuted,
  },
  freqBtnText: {
    fontSize: 11,
    color: FamilyMint.foregroundMuted,
  },
  freqBtnTextActive: {
    color: FamilyMint.primary,
    fontWeight: '700',
  },
  submitBtn: {
    backgroundColor: FamilyMint.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  submitBtnText: {
    color: '#0A1128',
    fontSize: 15,
    fontWeight: '700',
  },
});
