import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { X, Target } from 'lucide-react-native';
import { FamilyMint } from '@/constants/Colors';
import { fetchWithAuth } from '@/constants/Api';

interface EditBudgetModalProps {
  visible: boolean;
  onClose: () => void;
  budget: any | null;
  onSuccess: () => void;
}

export default function EditBudgetModal({
  visible,
  onClose,
  budget,
  onSuccess,
}: EditBudgetModalProps) {
  const [limitAmount, setLimitAmount] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (budget) {
      setLimitAmount(String(budget.limitAmount || ''));
    }
  }, [budget]);

  const handleSubmit = async () => {
    if (!budget) return;
    const parsed = parseFloat(limitAmount.replace(',', '.'));
    if (isNaN(parsed) || parsed <= 0) {
      Alert.alert('Monto Inválido', 'Ingresa un límite numérico positivo.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetchWithAuth(`/api/budgets/${budget.id}`, {
        method: 'PUT',
        body: JSON.stringify({ limitAmount: parsed }),
      });
      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        const err = await res.json().catch(() => ({}));
        Alert.alert('Error', err.message || 'No se pudo actualizar el presupuesto.');
      }
    } catch (e) {
      Alert.alert('Error', 'Error de conexión.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    if (!budget) return;
    Alert.alert('Eliminar Presupuesto', '¿Deseas eliminar este presupuesto mensual?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            const res = await fetchWithAuth(`/api/budgets/${budget.id}`, { method: 'DELETE' });
            if (res.ok) {
              onSuccess();
              onClose();
            }
          } catch (e) {
            console.error(e);
          }
        },
      },
    ]);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Editar Presupuesto</Text>
              <Text style={styles.subtitle}>{budget?.category?.name || 'Categoría'}</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <X size={20} color={FamilyMint.foregroundSubtle} />
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Límite Mensual Asignado ($)</Text>
          <TextInput
            style={styles.input}
            keyboardType="decimal-pad"
            placeholder="0.00"
            placeholderTextColor={FamilyMint.foregroundSubtle}
            value={limitAmount}
            onChangeText={setLimitAmount}
          />

          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
              <Text style={styles.deleteBtnText}>Eliminar</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.submitBtn} disabled={loading} onPress={handleSubmit}>
              {loading ? (
                <ActivityIndicator size="small" color="#0A1128" />
              ) : (
                <Text style={styles.submitBtnText}>Guardar</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 10, 24, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: FamilyMint.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: FamilyMint.border,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: { fontSize: 17, fontWeight: '700', color: FamilyMint.foreground },
  subtitle: { fontSize: 12, color: FamilyMint.primary, marginTop: 2, fontWeight: '600' },
  label: { fontSize: 11, fontWeight: '700', color: FamilyMint.foregroundSubtle, marginBottom: 6, textTransform: 'uppercase' },
  input: {
    backgroundColor: FamilyMint.surfaceElevated,
    borderWidth: 1,
    borderColor: FamilyMint.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 18,
    fontWeight: '700',
    color: FamilyMint.foreground,
    marginBottom: 18,
  },
  btnRow: { flexDirection: 'row', gap: 10 },
  deleteBtn: {
    flex: 1,
    backgroundColor: FamilyMint.surfaceElevated,
    borderWidth: 1,
    borderColor: FamilyMint.expense,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  deleteBtnText: { color: FamilyMint.expense, fontWeight: '700', fontSize: 13 },
  submitBtn: {
    flex: 2,
    backgroundColor: FamilyMint.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  submitBtnText: { color: '#0A1128', fontWeight: '700', fontSize: 13 },
});
