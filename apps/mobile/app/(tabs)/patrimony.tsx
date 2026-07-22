import React, { useState } from 'react';
import { StyleSheet, ScrollView, View, Text, TouchableOpacity, Alert, Modal, TextInput } from 'react-native';

export default function MobilePatrimonyScreen() {
  const [assets, setAssets] = useState([
    { id: '1', name: 'Casa Principal (Inmueble)', type: 'REAL_ESTATE', icon: '🏠', value: 4500000 },
    { id: '2', name: 'Vehículo SUV', type: 'VEHICLE', icon: '🚗', value: 950000 },
    { id: '3', name: 'Portafolio Criptomonedas', type: 'CRYPTO', icon: '🪙', value: 320000 },
    { id: '4', name: 'Fondo de Inversión', type: 'INVESTMENT', icon: '📈', value: 500000 },
    { id: '5', name: 'Saldo en Cuentas Bancarias', type: 'CASH', icon: '💵', value: 70700 },
  ]);

  const [liabilities] = useState([
    { id: '1', name: 'Hipoteca Vivienda', value: 2800000 },
    { id: '2', name: 'Préstamo Vehículo', value: 180000 },
    { id: '3', name: 'Tarjeta Crédito Gold', value: 45000 },
  ]);

  const [showModal, setShowModal] = useState(false);
  const [assetName, setAssetName] = useState('');
  const [assetValue, setAssetValue] = useState('');

  const totalAssets = assets.reduce((acc, a) => acc + a.value, 0);
  const totalLiabilities = liabilities.reduce((acc, l) => acc + l.value, 0);
  const netWorth = totalAssets - totalLiabilities;

  const handleCreateAsset = () => {
    if (!assetName || !assetValue) return;
    setAssets([
      { id: Date.now().toString(), name: assetName, type: 'CASH_OTHER', icon: '💎', value: parseFloat(assetValue) },
      ...assets,
    ]);
    setShowModal(false);
    setAssetName('');
    setAssetValue('');
    Alert.alert('¡Éxito!', 'Activo registrado correctamente');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.screenTitle}>Patrimonio Neto</Text>
          <Text style={styles.screenSub}>Balance global de activos y pasivos</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={() => setShowModal(true)}>
          <Text style={styles.addButtonText}>+ Activo</Text>
        </TouchableOpacity>
      </View>

      {/* 🏆 TARJETA NET WORTH */}
      <View style={styles.netWorthCard}>
        <Text style={styles.netWorthLabel}>PATRIMONIO NETO CONSOLIDADO</Text>
        <Text style={styles.netWorthValue}>
          RD${netWorth.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </Text>

        <View style={styles.netWorthRow}>
          <View style={styles.netWorthSubItem}>
            <Text style={styles.assetLabel}>TOTAL ACTIVOS</Text>
            <Text style={styles.assetValueText}>+RD${totalAssets.toLocaleString()}</Text>
          </View>
          <View style={styles.netWorthSubItem}>
            <Text style={styles.liabLabel}>TOTAL PASIVOS</Text>
            <Text style={styles.liabValueText}>-RD${totalLiabilities.toLocaleString()}</Text>
          </View>
        </View>
      </View>

      {/* 💎 ACTIVOS */}
      <Text style={styles.sectionHeader}>Activos (Bienes y Propiedades)</Text>
      {assets.map((a) => (
        <View key={a.id} style={styles.assetCard}>
          <View style={styles.cardLeft}>
            <Text style={styles.assetIcon}>{a.icon}</Text>
            <View>
              <Text style={styles.cardTitle}>{a.name}</Text>
              <Text style={styles.assetType}>{a.type}</Text>
            </View>
          </View>
          <Text style={styles.assetAmount}>+RD${a.value.toLocaleString()}</Text>
        </View>
      ))}

      {/* 📉 PASIVOS */}
      <Text style={styles.sectionHeader}>Pasivos (Deudas e Hipotecas)</Text>
      {liabilities.map((l) => (
        <View key={l.id} style={styles.liabCard}>
          <View style={styles.cardLeft}>
            <Text style={styles.assetIcon}>🏦</Text>
            <Text style={styles.cardTitle}>{l.name}</Text>
          </View>
          <Text style={styles.liabAmount}>-RD${l.value.toLocaleString()}</Text>
        </View>
      ))}

      {/* Modal Registrar Activo */}
      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Registrar Nuevo Activo</Text>
            <TextInput style={styles.modalInput} placeholder="Nombre del activo (ej. Inmueble, Vehículo)" placeholderTextColor="#94a3b8" value={assetName} onChangeText={setAssetName} />
            <TextInput style={styles.modalInput} placeholder="Valor Estimado (RD$)" placeholderTextColor="#94a3b8" keyboardType="numeric" value={assetValue} onChangeText={setAssetValue} />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowModal(false)}><Text style={styles.cancelBtnText}>Cancelar</Text></TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleCreateAsset}><Text style={styles.saveBtnText}>Guardar</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090d16' },
  contentContainer: { padding: 16, paddingTop: 48, paddingBottom: 40 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  screenTitle: { fontSize: 20, fontWeight: 'bold', color: '#ffffff' },
  screenSub: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  addButton: { backgroundColor: '#10b981', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  addButtonText: { color: '#ffffff', fontSize: 12, fontWeight: 'bold' },
  netWorthCard: { backgroundColor: 'rgba(30, 41, 59, 0.9)', borderRadius: 20, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: '#9333ea' },
  netWorthLabel: { fontSize: 10, fontWeight: 'bold', color: '#c084fc', letterSpacing: 1 },
  netWorthValue: { fontSize: 30, fontWeight: '900', color: '#ffffff', marginTop: 4 },
  netWorthRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#1e293b' },
  netWorthSubItem: { flex: 1 },
  assetLabel: { fontSize: 9, fontWeight: 'bold', color: '#34d399' },
  assetValueText: { fontSize: 14, fontWeight: 'bold', color: '#34d399', marginTop: 2 },
  liabLabel: { fontSize: 9, fontWeight: 'bold', color: '#fb7185' },
  liabValueText: { fontSize: 14, fontWeight: 'bold', color: '#fb7185', marginTop: 2 },
  sectionHeader: { fontSize: 15, fontWeight: 'bold', color: '#ffffff', marginTop: 12, marginBottom: 12 },
  assetCard: { backgroundColor: 'rgba(30, 41, 59, 0.8)', borderRadius: 14, padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.2)' },
  liabCard: { backgroundColor: 'rgba(30, 41, 59, 0.8)', borderRadius: 14, padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, borderWidth: 1, borderColor: 'rgba(244, 63, 94, 0.2)' },
  cardLeft: { flexDirection: 'row', alignItems: 'center' },
  assetIcon: { fontSize: 20, marginRight: 10 },
  cardTitle: { fontSize: 13, fontWeight: 'bold', color: '#ffffff' },
  assetType: { fontSize: 10, color: '#94a3b8' },
  assetAmount: { fontSize: 14, fontWeight: 'bold', color: '#34d399' },
  liabAmount: { fontSize: 14, fontWeight: 'bold', color: '#fb7185' },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#0f172a', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#10b981' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#ffffff', marginBottom: 16 },
  modalInput: { backgroundColor: '#1e293b', borderRadius: 10, padding: 12, color: '#ffffff', marginBottom: 12 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 10 },
  cancelBtn: { padding: 10, borderRadius: 8, backgroundColor: '#334155' },
  cancelBtnText: { color: '#cbd5e1', fontSize: 12, fontWeight: 'bold' },
  saveBtn: { padding: 10, borderRadius: 8, backgroundColor: '#10b981' },
  saveBtnText: { color: '#ffffff', fontSize: 12, fontWeight: 'bold' },
});
