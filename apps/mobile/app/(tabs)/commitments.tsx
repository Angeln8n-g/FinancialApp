import React, { useState } from 'react';
import { StyleSheet, ScrollView, View, Text, TouchableOpacity, Alert, Modal, TextInput } from 'react-native';

export default function MobileCommitmentsScreen() {
  const [debts, setDebts] = useState([
    { id: '1', name: 'Préstamo Vehículo SUV', remaining: 180000, total: 350000, rate: 12 },
    { id: '2', name: 'Tarjeta Crédito Gold', remaining: 45000, total: 100000, rate: 18 },
    { id: '3', name: 'Hipoteca Vivienda', remaining: 2800000, total: 3500000, rate: 8.5 },
  ]);

  const [subscriptions, setSubscriptions] = useState([
    { id: '1', name: 'Netflix 4K', cost: 15.99, date: '15 de cada mes' },
    { id: '2', name: 'Spotify Familiar', cost: 9.99, date: '20 de cada mes' },
    { id: '3', name: 'ChatGPT Plus', cost: 20.00, date: '01 de cada mes' },
    { id: '4', name: 'Amazon Prime', cost: 14.99, date: '12 de cada mes' },
    { id: '5', name: 'Hosting Cloud Server', cost: 35.00, date: '05 de cada mes' },
  ]);

  // Modales
  const [showDebtModal, setShowDebtModal] = useState(false);
  const [showSubModal, setShowSubModal] = useState(false);
  const [showEditSubModal, setShowEditSubModal] = useState(false);

  const [dName, setDName] = useState('');
  const [dAmount, setDAmount] = useState('');
  const [dRate, setDRate] = useState('');

  const [sName, setSName] = useState('');
  const [sCost, setSCost] = useState('');

  const [selectedSub, setSelectedSub] = useState<any>(null);
  const [editSubName, setEditSubName] = useState('');
  const [editSubCost, setEditSubCost] = useState('');

  const totalMonthlySubs = subscriptions.reduce((acc, s) => acc + s.cost, 0);

  const handleCreateDebt = () => {
    if (!dName || !dAmount) return;
    const amountNum = parseFloat(dAmount);
    setDebts([
      { id: Date.now().toString(), name: dName, remaining: amountNum, total: amountNum, rate: parseFloat(dRate || '0') },
      ...debts,
    ]);
    setShowDebtModal(false);
    setDName('');
    setDAmount('');
    setDRate('');
    Alert.alert('¡Éxito!', 'Deuda registrada con éxito');
  };

  const handleDeleteDebt = (id: string) => {
    setDebts((prev) => prev.filter((d) => d.id !== id));
    Alert.alert('Deuda Eliminada', 'La deuda fue borrada.');
  };

  const handleCreateSub = () => {
    if (!sName || !sCost) return;
    setSubscriptions([
      { id: Date.now().toString(), name: sName, cost: parseFloat(sCost), date: 'Próximo mes' },
      ...subscriptions,
    ]);
    setShowSubModal(false);
    setSName('');
    setSCost('');
    Alert.alert('¡Éxito!', 'Suscripción agregada con éxito');
  };

  const handleDeleteSub = (id: string) => {
    setSubscriptions((prev) => prev.filter((s) => s.id !== id));
    Alert.alert('Suscripción Eliminada', 'El servicio fue borrado.');
  };

  const handleOpenEditSub = (s: any) => {
    setSelectedSub(s);
    setEditSubName(s.name);
    setEditSubCost(s.cost.toString());
    setShowEditSubModal(true);
  };

  const handleSaveEditSub = () => {
    if (!selectedSub || !editSubName || !editSubCost) return;
    setSubscriptions((prev) =>
      prev.map((s) => (s.id === selectedSub.id ? { ...s, name: editSubName, cost: parseFloat(editSubCost) } : s))
    );
    setShowEditSubModal(false);
    Alert.alert('Guardado', 'Suscripción actualizada correctamente.');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.screenTitle}>Deudas & Suscripciones</Text>
          <Text style={styles.screenSub}>Compromisos financieros recurrentes</Text>
        </View>
      </View>

      {/* 💸 DEUDAS Y PRÉSTAMOS */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionHeader}>Deudas y Préstamos</Text>
        <TouchableOpacity style={styles.addSmallBtn} onPress={() => setShowDebtModal(true)}>
          <Text style={styles.addSmallBtnText}>+ Deuda</Text>
        </TouchableOpacity>
      </View>

      {debts.map((d) => (
        <View key={d.id} style={styles.debtCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>{d.name}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={styles.rateBadge}>
                <Text style={styles.rateText}>Tasa {d.rate}%</Text>
              </View>
              <TouchableOpacity onPress={() => handleDeleteDebt(d.id)}>
                <Text style={{ fontSize: 13 }}>🗑️</Text>
              </TouchableOpacity>
            </View>
          </View>
          <Text style={styles.debtLabel}>Saldo Restante</Text>
          <Text style={styles.debtAmount}>RD${d.remaining.toLocaleString()}</Text>
          <Text style={styles.debtSub}>Monto Inicial: RD${d.total.toLocaleString()}</Text>
        </View>
      ))}

      {/* 📺 SUSCRIPCIONES RECURRENTES */}
      <View style={styles.sectionHeaderRow}>
        <View>
          <Text style={styles.sectionHeader}>Suscripciones Recurrentes</Text>
          <Text style={styles.subTotalText}>Total Mensual: ${totalMonthlySubs.toFixed(2)}/mes</Text>
        </View>
        <TouchableOpacity style={styles.addSmallBtn} onPress={() => setShowSubModal(true)}>
          <Text style={styles.addSmallBtnText}>+ Servicio</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.subsGrid}>
        {subscriptions.map((s) => (
          <View key={s.id} style={styles.subCard}>
            <View style={styles.subCardHeader}>
              <Text style={styles.subName} numberOfLines={1}>{s.name}</Text>
              <Text style={styles.subCost}>${s.cost.toFixed(2)}</Text>
            </View>
            <View style={styles.subCardFooter}>
              <Text style={styles.subDate}>Cobro: {s.date}</Text>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity onPress={() => handleOpenEditSub(s)}>
                  <Text style={{ fontSize: 12 }}>✏️</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDeleteSub(s.id)}>
                  <Text style={{ fontSize: 12 }}>🗑️</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
      </View>

      {/* Modal Deuda */}
      <Modal visible={showDebtModal} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Nueva Deuda / Préstamo</Text>
            <TextInput style={styles.modalInput} placeholder="Nombre / Acreedor (ej. Préstamo Vehículo)" placeholderTextColor="#94a3b8" value={dName} onChangeText={setDName} />
            <TextInput style={styles.modalInput} placeholder="Monto Total (RD$)" placeholderTextColor="#94a3b8" keyboardType="numeric" value={dAmount} onChangeText={setDAmount} />
            <TextInput style={styles.modalInput} placeholder="Tasa de Interés Anual (%)" placeholderTextColor="#94a3b8" keyboardType="numeric" value={dRate} onChangeText={setDRate} />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowDebtModal(false)}><Text style={styles.cancelBtnText}>Cancelar</Text></TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleCreateDebt}><Text style={styles.saveBtnText}>Guardar</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Suscripción */}
      <Modal visible={showSubModal} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Nueva Suscripción</Text>
            <TextInput style={styles.modalInput} placeholder="Servicio (ej. Disney+, ChatGPT)" placeholderTextColor="#94a3b8" value={sName} onChangeText={setSName} />
            <TextInput style={styles.modalInput} placeholder="Costo Mensual ($)" placeholderTextColor="#94a3b8" keyboardType="numeric" value={sCost} onChangeText={setSCost} />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowSubModal(false)}><Text style={styles.cancelBtnText}>Cancelar</Text></TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleCreateSub}><Text style={styles.saveBtnText}>Guardar</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Editar Suscripción */}
      <Modal visible={showEditSubModal} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Editar Suscripción</Text>
            <TextInput style={styles.modalInput} value={editSubName} onChangeText={setEditSubName} placeholder="Nombre del Servicio" placeholderTextColor="#94a3b8" />
            <TextInput style={styles.modalInput} value={editSubCost} onChangeText={setEditSubCost} placeholder="Costo Mensual ($)" keyboardType="numeric" placeholderTextColor="#94a3b8" />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowEditSubModal(false)}>
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveEditSub}>
                <Text style={styles.saveBtnText}>Guardar Cambios</Text>
              </TouchableOpacity>
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
  headerRow: { marginBottom: 20 },
  screenTitle: { fontSize: 20, fontWeight: 'bold', color: '#ffffff' },
  screenSub: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, marginBottom: 12 },
  sectionHeader: { fontSize: 15, fontWeight: 'bold', color: '#ffffff' },
  subTotalText: { fontSize: 11, color: '#c084fc', fontWeight: 'bold' },
  addSmallBtn: { backgroundColor: '#9333ea', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  addSmallBtnText: { color: '#ffffff', fontSize: 11, fontWeight: 'bold' },
  debtCard: { backgroundColor: 'rgba(30, 41, 59, 0.8)', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(244, 63, 94, 0.3)' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 14, fontWeight: 'bold', color: '#ffffff' },
  rateBadge: { backgroundColor: 'rgba(244, 63, 94, 0.1)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  rateText: { color: '#fb7185', fontSize: 11, fontWeight: 'bold' },
  debtLabel: { fontSize: 10, color: '#94a3b8', marginTop: 8 },
  debtAmount: { fontSize: 22, fontWeight: '900', color: '#fb7185' },
  debtSub: { fontSize: 11, color: '#64748b', marginTop: 2 },
  subsGrid: { gap: 10 },
  subCard: { backgroundColor: 'rgba(30, 41, 59, 0.8)', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#1e293b' },
  subCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  subName: { fontSize: 13, fontWeight: 'bold', color: '#ffffff', flex: 1 },
  subCost: { fontSize: 13, fontWeight: 'bold', color: '#c084fc' },
  subCardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
  subDate: { fontSize: 10, color: '#64748b' },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#0f172a', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#9333ea' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#ffffff', marginBottom: 16 },
  modalInput: { backgroundColor: '#1e293b', borderRadius: 10, padding: 12, color: '#ffffff', marginBottom: 12 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 10 },
  cancelBtn: { padding: 10, borderRadius: 8, backgroundColor: '#334155' },
  cancelBtnText: { color: '#cbd5e1', fontSize: 12, fontWeight: 'bold' },
  saveBtn: { padding: 10, borderRadius: 8, backgroundColor: '#9333ea' },
  saveBtnText: { color: '#ffffff', fontSize: 12, fontWeight: 'bold' },
});
