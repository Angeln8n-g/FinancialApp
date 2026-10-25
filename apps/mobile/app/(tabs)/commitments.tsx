import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { fetchWithAuth } from '@/constants/Api';

interface DebtItem {
  id: string;
  contactName: string;
  totalAmount: number;
  remainingAmount: number;
  paidAmount?: number;
  progressPercentage?: number;
  interestRate: number;
  dueDate?: string | null;
  targetPayoffDate?: string | null;
  monthlyTargetPayment?: number | null;
  mitigationStrategy?: 'AVALANCHE' | 'SNOWBALL' | 'CUSTOM';
  notes?: string | null;
  monthsRemaining?: number | null;
  daysRemaining?: number | null;
  suggestedMonthlyPayment?: number | null;
  isPaidOff?: boolean;
}

interface SubscriptionItem {
  id: string;
  name: string;
  cost: number;
  period?: string;
  nextBillingDate?: string | null;
  autoDeduct: boolean;
  accountId?: string | null;
  account?: {
    id: string;
    name: string;
    type: string;
    balance: number;
  } | null;
}

interface AccountItem {
  id: string;
  name: string;
  type: string;
  balance: number;
  isPayroll?: boolean;
}

export default function MobileCommitmentsScreen() {
  const [debts, setDebts] = useState<DebtItem[]>([]);
  const [subscriptions, setSubscriptions] = useState<SubscriptionItem[]>([]);
  const [accounts, setAccounts] = useState<AccountItem[]>([]);
  const [totalMonthlyConsumption, setTotalMonthlyConsumption] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modales
  const [showDebtModal, setShowDebtModal] = useState(false);
  const [showPayDebtModal, setShowPayDebtModal] = useState(false);
  const [showSubModal, setShowSubModal] = useState(false);
  const [showEditSubModal, setShowEditSubModal] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);

  // Formulario Crear Deuda
  const [dName, setDName] = useState('');
  const [dAmount, setDAmount] = useState('');
  const [dRate, setDRate] = useState('');
  const [dStrategy, setDStrategy] = useState<'AVALANCHE' | 'SNOWBALL' | 'CUSTOM'>('AVALANCHE');
  const [dTargetDate, setDTargetDate] = useState('');
  const [dTargetMonthly, setDTargetMonthly] = useState('');
  const [dNotes, setDNotes] = useState('');
  const [isSubmittingDebt, setIsSubmittingDebt] = useState(false);

  // Formulario Abonar a Deuda
  const [selectedDebtForPay, setSelectedDebtForPay] = useState<DebtItem | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payAccountId, setPayAccountId] = useState('');
  const [payNotes, setPayNotes] = useState('');
  const [isSubmittingPay, setIsSubmittingPay] = useState(false);

  // Formulario Crear/Editar Suscripción
  const [sName, setSName] = useState('');
  const [sCost, setSCost] = useState('');
  const [sAutoDeduct, setSAutoDeduct] = useState(false);
  const [sAccountId, setSAccountId] = useState('');
  const [sNextDate, setSNextDate] = useState('');
  const [isSubmittingSub, setIsSubmittingSub] = useState(false);

  const [selectedSub, setSelectedSub] = useState<SubscriptionItem | null>(null);
  const [editSubName, setEditSubName] = useState('');
  const [editSubCost, setEditSubCost] = useState('');
  const [editAutoDeduct, setEditAutoDeduct] = useState(false);
  const [editAccountId, setEditAccountId] = useState('');

  // Formulario Recordatorio
  const [remTitle, setRemTitle] = useState('');
  const [remAmount, setRemAmount] = useState('');
  const [remDueDate, setRemDueDate] = useState('');
  const [remSubId, setRemSubId] = useState('');
  const [remDebtId, setRemDebtId] = useState('');
  const [isSubmittingRem, setIsSubmittingRem] = useState(false);

  const [deductingSubId, setDeductingSubId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [resDebts, resSubs, resAccounts] = await Promise.all([
        fetchWithAuth('/api/debts'),
        fetchWithAuth('/api/subscriptions'),
        fetchWithAuth('/api/accounts'),
      ]);

      if (resDebts.ok) {
        const dData = await resDebts.json();
        if (Array.isArray(dData)) {
          setDebts(
            dData.map((d: any) => ({
              id: d.id,
              contactName: d.contactName,
              totalAmount: Number(d.totalAmount || 0),
              remainingAmount: Number(d.remainingAmount || 0),
              paidAmount: Number(d.paidAmount || (Number(d.totalAmount || 0) - Number(d.remainingAmount || 0))),
              progressPercentage: Number(d.progressPercentage || 0),
              interestRate: Number(d.interestRate || 0),
              dueDate: d.dueDate,
              targetPayoffDate: d.targetPayoffDate,
              monthlyTargetPayment: d.monthlyTargetPayment ? Number(d.monthlyTargetPayment) : null,
              mitigationStrategy: d.mitigationStrategy || 'CUSTOM',
              notes: d.notes,
              monthsRemaining: d.monthsRemaining,
              daysRemaining: d.daysRemaining,
              suggestedMonthlyPayment: d.suggestedMonthlyPayment ? Number(d.suggestedMonthlyPayment) : null,
              isPaidOff: d.isPaidOff || false,
            }))
          );
        }
      }

      if (resSubs.ok) {
        const sData = await resSubs.json();
        if (sData.subscriptions && Array.isArray(sData.subscriptions)) {
          setSubscriptions(
            sData.subscriptions.map((s: any) => ({
              id: s.id,
              name: s.name,
              cost: Number(s.cost || 0),
              period: s.period || 'MONTHLY',
              nextBillingDate: s.nextBillingDate,
              autoDeduct: !!s.autoDeduct,
              accountId: s.accountId || null,
              account: s.account
                ? {
                    id: s.account.id,
                    name: s.account.name,
                    type: s.account.type,
                    balance: Number(s.account.balance || 0),
                  }
                : null,
            }))
          );
          setTotalMonthlyConsumption(Number(sData.totalMonthlyConsumption || 0));
        }
      }

      if (resAccounts.ok) {
        const accData = await resAccounts.json();
        if (Array.isArray(accData)) {
          setAccounts(
            accData.map((a: any) => ({
              id: a.id,
              name: a.name,
              type: a.type,
              balance: Number(a.balance || 0),
              isPayroll: a.isPayroll || false,
            }))
          );
        }
      }
    } catch (e) {
      console.log('Error cargando compromisos:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // Cálculos banner global de mitigación de deudas
  const totalDebtOriginal = debts.reduce((acc, d) => acc + d.totalAmount, 0);
  const totalDebtRemaining = debts.reduce((acc, d) => acc + d.remainingAmount, 0);
  const totalDebtAmortized = Math.max(0, totalDebtOriginal - totalDebtRemaining);
  const globalProgress =
    totalDebtOriginal > 0 ? Math.min(100, Math.round((totalDebtAmortized / totalDebtOriginal) * 100)) : 0;

  // Acciones Deudas
  const handleCreateDebt = async () => {
    if (!dName.trim() || !dAmount || parseFloat(dAmount) <= 0) {
      Alert.alert('Datos requeridos', 'Ingresa el nombre del acreedor y un monto válido.');
      return;
    }

    try {
      setIsSubmittingDebt(true);
      const res = await fetchWithAuth('/api/debts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactName: dName.trim(),
          totalAmount: parseFloat(dAmount),
          remainingAmount: parseFloat(dAmount),
          interestRate: parseFloat(dRate || '0'),
          mitigationStrategy: dStrategy,
          targetPayoffDate: dTargetDate ? new Date(dTargetDate).toISOString() : undefined,
          monthlyTargetPayment: dTargetMonthly ? parseFloat(dTargetMonthly) : undefined,
          notes: dNotes.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Error al crear la deuda');
      }

      setShowDebtModal(false);
      setDName('');
      setDAmount('');
      setDRate('');
      setDTargetDate('');
      setDTargetMonthly('');
      setDNotes('');
      Alert.alert('¡Éxito!', 'Plan de deuda registrado con éxito.');
      loadData();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'No se pudo registrar la deuda.');
    } finally {
      setIsSubmittingDebt(false);
    }
  };

  const handleDeleteDebt = (id: string, name: string) => {
    Alert.alert('Confirmar eliminación', `¿Deseas eliminar el registro de deuda "${name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            const res = await fetchWithAuth(`/api/debts/${id}`, { method: 'DELETE' });
            if (res.ok) {
              Alert.alert('Eliminado', 'La deuda ha sido eliminada.');
              loadData();
            } else {
              Alert.alert('Error', 'No se pudo eliminar la deuda.');
            }
          } catch (e) {
            Alert.alert('Error', 'Ocurrió un error al conectar con el servidor.');
          }
        },
      },
    ]);
  };

  const handleOpenPayModal = (debt: DebtItem) => {
    setSelectedDebtForPay(debt);
    setPayAmount('');
    setPayAccountId(accounts.length > 0 ? accounts[0].id : '');
    setPayNotes('');
    setShowPayDebtModal(true);
  };

  const handleExecuteDebtPayment = async () => {
    if (!selectedDebtForPay) return;
    const amountNum = parseFloat(payAmount);
    if (!amountNum || amountNum <= 0) {
      Alert.alert('Monto Inválido', 'Ingresa una cantidad mayor a 0 para el abono.');
      return;
    }

    if (amountNum > selectedDebtForPay.remainingAmount) {
      Alert.alert(
        'Monto Excede el Saldo',
        `El saldo restante es de RD$${selectedDebtForPay.remainingAmount.toLocaleString()}. ¿Deseas abonar el saldo total exacto?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Abonar Saldo Total',
            onPress: () => setPayAmount(selectedDebtForPay.remainingAmount.toString()),
          },
        ]
      );
      return;
    }

    const selectedAcc = accounts.find((a) => a.id === payAccountId);
    if (selectedAcc && selectedAcc.balance < amountNum) {
      Alert.alert(
        'Saldo Insuficiente',
        `La cuenta "${selectedAcc.name}" solo dispone de RD$${selectedAcc.balance.toLocaleString()}. Selecciona otra cuenta o ajusta el monto.`
      );
      return;
    }

    try {
      setIsSubmittingPay(true);
      const res = await fetchWithAuth(`/api/debts/${selectedDebtForPay.id}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amountNum,
          accountId: payAccountId || undefined,
          notes: payNotes.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Error al registrar abono.');
      }

      setShowPayDebtModal(false);
      Alert.alert('¡Abono Registrado!', `Se abonaron RD$${amountNum.toLocaleString()} a "${selectedDebtForPay.contactName}".`);
      loadData();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'No se pudo procesar el pago.');
    } finally {
      setIsSubmittingPay(false);
    }
  };

  // Acciones Suscripciones
  const handleCreateSub = async () => {
    if (!sName.trim() || !sCost || parseFloat(sCost) <= 0) {
      Alert.alert('Datos requeridos', 'Ingresa el nombre del servicio y el costo mensual.');
      return;
    }

    try {
      setIsSubmittingSub(true);
      const res = await fetchWithAuth('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: sName.trim(),
          cost: parseFloat(sCost),
          autoDeduct: sAutoDeduct,
          accountId: sAutoDeduct && sAccountId ? sAccountId : undefined,
          nextBillingDate: sNextDate ? new Date(sNextDate).toISOString() : undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Error al guardar la suscripción');
      }

      setShowSubModal(false);
      setSName('');
      setSCost('');
      setSAutoDeduct(false);
      setSAccountId('');
      setSNextDate('');
      Alert.alert('¡Éxito!', 'Suscripción recurrente registrada.');
      loadData();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'No se pudo registrar la suscripción.');
    } finally {
      setIsSubmittingSub(false);
    }
  };

  const handleOpenEditSub = (s: SubscriptionItem) => {
    setSelectedSub(s);
    setEditSubName(s.name);
    setEditSubCost(s.cost.toString());
    setEditAutoDeduct(s.autoDeduct);
    setEditAccountId(s.accountId || (accounts.length > 0 ? accounts[0].id : ''));
    setShowEditSubModal(true);
  };

  const handleSaveEditSub = async () => {
    if (!selectedSub || !editSubName.trim() || !editSubCost || parseFloat(editSubCost) <= 0) return;

    try {
      const res = await fetchWithAuth(`/api/subscriptions/${selectedSub.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editSubName.trim(),
          cost: parseFloat(editSubCost),
          autoDeduct: editAutoDeduct,
          accountId: editAutoDeduct && editAccountId ? editAccountId : undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Error al actualizar suscripción');
      }

      setShowEditSubModal(false);
      Alert.alert('Actualizado', 'Suscripción actualizada correctamente.');
      loadData();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'No se pudo guardar la suscripción.');
    }
  };

  const handleDeleteSub = (id: string, name: string) => {
    Alert.alert('Confirmar eliminación', `¿Eliminar la suscripción "${name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            const res = await fetchWithAuth(`/api/subscriptions/${id}`, { method: 'DELETE' });
            if (res.ok) {
              Alert.alert('Eliminada', 'La suscripción ha sido eliminada.');
              loadData();
            } else {
              Alert.alert('Error', 'No se pudo eliminar la suscripción.');
            }
          } catch (e) {
            Alert.alert('Error', 'Error de conexión.');
          }
        },
      },
    ]);
  };

  const handleTriggerManualDeduct = async (sub: SubscriptionItem) => {
    Alert.alert(
      'Deducción Manual',
      `¿Deseas procesar el pago de RD$${sub.cost.toFixed(2)} para "${sub.name}" desde la cuenta configurada?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Deducir Ahora',
          onPress: async () => {
            try {
              setDeductingSubId(sub.id);
              const res = await fetchWithAuth(`/api/subscriptions/${sub.id}/deduct`, {
                method: 'POST',
              });
              const data = await res.json();

              if (!res.ok) {
                throw new Error(data.message || 'No se pudo deducir la suscripción.');
              }

              Alert.alert('¡Pago Realizado!', data.message || `Cobro de RD$${sub.cost.toFixed(2)} procesado exitosamente.`);
              loadData();
            } catch (e: any) {
              Alert.alert('Error en Deducción', e.message || 'Fondos insuficientes o error del servidor.');
            } finally {
              setDeductingSubId(null);
            }
          },
        },
      ]
    );
  };

  // Recordatorios
  const handleOpenReminderFromDebt = (d: DebtItem) => {
    setRemTitle(`Pago Deuda: ${d.contactName}`);
    setRemAmount(d.remainingAmount.toString());
    setRemDueDate(d.dueDate ? new Date(d.dueDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
    setRemDebtId(d.id);
    setRemSubId('');
    setShowReminderModal(true);
  };

  const handleOpenReminderFromSub = (s: SubscriptionItem) => {
    setRemTitle(`Suscripción: ${s.name}`);
    setRemAmount(s.cost.toString());
    setRemDueDate(s.nextBillingDate ? new Date(s.nextBillingDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
    setRemSubId(s.id);
    setRemDebtId('');
    setShowReminderModal(true);
  };

  const handleCreateReminder = async () => {
    if (!remTitle || !remAmount) return;
    try {
      setIsSubmittingRem(true);
      const res = await fetchWithAuth('/api/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: remTitle,
          amount: parseFloat(remAmount),
          dueDate: remDueDate || new Date().toISOString().split('T')[0],
          subscriptionId: remSubId || undefined,
          debtId: remDebtId || undefined,
        }),
      });

      if (res.ok) {
        setShowReminderModal(false);
        setRemTitle('');
        setRemAmount('');
        setRemDueDate('');
        Alert.alert('¡Éxito!', 'Recordatorio programado con éxito.');
      } else {
        Alert.alert('Error', 'No se pudo programar el recordatorio.');
      }
    } catch (e) {
      Alert.alert('Error', 'No se pudo conectar con el servidor.');
    } finally {
      setIsSubmittingRem(false);
    }
  };

  const getStrategyBadge = (strat?: string) => {
    switch (strat) {
      case 'AVALANCHE':
        return { label: '⚡ Avalancha', bg: 'rgba(168, 85, 247, 0.15)', text: '#c084fc', border: 'rgba(168, 85, 247, 0.3)' };
      case 'SNOWBALL':
        return { label: '❄️ Bola de Nieve', bg: 'rgba(56, 189, 248, 0.15)', text: '#38bdf8', border: 'rgba(56, 189, 248, 0.3)' };
      default:
        return { label: '🎯 Personalizado', bg: 'rgba(148, 163, 184, 0.15)', text: '#94a3b8', border: 'rgba(148, 163, 184, 0.3)' };
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#a855f7" />
        <Text style={styles.loadingText}>Cargando compromisos y mitigación...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#a855f7" />}
    >
      {/* HEADER */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.screenTitle}>Deudas & Suscripciones</Text>
          <Text style={styles.screenSub}>Estrategias de mitigación y deducción automática</Text>
        </View>
      </View>

      {/* 🛡️ BANNER SALUD & MITIGACIÓN DE DEUDAS FAMILIARES */}
      <View style={styles.healthBanner}>
        <View style={styles.healthBannerHeader}>
          <Text style={styles.healthBannerTitle}>Plan de Mitigación Familiar</Text>
          <View style={styles.healthProgressBadge}>
            <Text style={styles.healthProgressText}>{globalProgress}% Amortizado</Text>
          </View>
        </View>

        <View style={styles.healthStatsRow}>
          <View style={styles.healthStatCol}>
            <Text style={styles.healthStatLabel}>Total Adeudado</Text>
            <Text style={[styles.healthStatValue, { color: '#fb7185' }]}>
              RD${totalDebtRemaining.toLocaleString('en-US', { minimumFractionDigits: 0 })}
            </Text>
          </View>
          <View style={styles.healthStatCol}>
            <Text style={styles.healthStatLabel}>Total Amortizado</Text>
            <Text style={[styles.healthStatValue, { color: '#34d399' }]}>
              RD${totalDebtAmortized.toLocaleString('en-US', { minimumFractionDigits: 0 })}
            </Text>
          </View>
          <View style={styles.healthStatCol}>
            <Text style={styles.healthStatLabel}>Monto Inicial</Text>
            <Text style={styles.healthStatValue}>
              RD${totalDebtOriginal.toLocaleString('en-US', { minimumFractionDigits: 0 })}
            </Text>
          </View>
        </View>

        {/* Barra de progreso global */}
        <View style={styles.progressBarTrack}>
          <View style={[styles.progressBarFill, { width: `${globalProgress}%` }]} />
        </View>
        <Text style={styles.healthBannerFooter}>
          {totalDebtRemaining === 0 && totalDebtOriginal > 0
            ? '🎉 ¡Felicidades! Todas las deudas familiares están 100% liquidadas.'
            : `${debts.filter((d) => d.remainingAmount > 0).length} deudas activas en curso hacia libertad financiera.`}
        </Text>
      </View>

      {/* 💸 DEUDAS Y PRÉSTAMOS */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionHeader}>Planes de Deuda ({debts.length})</Text>
        <TouchableOpacity style={styles.addSmallBtn} onPress={() => setShowDebtModal(true)}>
          <Text style={styles.addSmallBtnText}>+ Nueva Deuda</Text>
        </TouchableOpacity>
      </View>

      {debts.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyCardIcon}>🎉</Text>
          <Text style={styles.emptyCardTitle}>Sin Deudas Registradas</Text>
          <Text style={styles.emptyCardSub}>¡Excelente! Tu hogar se encuentra completamente libre de deudas.</Text>
        </View>
      ) : (
        debts.map((d) => {
          const strat = getStrategyBadge(d.mitigationStrategy);
          const paid = Math.max(0, d.totalAmount - d.remainingAmount);
          const pct = d.totalAmount > 0 ? Math.min(100, Math.round((paid / d.totalAmount) * 100)) : 0;
          const isDone = d.remainingAmount <= 0;

          return (
            <View key={d.id} style={[styles.debtCard, isDone && styles.debtCardDone]}>
              {/* Header de la tarjeta */}
              <View style={styles.cardHeader}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.cardTitle}>{d.contactName}</Text>
                  <View style={styles.badgeRow}>
                    <View style={[styles.stratBadge, { backgroundColor: strat.bg, borderColor: strat.border }]}>
                      <Text style={[styles.stratText, { color: strat.text }]}>{strat.label}</Text>
                    </View>
                    {d.interestRate > 0 && (
                      <View style={styles.rateBadge}>
                        <Text style={styles.rateText}>{d.interestRate}% Interés</Text>
                      </View>
                    )}
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.deleteIconBtn}
                  onPress={() => handleDeleteDebt(d.id, d.contactName)}
                >
                  <Text style={{ fontSize: 14 }}>🗑️</Text>
                </TouchableOpacity>
              </View>

              {/* Saldo y Amortización */}
              <View style={styles.debtAmountsRow}>
                <View>
                  <Text style={styles.debtLabel}>Saldo Pendiente</Text>
                  <Text style={[styles.debtAmount, isDone && { color: '#34d399' }]}>
                    RD${d.remainingAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.debtLabel}>Monto Inicial</Text>
                  <Text style={styles.debtInitialAmount}>
                    RD${d.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </Text>
                </View>
              </View>

              {/* Barra de progreso de amortización */}
              <View style={styles.debtProgressSection}>
                <View style={styles.progressBarTrackSmall}>
                  <View
                    style={[
                      styles.progressBarFillSmall,
                      { width: `${pct}%`, backgroundColor: isDone ? '#34d399' : '#a855f7' },
                    ]}
                  />
                </View>
                <View style={styles.debtProgressCaptionRow}>
                  <Text style={styles.debtProgressCaption}>
                    Amortizado: RD${paid.toLocaleString('en-US', { minimumFractionDigits: 0 })} ({pct}%)
                  </Text>
                  {isDone && <Text style={styles.debtDoneBadge}>✅ Liquidada</Text>}
                </View>
              </View>

              {/* Metas y Proyección */}
              {(d.targetPayoffDate || d.monthlyTargetPayment) && (
                <View style={styles.targetBox}>
                  {d.targetPayoffDate && (
                    <Text style={styles.targetBoxText}>
                      🎯 Meta liquidación: {new Date(d.targetPayoffDate).toLocaleDateString()}
                      {d.monthsRemaining !== null && d.monthsRemaining !== undefined && !isDone
                        ? ` (~${d.monthsRemaining} meses)`
                        : ''}
                    </Text>
                  )}
                  {d.monthlyTargetPayment && !isDone && (
                    <Text style={styles.targetBoxSub}>
                      Aporte objetivo mensual: RD${d.monthlyTargetPayment.toLocaleString()}
                    </Text>
                  )}
                </View>
              )}

              {/* Acciones de la deuda */}
              <View style={styles.cardActionsRow}>
                {!isDone ? (
                  <TouchableOpacity
                    style={styles.payActionBtn}
                    onPress={() => handleOpenPayModal(d)}
                  >
                    <Text style={styles.payActionBtnText}>+ Abonar a Deuda</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.paidOffPill}>
                    <Text style={styles.paidOffPillText}>Totalmente Amortizada</Text>
                  </View>
                )}
                <TouchableOpacity
                  style={styles.reminderBtn}
                  onPress={() => handleOpenReminderFromDebt(d)}
                >
                  <Text style={styles.reminderBtnText}>⏰ Recordatorio</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })
      )}

      {/* 📺 SUSCRIPCIONES Y SERVICIOS RECURRENTES */}
      <View style={styles.sectionHeaderRow}>
        <View>
          <Text style={styles.sectionHeader}>Suscripciones & Débito ({subscriptions.length})</Text>
          <Text style={styles.subTotalText}>
            Consumo mensual: RD${totalMonthlyConsumption.toLocaleString('en-US', { minimumFractionDigits: 2 })}/mes
          </Text>
        </View>
        <TouchableOpacity style={styles.addSmallBtn} onPress={() => setShowSubModal(true)}>
          <Text style={styles.addSmallBtnText}>+ Servicio</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.subsGrid}>
        {subscriptions.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyCardIcon}>📺</Text>
            <Text style={styles.emptyCardTitle}>Sin Suscripciones</Text>
            <Text style={styles.emptyCardSub}>No tienes servicios de streaming o membresías recurrentes registradas.</Text>
          </View>
        ) : (
          subscriptions.map((s) => {
            const hasAccount = !!s.account;
            const isInsufficient =
              s.autoDeduct && hasAccount && (s.account?.balance ?? 0) < s.cost;
            const isDeducting = deductingSubId === s.id;

            return (
              <View key={s.id} style={styles.subCard}>
                <View style={styles.subCardHeader}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={styles.subName} numberOfLines={1}>
                      {s.name}
                    </Text>
                    {/* Badge Débito Automático */}
                    <View style={styles.subBadgeRow}>
                      {s.autoDeduct ? (
                        <View style={styles.autoDeductBadge}>
                          <Text style={styles.autoDeductBadgeText}>
                            🟢 Auto: {s.account ? s.account.name : 'Cuenta configurada'}
                          </Text>
                        </View>
                      ) : (
                        <View style={styles.manualDeductBadge}>
                          <Text style={styles.manualDeductBadgeText}>⚪ Cobro Manual</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.subCost}>
                      RD${s.cost.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </Text>
                    <Text style={styles.subCycleText}>/{s.period === 'YEARLY' ? 'año' : 'mes'}</Text>
                  </View>
                </View>

                {/* Alerta de saldo insuficiente */}
                {isInsufficient && (
                  <View style={styles.insufficientAlert}>
                    <Text style={styles.insufficientAlertText}>
                      ⚠️ Saldo insuficiente en cuenta (RD$
                      {s.account?.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })} disp.)
                    </Text>
                  </View>
                )}

                {/* Footer y Acciones de la suscripción */}
                <View style={styles.subCardFooter}>
                  <Text style={styles.subDate}>
                    {s.nextBillingDate
                      ? `Próx: ${new Date(s.nextBillingDate).toLocaleDateString()}`
                      : 'Fecha no fijada'}
                  </Text>

                  <View style={styles.subActionsGroup}>
                    {s.autoDeduct && (
                      <TouchableOpacity
                        style={[styles.deductNowBtn, isDeducting && { opacity: 0.5 }]}
                        onPress={() => handleTriggerManualDeduct(s)}
                        disabled={isDeducting}
                      >
                        {isDeducting ? (
                          <ActivityIndicator size="small" color="#ffffff" />
                        ) : (
                          <Text style={styles.deductNowBtnText}>⚡ Deducir Ahora</Text>
                        )}
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity onPress={() => handleOpenReminderFromSub(s)} style={styles.iconCircleBtn}>
                      <Text style={{ fontSize: 13 }}>⏰</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleOpenEditSub(s)} style={styles.iconCircleBtn}>
                      <Text style={{ fontSize: 13 }}>✏️</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDeleteSub(s.id, s.name)} style={styles.iconCircleBtn}>
                      <Text style={{ fontSize: 13 }}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </View>

      {/* ================= MODALES ================= */}

      {/* 1. MODAL NUEVA DEUDA */}
      <Modal visible={showDebtModal} transparent animationType="slide">
        <View style={styles.modalBg}>
          <ScrollView contentContainerStyle={styles.modalScroll}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Nueva Deuda / Mitigación</Text>
              <Text style={styles.modalSub}>Diseña un plan para extinguir este compromiso</Text>

              <Text style={styles.inputLabel}>Acreedor o Concepto</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="ej. Préstamo Banreservas, Tarjeta Visa"
                placeholderTextColor="#94a3b8"
                value={dName}
                onChangeText={setDName}
              />

              <Text style={styles.inputLabel}>Monto Inicial (RD$)</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="0.00"
                placeholderTextColor="#94a3b8"
                keyboardType="numeric"
                value={dAmount}
                onChangeText={setDAmount}
              />

              <Text style={styles.inputLabel}>Tasa de Interés Anual (%)</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="ej. 14.5"
                placeholderTextColor="#94a3b8"
                keyboardType="numeric"
                value={dRate}
                onChangeText={setDRate}
              />

              <Text style={styles.inputLabel}>Estrategia de Mitigación</Text>
              <View style={styles.strategyPickerRow}>
                {(['AVALANCHE', 'SNOWBALL', 'CUSTOM'] as const).map((strat) => (
                  <TouchableOpacity
                    key={strat}
                    style={[
                      styles.strategyChip,
                      dStrategy === strat && styles.strategyChipActive,
                    ]}
                    onPress={() => setDStrategy(strat)}
                  >
                    <Text
                      style={[
                        styles.strategyChipText,
                        dStrategy === strat && styles.strategyChipTextActive,
                      ]}
                    >
                      {strat === 'AVALANCHE' ? '⚡ Avalancha' : strat === 'SNOWBALL' ? '❄️ Bola Nieve' : '🎯 Personalizado'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Fecha Meta para Saldar (Opcional)</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#94a3b8"
                value={dTargetDate}
                onChangeText={setDTargetDate}
              />

              <Text style={styles.inputLabel}>Aporte Mensual Proyectado (RD$)</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="ej. 5000"
                placeholderTextColor="#94a3b8"
                keyboardType="numeric"
                value={dTargetMonthly}
                onChangeText={setDTargetMonthly}
              />

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setShowDebtModal(false)}
                  disabled={isSubmittingDebt}
                >
                  <Text style={styles.cancelBtnText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.saveBtn}
                  onPress={handleCreateDebt}
                  disabled={isSubmittingDebt}
                >
                  {isSubmittingDebt ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Text style={styles.saveBtnText}>Guardar Plan</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* 2. MODAL ABONAR A DEUDA */}
      <Modal visible={showPayDebtModal} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Abonar a Deuda</Text>
            {selectedDebtForPay && (
              <View style={styles.debtSummaryBox}>
                <Text style={styles.debtSummaryTitle}>{selectedDebtForPay.contactName}</Text>
                <Text style={styles.debtSummaryBalance}>
                  Saldo Restante: RD$
                  {selectedDebtForPay.remainingAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </Text>
              </View>
            )}

            <Text style={styles.inputLabel}>Monto a Abonar (RD$)</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="0.00"
              placeholderTextColor="#94a3b8"
              keyboardType="numeric"
              value={payAmount}
              onChangeText={setPayAmount}
            />

            {/* Accesos rápidos de monto */}
            {selectedDebtForPay && (
              <View style={styles.quickAmountRow}>
                <TouchableOpacity
                  style={styles.quickAmountPill}
                  onPress={() => setPayAmount('1000')}
                >
                  <Text style={styles.quickAmountText}>RD$1k</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.quickAmountPill}
                  onPress={() => setPayAmount('5000')}
                >
                  <Text style={styles.quickAmountText}>RD$5k</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.quickAmountPill}
                  onPress={() => setPayAmount(selectedDebtForPay.remainingAmount.toString())}
                >
                  <Text style={styles.quickAmountText}>Liquidación Total</Text>
                </TouchableOpacity>
              </View>
            )}

            <Text style={styles.inputLabel}>Deducir de Cuenta</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.accountChipsScroll}>
              <View style={styles.accountChipsRow}>
                {accounts.map((acc) => {
                  const isSelected = payAccountId === acc.id;
                  return (
                    <TouchableOpacity
                      key={acc.id}
                      style={[styles.accountChip, isSelected && styles.accountChipSelected]}
                      onPress={() => setPayAccountId(acc.id)}
                    >
                      <Text style={[styles.accountChipName, isSelected && styles.accountChipTextActive]}>
                        {acc.name}
                      </Text>
                      <Text style={[styles.accountChipBalance, isSelected && styles.accountChipTextActive]}>
                        RD${acc.balance.toLocaleString()}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowPayDebtModal(false)}
                disabled={isSubmittingPay}
              >
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: '#10b981' }]}
                onPress={handleExecuteDebtPayment}
                disabled={isSubmittingPay}
              >
                {isSubmittingPay ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.saveBtnText}>Confirmar Abono</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 3. MODAL NUEVA SUSCRIPCIÓN */}
      <Modal visible={showSubModal} transparent animationType="slide">
        <View style={styles.modalBg}>
          <ScrollView contentContainerStyle={styles.modalScroll}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Nueva Suscripción / Servicio</Text>
              <Text style={styles.modalSub}>Configura cobros periódicos y débito automático</Text>

              <Text style={styles.inputLabel}>Nombre del Servicio</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="ej. Netflix, Spotify, Internet Fibra"
                placeholderTextColor="#94a3b8"
                value={sName}
                onChangeText={setSName}
              />

              <Text style={styles.inputLabel}>Costo Mensual (RD$)</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="0.00"
                placeholderTextColor="#94a3b8"
                keyboardType="numeric"
                value={sCost}
                onChangeText={setSCost}
              />

              {/* Switch Débito Automático */}
              <TouchableOpacity
                style={styles.autoDeductToggle}
                onPress={() => {
                  const nextVal = !sAutoDeduct;
                  setSAutoDeduct(nextVal);
                  if (nextVal && !sAccountId && accounts.length > 0) {
                    setSAccountId(accounts[0].id);
                  }
                }}
              >
                <View style={[styles.toggleCheckbox, sAutoDeduct && styles.toggleCheckboxChecked]}>
                  {sAutoDeduct && <Text style={{ color: '#ffffff', fontSize: 12, fontWeight: 'bold' }}>✓</Text>}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.toggleTitle}>Deducción Automática desde Cuenta</Text>
                  <Text style={styles.toggleSub}>
                    Debitará el costo automáticamente en la fecha fijada si hay fondos suficientes.
                  </Text>
                </View>
              </TouchableOpacity>

              {sAutoDeduct && (
                <View style={{ marginTop: 12 }}>
                  <Text style={styles.inputLabel}>Cuenta a Debitar</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.accountChipsScroll}>
                    <View style={styles.accountChipsRow}>
                      {accounts.map((acc) => {
                        const isSelected = sAccountId === acc.id;
                        return (
                          <TouchableOpacity
                            key={acc.id}
                            style={[styles.accountChip, isSelected && styles.accountChipSelected]}
                            onPress={() => setSAccountId(acc.id)}
                          >
                            <Text style={[styles.accountChipName, isSelected && styles.accountChipTextActive]}>
                              {acc.name}
                            </Text>
                            <Text style={[styles.accountChipBalance, isSelected && styles.accountChipTextActive]}>
                              RD${acc.balance.toLocaleString()}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </ScrollView>
                </View>
              )}

              <Text style={[styles.inputLabel, { marginTop: 12 }]}>Próxima Fecha de Cobro</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#94a3b8"
                value={sNextDate}
                onChangeText={setSNextDate}
              />

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setShowSubModal(false)}
                  disabled={isSubmittingSub}
                >
                  <Text style={styles.cancelBtnText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.saveBtn}
                  onPress={handleCreateSub}
                  disabled={isSubmittingSub}
                >
                  {isSubmittingSub ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Text style={styles.saveBtnText}>Guardar</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* 4. MODAL EDITAR SUSCRIPCIÓN */}
      <Modal visible={showEditSubModal} transparent animationType="slide">
        <View style={styles.modalBg}>
          <ScrollView contentContainerStyle={styles.modalScroll}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Editar Suscripción</Text>

              <Text style={styles.inputLabel}>Nombre del Servicio</Text>
              <TextInput
                style={styles.modalInput}
                value={editSubName}
                onChangeText={setEditSubName}
                placeholderTextColor="#94a3b8"
              />

              <Text style={styles.inputLabel}>Costo (RD$)</Text>
              <TextInput
                style={styles.modalInput}
                value={editSubCost}
                onChangeText={setEditSubCost}
                keyboardType="numeric"
                placeholderTextColor="#94a3b8"
              />

              {/* Switch Débito Automático */}
              <TouchableOpacity
                style={styles.autoDeductToggle}
                onPress={() => {
                  const nextVal = !editAutoDeduct;
                  setEditAutoDeduct(nextVal);
                  if (nextVal && !editAccountId && accounts.length > 0) {
                    setEditAccountId(accounts[0].id);
                  }
                }}
              >
                <View style={[styles.toggleCheckbox, editAutoDeduct && styles.toggleCheckboxChecked]}>
                  {editAutoDeduct && <Text style={{ color: '#ffffff', fontSize: 12, fontWeight: 'bold' }}>✓</Text>}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.toggleTitle}>Deducción Automática desde Cuenta</Text>
                  <Text style={styles.toggleSub}>Debitará el costo automáticamente cuando corresponda.</Text>
                </View>
              </TouchableOpacity>

              {editAutoDeduct && (
                <View style={{ marginTop: 12 }}>
                  <Text style={styles.inputLabel}>Cuenta a Debitar</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.accountChipsScroll}>
                    <View style={styles.accountChipsRow}>
                      {accounts.map((acc) => {
                        const isSelected = editAccountId === acc.id;
                        return (
                          <TouchableOpacity
                            key={acc.id}
                            style={[styles.accountChip, isSelected && styles.accountChipSelected]}
                            onPress={() => setEditAccountId(acc.id)}
                          >
                            <Text style={[styles.accountChipName, isSelected && styles.accountChipTextActive]}>
                              {acc.name}
                            </Text>
                            <Text style={[styles.accountChipBalance, isSelected && styles.accountChipTextActive]}>
                              RD${acc.balance.toLocaleString()}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </ScrollView>
                </View>
              )}

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowEditSubModal(false)}>
                  <Text style={styles.cancelBtnText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveBtn} onPress={handleSaveEditSub}>
                  <Text style={styles.saveBtnText}>Guardar Cambios</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* 5. MODAL RECORDATORIO */}
      <Modal visible={showReminderModal} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Programar Recordatorio</Text>
            <Text style={styles.inputLabel}>Título del Recordatorio</Text>
            <TextInput
              style={styles.modalInput}
              value={remTitle}
              onChangeText={setRemTitle}
              placeholder="Título"
              placeholderTextColor="#94a3b8"
            />

            <Text style={styles.inputLabel}>Monto (RD$)</Text>
            <TextInput
              style={styles.modalInput}
              value={remAmount}
              onChangeText={setRemAmount}
              placeholder="0.00"
              keyboardType="numeric"
              placeholderTextColor="#94a3b8"
            />

            <Text style={styles.inputLabel}>Fecha Límite</Text>
            <TextInput
              style={styles.modalInput}
              value={remDueDate}
              onChangeText={setRemDueDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#94a3b8"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowReminderModal(false)}
                disabled={isSubmittingRem}
              >
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleCreateReminder}
                disabled={isSubmittingRem}
              >
                {isSubmittingRem ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.saveBtnText}>Guardar Recordatorio</Text>
                )}
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
  centered: { justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#94a3b8', marginTop: 12, fontSize: 13 },
  contentContainer: { padding: 16, paddingTop: 48, paddingBottom: 60 },
  headerRow: { marginBottom: 16 },
  screenTitle: { fontSize: 22, fontWeight: 'bold', color: '#ffffff' },
  screenSub: { fontSize: 12, color: '#94a3b8', marginTop: 2 },

  /* BANNER SALUD Y MITIGACIÓN */
  healthBanner: {
    backgroundColor: '#101a36',
    borderRadius: 18,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#1e2b4d',
  },
  healthBannerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  healthBannerTitle: { fontSize: 15, fontWeight: 'bold', color: '#ffffff' },
  healthProgressBadge: {
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.3)',
  },
  healthProgressText: { color: '#34d399', fontSize: 11, fontWeight: 'bold' },
  healthStatsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  healthStatCol: { flex: 1 },
  healthStatLabel: { fontSize: 10, color: '#94a3b8', marginBottom: 2 },
  healthStatValue: { fontSize: 14, fontWeight: 'bold', color: '#ffffff' },
  progressBarTrack: { height: 8, backgroundColor: '#1e293b', borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#34d399', borderRadius: 4 },
  healthBannerFooter: { fontSize: 11, color: '#94a3b8', marginTop: 8, fontStyle: 'italic' },

  /* SECCIONES */
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  sectionHeader: { fontSize: 16, fontWeight: 'bold', color: '#ffffff' },
  subTotalText: { fontSize: 11, color: '#c084fc', fontWeight: 'bold', marginTop: 2 },
  addSmallBtn: { backgroundColor: '#a855f7', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  addSmallBtnText: { color: '#ffffff', fontSize: 11, fontWeight: 'bold' },

  /* CARDS DEUDAS */
  debtCard: {
    backgroundColor: '#101a36',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#1e2b4d',
  },
  debtCardDone: { borderColor: 'rgba(52, 211, 153, 0.4)', backgroundColor: 'rgba(16, 26, 54, 0.6)' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardTitle: { fontSize: 15, fontWeight: 'bold', color: '#ffffff' },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  stratBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, borderWidth: 1 },
  stratText: { fontSize: 10, fontWeight: 'bold' },
  rateBadge: { backgroundColor: 'rgba(251, 113, 133, 0.15)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  rateText: { color: '#fb7185', fontSize: 10, fontWeight: 'bold' },
  deleteIconBtn: { padding: 4 },

  debtAmountsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 12,
  },
  debtLabel: { fontSize: 10, color: '#94a3b8' },
  debtAmount: { fontSize: 20, fontWeight: '900', color: '#fb7185', marginTop: 2 },
  debtInitialAmount: { fontSize: 13, color: '#94a3b8', fontWeight: '600' },

  debtProgressSection: { marginTop: 10 },
  progressBarTrackSmall: { height: 6, backgroundColor: '#1e293b', borderRadius: 3, overflow: 'hidden' },
  progressBarFillSmall: { height: '100%', borderRadius: 3 },
  debtProgressCaptionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  debtProgressCaption: { fontSize: 10, color: '#94a3b8' },
  debtDoneBadge: { fontSize: 10, color: '#34d399', fontWeight: 'bold' },

  targetBox: {
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    padding: 8,
    borderRadius: 8,
    marginTop: 10,
  },
  targetBoxText: { fontSize: 11, color: '#cbd5e1' },
  targetBoxSub: { fontSize: 10, color: '#a855f7', marginTop: 2, fontWeight: '600' },

  cardActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#1e2b4d',
  },
  payActionBtn: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  payActionBtnText: { color: '#34d399', fontSize: 11, fontWeight: 'bold' },
  paidOffPill: {
    backgroundColor: 'rgba(52, 211, 153, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  paidOffPillText: { color: '#34d399', fontSize: 11, fontWeight: '600' },
  reminderBtn: {
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.3)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  reminderBtnText: { color: '#c084fc', fontSize: 11, fontWeight: 'bold' },

  /* CARDS SUSCRIPCIONES */
  subsGrid: { gap: 12 },
  subCard: {
    backgroundColor: '#101a36',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1e2b4d',
  },
  subCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  subName: { fontSize: 14, fontWeight: 'bold', color: '#ffffff' },
  subBadgeRow: { marginTop: 4 },
  autoDeductBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  autoDeductBadgeText: { color: '#34d399', fontSize: 10, fontWeight: 'bold' },
  manualDeductBadge: {
    backgroundColor: 'rgba(148, 163, 184, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  manualDeductBadgeText: { color: '#94a3b8', fontSize: 10 },
  subCost: { fontSize: 15, fontWeight: 'bold', color: '#c084fc' },
  subCycleText: { fontSize: 10, color: '#64748b' },

  insufficientAlert: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
    borderRadius: 8,
    padding: 6,
    marginTop: 8,
  },
  insufficientAlertText: { color: '#fbbf24', fontSize: 10, fontWeight: '600' },

  subCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#1e2b4d',
  },
  subDate: { fontSize: 10, color: '#94a3b8' },
  subActionsGroup: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  deductNowBtn: {
    backgroundColor: 'rgba(168, 85, 247, 0.2)',
    borderWidth: 1,
    borderColor: '#a855f7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  deductNowBtnText: { color: '#c084fc', fontSize: 10, fontWeight: 'bold' },
  iconCircleBtn: { padding: 4 },

  /* EMPTY STATES */
  emptyCard: {
    backgroundColor: '#101a36',
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1e2b4d',
    marginBottom: 12,
  },
  emptyCardIcon: { fontSize: 32, marginBottom: 8 },
  emptyCardTitle: { color: '#ffffff', fontSize: 14, fontWeight: 'bold' },
  emptyCardSub: { color: '#94a3b8', fontSize: 11, textAlign: 'center', marginTop: 4 },

  /* MODALES */
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 16 },
  modalScroll: { flexGrow: 1, justifyContent: 'center' },
  modalContent: {
    backgroundColor: '#0f172a',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#a855f7',
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#ffffff' },
  modalSub: { fontSize: 11, color: '#94a3b8', marginBottom: 14, marginTop: 2 },
  inputLabel: { fontSize: 11, color: '#cbd5e1', marginBottom: 4, fontWeight: '600' },
  modalInput: {
    backgroundColor: '#1e293b',
    borderRadius: 10,
    padding: 12,
    color: '#ffffff',
    fontSize: 13,
    marginBottom: 12,
  },
  strategyPickerRow: { flexDirection: 'row', gap: 6, marginBottom: 12 },
  strategyChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  strategyChipActive: { backgroundColor: '#a855f7', borderColor: '#c084fc' },
  strategyChipText: { fontSize: 10, color: '#94a3b8', fontWeight: 'bold' },
  strategyChipTextActive: { color: '#ffffff' },

  debtSummaryBox: {
    backgroundColor: '#1e293b',
    padding: 10,
    borderRadius: 10,
    marginBottom: 12,
  },
  debtSummaryTitle: { color: '#ffffff', fontSize: 13, fontWeight: 'bold' },
  debtSummaryBalance: { color: '#fb7185', fontSize: 11, marginTop: 2 },

  quickAmountRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  quickAmountPill: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#334155',
  },
  quickAmountText: { color: '#c084fc', fontSize: 10, fontWeight: 'bold' },

  accountChipsScroll: { marginBottom: 12 },
  accountChipsRow: { flexDirection: 'row', gap: 8 },
  accountChip: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  accountChipSelected: { borderColor: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.15)' },
  accountChipName: { color: '#cbd5e1', fontSize: 11, fontWeight: 'bold' },
  accountChipBalance: { color: '#94a3b8', fontSize: 10, marginTop: 2 },
  accountChipTextActive: { color: '#34d399' },

  autoDeductToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#1e293b',
    padding: 12,
    borderRadius: 10,
    marginVertical: 6,
  },
  toggleCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#64748b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleCheckboxChecked: { backgroundColor: '#10b981', borderColor: '#10b981' },
  toggleTitle: { color: '#ffffff', fontSize: 12, fontWeight: 'bold' },
  toggleSub: { color: '#94a3b8', fontSize: 10, marginTop: 2 },

  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 14 },
  cancelBtn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, backgroundColor: '#334155' },
  cancelBtnText: { color: '#cbd5e1', fontSize: 12, fontWeight: 'bold' },
  saveBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#a855f7',
    minWidth: 90,
    alignItems: 'center',
  },
  saveBtnText: { color: '#ffffff', fontSize: 12, fontWeight: 'bold' },
});
