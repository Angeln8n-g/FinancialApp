import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, View, Text, TouchableOpacity, Alert, Modal, TextInput } from 'react-native';
import { fetchWithAuth } from '@/constants/Api';

export default function MobileFamilyScreen() {
  const [members, setMembers] = useState<any[]>([]);
  const [allowances, setAllowances] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [selectedAllowance, setSelectedAllowance] = useState<any>(null);

  const loadData = async () => {
    try {
      const [resMem, resAllow, resAcc] = await Promise.all([
        fetchWithAuth('/api/household/members'),
        fetchWithAuth('/api/allowances'),
        fetchWithAuth('/api/accounts'),
      ]);

      if (resMem.ok) {
        const mData = await resMem.json();
        if (Array.isArray(mData)) setMembers(mData);
      }
      if (resAllow.ok) {
        const aData = await resAllow.json();
        if (Array.isArray(aData)) setAllowances(aData);
      }
      if (resAcc.ok) {
        const accData = await resAcc.json();
        if (Array.isArray(accData)) setAccounts(accData);
      }
    } catch (e) {
      console.log('Error cargando datos de familia:', e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleInvite = async () => {
    if (!inviteEmail) return;
    try {
      const res = await fetchWithAuth('/api/household/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, role: 'COLLABORATOR' }),
      });
      if (res.ok) {
        setShowInviteModal(false);
        setInviteEmail('');
        Alert.alert('¡Invitación Enviada!', `Se envió la invitación a ${inviteEmail}`);
        loadData();
      }
    } catch (e) {
      Alert.alert('Error', 'No se pudo enviar la invitación.');
    }
  };

  const handleRecordExpense = async () => {
    if (!selectedAllowance || !expenseAmount) return;
    try {
      const res = await fetchWithAuth(`/api/allowances/${selectedAllowance.id}/expense`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: parseFloat(expenseAmount) }),
      });

      if (res.ok) {
        setShowExpenseModal(false);
        setExpenseAmount('');
        setSelectedAllowance(null);
        Alert.alert('¡Éxito!', 'Gasto imputado a la mesada correctamente');
        loadData();
      }
    } catch (e) {
      Alert.alert('Error', 'No se pudo registrar el gasto.');
    }
  };

  const handleResetAllowance = async (id: string) => {
    try {
      const res = await fetchWithAuth(`/api/allowances/${id}/reset`, { method: 'POST' });
      if (res.ok) {
        Alert.alert('Reiniciado', 'Consumo de mesada reiniciado a $0');
        loadData();
      }
    } catch (e) {
      console.log('Error reiniciando:', e);
    }
  };

  const handleJoinByCode = async () => {
    Alert.prompt(
      '🔑 Unirme con Código',
      'Ingresa el código de invitación que te compartió el administrador (ej: HIQ-A7X9):',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Unirme al Hogar',
          onPress: async (code?: string) => {
            if (!code || !code.trim()) return;
            try {
              const res = await fetchWithAuth(`/api/household/join/${code.trim().toUpperCase()}`, {
                method: 'POST',
              });
              const data = await res.json();
              if (res.ok) {
                Alert.alert('🎉 ¡Éxito!', 'Te has unido correctamente al hogar.');
                loadData();
              } else {
                Alert.alert('Error', data.message || 'Código no válido o expirado.');
              }
            } catch (e) {
              Alert.alert('Error', 'No se pudo procesar el código de invitación.');
            }
          },
        },
      ],
      'plain-text'
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.screenTitle}>Familia & Mesadas</Text>
          <Text style={styles.screenSub}>Gestión de integrantes y presupuestos</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          <TouchableOpacity style={[styles.addButton, { backgroundColor: '#059669' }]} onPress={handleJoinByCode}>
            <Text style={styles.addButtonText}>🔑 Código</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.addButton} onPress={() => setShowInviteModal(true)}>
            <Text style={styles.addButtonText}>+ Invitar</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 👨‍👩‍👧‍👦 MIEMBROS DEL HOGAR */}
      <Text style={styles.sectionHeader}>Integrantes del Hogar ({members.length})</Text>
      {members.map((m) => (
        <View key={m.id} style={styles.memberCard}>
          <View style={styles.cardLeft}>
            <View style={styles.avatarBadge}>
              <Text style={styles.avatarText}>{(m.fullName || m.email)[0].toUpperCase()}</Text>
            </View>
            <View>
              <Text style={styles.cardTitle}>{m.fullName || m.email.split('@')[0]}</Text>
              <Text style={styles.memberEmail}>{m.email}</Text>
            </View>
          </View>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{m.role}</Text>
          </View>
        </View>
      ))}

      {/* 💸 MESADAS Y PRESUPUESTOS FAMILIARES */}
      <Text style={styles.sectionHeader}>💸 Mesadas & Presupuestos ({allowances.length})</Text>
      {allowances.map((a) => {
        const pct = a.percentageUsed || 0;
        const barColor = pct >= 90 ? '#f43f5e' : pct >= 70 ? '#f59e0b' : '#10b981';

        return (
          <View key={a.id} style={styles.allowCard}>
            <View style={styles.allowHeader}>
              <View>
                <Text style={styles.allowUser}>👤 {a.member?.user?.fullName || 'Familiar'}</Text>
                <Text style={styles.allowTitle}>{a.title}</Text>
              </View>
              <Text style={styles.periodBadge}>{a.period === 'WEEKLY' ? 'Semanal' : 'Mensual'}</Text>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressBg}>
              <View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: barColor }]} />
            </View>

            <View style={styles.progressDetails}>
              <Text style={styles.detailsText}>Gastado: ${Number(a.spentAmount).toFixed(2)} / ${Number(a.limitAmount).toFixed(2)}</Text>
              <Text style={styles.availText}>Disp: ${Number(a.remainingAmount).toFixed(2)}</Text>
            </View>

            <View style={styles.cardActions}>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => {
                  setSelectedAllowance(a);
                  setExpenseAmount('');
                  setShowExpenseModal(true);
                }}
              >
                <Text style={styles.actionBtnText}>📉 Gasto</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtnReset} onPress={() => handleResetAllowance(a.id)}>
                <Text style={styles.actionBtnText}>🔄 Reiniciar</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      })}

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

      {/* Modal Registrar Gasto en Mesada */}
      <Modal visible={showExpenseModal} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>📉 Registrar Gasto en Mesada</Text>
            <TextInput style={styles.modalInput} placeholder="Monto ($)" keyboardType="numeric" placeholderTextColor="#94a3b8" value={expenseAmount} onChangeText={setExpenseAmount} />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowExpenseModal(false)}>
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleRecordExpense}>
                <Text style={styles.saveBtnText}>Imputar Gasto</Text>
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
  sectionHeader: { fontSize: 15, fontWeight: 'bold', color: '#ffffff', marginTop: 16, marginBottom: 12 },
  memberCard: { backgroundColor: 'rgba(30, 41, 59, 0.8)', borderRadius: 14, padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, borderWidth: 1, borderColor: '#1e293b' },
  cardLeft: { flexDirection: 'row', alignItems: 'center' },
  avatarBadge: { width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(147, 51, 234, 0.2)', alignItems: 'center', justifyContent: 'center', marginRight: 10, borderWidth: 1, borderColor: 'rgba(168, 85, 247, 0.3)' },
  avatarText: { color: '#c084fc', fontSize: 16, fontWeight: 'bold' },
  cardTitle: { fontSize: 13, fontWeight: 'bold', color: '#ffffff' },
  memberEmail: { fontSize: 10, color: '#94a3b8' },
  roleBadge: { backgroundColor: 'rgba(147, 51, 234, 0.2)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  roleText: { color: '#c084fc', fontSize: 10, fontWeight: 'bold' },
  allowCard: { backgroundColor: 'rgba(30, 41, 59, 0.8)', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(168, 85, 247, 0.3)' },
  allowHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  allowUser: { fontSize: 10, color: '#c084fc', fontWeight: 'bold', textTransform: 'uppercase' },
  allowTitle: { fontSize: 14, fontWeight: 'bold', color: '#ffffff', marginTop: 2 },
  periodBadge: { backgroundColor: '#1e293b', color: '#94a3b8', fontSize: 10, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, overflow: 'hidden' },
  progressBg: { height: 8, backgroundColor: '#0f172a', borderRadius: 4, overflow: 'hidden', marginVertical: 8, borderWidth: 1, borderColor: '#1e293b' },
  progressFill: { height: '100%', borderRadius: 4 },
  progressDetails: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  detailsText: { fontSize: 11, color: '#cbd5e1' },
  availText: { fontSize: 11, color: '#34d399', fontWeight: 'bold' },
  cardActions: { flexDirection: 'row', gap: 8, marginTop: 4 },
  actionBtn: { flex: 1, backgroundColor: '#1e293b', paddingVertical: 8, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#334155' },
  actionBtnReset: { width: 90, backgroundColor: '#1e293b', paddingVertical: 8, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#334155' },
  actionBtnText: { color: '#ffffff', fontSize: 11, fontWeight: 'bold' },
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
