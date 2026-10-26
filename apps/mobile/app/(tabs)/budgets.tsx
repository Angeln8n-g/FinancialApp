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

interface BudgetItem {
  id: string;
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  limitAmount: number;
  spentAmount: number;
  remainingAmount: number;
  isOverbudget: boolean;
  percentage: number;
  dailyRemaining: number;
  daysRemaining: number;
  committedRecurringAmount?: number;
  recurringSubscriptionsCount?: number;
}

interface GoalItem {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  percentage: number;
  suggested: number;
  targetDate: string;
  isCompleted?: boolean;
}

interface CategoryItem {
  id: string;
  name: string;
  icon?: string;
  color?: string;
}

interface AccountItem {
  id: string;
  name: string;
  type: string;
  balance: number;
}

export default function MobileBudgetsScreen() {
  const [budgets, setBudgets] = useState<BudgetItem[]>([]);
  const [goals, setGoals] = useState<GoalItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [accounts, setAccounts] = useState<AccountItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modales
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showContributeModal, setShowContributeModal] = useState(false);

  // Formulario Presupuesto
  const [selectedCatId, setSelectedCatId] = useState('');
  const [limitInput, setLimitInput] = useState('');
  const [isSubmittingBudget, setIsSubmittingBudget] = useState(false);

  // Formulario Meta
  const [goalName, setGoalName] = useState('');
  const [goalTarget, setGoalTarget] = useState('');
  const [goalInitial, setGoalInitial] = useState('');
  const [goalDate, setGoalDate] = useState('');
  const [isSubmittingGoal, setIsSubmittingGoal] = useState(false);

  // Formulario Aportar a Meta
  const [selectedGoal, setSelectedGoal] = useState<GoalItem | null>(null);
  const [contribAmount, setContribAmount] = useState('');
  const [contribAccountId, setContribAccountId] = useState('');
  const [contribNotes, setContribNotes] = useState('');
  const [isSubmittingContrib, setIsSubmittingContrib] = useState(false);

  const fmt = (n: any) => {
    const val = Number(n);
    return isNaN(val) ? '0' : val.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  };

  const loadData = useCallback(async () => {
    try {
      const [resB, resG, resC, resA] = await Promise.all([
        fetchWithAuth('/api/budgets/progress'),
        fetchWithAuth('/api/goals'),
        fetchWithAuth('/api/categories'),
        fetchWithAuth('/api/accounts'),
      ]);

      if (resB.ok) {
        const bData = await resB.json();
        if (Array.isArray(bData)) {
          setBudgets(
            bData.map((item: any) => {
              const spent = Number(item.spentAmount || 0);
              const limit = Number(item.limitAmount || 0);
              const percentage =
                item.percentage !== undefined
                  ? Number(item.percentage)
                  : limit > 0
                  ? Math.round((spent / limit) * 100)
                  : 0;

              return {
                id: item.id || item.categoryId,
                categoryId: item.categoryId,
                categoryName: item.categoryName || item.category?.name || 'Categoría',
                categoryIcon: item.categoryIcon || item.category?.icon || '📊',
                categoryColor: item.categoryColor || item.category?.color || '#a855f7',
                limitAmount: limit,
                spentAmount: spent,
                remainingAmount: item.remainingAmount !== undefined ? Number(item.remainingAmount) : limit - spent,
                isOverbudget: item.isOverbudget !== undefined ? !!item.isOverbudget : spent > limit,
                percentage,
                dailyRemaining: Number(item.dailyRemaining || 0),
                daysRemaining: Number(item.daysRemaining || 1),
                committedRecurringAmount: Number(item.committedRecurringAmount || 0),
                recurringSubscriptionsCount: Number(item.recurringSubscriptionsCount || 0),
              };
            })
          );
        }
      }

      if (resG.ok) {
        const gData = await resG.json();
        if (Array.isArray(gData)) {
          setGoals(
            gData.map((item: any) => {
              const target = Number(item.targetAmount || item.target || 0);
              const current = Number(item.currentAmount || item.current || 0);
              const remaining = Math.max(0, target - current);
              const pct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
              return {
                id: item.id,
                name: item.name || 'Meta Familiar',
                targetAmount: target,
                currentAmount: current,
                percentage: pct,
                suggested: Math.round(remaining / 6),
                targetDate: item.targetDate ? item.targetDate.split('T')[0] : '2026-12-31',
                isCompleted: current >= target,
              };
            })
          );
        }
      }

      if (resC.ok) {
        const cData = await resC.json();
        if (Array.isArray(cData)) {
          setCategories(cData);
          if (cData.length > 0 && !selectedCatId) {
            setSelectedCatId(cData[0].id);
          }
        }
      }

      if (resA.ok) {
        const aData = await resA.json();
        if (Array.isArray(aData)) {
          setAccounts(aData);
          if (aData.length > 0 && !contribAccountId) {
            setContribAccountId(aData[0].id);
          }
        }
      }
    } catch (e) {
      console.log('Error cargando presupuestos y metas:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedCatId, contribAccountId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // Crear Presupuesto
  const handleCreateBudget = async () => {
    if (!selectedCatId || !limitInput || parseFloat(limitInput) <= 0) {
      Alert.alert('Datos requeridos', 'Selecciona una categoría y define un límite mayor a RD$0.');
      return;
    }

    try {
      setIsSubmittingBudget(true);
      const res = await fetchWithAuth('/api/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryId: selectedCatId,
          limitAmount: parseFloat(limitInput),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Error al guardar presupuesto');
      }

      setShowBudgetModal(false);
      setLimitInput('');
      Alert.alert('¡Éxito!', 'Presupuesto creado con éxito.');
      loadData();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'No se pudo guardar el presupuesto.');
    } finally {
      setIsSubmittingBudget(false);
    }
  };

  const handleDeleteBudget = (id: string, name: string) => {
    Alert.alert('Eliminar Presupuesto', `¿Deseas eliminar el presupuesto para "${name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            const res = await fetchWithAuth(`/api/budgets/${id}`, { method: 'DELETE' });
            if (res.ok) {
              Alert.alert('Eliminado', 'Presupuesto eliminado con éxito.');
              loadData();
            } else {
              Alert.alert('Error', 'No se pudo eliminar el presupuesto.');
            }
          } catch (e) {
            Alert.alert('Error', 'Error de conexión.');
          }
        },
      },
    ]);
  };

  // Crear Meta
  const handleCreateGoal = async () => {
    if (!goalName.trim() || !goalTarget || parseFloat(goalTarget) <= 0) {
      Alert.alert('Datos requeridos', 'Ingresa el nombre de la meta y el monto objetivo.');
      return;
    }

    try {
      setIsSubmittingGoal(true);
      const res = await fetchWithAuth('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: goalName.trim(),
          targetAmount: parseFloat(goalTarget),
          currentAmount: goalInitial ? parseFloat(goalInitial) : 0,
          targetDate: goalDate ? new Date(goalDate).toISOString() : undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Error al guardar meta');
      }

      setShowGoalModal(false);
      setGoalName('');
      setGoalTarget('');
      setGoalInitial('');
      setGoalDate('');
      Alert.alert('¡Éxito!', 'Meta de ahorro familiar registrada.');
      loadData();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'No se pudo registrar la meta.');
    } finally {
      setIsSubmittingGoal(false);
    }
  };

  const handleDeleteGoal = (id: string, name: string) => {
    Alert.alert('Eliminar Meta', `¿Deseas eliminar la meta "${name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            const res = await fetchWithAuth(`/api/goals/${id}`, { method: 'DELETE' });
            if (res.ok) {
              Alert.alert('Eliminada', 'Meta eliminada con éxito.');
              loadData();
            } else {
              Alert.alert('Error', 'No se pudo eliminar la meta.');
            }
          } catch (e) {
            Alert.alert('Error', 'Error de conexión.');
          }
        },
      },
    ]);
  };

  // Aportar a Meta
  const handleOpenContributeModal = (goal: GoalItem) => {
    setSelectedGoal(goal);
    setContribAmount('');
    setContribAccountId(accounts.length > 0 ? accounts[0].id : '');
    setContribNotes('');
    setShowContributeModal(true);
  };

  const handleExecuteContribution = async () => {
    if (!selectedGoal) return;
    const amountNum = parseFloat(contribAmount);
    if (!amountNum || amountNum <= 0) {
      Alert.alert('Monto Inválido', 'Ingresa una cantidad mayor a RD$0 para aportar.');
      return;
    }

    const selectedAcc = accounts.find((a) => a.id === contribAccountId);
    if (selectedAcc && selectedAcc.balance < amountNum) {
      Alert.alert(
        'Saldo Insuficiente',
        `La cuenta "${selectedAcc.name}" tiene RD$${selectedAcc.balance.toLocaleString()}. No cuenta con saldo suficiente para aportar RD$${amountNum.toLocaleString()}.`
      );
      return;
    }

    try {
      setIsSubmittingContrib(true);
      const res = await fetchWithAuth(`/api/goals/${selectedGoal.id}/contribute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amountNum,
          accountId: contribAccountId || undefined,
          notes: contribNotes.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Error al procesar aporte');
      }

      setShowContributeModal(false);
      Alert.alert('¡Aporte Exitoso!', `Se aportaron RD$${amountNum.toLocaleString()} a "${selectedGoal.name}".`);
      loadData();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'No se pudo registrar el aporte.');
    } finally {
      setIsSubmittingContrib(false);
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#a855f7" />
        <Text style={styles.loadingText}>Cargando presupuestos y metas...</Text>
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
          <Text style={styles.screenTitle}>Presupuestos & Metas</Text>
          <Text style={styles.screenSub}>Límites sin tope artificial y aportes a metas familiares</Text>
        </View>
        <View style={styles.headerBtnsRow}>
          <TouchableOpacity style={styles.addButton} onPress={() => setShowBudgetModal(true)}>
            <Text style={styles.addButtonText}>+ Presupuesto</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 📊 SECCIÓN PRESUPUESTOS MENSUALES */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionHeader}>Presupuestos Mensuales ({budgets.length})</Text>
      </View>

      {budgets.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyCardIcon}>📊</Text>
          <Text style={styles.emptyCardTitle}>Sin Presupuestos Activos</Text>
          <Text style={styles.emptyCardSub}>Crea un presupuesto por categoría para vigilar tus gastos mensuales.</Text>
        </View>
      ) : (
        budgets.map((b) => {
          const isOver = b.isOverbudget || b.percentage > 100;
          const isNear = !isOver && b.percentage >= 80;
          const fillWidth = Math.min(100, Math.max(4, b.percentage));

          let badgeColor = '#34d399';
          let badgeBg = 'rgba(52, 211, 153, 0.15)';
          let barColor = '#10b981';

          if (isOver) {
            badgeColor = '#fb7185';
            badgeBg = 'rgba(251, 113, 133, 0.2)';
            barColor = '#ef4444';
          } else if (isNear) {
            badgeColor = '#fbbf24';
            badgeBg = 'rgba(245, 158, 11, 0.2)';
            barColor = '#f59e0b';
          }

          return (
            <View key={b.id} style={[styles.card, isOver && styles.cardOverbudget]}>
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                  <Text style={styles.cardIcon}>{b.categoryIcon}</Text>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={styles.cardTitle}>{b.categoryName}</Text>
                    <Text style={styles.cardSub}>
                      Consumido: RD${fmt(b.spentAmount)} de RD${fmt(b.limitAmount)}
                    </Text>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={[styles.percentBadge, { backgroundColor: badgeBg }]}>
                    <Text style={[styles.percentText, { color: badgeColor }]}>
                      {isOver ? `⚠️ ${b.percentage}%` : `${b.percentage}%`}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => handleDeleteBudget(b.id, b.categoryName)} style={{ padding: 2 }}>
                    <Text style={{ fontSize: 13 }}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Progress Bar (Color dinámico y sin recorte de porcentaje de aviso) */}
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${fillWidth}%`, backgroundColor: barColor }]} />
              </View>

              {/* Feedback de disponibilidad o sobregiro */}
              <View style={styles.budgetFooterRow}>
                {isOver ? (
                  <Text style={styles.overbudgetWarningText}>
                    🚨 Excedido por RD${fmt(Math.abs(b.remainingAmount))}
                  </Text>
                ) : (
                  <Text style={styles.budgetAvailableText}>
                    Disponible: RD${fmt(b.remainingAmount)} ({b.daysRemaining} días restantes)
                  </Text>
                )}
                {!isOver && b.dailyRemaining > 0 && (
                  <Text style={styles.dailyRemainingText}>~RD${fmt(b.dailyRemaining)}/día</Text>
                )}
              </View>

              {/* Suscripciones fijas comprometidas en esta categoría */}
              {Number(b.committedRecurringAmount || 0) > 0 && (
                <View style={styles.recurringBox}>
                  <Text style={styles.recurringBoxText}>
                    🔄 Compromiso fijo: RD${fmt(b.committedRecurringAmount)}/mes ({b.recurringSubscriptionsCount || 0} serv.)
                  </Text>
                </View>
              )}
            </View>
          );
        })
      )}

      {/* 🎯 SECCIÓN METAS DE AHORRO FAMILIARES */}
      <View style={[styles.sectionHeaderRow, { marginTop: 20 }]}>
        <Text style={styles.sectionHeader}>Metas de Ahorro ({goals.length})</Text>
        <TouchableOpacity style={styles.addSmallGoalBtn} onPress={() => setShowGoalModal(true)}>
          <Text style={styles.addSmallGoalBtnText}>+ Nueva Meta</Text>
        </TouchableOpacity>
      </View>

      {goals.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyCardIcon}>🎯</Text>
          <Text style={styles.emptyCardTitle}>Sin Metas Registradas</Text>
          <Text style={styles.emptyCardSub}>Define metas familiares de ahorro (ej. Vacaciones, Fondo de Emergencia).</Text>
        </View>
      ) : (
        goals.map((g) => {
          const isDone = g.isCompleted || g.currentAmount >= g.targetAmount;
          const remaining = Math.max(0, g.targetAmount - g.currentAmount);

          return (
            <View key={g.id} style={[styles.card, styles.goalCard, isDone && styles.goalCardDone]}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.cardTitle}>{g.name}</Text>
                  <Text style={styles.goalTargetDateText}>Meta para: {g.targetDate}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={[styles.goalBadgePill, isDone && styles.goalBadgeDone]}>
                    <Text style={[styles.goalBadgeText, isDone && { color: '#34d399' }]}>
                      {isDone ? '🎉 100%' : `${g.percentage}%`}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => handleDeleteGoal(g.id, g.name)} style={{ padding: 2 }}>
                    <Text style={{ fontSize: 13 }}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <Text style={styles.goalCurrent}>
                RD${fmt(g.currentAmount)}{' '}
                <Text style={styles.goalTarget}>/ RD${fmt(g.targetAmount)}</Text>
              </Text>

              {/* Progress Bar */}
              <View style={styles.progressBarBg}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${Math.min(100, Math.max(4, g.percentage))}%`,
                      backgroundColor: isDone ? '#34d399' : '#a855f7',
                    },
                  ]}
                />
              </View>

              <View style={styles.goalFooter}>
                <Text style={styles.goalFooterText}>
                  {isDone ? '¡Meta completada con éxito!' : `Faltan RD$${fmt(remaining)}`}
                </Text>
                {!isDone && <Text style={styles.goalSuggested}>Sugerido: RD${fmt(g.suggested)}/mes</Text>}
              </View>

              {/* Botón Aportar Fondos */}
              <View style={styles.goalActionRow}>
                <TouchableOpacity
                  style={[styles.contributeBtn, isDone && styles.contributeBtnDisabled]}
                  onPress={() => handleOpenContributeModal(g)}
                >
                  <Text style={styles.contributeBtnText}>+ Aportar a Meta</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })
      )}

      {/* ================= MODALES ================= */}

      {/* 1. MODAL CREAR PRESUPUESTO */}
      <Modal visible={showBudgetModal} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Crear Presupuesto</Text>
            <Text style={styles.modalSub}>Asigna un límite mensual a una categoría</Text>

            <Text style={styles.inputLabel}>Seleccionar Categoría</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catChipsScroll}>
              <View style={styles.catChipsRow}>
                {categories.map((cat) => {
                  const isSelected = selectedCatId === cat.id;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      style={[styles.catChip, isSelected && styles.catChipActive]}
                      onPress={() => setSelectedCatId(cat.id)}
                    >
                      <Text style={styles.catChipIcon}>{cat.icon || '📌'}</Text>
                      <Text style={[styles.catChipName, isSelected && styles.catChipNameActive]}>
                        {cat.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            <Text style={styles.inputLabel}>Límite Mensual (RD$)</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="0.00"
              placeholderTextColor="#94a3b8"
              keyboardType="numeric"
              value={limitInput}
              onChangeText={setLimitInput}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowBudgetModal(false)}
                disabled={isSubmittingBudget}
              >
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleCreateBudget}
                disabled={isSubmittingBudget}
              >
                {isSubmittingBudget ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.saveBtnText}>Guardar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 2. MODAL CREAR META */}
      <Modal visible={showGoalModal} transparent animationType="slide">
        <View style={styles.modalBg}>
          <ScrollView contentContainerStyle={styles.modalScroll}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Nueva Meta de Ahorro</Text>
              <Text style={styles.modalSub}>Planifica un objetivo para tu familia</Text>

              <Text style={styles.inputLabel}>Nombre de la Meta</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="ej. Vacaciones Familiares, Fondo Emergencia"
                placeholderTextColor="#94a3b8"
                value={goalName}
                onChangeText={setGoalName}
              />

              <Text style={styles.inputLabel}>Monto Objetivo (RD$)</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="0.00"
                placeholderTextColor="#94a3b8"
                keyboardType="numeric"
                value={goalTarget}
                onChangeText={setGoalTarget}
              />

              <Text style={styles.inputLabel}>Monto Inicial Ahorrado (RD$ Opcional)</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="0.00"
                placeholderTextColor="#94a3b8"
                keyboardType="numeric"
                value={goalInitial}
                onChangeText={setGoalInitial}
              />

              <Text style={styles.inputLabel}>Fecha Límite Deseada</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#94a3b8"
                value={goalDate}
                onChangeText={setGoalDate}
              />

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setShowGoalModal(false)}
                  disabled={isSubmittingGoal}
                >
                  <Text style={styles.cancelBtnText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.saveBtn}
                  onPress={handleCreateGoal}
                  disabled={isSubmittingGoal}
                >
                  {isSubmittingGoal ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Text style={styles.saveBtnText}>Guardar Meta</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* 3. MODAL APORTAR A META */}
      <Modal visible={showContributeModal} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Aportar a Meta</Text>
            {selectedGoal && (
              <View style={styles.goalSummaryBox}>
                <Text style={styles.goalSummaryName}>{selectedGoal.name}</Text>
                <Text style={styles.goalSummaryNumbers}>
                  Acumulado: RD${fmt(selectedGoal.currentAmount)} / RD${fmt(selectedGoal.targetAmount)}
                </Text>
              </View>
            )}

            <Text style={styles.inputLabel}>Monto a Aportar (RD$)</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="0.00"
              placeholderTextColor="#94a3b8"
              keyboardType="numeric"
              value={contribAmount}
              onChangeText={setContribAmount}
            />

            {/* Accesos rápidos de monto */}
            <View style={styles.quickAmountRow}>
              <TouchableOpacity style={styles.quickPill} onPress={() => setContribAmount('1000')}>
                <Text style={styles.quickPillText}>RD$1k</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickPill} onPress={() => setContribAmount('5000')}>
                <Text style={styles.quickPillText}>RD$5k</Text>
              </TouchableOpacity>
              {selectedGoal && selectedGoal.targetAmount > selectedGoal.currentAmount && (
                <TouchableOpacity
                  style={styles.quickPill}
                  onPress={() => setContribAmount((selectedGoal.targetAmount - selectedGoal.currentAmount).toString())}
                >
                  <Text style={styles.quickPillText}>Completar Meta</Text>
                </TouchableOpacity>
              )}
            </View>

            <Text style={styles.inputLabel}>Deducir de Cuenta</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.accChipsScroll}>
              <View style={styles.accChipsRow}>
                {accounts.map((acc) => {
                  const isSelected = contribAccountId === acc.id;
                  return (
                    <TouchableOpacity
                      key={acc.id}
                      style={[styles.accChip, isSelected && styles.accChipSelected]}
                      onPress={() => setContribAccountId(acc.id)}
                    >
                      <Text style={[styles.accChipName, isSelected && styles.accChipTextActive]}>
                        {acc.name}
                      </Text>
                      <Text style={[styles.accChipBalance, isSelected && styles.accChipTextActive]}>
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
                onPress={() => setShowContributeModal(false)}
                disabled={isSubmittingContrib}
              >
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: '#10b981' }]}
                onPress={handleExecuteContribution}
                disabled={isSubmittingContrib}
              >
                {isSubmittingContrib ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.saveBtnText}>Confirmar Aporte</Text>
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
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  headerBtnsRow: { flexDirection: 'row', gap: 8 },
  screenTitle: { fontSize: 22, fontWeight: 'bold', color: '#ffffff' },
  screenSub: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  addButton: { backgroundColor: '#a855f7', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  addButtonText: { color: '#ffffff', fontSize: 11, fontWeight: 'bold' },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionHeader: { fontSize: 16, fontWeight: 'bold', color: '#ffffff' },
  addSmallGoalBtn: { backgroundColor: '#3b82f6', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  addSmallGoalBtnText: { color: '#ffffff', fontSize: 11, fontWeight: 'bold' },

  /* CARDS */
  card: {
    backgroundColor: '#101a36',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#1e2b4d',
  },
  cardOverbudget: {
    borderColor: 'rgba(239, 68, 68, 0.4)',
    backgroundColor: 'rgba(30, 20, 35, 0.7)',
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  cardHeaderLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  cardIcon: { fontSize: 22, marginRight: 10 },
  cardTitle: { fontSize: 14, fontWeight: 'bold', color: '#ffffff' },
  cardSub: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  percentBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  percentText: { fontSize: 11, fontWeight: 'bold' },
  progressBarBg: { backgroundColor: '#0f172a', height: 8, borderRadius: 4, overflow: 'hidden', marginTop: 8 },
  progressBarFill: { height: '100%', borderRadius: 4 },

  budgetFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  overbudgetWarningText: { color: '#fb7185', fontSize: 11, fontWeight: 'bold' },
  budgetAvailableText: { color: '#94a3b8', fontSize: 10 },
  dailyRemainingText: { color: '#34d399', fontSize: 10, fontWeight: 'bold' },
  recurringBox: {
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.25)',
  },
  recurringBoxText: { color: '#a5b4fc', fontSize: 10, fontWeight: '600' },

  /* METAS */
  goalCard: { borderColor: 'rgba(168, 85, 247, 0.3)' },
  goalCardDone: { borderColor: 'rgba(52, 211, 153, 0.4)' },
  goalTargetDateText: { fontSize: 10, color: '#94a3b8', marginTop: 2 },
  goalBadgePill: {
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  goalBadgeDone: { backgroundColor: 'rgba(52, 211, 153, 0.15)' },
  goalBadgeText: { color: '#c084fc', fontSize: 11, fontWeight: 'bold' },
  goalCurrent: { fontSize: 18, fontWeight: '900', color: '#ffffff', marginTop: 4 },
  goalTarget: { fontSize: 12, color: '#94a3b8', fontWeight: 'normal' },
  goalFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  goalFooterText: { fontSize: 10, color: '#94a3b8' },
  goalSuggested: { fontSize: 10, fontWeight: 'bold', color: '#c084fc' },
  goalActionRow: {
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#1e2b4d',
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  contributeBtn: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  contributeBtnDisabled: { opacity: 0.6 },
  contributeBtnText: { color: '#34d399', fontSize: 11, fontWeight: 'bold' },

  /* EMPTY */
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
  catChipsScroll: { marginBottom: 12 },
  catChipsRow: { flexDirection: 'row', gap: 8 },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1e293b',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  catChipActive: { backgroundColor: '#a855f7', borderColor: '#c084fc' },
  catChipIcon: { fontSize: 14 },
  catChipName: { color: '#cbd5e1', fontSize: 11 },
  catChipNameActive: { color: '#ffffff', fontWeight: 'bold' },

  goalSummaryBox: {
    backgroundColor: '#1e293b',
    padding: 10,
    borderRadius: 10,
    marginBottom: 12,
  },
  goalSummaryName: { color: '#ffffff', fontSize: 13, fontWeight: 'bold' },
  goalSummaryNumbers: { color: '#a855f7', fontSize: 11, marginTop: 2 },

  quickAmountRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  quickPill: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#334155',
  },
  quickPillText: { color: '#c084fc', fontSize: 10, fontWeight: 'bold' },

  accChipsScroll: { marginBottom: 14 },
  accChipsRow: { flexDirection: 'row', gap: 8 },
  accChip: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  accChipSelected: { borderColor: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.15)' },
  accChipName: { color: '#cbd5e1', fontSize: 11, fontWeight: 'bold' },
  accChipBalance: { color: '#94a3b8', fontSize: 10, marginTop: 2 },
  accChipTextActive: { color: '#34d399' },

  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 10 },
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
