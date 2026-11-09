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
import { X, Gem } from 'lucide-react-native';
import { FamilyMint } from '@/constants/Colors';
import { fetchWithAuth } from '@/constants/Api';

interface EditAssetModalProps {
  visible: boolean;
  onClose: () => void;
  asset: any | null;
  onSuccess: () => void;
}

const ASSET_TYPES = [
  { id: 'REAL_ESTATE', label: 'Inmueble' },
  { id: 'VEHICLE', label: 'Vehículo' },
  { id: 'INVESTMENT', label: 'Inversión' },
  { id: 'BUSINESS', label: 'Negocio' },
  { id: 'COLLECTIBLE', label: 'Coleccionable' },
  { id: 'OTHER', label: 'Otro' },
];

export default function EditAssetModal({
  visible,
  onClose,
  asset,
  onSuccess,
}: EditAssetModalProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState('REAL_ESTATE');
  const [currentValue, setCurrentValue] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (asset) {
      setName(asset.name || '');
      setType(asset.type || 'REAL_ESTATE');
      setCurrentValue(String(asset.currentValue || ''));
      setNotes(asset.notes || '');
    }
  }, [asset]);

  const handleSubmit = async () => {
    if (!asset || !name.trim()) {
      Alert.alert('Nombre Requerido', 'Ingresa un nombre para el activo.');
      return;
    }
    const val = parseFloat(currentValue.replace(',', '.'));

    setLoading(true);
    try {
      const res = await fetchWithAuth(`/api/patrimony/assets/${asset.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: name.trim(),
          type,
          currentValue: isNaN(val) ? 0 : val,
          notes: notes.trim(),
        }),
      });

      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        const err = await res.json().catch(() => ({}));
        Alert.alert('Error', err.message || 'No se pudo actualizar el activo.');
      }
    } catch (e) {
      Alert.alert('Error', 'Error de conexión.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    if (!asset) return;
    Alert.alert('Eliminar Activo', `¿Deseas eliminar permanentemente "${asset.name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            const res = await fetchWithAuth(`/api/patrimony/assets/${asset.id}`, { method: 'DELETE' });
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
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Editar Activo Patrimonial</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={20} color={FamilyMint.foregroundSubtle} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
            <Text style={styles.label}>Nombre del Activo</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: Apartamento Piantini, Vehículo..."
              placeholderTextColor={FamilyMint.foregroundSubtle}
              value={name}
              onChangeText={setName}
            />

            <Text style={styles.label}>Tipo de Activo</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row', marginBottom: 14 }}>
              {ASSET_TYPES.map((t) => (
                <TouchableOpacity
                  key={t.id}
                  style={[styles.typeBtn, type === t.id && styles.typeBtnActive]}
                  onPress={() => setType(t.id)}
                >
                  <Text style={[styles.typeBtnText, type === t.id && styles.typeBtnTextActive]}>
                    {t.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.label}>Valor Actual Estimado ($)</Text>
            <TextInput
              style={styles.input}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor={FamilyMint.foregroundSubtle}
              value={currentValue}
              onChangeText={setCurrentValue}
            />

            <Text style={styles.label}>Notas y Ubicación</Text>
            <TextInput
              style={styles.input}
              placeholder="Notas opcionales..."
              placeholderTextColor={FamilyMint.foregroundSubtle}
              value={notes}
              onChangeText={setNotes}
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
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    borderColor: FamilyMint.border,
    padding: 20,
    maxHeight: '90%',
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
  typeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: FamilyMint.surfaceElevated,
    borderWidth: 1,
    borderColor: FamilyMint.border,
    marginRight: 8,
  },
  typeBtnActive: { borderColor: FamilyMint.primary, backgroundColor: FamilyMint.primaryMuted },
  typeBtnText: { fontSize: 11, color: FamilyMint.foregroundMuted, fontWeight: '600' },
  typeBtnTextActive: { color: FamilyMint.primary, fontWeight: '700' },
  btnRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
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
