import React, { useState } from 'react';
import { StyleSheet, ScrollView, View, Text, TouchableOpacity, Alert, Modal, TextInput } from 'react-native';

export default function MobileFamilyScreen() {
  const [members, setMembers] = useState([
    { id: '1', name: 'Angela Fraga', email: 'angellafraga@gmail.con', role: 'ADMIN' },
    { id: '2', name: 'Carlos Fraga', email: 'carlos@hogariq.com', role: 'MIEMBRO' },
  ]);

  const [categories] = useState([
    { name: 'Supermercado', percent: '45%', icon: '🛒' },
    { name: 'Servicios Básicos', percent: '30%', icon: '💡' },
    { name: 'Entretenimiento', percent: '15%', icon: '🍿' },
    { name: 'Otros Gastos', percent: '10%', icon: '📦' },
  ]);

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');

  const handleInvite = () => {
    if (!inviteEmail) return;
    setMembers([
      ...members,
      { id: Date.now().toString(), name: inviteEmail.split('@')[0], email: inviteEmail, role: 'MIEMBRO' },
    ]);
    setShowInviteModal(false);
    setInviteEmail('');
    Alert.alert('¡Invitación Enviada!', `Se envió la invitación a ${inviteEmail}`);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.screenTitle}>Familia & Reportes</Text>
          <Text style={styles.screenSub}>Gestión de miembros y distribución de gastos</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={() => setShowInviteModal(true)}>
          <Text style={styles.addButtonText}>+ Invitar</Text>
        </TouchableOpacity>
      </View>

      {/* 👨‍👩‍👧‍👦 MIEMBROS DEL HOGAR */}
      <Text style={styles.sectionHeader}>Integrantes del Hogar ({members.length})</Text>
      {members.map((m) => (
        <View key={m.id} style={styles.memberCard}>
          <View style={styles.cardLeft}>
            <View style={styles.avatarBadge}>
              <Text style={styles.avatarText}>{m.name[0]}</Text>
            </View>
            <View>
              <Text style={styles.cardTitle}>{m.name}</Text>
              <Text style={styles.memberEmail}>{m.email}</Text>
            </View>
          </View>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{m.role}</Text>
          </View>
        </View>
      ))}

      {/* 📊 DISTRIBUCIÓN DE GASTOS */}
      <Text style={styles.sectionHeader}>Distribución de Gastos por Categoría</Text>
      {categories.map((c, idx) => (
        <View key={idx} style={styles.catCard}>
          <View style={styles.cardLeft}>
            <Text style={styles.catIcon}>{c.icon}</Text>
            <Text style={styles.cardTitle}>{c.name}</Text>
          </View>
          <Text style={styles.catPercent}>{c.percent}</Text>
        </View>
      ))}

      {/* Modal Invitar */}
      <Modal visible={showInviteModal} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Invitar Familiar al Hogar</Text>
            <TextInput style={styles.modalInput} placeholder="Correo Electrónico del Familiar" placeholderTextColor="#94a3b8" keyboardType="email-address" value={inviteEmail} onChangeText={setInviteEmail} />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowInviteModal(false)}><Text style={styles.cancelBtnText}>Cancelar</Text></TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleInvite}><Text style={styles.saveBtnText}>Enviar Invitación</Text></TouchableOpacity>
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
  memberCard: { backgroundColor: 'rgba(30, 41, 59, 0.8)', borderRadius: 14, padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, borderWidth: 1, borderColor: '#1e293b' },
  catCard: { backgroundColor: 'rgba(30, 41, 59, 0.6)', borderRadius: 14, padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, borderWidth: 1, borderColor: '#1e293b' },
  cardLeft: { flexDirection: 'row', alignItems: 'center' },
  avatarBadge: { width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(147, 51, 234, 0.2)', alignItems: 'center', justifyContent: 'center', marginRight: 10, borderWidth: 1, borderColor: 'rgba(168, 85, 247, 0.3)' },
  avatarText: { color: '#c084fc', fontSize: 16, fontWeight: 'bold' },
  cardTitle: { fontSize: 13, fontWeight: 'bold', color: '#ffffff' },
  memberEmail: { fontSize: 10, color: '#94a3b8' },
  roleBadge: { backgroundColor: 'rgba(147, 51, 234, 0.2)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  roleText: { color: '#c084fc', fontSize: 10, fontWeight: 'bold' },
  catIcon: { fontSize: 18, marginRight: 10 },
  catPercent: { fontSize: 13, fontWeight: 'bold', color: '#c084fc' },
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
