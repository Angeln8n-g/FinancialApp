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
import { X, Building2, Briefcase, Trash2, Check, CreditCard, Wallet, Landmark } from 'lucide-react-native';
import { FamilyMint } from '@/constants/Colors';
import { fetchWithAuth } from '@/constants/Api';

interface EditAccountModalProps {
  visible: boolean;
  onClose: () => void;
  account: any | null;
  onSuccess: () => void;
}

const ACCOUNT_TYPES = [
  { id: 'BANK_ACCOUNT', label: 'Cuenta Bancaria' },
  { id: 'CASH', label: 'Efectivo / Caja' },
  { id: 'PAYROLL', label: 'Cuenta Nómina' },
  { id: 'SAVINGS', label: 'Ahorros' },
  { id: 'INVESTMENT', label: 'Inversión' },
  { id: 'CREDIT_CARD', label: 'Tarjeta de Crédito' },
];

const CURRENCIES = ['USD', 'EUR', 'DOP', 'MXN', 'COP', 'ARS', 'CLP', 'PEN', 'GBP', 'BRL', 'CAD', 'USDT'];

export default function EditAccountModal({
  visible,
  onClose,
  account,
  onSuccess,
}: EditAccountModalProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState('BANK_ACCOUNT');
  const [currency, setCurrency] = useState('USD');

  // Configuración de Nómina
  const [payrollAmount, setPayrollAmount] = useState('');
  const [payrollFrequency, setPayrollFrequency] = useState<'MONTHLY' | 'BIWEEKLY'>('BIWEEKLY');
  const [payrollDay1, setPayrollDay1] = useState('15');
  const [payrollDay2, setPayrollDay2] = useState('30');
  const [payrollAutoDeposit, setPayrollAutoDeposit] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (account) {
      setName(account.name || '');
      setType(account.type || 'BANK_ACCOUNT');
      setCurrency(account.currency || 'USD');
      setPayrollAmount(account.payrollAmount ? account.payrollAmount.toString() : '');
      setPayrollFrequency(account.payrollFrequency || 'BIWEEKLY');
      setPayrollDay1(account.payrollDay1 ? account.payrollDay1.toString() : '15');
      setPayrollDay2(account.payrollDay2 ? account.payrollDay2.toString() : '30');
      setPayrollAutoDeposit(account.payrollAutoDeposit ?? true);
    }
  }, [account]);

  if (!account) return null;

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('Nombre Requerido', 'Por favor ingresa un nombre para la cuenta.');
      return;
    }

    const isPayroll = type === 'PAYROLL';
    const parsedPayrollAmount = parseFloat(payrollAmount.replace(',', '.'));

    const payload: any = {
      name: name.trim(),
      type,
      currency,
    };

    if (isPayroll) {
      payload.payrollAmount = !isNaN(parsedPayrollAmount) && parsedPayrollAmount > 0 ? parsedPayrollAmount : null;
      payload.payrollFrequency = payrollFrequency;
      payload.payrollDay1 = parseInt(payrollDay1, 10) || 15;
      payload.payrollDay2 = payrollFrequency === 'BIWEEKLY' ? parseInt(payrollDay2, 10) || 30 : null;
      payload.payrollAutoDeposit = payrollAutoDeposit;
    } else {
      payload.payrollAmount = null;
      payload.payrollAutoDeposit = false;
    }

    setSubmitting(true);
    try {
      const res = await fetchWithAuth(`/api/accounts/${account.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        Alert.alert('Éxito', 'Cuenta actualizada correctamente.');
        onSuccess();
        onClose();
      } else {
        const err = await res.json().catch(() => ({}));
        Alert.alert('Error', err.message || 'No se pudo actualizar la cuenta.');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Error de conexión.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Eliminar Cuenta',
      `¿Estás seguro de eliminar "${account.name}"? Los movimientos asociados permanecerán en el historial.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              const res = await fetchWithAuth(`/api/accounts/${account.id}`, {
                method: 'DELETE',
              });

              if (res.ok) {
                Alert.alert('Cuenta Eliminada', 'La cuenta ha sido eliminada.');
                onSuccess();
                onClose();
              } else {
                const err = await res.json().catch(() => ({}));
                Alert.alert('Error', err.message || 'No se pudo eliminar la cuenta.');
              }
            } catch (e: any) {
              Alert.alert('Error', e.message || 'Error de conexión.');
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  const isPayroll = type === 'PAYROLL';

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalBg}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={styles.headerIconWrap}>
                {isPayroll ? (
                  <Briefcase size={18} color={FamilyMint.primary} />
                ) : (
                  <Building2 size={18} color={FamilyMint.primary} />
                )}
              </View>
              <View>
                <Text style={styles.title}>Editar Cuenta</Text>
                <Text style={styles.subtitle}>Modifica los datos o configuración de nómina</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color={FamilyMint.foregroundSubtle} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
            {/* Nombre */}
            <Text style={styles.label}>Nombre de la Cuenta</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Ej. BHD Nómina, Scotia Ahorros"
              placeholderTextColor={FamilyMint.foregroundSubtle}
            />

            {/* Tipo de Cuenta */}
            <Text style={styles.label}>Tipo de Cuenta</Text>
            <View style={styles.typeGrid}>
              {ACCOUNT_TYPES.map((t) => {
                const isSelected = type === t.id;
                return (
                  <TouchableOpacity
                    key={t.id}
                    onPress={() => setType(t.id)}
                    style={[
                      styles.typeBtn,
                      isSelected && styles.typeBtnActive,
                      t.id === 'PAYROLL' && isSelected && { borderColor: FamilyMint.primary },
                    ]}
                  >
                    <Text
                      style={[
                        styles.typeBtnText,
                        isSelected && styles.typeBtnTextActive,
                        t.id === 'PAYROLL' && isSelected && { color: FamilyMint.primary },
                      ]}
                    >
                      {t.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Moneda */}
            <Text style={styles.label}>Moneda Principal</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.currScroll}>
              {CURRENCIES.map((c) => (
                <TouchableOpacity
                  key={c}
                  onPress={() => setCurrency(c)}
                  style={[styles.currPill, currency === c && styles.currPillActive]}
                >
                  <Text style={[styles.currPillText, currency === c && styles.currPillTextActive]}>
                    {c}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Configuración de Nómina */}
            {isPayroll && (
              <View style={styles.payrollBox}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                  <Briefcase size={16} color={FamilyMint.primary} />
                  <Text style={styles.payrollBoxTitle}>Configuración de Nómina & Salario</Text>
                </View>

                <Text style={styles.label}>Monto del Salario Neto ({currency})</Text>
                <TextInput
                  style={styles.input}
                  value={payrollAmount}
                  onChangeText={setPayrollAmount}
                  placeholder="0.00"
                  placeholderTextColor={FamilyMint.foregroundSubtle}
                  keyboardType="numeric"
                />

                <Text style={styles.label}>Frecuencia de Cobro</Text>
                <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
                  <TouchableOpacity
                    onPress={() => setPayrollFrequency('BIWEEKLY')}
                    style={[
                      styles.freqBtn,
                      payrollFrequency === 'BIWEEKLY' && styles.freqBtnActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.freqBtnText,
                        payrollFrequency === 'BIWEEKLY' && styles.freqBtnTextActive,
                      ]}
                    >
                      Quincenal (15 y 30)
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setPayrollFrequency('MONTHLY')}
                    style={[
                      styles.freqBtn,
                      payrollFrequency === 'MONTHLY' && styles.freqBtnActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.freqBtnText,
                        payrollFrequency === 'MONTHLY' && styles.freqBtnTextActive,
                      ]}
                    >
                      Mensual (Día fijo)
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Días de pago */}
                <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>Primer Día de Cobro</Text>
                    <TextInput
                      style={styles.input}
                      value={payrollDay1}
                      onChangeText={setPayrollDay1}
                      placeholder="15"
                      placeholderTextColor={FamilyMint.foregroundSubtle}
                      keyboardType="numeric"
                    />
                  </View>

                  {payrollFrequency === 'BIWEEKLY' && (
                    <View style={{ flex: 1 }}>
                      <Text style={styles.label}>Segundo Día de Cobro</Text>
                      <TextInput
                        style={styles.input}
                        value={payrollDay2}
                        onChangeText={setPayrollDay2}
                        placeholder="30"
                        placeholderTextColor={FamilyMint.foregroundSubtle}
                        keyboardType="numeric"
                      />
                    </View>
                  )}
                </View>

                {/* Switch Auto-Abono */}
                <View style={styles.switchRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.switchTitle}>Acreditar automáticamente</Text>
                    <Text style={styles.switchSub}>
                      El sistema registrará el ingreso de salario en las fechas fijadas
                    </Text>
                  </View>
                  <Switch
                    value={payrollAutoDeposit}
                    onValueChange={setPayrollAutoDeposit}
                    trackColor={{ false: '#1E2B4D', true: FamilyMint.primary }}
                    thumbColor="#FFFFFF"
                  />
                </View>
              </View>
            )}

            {/* Botón Eliminar Cuenta */}
            <TouchableOpacity
              onPress={handleDelete}
              disabled={deleting || submitting}
              style={styles.deleteBtn}
            >
              {deleting ? (
                <ActivityIndicator size="small" color={FamilyMint.expense} />
              ) : (
                <>
                  <Trash2 size={16} color={FamilyMint.expense} />
                  <Text style={styles.deleteBtnText}>Eliminar esta Cuenta</Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>

          {/* Footer Actions */}
          <View style={styles.footer}>
            <TouchableOpacity onPress={onClose} style={styles.cancelBtn} disabled={submitting}>
              <Text style={styles.cancelBtnText}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSubmit}
              style={styles.saveBtn}
              disabled={submitting || deleting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#0A1128" />
              ) : (
                <>
                  <Check size={16} color="#0A1128" />
                  <Text style={styles.saveBtnText}>Guardar Cambios</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: FamilyMint.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: FamilyMint.border,
    maxHeight: '90%',
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: FamilyMint.border,
  },
  headerIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: FamilyMint.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: FamilyMint.foreground,
  },
  subtitle: {
    fontSize: 11,
    color: FamilyMint.foregroundMuted,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 10,
    backgroundColor: FamilyMint.surfaceElevated,
  },
  scrollArea: {
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: FamilyMint.foregroundMuted,
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    backgroundColor: FamilyMint.surfaceElevated,
    borderWidth: 1,
    borderColor: FamilyMint.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: FamilyMint.foreground,
    fontSize: 14,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: FamilyMint.surfaceElevated,
    borderWidth: 1,
    borderColor: FamilyMint.border,
  },
  typeBtnActive: {
    borderColor: FamilyMint.primary,
    backgroundColor: FamilyMint.primaryMuted,
  },
  typeBtnText: {
    fontSize: 12,
    color: FamilyMint.foregroundMuted,
    fontWeight: '500',
  },
  typeBtnTextActive: {
    color: FamilyMint.foreground,
    fontWeight: '700',
  },
  currScroll: {
    marginBottom: 4,
  },
  currPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: FamilyMint.surfaceElevated,
    borderWidth: 1,
    borderColor: FamilyMint.border,
    marginRight: 8,
  },
  currPillActive: {
    backgroundColor: FamilyMint.primary,
    borderColor: FamilyMint.primary,
  },
  currPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: FamilyMint.foregroundMuted,
  },
  currPillTextActive: {
    color: '#0A1128',
    fontWeight: '700',
  },
  payrollBox: {
    marginTop: 14,
    padding: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  payrollBoxTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: FamilyMint.primary,
  },
  freqBtn: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
    backgroundColor: FamilyMint.surfaceElevated,
    borderWidth: 1,
    borderColor: FamilyMint.border,
    alignItems: 'center',
  },
  freqBtnActive: {
    borderColor: FamilyMint.primary,
    backgroundColor: FamilyMint.primaryMuted,
  },
  freqBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: FamilyMint.foregroundMuted,
  },
  freqBtnTextActive: {
    color: FamilyMint.primary,
    fontWeight: '700',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    marginTop: 6,
  },
  switchTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: FamilyMint.foreground,
  },
  switchSub: {
    fontSize: 10,
    color: FamilyMint.foregroundSubtle,
    marginTop: 2,
    paddingRight: 10,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
    marginBottom: 10,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: FamilyMint.expenseBg,
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.3)',
  },
  deleteBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: FamilyMint.expense,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: FamilyMint.border,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: FamilyMint.border,
    alignItems: 'center',
    backgroundColor: FamilyMint.surfaceElevated,
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: FamilyMint.foregroundMuted,
  },
  saveBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: FamilyMint.primary,
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0A1128',
  },
});
