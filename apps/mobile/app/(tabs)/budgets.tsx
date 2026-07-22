import React, { useState } from 'react';
import { StyleSheet, ScrollView, View, Text, TouchableOpacity, Alert, Modal, TextInput } from 'react-native';

export default function MobileBudgetsScreen() {
  const [budgets, setBudgets] = useState([
    { id: '1', name: 'Supermercado', icon: '🛒', limit: 18000, spent: 12960, percentage: 72 },
    { id: '2', name: 'Servicios Básicos', icon: '💡', limit: 10000, spent: 8500, percentage: 85 },
    { id: '3', name: 'Entretenimiento', icon: '🍿', limit: 5000, spent: 2100, percentage: 42 },
  ]);

  const [goals, setGoals] = useState([
    { id: '1', name: 'Comprar carro', target: 500000, current: 180000, percentage: 36, suggested: 15000, targetDate: '2027-01-15' },
    { id: '2', name: 'Viaje familiar', target: 120000, current: 45000, percentage: 37, suggested: 7500, targetDate: '2026-12-01' },
    { id: '3', name: 'Inicial apartamento', target: 1500000, current: 450000, percentage: 30, suggested: 25000, targetDate: '2028-06-01' },
  ]);

  // Modal Nuevo Presupuesto
  const [showModal, setShowModal] = useState(false);
  const [catName, setCatName] = useState('');
  const [limitInput, setLimitInput] = useState('');

  const handleCreateBudget = () => {
    if (!catName || !limitInput) return;
    const limitNum = parseFloat(limitInput);
    const newB = {
      id: Date.now().toString(),
      name: catName,
      icon: '📌',
      limit: limitNum,
      spent: 0,
      percentage: 0,
    };
    setBudgets([newB, ...budgets]);
    setShowModal(false);
    setCatName('');
    setLimitInput('');
    Alert.alert('¡Éxito!', 'Presupuesto creado con éxito');
  };

  const handleDeleteBudget = (id: string) => {
    setBudgets((prev) => prev.filter((b) => b.id !== id));
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.screenTitle}>Presupuestos & Metas</Text>
          <Text style={styles.screenSub}>Control por categoría y plan de ahorro</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={() => setShowModal(true)}>
          <Text style={styles.addButtonText}>+ Crear</Text>
        </TouchableOpacity>
      </View>

      {/* 📊 PRESTUPUESTOS MENSUALES */}
      <Text style={styles.sectionHeader}>Presupuestos Mensuales</Text>
      {budgets.map((b) => (
        <View key={b.id} style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <Text style={styles.cardIcon}>{b.icon}</Text>
              <View>
                <Text style={styles.cardTitle}>{b.name}</Text>
                <Text style={styles.cardSub}>
                  Consumo: RD${b.spent.toLocaleString()} / RD${b.limit.toLocaleString()}
                </Text>
              </View>
            </View>
            <View style={styles.percentBadge}>
              <Text style={styles.percentText}>{b.percentage}%</Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${Math.max(b.percentage, 5)}%` }]} />
          </View>
        </View>
      ))}

      {/* 🎯 METAS DE AHORRO */}
      <Text style={styles.sectionHeader}>Metas de Ahorro Familiares</Text>
      {goals.map((g) => (
        <View key={g.id} style={[styles.card, styles.goalCard]}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>{g.name}</Text>
            <Text style={styles.goalBadge}>{g.percentage}%</Text>
          </View>

          <Text style={styles.goalCurrent}>
            RD${g.current.toLocaleString()}{' '}
            <Text style={styles.goalTarget}>/ RD${g.target.toLocaleString()}</Text>
          </Text>

          <View style={styles.goalFooter}>
            <Text style={styles.goalFooterText}>Ahorro mensual sugerido:</Text>
            <Text style={styles.goalSuggested}>RD${g.suggested.toLocaleString()}/mes</Text>
          </View>

          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, styles.goalProgressFill, { width: `${Math.max(g.percentage, 5)}%` }]} />
          </View>
        </View>
      ))}

      {/* Modal Crear Presupuesto */}
      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Crear Presupuesto</Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Nombre de la categoría (ej. Transporte)"
              placeholderTextColor="#94a3b8"
              value={catName}
              onChangeText={setCatName}
            />

            <TextInput
              style={styles.modalInput}
              placeholder="Límite Mensual (RD$)"
              placeholderTextColor="#94a3b8"
              keyboardType="numeric"
              value={limitInput}
              onChangeText={setLimitInput}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowModal(false)}>
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleCreateBudget}>
                <Text style={styles.saveBtnText}>Guardar</Text>
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
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  screenTitle: { fontSize: 20, fontWeight: 'bold', color: '#ffffff' },
  screenSub: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  addButton: { backgroundColor: '#9333ea', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  addButtonText: { color: '#ffffff', fontSize: 12, fontWeight: 'bold' },
  sectionHeader: { fontSize: 15, fontWeight: 'bold', color: '#ffffff', marginTop: 12, marginBottom: 12 },
  card: { backgroundColor: 'rgba(30, 41, 59, 0.8)', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#1e293b' },
  goalCard: { borderColor: 'rgba(168, 85, 247, 0.3)' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  cardHeaderLeft: { flexDirection: 'row', alignItems: 'center' },
  cardIcon: { fontSize: 22, marginRight: 10 },
  cardTitle: { fontSize: 14, fontWeight: 'bold', color: '#ffffff' },
  cardSub: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  percentBadge: { backgroundColor: 'rgba(147, 51, 234, 0.2)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  percentText: { color: '#c084fc', fontSize: 12, fontWeight: 'bold' },
  progressBarBg: { backgroundColor: '#0f172a', height: 10, borderRadius: 10, overflow: 'hidden', marginTop: 10 },
  progressBarFill: { backgroundColor: '#9333ea', height: '100%', borderRadius: 10 },
  goalBadge: { color: '#34d399', backgroundColor: 'rgba(16, 185, 129, 0.1)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, fontSize: 11, fontWeight: 'bold' },
  goalCurrent: { fontSize: 20, fontWeight: '900', color: '#ffffff' },
  goalTarget: { fontSize: 12, color: '#94a3b8', fontWeight: 'normal' },
  goalFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  goalFooterText: { fontSize: 11, color: '#94a3b8' },
  goalSuggested: { fontSize: 11, fontWeight: 'bold', color: '#c084fc' },
  goalProgressFill: { backgroundColor: '#10b981' },
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
