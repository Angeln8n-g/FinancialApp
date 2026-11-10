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
} from 'react-native';
import { ArrowDownRight, ArrowUpRight, ArrowRightLeft, X, Camera } from 'lucide-react-native';
import { FamilyMint } from '@/constants/Colors';

interface TransactionModalProps {
  visible: boolean;
  onClose: () => void;
  accounts: any[];
  categories: any[];
  initialType?: 'EXPENSE' | 'INCOME' | 'TRANSFER';
  initialDate?: string;
  onSuccess: () => void;
}

export default function TransactionModal({
  visible,
  onClose,
  accounts,
  categories,
  initialType = 'EXPENSE',
  initialDate,
  onSuccess,
}: TransactionModalProps) {
  const [type, setType] = useState<'EXPENSE' | 'INCOME' | 'TRANSFER'>(initialType);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [accountId, setAccountId] = useState('');
  const [destinationAccountId, setDestinationAccountId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [date, setDate] = useState(initialDate || new Date().toISOString().split('T')[0]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      setType(initialType);
      setAmount('');
      setDescription('');
      setDate(initialDate || new Date().toISOString().split('T')[0]);
      if (accounts.length > 0) {
        setAccountId(accounts[0].id);
        if (accounts.length > 1) {
          setDestinationAccountId(accounts[1].id);
        }
      }
      if (categories.length > 0) {
        setCategoryId(categories[0].id);
      }
    }
  }, [visible, initialType, initialDate, accounts, categories]);

  const handleSubmit = async () => {
    const parsedAmount = parseFloat(amount.replace(',', '.'));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert('Monto Inválido', 'Por favor ingresa un monto numérico positivo.');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Descripción Requerida', 'Ingresa una descripción para el movimiento.');
      return;
    }
    if (!accountId) {
      Alert.alert('Cuenta Requerida', 'Debes seleccionar una cuenta de origen.');
      return;
    }
    if (type === 'TRANSFER' && (!destinationAccountId || destinationAccountId === accountId)) {
      Alert.alert('Transferencia Inválida', 'Selecciona una cuenta de destino distinta a la de origen.');
      return;
    }

    setSubmitting(true);
    try {
      const { fetchWithAuth } = await import('@/constants/Api');
      const payload: any = {
        type,
        amount: parsedAmount,
        description: description.trim(),
        accountId,
        date: new Date(date).toISOString(),
      };

      if (type === 'TRANSFER') {
        payload.destinationAccountId = destinationAccountId;
      } else if (categoryId) {
        payload.categoryId = categoryId;
      }

      const res = await fetchWithAuth('/api/transactions', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        const err = await res.json().catch(() => ({}));
        Alert.alert('Error', err.message || 'No se pudo guardar la transacción.');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Error de conexión.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAutofillReceipt = async () => {
    try {
      const { fetchWithAuth } = await import('@/constants/Api');
      const res = await fetchWithAuth('/api/ocr/samples');
      let sampleList = [
        { merchant: 'Supermercado Nacional', amount: 47.32, rawText: 'SUPERMERCADO NACIONAL\nFECHA: 24/10/2026\nTOTAL: $47.32' },
        { merchant: 'Restaurante Bella', amount: 56.40, rawText: 'RESTAURANTE BELLA\nFECHA: 25/10/2026\nTOTAL: $56.40' },
        { merchant: 'Farmacia Carol', amount: 18.90, rawText: 'FARMACIA CAROL\nFECHA: 26/10/2026\nTOTAL: $18.90' },
      ];
      if (res.ok) {
        const data = await res.json();
        if (data.samples && data.samples.length > 0) sampleList = data.samples;
      }

      Alert.alert(
        'Escanear Recibo con IA (OCR)',
        'Selecciona un comprobante para analizar y autocompletar:',
        [
          { text: 'Cancelar', style: 'cancel' },
          ...sampleList.slice(0, 3).map((s: any) => ({
            text: `${s.merchant} ($${Number(s.amount).toFixed(2)})`,
            onPress: async () => {
              try {
                const parseRes = await fetchWithAuth('/api/ocr/parse', {
                  method: 'POST',
                  body: JSON.stringify({ rawText: s.rawText }),
                });
                if (parseRes.ok) {
                  const pData = await parseRes.json();
                  const c = pData.candidate || {};
                  setType('EXPENSE');
                  if (c.totalAmount) setAmount(String(c.totalAmount));
                  setDescription(c.merchantName ? `${c.merchantName} [🧾 OCR]` : `${s.merchant} [🧾 OCR]`);
                  if (c.categoryId) setCategoryId(c.categoryId);
                  if (c.date) setDate(c.date);
                } else {
                  setType('EXPENSE');
                  setAmount(String(s.amount));
                  setDescription(`${s.merchant} [🧾 OCR]`);
                }
              } catch (e) {
                setType('EXPENSE');
                setAmount(String(s.amount));
                setDescription(`${s.merchant} [🧾 OCR]`);
              }
            },
          })),
        ]
      );
    } catch (e) {
      Alert.alert('OCR', 'No se pudieron cargar los comprobantes.');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={styles.title}>Nuevo Movimiento</Text>
              <TouchableOpacity
                onPress={handleAutofillReceipt}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(168, 85, 247, 0.15)', borderWidth: 1, borderColor: 'rgba(168, 85, 247, 0.3)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}
              >
                <Camera size={13} color="#C084FC" />
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#C084FC' }}>OCR Ticket</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <X size={20} color={FamilyMint.foregroundSubtle} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
            {/* Segmented Type Control */}
            <View style={styles.typeSelector}>
              <TouchableOpacity
                style={[styles.typeBtn, type === 'EXPENSE' && styles.typeBtnExpense]}
                onPress={() => setType('EXPENSE')}
              >
                <ArrowDownRight
                  size={16}
                  color={type === 'EXPENSE' ? '#FFFFFF' : FamilyMint.expense}
                />
                <Text style={[styles.typeBtnText, type === 'EXPENSE' && styles.typeBtnTextActive]}>
                  Gasto
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.typeBtn, type === 'INCOME' && styles.typeBtnIncome]}
                onPress={() => setType('INCOME')}
              >
                <ArrowUpRight
                  size={16}
                  color={type === 'INCOME' ? '#FFFFFF' : FamilyMint.income}
                />
                <Text style={[styles.typeBtnText, type === 'INCOME' && styles.typeBtnTextActive]}>
                  Ingreso
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.typeBtn, type === 'TRANSFER' && styles.typeBtnTransfer]}
                onPress={() => setType('TRANSFER')}
              >
                <ArrowRightLeft
                  size={16}
                  color={type === 'TRANSFER' ? '#FFFFFF' : FamilyMint.info}
                />
                <Text style={[styles.typeBtnText, type === 'TRANSFER' && styles.typeBtnTextActive]}>
                  Transferir
                </Text>
              </TouchableOpacity>
            </View>

            {/* Monto Principal */}
            <Text style={styles.label}>Monto ($)</Text>
            <TextInput
              style={styles.amountInput}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor={FamilyMint.foregroundSubtle}
              value={amount}
              onChangeText={setAmount}
            />

            {/* Descripción */}
            <Text style={styles.label}>Descripción</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: Mercado semanal, Gasolina..."
              placeholderTextColor={FamilyMint.foregroundSubtle}
              value={description}
              onChangeText={setDescription}
            />

            {/* Cuenta Origen */}
            <Text style={styles.label}>
              {type === 'TRANSFER' ? 'Cuenta de Origen' : 'Cuenta'}
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
              {accounts.map((acc) => {
                const isSelected = acc.id === accountId;
                return (
                  <TouchableOpacity
                    key={acc.id}
                    style={[styles.chip, isSelected && styles.chipActive]}
                    onPress={() => setAccountId(acc.id)}
                  >
                    <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                      {acc.name} (${Number(acc.balance).toFixed(2)})
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Cuenta Destino (Solo si es transferencia) */}
            {type === 'TRANSFER' && (
              <>
                <Text style={styles.label}>Cuenta de Destino</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
                  {accounts
                    .filter((a) => a.id !== accountId)
                    .map((acc) => {
                      const isSelected = acc.id === destinationAccountId;
                      return (
                        <TouchableOpacity
                          key={acc.id}
                          style={[styles.chip, isSelected && styles.chipActive]}
                          onPress={() => setDestinationAccountId(acc.id)}
                        >
                          <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                            {acc.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                </ScrollView>
              </>
            )}

            {/* Categoría (Solo Gasto o Ingreso) */}
            {type !== 'TRANSFER' && categories.length > 0 && (
              <>
                <Text style={styles.label}>Categoría</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
                  {categories.map((cat) => {
                    const isSelected = cat.id === categoryId;
                    return (
                      <TouchableOpacity
                        key={cat.id}
                        style={[styles.chip, isSelected && styles.chipActive]}
                        onPress={() => setCategoryId(cat.id)}
                      >
                        <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                          {cat.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </>
            )}

            {/* Fecha */}
            <Text style={styles.label}>Fecha (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.input}
              placeholder="2026-11-08"
              placeholderTextColor={FamilyMint.foregroundSubtle}
              value={date}
              onChangeText={setDate}
            />

            {/* Botón de Enviar */}
            <TouchableOpacity
              style={[
                styles.submitBtn,
                type === 'EXPENSE'
                  ? styles.submitExpense
                  : type === 'INCOME'
                  ? styles.submitIncome
                  : styles.submitTransfer,
              ]}
              disabled={submitting}
              onPress={handleSubmit}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.submitBtnText}>
                  {type === 'EXPENSE'
                    ? 'Guardar Gasto'
                    : type === 'INCOME'
                    ? 'Guardar Ingreso'
                    : 'Confirmar Transferencia'}
                </Text>
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
  typeSelector: {
    flexDirection: 'row',
    backgroundColor: FamilyMint.surfaceElevated,
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: FamilyMint.border,
  },
  typeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 4,
  },
  typeBtnExpense: {
    backgroundColor: FamilyMint.expense,
  },
  typeBtnIncome: {
    backgroundColor: FamilyMint.income,
  },
  typeBtnTransfer: {
    backgroundColor: '#3B82F6',
  },
  typeBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: FamilyMint.foregroundMuted,
  },
  typeBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: FamilyMint.foregroundSubtle,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  amountInput: {
    backgroundColor: FamilyMint.surfaceElevated,
    borderWidth: 1,
    borderColor: FamilyMint.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 26,
    fontWeight: '800',
    color: FamilyMint.foreground,
    marginBottom: 14,
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
  submitBtn: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  submitExpense: {
    backgroundColor: FamilyMint.expense,
  },
  submitIncome: {
    backgroundColor: FamilyMint.income,
  },
  submitTransfer: {
    backgroundColor: '#3B82F6',
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
