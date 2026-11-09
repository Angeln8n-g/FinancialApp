import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  Alert,
} from 'react-native';
import { FamilyMint } from '@/constants/Colors';
import { getAvailableHouseholds, switchHouseholdApi, getHousehold } from '@/constants/Api';

interface HouseholdSelectorModalProps {
  visible: boolean;
  onClose: () => void;
  onSwitched: () => void;
}

export default function HouseholdSelectorModal({
  visible,
  onClose,
  onSwitched,
}: HouseholdSelectorModalProps) {
  const [households, setHouseholds] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [switchingId, setSwitchingId] = useState<string | null>(null);

  const currentHousehold = getHousehold();

  useEffect(() => {
    if (visible) {
      loadHouseholds();
    }
  }, [visible]);

  const loadHouseholds = async () => {
    setLoading(true);
    try {
      const list = await getAvailableHouseholds();
      setHouseholds(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = async (targetId: string) => {
    if (targetId === currentHousehold?.id) {
      onClose();
      return;
    }

    setSwitchingId(targetId);
    const success = await switchHouseholdApi(targetId);
    setSwitchingId(null);

    if (success) {
      onSwitched();
      onClose();
    } else {
      Alert.alert('Error', 'No se pudo cambiar de hogar. Intenta de nuevo.');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>Mis Hogares</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={styles.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>
            Selecciona el hogar sobre el cual deseas operar finanzas compartidas.
          </Text>

          {loading ? (
            <ActivityIndicator size="small" color={FamilyMint.primary} style={{ marginVertical: 24 }} />
          ) : households.length === 0 ? (
            <Text style={styles.emptyText}>No se encontraron hogares adicionales.</Text>
          ) : (
            <FlatList
              data={households}
              keyExtractor={(item) => item.id}
              style={{ maxHeight: 280, marginVertical: 12 }}
              renderItem={({ item }) => {
                const isCurrent = item.id === currentHousehold?.id;
                const isSwitching = switchingId === item.id;

                return (
                  <TouchableOpacity
                    style={[
                      styles.householdItem,
                      isCurrent && styles.householdItemActive,
                    ]}
                    disabled={isSwitching}
                    onPress={() => handleSelect(item.id)}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.householdName, isCurrent && styles.householdNameActive]}>
                        {item.name}
                      </Text>
                      <Text style={styles.householdRole}>
                        Rol: {item.role || 'MEMBER'}
                      </Text>
                    </View>

                    {isSwitching ? (
                      <ActivityIndicator size="small" color={FamilyMint.primary} />
                    ) : isCurrent ? (
                      <View style={styles.activeBadge}>
                        <Text style={styles.activeBadgeText}>Activo</Text>
                      </View>
                    ) : null}
                  </TouchableOpacity>
                );
              }}
            />
          )}

          <TouchableOpacity style={styles.doneBtn} onPress={onClose}>
            <Text style={styles.doneBtnText}>Cerrar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 10, 24, 0.8)',
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: FamilyMint.foreground,
  },
  closeBtn: {
    fontSize: 18,
    color: FamilyMint.foregroundSubtle,
    padding: 4,
  },
  subtitle: {
    fontSize: 13,
    color: FamilyMint.foregroundMuted,
    lineHeight: 18,
  },
  emptyText: {
    fontSize: 13,
    color: FamilyMint.foregroundSubtle,
    textAlign: 'center',
    marginVertical: 20,
  },
  householdItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: FamilyMint.surfaceElevated,
    borderWidth: 1,
    borderColor: FamilyMint.border,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
  },
  householdItemActive: {
    borderColor: FamilyMint.primary,
    backgroundColor: FamilyMint.primaryMuted,
  },
  householdName: {
    fontSize: 15,
    fontWeight: '600',
    color: FamilyMint.foreground,
  },
  householdNameActive: {
    color: FamilyMint.primary,
  },
  householdRole: {
    fontSize: 12,
    color: FamilyMint.foregroundSubtle,
    marginTop: 2,
  },
  activeBadge: {
    backgroundColor: FamilyMint.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  activeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0A1128',
  },
  doneBtn: {
    backgroundColor: FamilyMint.surfaceElevated,
    borderWidth: 1,
    borderColor: FamilyMint.border,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  doneBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: FamilyMint.foreground,
  },
});
