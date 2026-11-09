import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  Share,
  RefreshControl,
} from 'react-native';
import {
  Users,
  UserPlus,
  Coins,
  Clock,
  Shield,
  Key,
  DollarSign,
  Share2,
  Trash2,
  RefreshCw,
  Check,
  X,
  CreditCard,
  Sparkles,
  Award,
  TrendingUp,
  Plus,
  Target,
} from 'lucide-react-native';
import { fetchWithAuth, getUser, getHousehold } from '@/constants/Api';
import { FamilyMint } from '@/constants/Colors';

type ActiveSection = 'members' | 'split' | 'missions' | 'allowances' | 'requests' | 'invitations' | 'activity';

export default function MobileFamilyScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveSection>('members');

  // Datos
  const [members, setMembers] = useState<any[]>([]);
  const [allowances, setAllowances] = useState<any[]>([]);
  const [allowanceRequests, setAllowanceRequests] = useState<any[]>([]);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Gamificación & Misiones Familiares
  const [missions, setMissions] = useState<any[]>([]);
  const [savingsMatching, setSavingsMatching] = useState<any>(null);
  const [showNewMissionModal, setShowNewMissionModal] = useState(false);
  const [showPayMissionModal, setShowPayMissionModal] = useState(false);
  const [selectedMission, setSelectedMission] = useState<any>(null);
  const [missionTitle, setMissionTitle] = useState('');
  const [missionReward, setMissionReward] = useState('');
  const [missionAssignedId, setMissionAssignedId] = useState('');
  const [missionPaymentAccount, setMissionPaymentAccount] = useState('');

  // Gastos Compartidos (Splitwise)
  const [splitSummary, setSplitSummary] = useState<any>(null);
  const [settling, setSettling] = useState(false);

  // Formularios de Invitación & Unirse
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('MEMBER');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joinLoading, setJoinLoading] = useState(false);

  // Modales
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showAllowModal, setShowAllowModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showDisburseModal, setShowDisburseModal] = useState(false);
  const [showEditMemberModal, setShowEditMemberModal] = useState(false);

  // Estados de formularios modales
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [editMemberRole, setEditMemberRole] = useState('MEMBER');
  const [editMemberTitle, setEditMemberTitle] = useState('');

  const [allowMemberId, setAllowMemberId] = useState('');
  const [allowTitle, setAllowTitle] = useState('');
  const [allowAmount, setAllowAmount] = useState('');
  const [allowPeriod, setAllowPeriod] = useState('WEEKLY');

  const [selectedAllowance, setSelectedAllowance] = useState<any>(null);
  const [expenseAmount, setExpenseAmount] = useState('');
  const [disburseAccountId, setDisburseAccountId] = useState('');
  const [disburseAmount, setDisburseAmount] = useState('');

  const loadData = async () => {
    try {
      setCurrentUser(getUser());
      const [resMem, resAllow, resReq, resInv, resAct, resAcc, resSplit, resMiss, resMatch] = await Promise.all([
        fetchWithAuth('/api/household/members'),
        fetchWithAuth('/api/allowances'),
        fetchWithAuth('/api/allowances/requests'),
        fetchWithAuth('/api/household/invitations'),
        fetchWithAuth('/api/household/activity'),
        fetchWithAuth('/api/accounts'),
        fetchWithAuth('/api/household/split-summary'),
        fetchWithAuth('/api/allowances/missions'),
        fetchWithAuth('/api/allowances/savings-matching'),
      ]);

      if (resMem.ok) {
        const memData = await resMem.json();
        if (Array.isArray(memData)) setMembers(memData);
      }
      if (resAllow.ok) {
        const allowData = await resAllow.json();
        if (Array.isArray(allowData)) setAllowances(allowData);
      }
      if (resReq.ok) {
        const reqData = await resReq.json();
        if (Array.isArray(reqData)) setAllowanceRequests(reqData);
      }
      if (resInv.ok) {
        const invData = await resInv.json();
        if (Array.isArray(invData)) setInvitations(invData);
      }
      if (resAct.ok) {
        const actData = await resAct.json();
        if (Array.isArray(actData)) setActivities(actData);
      }
      if (resAcc.ok) {
        const accData = await resAcc.json();
        if (Array.isArray(accData)) {
          setAccounts(accData);
          if (accData.length > 0) {
            if (!disburseAccountId) setDisburseAccountId(accData[0].id);
            if (!missionPaymentAccount) setMissionPaymentAccount(accData[0].id);
          }
        }
      }
      if (resSplit.ok) {
        const splitData = await resSplit.json();
        setSplitSummary(splitData);
      }
      if (resMiss.ok) {
        const missData = await resMiss.json();
        if (Array.isArray(missData)) setMissions(missData);
      }
      if (resMatch.ok) {
        const matchData = await resMatch.json();
        setSavingsMatching(matchData);
      }
    } catch (e) {
      console.log('Error cargando familia:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleInvite = async () => {
    if (!inviteEmail.trim()) {
      Alert.alert('Email Requerido', 'Ingresa el correo del familiar.');
      return;
    }

    setInviteLoading(true);
    try {
      const res = await fetchWithAuth('/api/household/invite', {
        method: 'POST',
        body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
      });
      const data = await res.json();

      if (res.ok) {
        setInviteEmail('');
        setShowInviteModal(false);
        loadData();

        if (data.inviteLink) {
          Alert.alert(
            '¡Invitación Generada!',
            `Código: ${data.invitationCode}\n¿Deseas compartir el enlace con el familiar?`,
            [
              { text: 'Listo', style: 'cancel' },
              {
                text: 'Compartir Enlace',
                onPress: () => {
                  Share.share({
                    title: 'Únete a mi familia en HogarIQ',
                    message: `Únete a nuestro hogar en HogarIQ con este enlace: ${data.inviteLink} o usa el código ${data.invitationCode}`,
                  });
                },
              },
            ]
          );
        } else {
          Alert.alert('Éxito', `Invitación enviada a ${inviteEmail}`);
        }
      } else {
        Alert.alert('Error', data.message || 'No se pudo enviar la invitación.');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Error de conexión.');
    } finally {
      setInviteLoading(false);
    }
  };

  const handleJoinByCode = async () => {
    if (!joinCode.trim()) return;
    setJoinLoading(true);
    try {
      const code = joinCode.trim().toUpperCase();
      const res = await fetchWithAuth(`/api/household/join/${code}`, {
        method: 'POST',
      });
      if (res.ok) {
        Alert.alert('¡Bienvenido!', 'Te has unido con éxito al hogar.');
        setJoinCode('');
        loadData();
      } else {
        const err = await res.json().catch(() => ({}));
        Alert.alert('Error', err.message || 'Código de invitación inválido o expirado.');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Error de conexión.');
    } finally {
      setJoinLoading(false);
    }
  };

  const handleSettleSplit = async (fromUserId: string, toUserId: string, amount: number) => {
    Alert.alert(
      'Saldar Cuenta',
      `¿Deseas registrar como saldada la deuda de $${amount.toFixed(2)} entre integrantes?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar Pago',
          onPress: async () => {
            setSettling(true);
            try {
              const res = await fetchWithAuth('/api/household/split-settle', {
                method: 'POST',
                body: JSON.stringify({ fromUserId, toUserId, amount }),
              });
              if (res.ok) {
                Alert.alert('Éxito', '¡Cuentas saldadas exitosamente!');
                loadData();
              } else {
                const err = await res.json().catch(() => ({}));
                Alert.alert('Error', err.message || 'No se pudo liquidar la cuenta.');
              }
            } catch (e: any) {
              Alert.alert('Error', e.message || 'Error de conexión.');
            } finally {
              setSettling(false);
            }
          },
        },
      ]
    );
  };

  const handleCreateMission = async () => {
    if (!missionTitle.trim() || !missionReward.trim()) {
      Alert.alert('Campos Incompletos', 'Ingresa el nombre y la recompensa de la misión.');
      return;
    }
    const reward = parseFloat(missionReward);
    if (isNaN(reward) || reward <= 0) {
      Alert.alert('Monto Inválido', 'Ingresa una recompensa válida.');
      return;
    }
    try {
      const res = await fetchWithAuth('/api/allowances/missions', {
        method: 'POST',
        body: JSON.stringify({
          title: missionTitle.trim(),
          rewardAmount: reward,
          assignedMemberId: missionAssignedId || undefined,
        }),
      });
      if (res.ok) {
        setShowNewMissionModal(false);
        setMissionTitle('');
        setMissionReward('');
        setMissionAssignedId('');
        loadData();
      } else {
        const err = await res.json().catch(() => ({}));
        Alert.alert('Error', err.message || 'No se pudo crear la misión.');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Error de conexión.');
    }
  };

  const handleCompleteMission = async (id: string) => {
    try {
      const res = await fetchWithAuth(`/api/allowances/missions/${id}/complete`, {
        method: 'PUT',
      });
      if (res.ok) {
        Alert.alert('¡Misión Completada!', 'Marcada como realizada. Pendiente de pago/aprobación por el tutor.');
        loadData();
      } else {
        const err = await res.json().catch(() => ({}));
        Alert.alert('Error', err.message || 'No se pudo actualizar la misión.');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Error de conexión.');
    }
  };

  const handlePayMission = async () => {
    if (!selectedMission || !missionPaymentAccount) {
      Alert.alert('Cuenta Requerida', 'Selecciona la cuenta de donde saldrá la recompensa.');
      return;
    }
    try {
      const res = await fetchWithAuth(`/api/allowances/missions/${selectedMission.id}/approve`, {
        method: 'POST',
        body: JSON.stringify({ accountId: missionPaymentAccount }),
      });
      if (res.ok) {
        setShowPayMissionModal(false);
        setSelectedMission(null);
        Alert.alert('¡Recompensa Pagada!', 'Se registró el pago y débito en la cuenta seleccionada.');
        loadData();
      } else {
        const err = await res.json().catch(() => ({}));
        Alert.alert('Error', err.message || 'No se pudo pagar la misión.');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Error de conexión.');
    }
  };

  const handleDeleteMission = (id: string) => {
    Alert.alert('Eliminar Misión', '¿Deseas eliminar permanentemente esta misión?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            const res = await fetchWithAuth(`/api/allowances/missions/${id}`, { method: 'DELETE' });
            if (res.ok) loadData();
          } catch (e: any) {
            Alert.alert('Error', e.message || 'Error de conexión.');
          }
        },
      },
    ]);
  };

  const handleCreateAllowance = async () => {
    if (!allowMemberId || !allowTitle.trim() || !allowAmount.trim()) {
      Alert.alert('Campos Incompletos', 'Completa el miembro, título y monto.');
      return;
    }
    const parsedAmount = parseFloat(allowAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert('Monto Inválido', 'Ingresa un monto numérico positivo.');
      return;
    }

    try {
      const res = await fetchWithAuth('/api/allowances', {
        method: 'POST',
        body: JSON.stringify({
          memberId: allowMemberId,
          title: allowTitle.trim(),
          limitAmount: parsedAmount,
          period: allowPeriod,
        }),
      });
      if (res.ok) {
        setShowAllowModal(false);
        setAllowTitle('');
        setAllowAmount('');
        loadData();
      } else {
        const err = await res.json().catch(() => ({}));
        Alert.alert('Error', err.message || 'No se pudo crear la mesada.');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Error al crear la mesada.');
    }
  };

  const handleRecordExpense = async () => {
    if (!selectedAllowance || !expenseAmount.trim()) return;
    const parsed = parseFloat(expenseAmount);
    if (isNaN(parsed) || parsed <= 0) {
      Alert.alert('Monto Inválido', 'Ingresa un monto válido.');
      return;
    }

    try {
      const res = await fetchWithAuth(`/api/allowances/${selectedAllowance.id}/expense`, {
        method: 'POST',
        body: JSON.stringify({ amount: parsed }),
      });
      if (res.ok) {
        setShowExpenseModal(false);
        setExpenseAmount('');
        setSelectedAllowance(null);
        loadData();
      } else {
        const err = await res.json().catch(() => ({}));
        Alert.alert('Error', err.message || 'No se pudo registrar el gasto.');
      }
    } catch (e) {
      Alert.alert('Error', 'Error de conexión.');
    }
  };

  const handleDisburse = async () => {
    if (!selectedAllowance || !disburseAccountId) {
      Alert.alert('Cuenta Requerida', 'Selecciona una cuenta de débito.');
      return;
    }
    const amount = parseFloat(disburseAmount || selectedAllowance.limitAmount.toString());

    try {
      const res = await fetchWithAuth(`/api/allowances/${selectedAllowance.id}/disburse`, {
        method: 'POST',
        body: JSON.stringify({ accountId: disburseAccountId, amount }),
      });
      if (res.ok) {
        setShowDisburseModal(false);
        setDisburseAmount('');
        setSelectedAllowance(null);
        Alert.alert('Éxito', '¡Desembolso acreditado y debitado de la cuenta!');
        loadData();
      } else {
        const err = await res.json().catch(() => ({}));
        Alert.alert('Error', err.message || 'No se pudo procesar el desembolso.');
      }
    } catch (e) {
      Alert.alert('Error', 'Error de conexión.');
    }
  };

  const handleResetAllowance = (id: string) => {
    Alert.alert('Reiniciar Periodo', '¿Deseas reiniciar los gastos de esta mesada a cero?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Reiniciar',
        onPress: async () => {
          try {
            const res = await fetchWithAuth(`/api/allowances/${id}/reset`, { method: 'POST' });
            if (res.ok) loadData();
          } catch (e) {
            console.error(e);
          }
        },
      },
    ]);
  };

  const handleDeleteAllowance = (id: string) => {
    Alert.alert('Eliminar Mesada', '¿Deseas eliminar permanentemente esta mesada?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            const res = await fetchWithAuth(`/api/allowances/${id}`, { method: 'DELETE' });
            if (res.ok) loadData();
          } catch (e) {
            console.error(e);
          }
        },
      },
    ]);
  };

  const handleRespondRequest = async (requestId: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      const res = await fetchWithAuth(`/api/allowances/requests/${requestId}`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
      if (res.ok) loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveMemberChanges = async () => {
    if (!selectedMember) return;
    try {
      await Promise.all([
        fetchWithAuth(`/api/household/members/${selectedMember.id}/role`, {
          method: 'PUT',
          body: JSON.stringify({ role: editMemberRole }),
        }),
        fetchWithAuth(`/api/household/members/${selectedMember.id}/title`, {
          method: 'PUT',
          body: JSON.stringify({ customTitle: editMemberTitle.trim() }),
        }),
      ]);
      setShowEditMemberModal(false);
      setSelectedMember(null);
      loadData();
    } catch (e) {
      Alert.alert('Error', 'No se pudieron guardar los cambios del miembro.');
    }
  };

  const handleRemoveMember = (m: any) => {
    Alert.alert(
      'Remover Familiar',
      `¿Deseas remover a "${m.fullName || m.email}" de este hogar?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await fetchWithAuth(`/api/household/members/${m.id}`, { method: 'DELETE' });
              if (res.ok) loadData();
            } catch (e) {
              console.error(e);
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            loadData();
          }}
          tintColor={FamilyMint.primary}
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Familia & Hogar</Text>
          <Text style={styles.subtitle}>Gobernanza familiar, mesadas y sincronización</Text>
        </View>

        <TouchableOpacity style={styles.inviteHeaderBtn} onPress={() => setShowInviteModal(true)}>
          <UserPlus size={16} color="#0A1128" />
          <Text style={styles.inviteHeaderBtnText}>Invitar</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs de Navegación Interna */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'members' && styles.tabItemActive]}
          onPress={() => setActiveTab('members')}
        >
          <Users size={14} color={activeTab === 'members' ? FamilyMint.primary : FamilyMint.foregroundSubtle} />
          <Text style={[styles.tabText, activeTab === 'members' && styles.tabTextActive]}>
            Miembros ({members.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'split' && styles.tabItemActive]}
          onPress={() => setActiveTab('split')}
        >
          <Share2 size={14} color={activeTab === 'split' ? FamilyMint.primary : FamilyMint.foregroundSubtle} />
          <Text style={[styles.tabText, activeTab === 'split' && styles.tabTextActive]}>
            Gastos 50/50
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'missions' && styles.tabItemActive]}
          onPress={() => setActiveTab('missions')}
        >
          <Sparkles size={14} color={activeTab === 'missions' ? FamilyMint.primary : FamilyMint.foregroundSubtle} />
          <Text style={[styles.tabText, activeTab === 'missions' && styles.tabTextActive]}>
            Misiones ({missions.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'allowances' && styles.tabItemActive]}
          onPress={() => setActiveTab('allowances')}
        >
          <Coins size={14} color={activeTab === 'allowances' ? FamilyMint.primary : FamilyMint.foregroundSubtle} />
          <Text style={[styles.tabText, activeTab === 'allowances' && styles.tabTextActive]}>
            Mesadas ({allowances.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'requests' && styles.tabItemActive]}
          onPress={() => setActiveTab('requests')}
        >
          <DollarSign size={14} color={activeTab === 'requests' ? FamilyMint.primary : FamilyMint.foregroundSubtle} />
          <Text style={[styles.tabText, activeTab === 'requests' && styles.tabTextActive]}>
            Solicitudes ({allowanceRequests.filter((r) => r.status === 'PENDING').length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'invitations' && styles.tabItemActive]}
          onPress={() => setActiveTab('invitations')}
        >
          <Key size={14} color={activeTab === 'invitations' ? FamilyMint.primary : FamilyMint.foregroundSubtle} />
          <Text style={[styles.tabText, activeTab === 'invitations' && styles.tabTextActive]}>
            Invitaciones ({invitations.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'activity' && styles.tabItemActive]}
          onPress={() => setActiveTab('activity')}
        >
          <Clock size={14} color={activeTab === 'activity' ? FamilyMint.primary : FamilyMint.foregroundSubtle} />
          <Text style={[styles.tabText, activeTab === 'activity' && styles.tabTextActive]}>
            Actividad
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* SECCIÓN 1: MIEMBROS */}
      {activeTab === 'members' && (
        <View style={styles.section}>
          {members.map((m) => (
            <View key={m.id} style={styles.card}>
              <View style={styles.cardRow}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {(m.fullName || m.email || '?')[0].toUpperCase()}
                  </Text>
                </View>

                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={styles.memberName}>{m.fullName || m.email}</Text>
                    {m.customTitle ? (
                      <View style={styles.titleBadge}>
                        <Text style={styles.titleBadgeText}>{m.customTitle}</Text>
                      </View>
                    ) : null}
                  </View>
                  <Text style={styles.memberEmail}>{m.email}</Text>
                  <Text style={styles.roleLabel}>Rol: {m.role}</Text>
                </View>

                <View style={{ gap: 6 }}>
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => {
                      setSelectedMember(m);
                      setEditMemberRole(m.role || 'MEMBER');
                      setEditMemberTitle(m.customTitle || '');
                      setShowEditMemberModal(true);
                    }}
                  >
                    <Text style={styles.actionBtnText}>Editar</Text>
                  </TouchableOpacity>

                  {m.userId !== currentUser?.id && (
                    <TouchableOpacity
                      style={[styles.actionBtn, { borderColor: FamilyMint.expense }]}
                      onPress={() => handleRemoveMember(m)}
                    >
                      <Trash2 size={13} color={FamilyMint.expense} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* SECCIÓN 2: MESADAS */}
      {activeTab === 'allowances' && (
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => {
              if (members.length > 0) setAllowMemberId(members[0].id);
              setShowAllowModal(true);
            }}
          >
            <Coins size={16} color={FamilyMint.primary} />
            <Text style={styles.addBtnText}>+ Asignar Nueva Mesada</Text>
          </TouchableOpacity>

          {allowances.length === 0 ? (
            <Text style={styles.emptyText}>No hay asignaciones de mesada activas.</Text>
          ) : (
            allowances.map((a) => {
              const spent = Number(a.spentAmount || 0);
              const limit = Number(a.limitAmount || 0);
              const pct = limit > 0 ? Math.min(100, Math.round((spent / limit) * 100)) : 0;
              const remaining = Math.max(0, limit - spent);

              return (
                <View key={a.id} style={styles.card}>
                  <View style={styles.cardRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.cardTitle}>{a.title}</Text>
                      <Text style={styles.cardSub}>
                        Para: {a.member?.fullName || a.member?.email || 'Familiar'} • {a.period === 'WEEKLY' ? 'Semanal' : 'Mensual'}
                      </Text>
                    </View>

                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles.allowanceRem}>${remaining.toFixed(2)}</Text>
                      <Text style={styles.allowanceLimit}>de ${limit.toFixed(2)}</Text>
                    </View>
                  </View>

                  {/* Barra de progreso */}
                  <View style={styles.progressBarBg}>
                    <View
                      style={[
                        styles.progressBarFill,
                        {
                          width: `${pct}%`,
                          backgroundColor: pct > 85 ? FamilyMint.expense : FamilyMint.primary,
                        },
                      ]}
                    />
                  </View>

                  <View style={styles.actionsRow}>
                    <TouchableOpacity
                      style={styles.btnSm}
                      onPress={() => {
                        setSelectedAllowance(a);
                        setShowExpenseModal(true);
                      }}
                    >
                      <Text style={styles.btnSmText}>- Registrar Gasto</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.btnSm, { borderColor: FamilyMint.primary }]}
                      onPress={() => {
                        setSelectedAllowance(a);
                        setDisburseAmount(String(a.limitAmount));
                        setShowDisburseModal(true);
                      }}
                    >
                      <CreditCard size={12} color={FamilyMint.primary} />
                      <Text style={[styles.btnSmText, { color: FamilyMint.primary }]}>Desembolsar</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.iconBtn} onPress={() => handleResetAllowance(a.id)}>
                      <RefreshCw size={13} color={FamilyMint.foregroundMuted} />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.iconBtn} onPress={() => handleDeleteAllowance(a.id)}>
                      <Trash2 size={13} color={FamilyMint.expense} />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </View>
      )}

      {/* SECCIÓN 3: SOLICITUDES DE MESADA */}
      {activeTab === 'requests' && (
        <View style={styles.section}>
          {allowanceRequests.length === 0 ? (
            <Text style={styles.emptyText}>No hay solicitudes de mesada registradas.</Text>
          ) : (
            allowanceRequests.map((req) => (
              <View key={req.id} style={styles.card}>
                <View style={styles.cardRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>
                      {req.member?.fullName || req.member?.email || 'Familiar'}
                    </Text>
                    <Text style={styles.cardSub}>Motivo: "{req.reason || 'Sin motivo'}"</Text>
                    <Text style={styles.cardSub}>
                      Fecha: {new Date(req.createdAt).toLocaleDateString()}
                    </Text>
                  </View>

                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[styles.cardTitle, { color: FamilyMint.accentSaving }]}>
                      +${Number(req.amount).toFixed(2)}
                    </Text>
                    <Text style={[styles.badgeText, { color: req.status === 'PENDING' ? FamilyMint.warning : FamilyMint.foregroundSubtle }]}>
                      {req.status}
                    </Text>
                  </View>
                </View>

                {req.status === 'PENDING' && (
                  <View style={styles.actionsRow}>
                    <TouchableOpacity
                      style={[styles.btnSm, { backgroundColor: FamilyMint.incomeBg, borderColor: FamilyMint.income }]}
                      onPress={() => handleRespondRequest(req.id, 'APPROVED')}
                    >
                      <Check size={13} color={FamilyMint.income} />
                      <Text style={[styles.btnSmText, { color: FamilyMint.income }]}>Aprobar</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.btnSm, { backgroundColor: FamilyMint.expenseBg, borderColor: FamilyMint.expense }]}
                      onPress={() => handleRespondRequest(req.id, 'REJECTED')}
                    >
                      <X size={13} color={FamilyMint.expense} />
                      <Text style={[styles.btnSmText, { color: FamilyMint.expense }]}>Rechazar</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))
          )}
        </View>
      )}

      {/* SECCIÓN 4: INVITACIONES & UNIRSE POR CÓDIGO */}
      {activeTab === 'invitations' && (
        <View style={styles.section}>
          {/* Tarjeta Unirse por Código */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🔑 Unirse a un Hogar por Código</Text>
            <Text style={styles.cardSub}>
              Si te han compartido un código de 6 caracteres, ingrésalo aquí:
            </Text>

            <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
              <TextInput
                style={[styles.input, { flex: 1, textTransform: 'uppercase', letterSpacing: 2 }]}
                placeholder="EJ: X7K9P2"
                placeholderTextColor={FamilyMint.foregroundSubtle}
                value={joinCode}
                onChangeText={setJoinCode}
                maxLength={8}
              />
              <TouchableOpacity
                style={[styles.submitBtnSm, joinLoading && { opacity: 0.6 }]}
                disabled={joinLoading}
                onPress={handleJoinByCode}
              >
                {joinLoading ? (
                  <ActivityIndicator size="small" color="#0A1128" />
                ) : (
                  <Text style={styles.submitBtnSmText}>Unirse</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Lista de Invitaciones Pendientes */}
          <Text style={[styles.sectionTitle, { marginTop: 14 }]}>Invitaciones Pendientes</Text>
          {invitations.length === 0 ? (
            <Text style={styles.emptyText}>No hay invitaciones pendientes emitidas.</Text>
          ) : (
            invitations.map((inv) => (
              <View key={inv.id} style={styles.card}>
                <View style={styles.cardRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{inv.email}</Text>
                    <Text style={styles.cardSub}>Rol: {inv.role} • Código: {inv.invitationCode}</Text>
                    <Text style={styles.cardSub}>
                      Estado: {inv.status}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.iconBtn}
                    onPress={() => {
                      Share.share({
                        title: 'Invitación a HogarIQ',
                        message: `Únete a mi familia en HogarIQ con el código: ${inv.invitationCode}`,
                      });
                    }}
                  >
                    <Share2 size={16} color={FamilyMint.primary} />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      )}

      {/* SECCIÓN 5: ACTIVIDAD RECIENTE */}
      {activeTab === 'activity' && (
        <View style={styles.section}>
          {activities.length === 0 ? (
            <Text style={styles.emptyText}>No hay actividad registrada en este hogar.</Text>
          ) : (
            activities.map((act) => (
              <View key={act.id} style={styles.activityItem}>
                <View style={styles.activityDot} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.activityText}>
                    <Text style={{ fontWeight: '700', color: FamilyMint.foreground }}>
                      {act.user?.fullName || act.user?.email || 'Un usuario'}{' '}
                    </Text>
                    {act.action}
                  </Text>
                  <Text style={styles.activityTime}>
                    {new Date(act.createdAt).toLocaleString()}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>
      )}

      {/* SECCIÓN 6: GASTOS COMPARTIDOS (SPLIT 50/50) */}
      {activeTab === 'split' && (
        <View style={styles.section}>
          {/* Tarjeta Resumen Principal */}
          <View style={[styles.card, { borderColor: FamilyMint.primary, borderWidth: 1 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <Share2 size={16} color={FamilyMint.primary} />
              <Text style={[styles.cardTitle, { color: FamilyMint.primary }]}>
                Gastos Compartidos (Split 50/50)
              </Text>
            </View>
            <Text style={styles.cardSub}>
              División automática para gastos comunes de adultos en el hogar.
            </Text>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 14 }}>
              <View>
                <Text style={styles.label}>Total Común</Text>
                <Text style={[styles.cardTitle, { fontSize: 18, color: FamilyMint.foreground }]}>
                  ${Number(splitSummary?.totalShared || 0).toFixed(2)}
                </Text>
                <Text style={[styles.cardSub, { fontSize: 10 }]}>
                  {splitSummary?.sharedTransactions?.length || 0} compras
                </Text>
              </View>

              <View>
                <Text style={styles.label}>Cuota / Adulto</Text>
                <Text style={[styles.cardTitle, { fontSize: 18, color: FamilyMint.primary }]}>
                  ${Number(splitSummary?.fairSharePerAdult || 0).toFixed(2)}
                </Text>
                <Text style={[styles.cardSub, { fontSize: 10 }]}>
                  {splitSummary?.adultsCount || 1} adultos
                </Text>
              </View>

              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.label}>Tu Balance</Text>
                {(() => {
                  const myBal = splitSummary?.memberBalances?.find((b: any) => b.userId === currentUser?.id);
                  const net = myBal ? myBal.netBalance : 0;
                  const isPositive = net > 0.01;
                  const isNegative = net < -0.01;
                  const color = isPositive ? FamilyMint.income : isNegative ? FamilyMint.expense : FamilyMint.primary;
                  const text = isPositive ? `+$${net.toFixed(2)}` : isNegative ? `-$${Math.abs(net).toFixed(2)}` : '$0.00';
                  return (
                    <>
                      <Text style={[styles.cardTitle, { fontSize: 18, color }]}>{text}</Text>
                      <Text style={[styles.cardSub, { fontSize: 10, color }]}>
                        {isPositive ? 'Te deben' : isNegative ? 'Debes' : 'Al día'}
                      </Text>
                    </>
                  );
                })()}
              </View>
            </View>
          </View>

          {/* Liquidaciones Pendientes (Cuentas Claras) */}
          <Text style={[styles.sectionTitle, { marginTop: 6 }]}>Cuentas Claras / Liquidaciones</Text>
          {splitSummary?.settlements && splitSummary.settlements.length > 0 ? (
            splitSummary.settlements.map((s: any, idx: number) => (
              <View key={idx} style={[styles.card, { borderColor: FamilyMint.warning, borderWidth: 1 }]}>
                <View style={styles.cardRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.cardTitle, { fontSize: 14 }]}>
                      <Text style={{ color: FamilyMint.expense }}>{s.fromName}</Text>
                      {' le debe a '}
                      <Text style={{ color: FamilyMint.income }}>{s.toName}</Text>
                    </Text>
                    <Text style={[styles.cardSub, { marginTop: 2 }]}>
                      Monto pendiente para equilibrar cuentas
                    </Text>
                  </View>
                  <Text style={[styles.cardTitle, { fontSize: 16, color: FamilyMint.warning }]}>
                    ${Number(s.amount).toFixed(2)}
                  </Text>
                </View>

                <TouchableOpacity
                  style={[styles.btnSm, { backgroundColor: FamilyMint.incomeBg, borderColor: FamilyMint.income, marginTop: 10, alignSelf: 'flex-end' }]}
                  disabled={settling}
                  onPress={() => handleSettleSplit(s.fromUserId, s.toUserId, s.amount)}
                >
                  <Check size={13} color={FamilyMint.income} />
                  <Text style={[styles.btnSmText, { color: FamilyMint.income }]}>
                    {settling ? 'Procesando...' : 'Marcar como Saldado'}
                  </Text>
                </TouchableOpacity>
              </View>
            ))
          ) : (
            <View style={[styles.card, { borderColor: FamilyMint.income, borderWidth: 1, backgroundColor: FamilyMint.incomeBg }]}>
              <Text style={[styles.cardSub, { color: FamilyMint.income, textAlign: 'center' }]}>
                ✓ Cuentas equilibradas. Ningún integrante adulto debe dinero.
              </Text>
            </View>
          )}

          {/* Aportes por Integrante */}
          <Text style={[styles.sectionTitle, { marginTop: 10 }]}>Aportes de Cada Integrante</Text>
          {splitSummary?.memberBalances?.map((mb: any) => (
            <View key={mb.memberId} style={styles.card}>
              <View style={styles.cardRow}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{mb.name.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.cardTitle}>{mb.name}</Text>
                  <Text style={styles.cardSub}>Pagó en común: ${Number(mb.paidTotal).toFixed(2)}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text
                    style={[
                      styles.cardTitle,
                      { color: mb.netBalance >= 0 ? FamilyMint.income : FamilyMint.expense },
                    ]}
                  >
                    {mb.formattedBalance}
                  </Text>
                  <Text style={[styles.cardSub, { fontSize: 10 }]}>
                    {mb.netBalance >= 0 ? 'A favor' : 'Por aportar'}
                  </Text>
                </View>
              </View>
            </View>
          ))}

          {/* Compras Compartidas */}
          {splitSummary?.sharedTransactions && splitSummary.sharedTransactions.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, { marginTop: 10 }]}>Compras Compartidas Este Mes</Text>
              {splitSummary.sharedTransactions.map((tx: any) => (
                <View key={tx.id} style={styles.card}>
                  <View style={styles.cardRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.cardTitle}>{tx.description}</Text>
                      <Text style={styles.cardSub}>
                        {tx.category} • Pagado por {tx.memberName} ({tx.accountName})
                      </Text>
                      <Text style={styles.cardSub}>{new Date(tx.date).toLocaleDateString()}</Text>
                    </View>
                    <Text style={[styles.cardTitle, { color: FamilyMint.expense }]}>
                      -${Number(tx.amount).toFixed(2)}
                    </Text>
                  </View>
                </View>
              ))}
            </>
          )}
        </View>
      )}

      {/* SECCIÓN 7: MISIONES FAMILIARES & MATCHING */}
      {activeTab === 'missions' && (
        <View style={styles.section}>
          {/* Card de Matching de Ahorro */}
          <View style={[styles.card, { borderColor: FamilyMint.primary, borderWidth: 1 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <Sparkles size={16} color={FamilyMint.primary} />
              <Text style={[styles.cardTitle, { color: FamilyMint.primary }]}>
                Matching de Ahorro Familiar
              </Text>
            </View>
            <Text style={styles.cardSub}>
              Premia el ahorro de los pequeños duplicando o bonificando sus aportes.
            </Text>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 14 }}>
              <View>
                <Text style={styles.label}>Bonificación</Text>
                <Text style={[styles.cardTitle, { fontSize: 18, color: FamilyMint.primary }]}>
                  +{savingsMatching?.matchPercentage || 50}%
                </Text>
                <Text style={[styles.cardSub, { fontSize: 10 }]}>Sobre cada ahorro</Text>
              </View>

              <View>
                <Text style={styles.label}>Tope Mensual</Text>
                <Text style={[styles.cardTitle, { fontSize: 18, color: FamilyMint.foreground }]}>
                  ${Number(savingsMatching?.monthlyCap || 50).toFixed(2)}
                </Text>
                <Text style={[styles.cardSub, { fontSize: 10 }]}>Límite por tutor</Text>
              </View>

              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.label}>Aportado Mes</Text>
                <Text style={[styles.cardTitle, { fontSize: 18, color: FamilyMint.income }]}>
                  ${Number(savingsMatching?.totalMatchedThisMonth || 0).toFixed(2)}
                </Text>
                <Text style={[styles.cardSub, { fontSize: 10, color: FamilyMint.income }]}>
                  Incentivo activo
                </Text>
              </View>
            </View>
          </View>

          {/* Botón Nueva Misión */}
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => {
              if (members.length > 0 && !missionAssignedId) {
                const child = members.find((m) => m.role === 'CHILD') || members[0];
                setMissionAssignedId(child.id);
              }
              setShowNewMissionModal(true);
            }}
          >
            <Plus size={16} color={FamilyMint.primary} />
            <Text style={styles.addBtnText}>+ Asignar Nueva Misión</Text>
          </TouchableOpacity>

          {/* Lista de Misiones */}
          <Text style={[styles.sectionTitle, { marginTop: 6 }]}>Misiones del Hogar ({missions.length})</Text>
          {missions.length === 0 ? (
            <Text style={styles.emptyText}>
              No hay misiones activas. ¡Crea una para motivar y educar financieramente a tus hijos!
            </Text>
          ) : (
            missions.map((m) => {
              const isPending = m.status === 'PENDING';
              const isCompleted = m.status === 'COMPLETED';
              const isPaid = m.status === 'PAID';

              return (
                <View key={m.id} style={styles.card}>
                  <View style={styles.cardRow}>
                    <View
                      style={[
                        styles.avatar,
                        {
                          backgroundColor: isPaid
                            ? 'rgba(16, 185, 129, 0.15)'
                            : isCompleted
                            ? 'rgba(59, 130, 246, 0.15)'
                            : 'rgba(245, 158, 11, 0.15)',
                          borderColor: isPaid
                            ? FamilyMint.primary
                            : isCompleted
                            ? '#3B82F6'
                            : '#F59E0B',
                        },
                      ]}
                    >
                      {isPaid ? (
                        <Check size={18} color={FamilyMint.primary} />
                      ) : isCompleted ? (
                        <Award size={18} color="#3B82F6" />
                      ) : (
                        <Target size={18} color="#F59E0B" />
                      )}
                    </View>

                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <Text style={styles.cardTitle}>{m.title}</Text>
                        <View
                          style={[
                            styles.titleBadge,
                            {
                              backgroundColor: isPaid
                                ? 'rgba(16, 185, 129, 0.15)'
                                : isCompleted
                                ? 'rgba(59, 130, 246, 0.15)'
                                : 'rgba(245, 158, 11, 0.15)',
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.titleBadgeText,
                              {
                                color: isPaid
                                  ? FamilyMint.primary
                                  : isCompleted
                                  ? '#3B82F6'
                                  : '#F59E0B',
                              },
                            ]}
                          >
                            {isPaid ? 'PAGADA' : isCompleted ? 'LISTA PARA APROBAR' : 'EN PROGRESO'}
                          </Text>
                        </View>
                      </View>

                      {m.description ? (
                        <Text style={styles.cardSub}>{m.description}</Text>
                      ) : null}

                      {m.assignedMemberName ? (
                        <Text style={[styles.roleLabel, { marginTop: 4 }]}>
                          Asignada a: <Text style={{ color: FamilyMint.foreground }}>{m.assignedMemberName}</Text>
                        </Text>
                      ) : null}
                    </View>

                    <View style={{ alignItems: 'flex-end', gap: 6 }}>
                      <Text style={[styles.cardTitle, { color: FamilyMint.primary, fontSize: 16 }]}>
                        +${Number(m.rewardAmount).toFixed(2)}
                      </Text>
                      <TouchableOpacity
                        style={[styles.iconBtn, { borderColor: FamilyMint.expense }]}
                        onPress={() => handleDeleteMission(m.id)}
                      >
                        <Trash2 size={12} color={FamilyMint.expense} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Acciones de la Misión */}
                  {isPending && (
                    <View style={[styles.actionsRow, { justifyContent: 'flex-end', marginTop: 10 }]}>
                      <TouchableOpacity
                        style={[styles.btnSm, { backgroundColor: FamilyMint.primaryMuted, borderColor: FamilyMint.primary }]}
                        onPress={() => handleCompleteMission(m.id)}
                      >
                        <Check size={13} color={FamilyMint.primary} />
                        <Text style={[styles.btnSmText, { color: FamilyMint.primary, fontWeight: '700' }]}>
                          Marcar como Hecha
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {isCompleted && (
                    <View style={[styles.actionsRow, { justifyContent: 'flex-end', marginTop: 10 }]}>
                      <TouchableOpacity
                        style={[styles.btnSm, { backgroundColor: '#10B981', borderColor: '#10B981' }]}
                        onPress={() => {
                          setSelectedMission(m);
                          setShowPayMissionModal(true);
                        }}
                      >
                        <DollarSign size={13} color="#0A1128" />
                        <Text style={[styles.btnSmText, { color: '#0A1128', fontWeight: '800' }]}>
                          Pagar Recompensa (${Number(m.rewardAmount).toFixed(2)})
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })
          )}
        </View>
      )}
      <Modal visible={showInviteModal} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Invitar Familiar</Text>
              <TouchableOpacity onPress={() => setShowInviteModal(false)}>
                <X size={20} color={FamilyMint.foregroundSubtle} />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Correo Electrónico</Text>
            <TextInput
              style={styles.input}
              placeholder="familiar@ejemplo.com"
              placeholderTextColor={FamilyMint.foregroundSubtle}
              value={inviteEmail}
              onChangeText={setInviteEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={styles.label}>Rol en el Hogar</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
              {['ADMIN', 'MEMBER', 'CHILD'].map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[styles.roleSelectBtn, inviteRole === r && styles.roleSelectBtnActive]}
                  onPress={() => setInviteRole(r)}
                >
                  <Text style={[styles.roleSelectText, inviteRole === r && styles.roleSelectTextActive]}>
                    {r}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={styles.modalSubmitBtn}
              disabled={inviteLoading}
              onPress={handleInvite}
            >
              {inviteLoading ? (
                <ActivityIndicator size="small" color="#0A1128" />
              ) : (
                <Text style={styles.modalSubmitText}>Generar e Invitar</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL CREAR MESADA */}
      <Modal visible={showAllowModal} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Asignar Mesada</Text>
              <TouchableOpacity onPress={() => setShowAllowModal(false)}>
                <X size={20} color={FamilyMint.foregroundSubtle} />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Familiar Destinatario</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              {members.map((m) => (
                <TouchableOpacity
                  key={m.id}
                  style={[styles.roleSelectBtn, allowMemberId === m.id && styles.roleSelectBtnActive]}
                  onPress={() => setAllowMemberId(m.id)}
                >
                  <Text style={[styles.roleSelectText, allowMemberId === m.id && styles.roleSelectTextActive]}>
                    {m.fullName || m.email}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.label}>Título / Concepto</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: Mesada Semanal, Gastos Escolares"
              placeholderTextColor={FamilyMint.foregroundSubtle}
              value={allowTitle}
              onChangeText={setAllowTitle}
            />

            <Text style={styles.label}>Monto Límite ($)</Text>
            <TextInput
              style={styles.input}
              placeholder="0.00"
              keyboardType="decimal-pad"
              placeholderTextColor={FamilyMint.foregroundSubtle}
              value={allowAmount}
              onChangeText={setAllowAmount}
            />

            <Text style={styles.label}>Periodicidad</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
              {['WEEKLY', 'MONTHLY'].map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[styles.roleSelectBtn, allowPeriod === p && styles.roleSelectBtnActive]}
                  onPress={() => setAllowPeriod(p)}
                >
                  <Text style={[styles.roleSelectText, allowPeriod === p && styles.roleSelectTextActive]}>
                    {p === 'WEEKLY' ? 'Semanal' : 'Mensual'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.modalSubmitBtn} onPress={handleCreateAllowance}>
              <Text style={styles.modalSubmitText}>Guardar Asignación</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL REGISTRAR GASTO MESADA */}
      <Modal visible={showExpenseModal} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Registrar Gasto en Mesada</Text>
              <TouchableOpacity onPress={() => setShowExpenseModal(false)}>
                <X size={20} color={FamilyMint.foregroundSubtle} />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Monto Gastado ($)</Text>
            <TextInput
              style={styles.input}
              placeholder="0.00"
              keyboardType="decimal-pad"
              placeholderTextColor={FamilyMint.foregroundSubtle}
              value={expenseAmount}
              onChangeText={setExpenseAmount}
            />

            <TouchableOpacity
              style={[styles.modalSubmitBtn, { backgroundColor: FamilyMint.expense }]}
              onPress={handleRecordExpense}
            >
              <Text style={[styles.modalSubmitText, { color: '#FFFFFF' }]}>Descontar de Mesada</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL DESEMBOLSAR MESADA */}
      <Modal visible={showDisburseModal} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Desembolsar Mesada</Text>
              <TouchableOpacity onPress={() => setShowDisburseModal(false)}>
                <X size={20} color={FamilyMint.foregroundSubtle} />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Cuenta Bancaria de Débito</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              {accounts.map((a) => (
                <TouchableOpacity
                  key={a.id}
                  style={[styles.roleSelectBtn, disburseAccountId === a.id && styles.roleSelectBtnActive]}
                  onPress={() => setDisburseAccountId(a.id)}
                >
                  <Text style={[styles.roleSelectText, disburseAccountId === a.id && styles.roleSelectTextActive]}>
                    {a.name} (${Number(a.balance).toFixed(0)})
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.label}>Monto a Desembolsar ($)</Text>
            <TextInput
              style={styles.input}
              placeholder="0.00"
              keyboardType="decimal-pad"
              placeholderTextColor={FamilyMint.foregroundSubtle}
              value={disburseAmount}
              onChangeText={setDisburseAmount}
            />

            <TouchableOpacity style={styles.modalSubmitBtn} onPress={handleDisburse}>
              <Text style={styles.modalSubmitText}>Confirmar Desembolso</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL EDITAR MIEMBRO */}
      <Modal visible={showEditMemberModal} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Editar Miembro</Text>
              <TouchableOpacity onPress={() => setShowEditMemberModal(false)}>
                <X size={20} color={FamilyMint.foregroundSubtle} />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Apodo o Título Familiar</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: Papá, Mamá, Hermano mayor..."
              placeholderTextColor={FamilyMint.foregroundSubtle}
              value={editMemberTitle}
              onChangeText={setEditMemberTitle}
            />

            <Text style={styles.label}>Rol en el Hogar</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
              {['ADMIN', 'MEMBER', 'CHILD'].map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[styles.roleSelectBtn, editMemberRole === r && styles.roleSelectBtnActive]}
                  onPress={() => setEditMemberRole(r)}
                >
                  <Text style={[styles.roleSelectText, editMemberRole === r && styles.roleSelectTextActive]}>
                    {r}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.modalSubmitBtn} onPress={handleSaveMemberChanges}>
              <Text style={styles.modalSubmitText}>Guardar Cambios</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL CREAR MISIÓN */}
      <Modal visible={showNewMissionModal} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nueva Misión Familiar</Text>
              <TouchableOpacity onPress={() => setShowNewMissionModal(false)}>
                <X size={20} color={FamilyMint.foregroundSubtle} />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Título de la Misión</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: Lavar el auto, Leer 30 mins, Buenas notas..."
              placeholderTextColor={FamilyMint.foregroundSubtle}
              value={missionTitle}
              onChangeText={setMissionTitle}
            />

            <Text style={styles.label}>Recompensa Económica ($)</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: 5.00"
              keyboardType="decimal-pad"
              placeholderTextColor={FamilyMint.foregroundSubtle}
              value={missionReward}
              onChangeText={setMissionReward}
            />

            <Text style={styles.label}>Asignar a Familiar</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              {members.map((m) => (
                <TouchableOpacity
                  key={m.id}
                  style={[styles.roleSelectBtn, missionAssignedId === m.id && styles.roleSelectBtnActive]}
                  onPress={() => setMissionAssignedId(m.id)}
                >
                  <Text style={[styles.roleSelectText, missionAssignedId === m.id && styles.roleSelectTextActive]}>
                    {m.fullName || m.email} ({m.role})
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity style={styles.modalSubmitBtn} onPress={handleCreateMission}>
              <Text style={styles.modalSubmitText}>Publicar Misión</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL PAGAR RECOMPENSA DE MISIÓN */}
      <Modal visible={showPayMissionModal} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Aprobar & Pagar Misión</Text>
              <TouchableOpacity onPress={() => setShowPayMissionModal(false)}>
                <X size={20} color={FamilyMint.foregroundSubtle} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.cardTitle, { marginBottom: 6 }]}>
              {selectedMission?.title}
            </Text>
            <Text style={[styles.cardSub, { marginBottom: 14 }]}>
              Monto a transferir:{' '}
              <Text style={{ color: FamilyMint.primary, fontWeight: '700' }}>
                ${Number(selectedMission?.rewardAmount || 0).toFixed(2)}
              </Text>
            </Text>

            <Text style={styles.label}>Cuenta Bancaria de Débito</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              {accounts.map((a) => (
                <TouchableOpacity
                  key={a.id}
                  style={[styles.roleSelectBtn, missionPaymentAccount === a.id && styles.roleSelectBtnActive]}
                  onPress={() => setMissionPaymentAccount(a.id)}
                >
                  <Text style={[styles.roleSelectText, missionPaymentAccount === a.id && styles.roleSelectTextActive]}>
                    {a.name} (${Number(a.balance).toFixed(0)})
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity style={styles.modalSubmitBtn} onPress={handlePayMission}>
              <Text style={styles.modalSubmitText}>Confirmar Pago y Débito</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: FamilyMint.background },
  contentContainer: { padding: 16, paddingTop: 48, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 20, fontWeight: '800', color: FamilyMint.foreground },
  subtitle: { fontSize: 12, color: FamilyMint.foregroundSubtle, marginTop: 2 },
  inviteHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: FamilyMint.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  inviteHeaderBtnText: { color: '#0A1128', fontWeight: '700', fontSize: 13 },
  tabScroll: { marginBottom: 16 },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: FamilyMint.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginRight: 8,
    borderWidth: 1,
    borderColor: FamilyMint.border,
  },
  tabItemActive: {
    backgroundColor: FamilyMint.primaryMuted,
    borderColor: FamilyMint.primary,
  },
  tabText: { fontSize: 12, color: FamilyMint.foregroundSubtle, fontWeight: '600' },
  tabTextActive: { color: FamilyMint.primary, fontWeight: '700' },
  section: { gap: 10 },
  card: {
    backgroundColor: FamilyMint.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: FamilyMint.border,
  },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: FamilyMint.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: FamilyMint.border,
  },
  avatarText: { fontSize: 16, fontWeight: '800', color: FamilyMint.primary },
  memberName: { fontSize: 14, fontWeight: '700', color: FamilyMint.foreground },
  memberEmail: { fontSize: 11, color: FamilyMint.foregroundSubtle, marginTop: 1 },
  roleLabel: { fontSize: 10, color: FamilyMint.foregroundMuted, marginTop: 2 },
  titleBadge: {
    backgroundColor: FamilyMint.primaryMuted,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  titleBadgeText: { fontSize: 9, color: FamilyMint.primary, fontWeight: '700' },
  actionBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: FamilyMint.surfaceElevated,
    borderWidth: 1,
    borderColor: FamilyMint.border,
    alignItems: 'center',
  },
  actionBtnText: { fontSize: 11, color: FamilyMint.foregroundMuted, fontWeight: '600' },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: FamilyMint.surface,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: FamilyMint.primary,
    borderRadius: 12,
    paddingVertical: 12,
    marginBottom: 8,
  },
  addBtnText: { color: FamilyMint.primary, fontWeight: '700', fontSize: 13 },
  emptyText: {
    color: FamilyMint.foregroundSubtle,
    fontSize: 13,
    textAlign: 'center',
    marginVertical: 24,
  },
  cardTitle: { fontSize: 14, fontWeight: '700', color: FamilyMint.foreground },
  cardSub: { fontSize: 11, color: FamilyMint.foregroundSubtle, marginTop: 2 },
  allowanceRem: { fontSize: 16, fontWeight: '800', color: FamilyMint.primary },
  allowanceLimit: { fontSize: 10, color: FamilyMint.foregroundSubtle },
  progressBarBg: {
    height: 6,
    backgroundColor: FamilyMint.surfaceElevated,
    borderRadius: 3,
    marginVertical: 10,
    overflow: 'hidden',
  },
  progressBarFill: { height: '100%', borderRadius: 3 },
  actionsRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  btnSm: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: FamilyMint.surfaceElevated,
    borderWidth: 1,
    borderColor: FamilyMint.border,
  },
  btnSmText: { fontSize: 11, color: FamilyMint.foregroundMuted, fontWeight: '600' },
  iconBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: FamilyMint.surfaceElevated,
    borderWidth: 1,
    borderColor: FamilyMint.border,
  },
  badgeText: { fontSize: 11, fontWeight: '700', marginTop: 2 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: FamilyMint.foreground },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: FamilyMint.border,
  },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: FamilyMint.primary,
    marginTop: 5,
  },
  activityText: { fontSize: 12, color: FamilyMint.foregroundMuted, lineHeight: 18 },
  activityTime: { fontSize: 10, color: FamilyMint.foregroundSubtle, marginTop: 2 },
  input: {
    backgroundColor: FamilyMint.surfaceElevated,
    borderWidth: 1,
    borderColor: FamilyMint.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: FamilyMint.foreground,
    fontSize: 13,
    marginBottom: 12,
  },
  submitBtnSm: {
    backgroundColor: FamilyMint.primary,
    paddingHorizontal: 16,
    justifyContent: 'center',
    borderRadius: 10,
    marginBottom: 12,
  },
  submitBtnSmText: { color: '#0A1128', fontWeight: '700', fontSize: 13 },
  modalBg: { flex: 1, backgroundColor: 'rgba(5, 10, 24, 0.85)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: FamilyMint.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    borderColor: FamilyMint.border,
    padding: 20,
    maxHeight: '90%',
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  modalTitle: { fontSize: 17, fontWeight: '700', color: FamilyMint.foreground },
  label: { fontSize: 11, fontWeight: '700', color: FamilyMint.foregroundSubtle, marginBottom: 6, textTransform: 'uppercase' },
  roleSelectBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: FamilyMint.surfaceElevated,
    borderWidth: 1,
    borderColor: FamilyMint.border,
  },
  roleSelectBtnActive: { borderColor: FamilyMint.primary, backgroundColor: FamilyMint.primaryMuted },
  roleSelectText: { fontSize: 12, color: FamilyMint.foregroundMuted, fontWeight: '600' },
  roleSelectTextActive: { color: FamilyMint.primary, fontWeight: '700' },
  modalSubmitBtn: {
    backgroundColor: FamilyMint.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 6,
  },
  modalSubmitText: { color: '#0A1128', fontSize: 14, fontWeight: '700' },
});
