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
import { X, PiggyBank } from 'lucide-react-native';
import { FamilyMint } from '@/constants/Colors';
import { fetchWithAuth } from '@/constants/Api';

interface EditGoalModalProps {
  visible: boolean;
  onClose: () => void;
  goal: any | null;
  onSuccess: () => void;
}

export default function EditGoalModal({
  visible,
  onClose,
  goal,
  onSuccess,
}: EditGoalModalProps) {
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (goal) {
      setName(goal.name || '');
      setTargetAmount(String(goal.targetAmount || ''));
      if (goal.targetDate) {
        setTargetDate(goal.targetDate.split('T')[0]);
      } else {
        setTargetDate('');
      }
    }
  }, [goal]);

  const handleSubmit = async () => {
    if (!goal || !name.trim()) {
      Alert.alert('Nombre Requerido', 'Ingresa un nombre para la meta.');
      return;
    }
    const parsedTarget = parseFloat(targetAmount.replace(',', '.'));
    if (isNaN(parsedTarget) || parsedTarget <= 0) {
      Alert.alert('Monto Inválido', 'Ingresa un monto objetivo válido.');
      return;
    }

    setLoading(true);
    try {
      const payload: any = {
        name: name.trim(),
        targetAmount: parsedTarget,
      };
      if (targetDate.trim()) {
        payload.targetDate = new Date(targetDate.trim()).toISOString();
      }

      const res = await fetchWithAuth(`/api/goals/${goal.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        const err = await res.json().catch(() => ({}));
        Alert.alert('Error', err.message || 'No se pudo actualizar la meta.');
      }
    } catch (e) {
      Alert.alert('Error', 'Error de conexión.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    if (!goal) return;
    Alert.alert('Eliminar Meta', `¿Deseas eliminar permanentemente "${goal.name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            const res = await fetchWithAuth(`/api/goals/${goal.id}`, { method: 'DELETE' });
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
            <Text style={styles.title}>Editar Meta de Ahorro</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={20} color={FamilyMint.foregroundSubtle} />
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Nombre de la Meta</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: Fondo de Emergencia, Vacaciones..."
            placeholderTextColor={FamilyMint.foregroundSubtle}
            value={name}
            onChangeText={setName}
          />

          <Text style={styles.label}>Monto Objetivo ($)</Text>
          <TextInput
            style={styles.input}
            keyboardType="decimal-pad"
            placeholder="0.00"
            placeholderTextColor={FamilyMint.foregroundSubtle}
            value={targetAmount}
            onChangeText={setTargetAmount}
          />

          <Text style={styles.label}>Fecha Objetivo (YYYY-MM-DD)</Text>
          <TextInput
            style={styles.input}
            placeholder="2027-12-31"
            placeholderTextColor={FamilyMint.foregroundSubtle}
            value={targetDate}
            onChangeText={setTargetDate}
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
  label: { fontSize: 11, fontWeight: '700', color: FamilyMint.foregroundSubtle, marginBottom: 6, textTransform: 'uppercase' },
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
  btnRow: { flexDirection: 'row', gap: 10, marginTop: 6 },
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
