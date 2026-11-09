import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Share,
  Alert,
  RefreshControl,
} from 'react-native';
import {
  BarChart3,
  Download,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Percent,
  ShieldCheck,
  AlertTriangle,
  Clock,
} from 'lucide-react-native';
import { fetchWithAuth } from '@/constants/Api';
import { FamilyMint } from '@/constants/Colors';

export default function MobileReportsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [summary, setSummary] = useState<any>(null);
  const [distribution, setDistribution] = useState<any>({ totalExpense: 0, categoriesDistribution: [] });
  const [cashflow, setCashflow] = useState<any>(null);
  const [exporting, setExporting] = useState(false);

  const loadData = async () => {
    try {
      const [resSum, resDist, resFlow] = await Promise.all([
        fetchWithAuth('/api/transactions/summary'),
        fetchWithAuth('/api/reports/expense-distribution'),
        fetchWithAuth('/api/reports/cashflow-projection?days=30'),
      ]);

      if (resSum.ok) {
        setSummary(await resSum.json());
      }
      if (resDist.ok) {
        setDistribution(await resDist.json());
      }
      if (resFlow.ok) {
        setCashflow(await resFlow.json());
      }
    } catch (e) {
      console.log('Error cargando reportes:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleExportCsv = async () => {
    setExporting(true);
    try {
      const res = await fetchWithAuth('/api/reports/export');
      if (res.ok) {
        const csvData = await res.text();
        await Share.share({
          title: 'Exportación Financiera HogarIQ',
          message: csvData,
        });
      } else {
        Alert.alert('Error', 'No se pudo generar la exportación en este momento.');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Error al exportar datos.');
    } finally {
      setExporting(false);
    }
  };

  const fmt = (n: any) => {
    const val = Number(n);
    return isNaN(val)
      ? '0.00'
      : val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const totalIncome = summary?.monthlyIncome || 0;
  const totalExpense = summary?.monthlyExpense || 0;
  const netSavings = totalIncome - totalExpense;
  const savingsRate =
    totalIncome > 0 ? Math.max(0, Math.round((netSavings / totalIncome) * 100)) : 0;

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
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.screenTitle}>Reportes Financieros</Text>
          <Text style={styles.screenSub}>Análisis de ingresos, gastos y ahorro</Text>
        </View>

        <TouchableOpacity
          style={styles.exportBtn}
          disabled={exporting}
          onPress={handleExportCsv}
        >
          {exporting ? (
            <ActivityIndicator size="small" color="#0A1128" />
          ) : (
            <>
              <Download size={15} color="#0A1128" />
              <Text style={styles.exportBtnText}>CSV</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={FamilyMint.primary} style={{ marginTop: 40 }} />
      ) : (
        <>
          {/* Tarjetas Resumen */}
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <View style={styles.statIconRow}>
                <Text style={styles.statLabel}>Ingresos del Mes</Text>
                <TrendingUp size={14} color={FamilyMint.income} />
              </View>
              <Text style={[styles.statValue, { color: FamilyMint.income }]}>
                +${fmt(totalIncome)}
              </Text>
            </View>

            <View style={styles.statCard}>
              <View style={styles.statIconRow}>
                <Text style={styles.statLabel}>Gastos del Mes</Text>
                <TrendingDown size={14} color={FamilyMint.expense} />
              </View>
              <Text style={[styles.statValue, { color: FamilyMint.expense }]}>
                -${fmt(totalExpense)}
              </Text>
            </View>

            <View style={styles.statCard}>
              <View style={styles.statIconRow}>
                <Text style={styles.statLabel}>Superávit Neto</Text>
                <PiggyBank size={14} color={netSavings >= 0 ? FamilyMint.primary : FamilyMint.expense} />
              </View>
              <Text
                style={[
                  styles.statValue,
                  { color: netSavings >= 0 ? FamilyMint.primary : FamilyMint.expense },
                ]}
              >
                {netSavings >= 0 ? '+' : ''}${fmt(netSavings)}
              </Text>
            </View>

            <View style={styles.statCard}>
              <View style={styles.statIconRow}>
                <Text style={styles.statLabel}>Tasa de Ahorro</Text>
                <Percent size={14} color={FamilyMint.accentSaving} />
              </View>
              <Text style={[styles.statValue, { color: FamilyMint.accentSaving }]}>
                {savingsRate}%
              </Text>
            </View>
          </View>

          {/* Eficiencia Presupuestaria */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Eficiencia Presupuestaria</Text>
            <Text style={styles.sectionSubText}>
              {netSavings >= 0
                ? 'Excelente balance: Los ingresos familiares cubren holgadamente los gastos.'
                : 'Atención: Los gastos familiares del mes han superado los ingresos registrados.'}
            </Text>
            <View style={styles.progressBg}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.min(
                      100,
                      totalIncome > 0 ? Math.round((totalExpense / totalIncome) * 100) : 100
                    )}%`,
                    backgroundColor:
                      totalExpense > totalIncome ? FamilyMint.expense : FamilyMint.primary,
                  },
                ]}
              />
            </View>
          </View>

          {/* Proyección de Flujo de Caja a 30 Días (Runway) */}
          {cashflow && (
            <View style={styles.sectionCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <TrendingUp size={16} color={FamilyMint.primary} />
                  <Text style={styles.sectionTitle}>Pista de Flujo (Runway a 30 Días)</Text>
                </View>
                <View
                  style={{
                    backgroundColor:
                      cashflow.alert === 'HEALTHY'
                        ? FamilyMint.incomeBg
                        : cashflow.alert === 'DEFICIT_RISK'
                        ? 'rgba(245, 158, 11, 0.15)'
                        : FamilyMint.expenseBg,
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    borderRadius: 6,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 10,
                      fontWeight: '700',
                      color:
                        cashflow.alert === 'HEALTHY'
                          ? FamilyMint.income
                          : cashflow.alert === 'DEFICIT_RISK'
                          ? FamilyMint.warning
                          : FamilyMint.expense,
                    }}
                  >
                    {cashflow.alert === 'HEALTHY' ? 'SALUDABLE' : cashflow.alert === 'DEFICIT_RISK' ? 'ATENCIÓN' : 'DÉFICIT'}
                  </Text>
                </View>
              </View>

              <Text style={styles.sectionSubText}>
                {cashflow.alert === 'HEALTHY'
                  ? `Tu liquidez cubre cómodamente los compromisos del próximo mes. Runway estimado de ${cashflow.runwayDays > 180 ? '>6 meses' : `${cashflow.runwayDays} días`}.`
                  : `Punto mínimo proyectado de $${Number(cashflow.projectedMinBalance).toFixed(2)} el ${new Date(cashflow.projectedMinDate).toLocaleDateString()}.`}
              </Text>

              {/* 3 Métricas clave */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginVertical: 8, paddingVertical: 10, borderTopWidth: 1, borderBottomWidth: 1, borderColor: FamilyMint.border }}>
                <View>
                  <Text style={styles.statLabel}>Burn Diario</Text>
                  <Text style={[styles.statValue, { fontSize: 14, color: FamilyMint.expense }]}>
                    -${fmt(cashflow.dailyBurnRate)}
                  </Text>
                </View>
                <View>
                  <Text style={styles.statLabel}>Mínimo Proyectado</Text>
                  <Text
                    style={[
                      styles.statValue,
                      {
                        fontSize: 14,
                        color: cashflow.projectedMinBalance >= 0 ? FamilyMint.primary : FamilyMint.expense,
                      },
                    ]}
                  >
                    ${fmt(cashflow.projectedMinBalance)}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.statLabel}>Runway Estimado</Text>
                  <Text style={[styles.statValue, { fontSize: 14, color: FamilyMint.income }]}>
                    {cashflow.runwayDays > 180 ? '> 180d' : `${cashflow.runwayDays}d`}
                  </Text>
                </View>
              </View>

              {/* Compromisos que impactan */}
              {cashflow.upcomingCommitments && cashflow.upcomingCommitments.length > 0 && (
                <View style={{ marginTop: 6 }}>
                  <Text style={[styles.statLabel, { marginBottom: 6 }]}>Próximos Pagos Fijos Detectados ({cashflow.upcomingCommitments.length})</Text>
                  {cashflow.upcomingCommitments.slice(0, 3).map((c: any, idx: number) => (
                    <View key={idx} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 }}>
                      <Text style={{ fontSize: 12, color: FamilyMint.foreground, flex: 1 }}>{c.name}</Text>
                      <Text style={{ fontSize: 11, color: FamilyMint.foregroundSubtle, marginRight: 8 }}>{new Date(c.date).toLocaleDateString([], { month: 'numeric', day: 'numeric' })}</Text>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: FamilyMint.warning }}>-${Number(c.amount).toFixed(2)}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* Distribución Real por Categorías (/api/reports/expense-distribution) */}
          <View style={styles.distributionHeaderRow}>
            <Text style={styles.sectionHeader}>Distribución de Gastos</Text>
            <Text style={styles.totalDistributionText}>
              Total: ${fmt(distribution.totalExpense || totalExpense)}
            </Text>
          </View>

          {(!distribution.categoriesDistribution ||
            distribution.categoriesDistribution.length === 0) ? (
            <Text style={styles.emptyText}>No hay gastos registrados para generar desglose.</Text>
          ) : (
            distribution.categoriesDistribution.map((item: any, idx: number) => {
              const pct = Number(item.percentage || 0);
              const amount = Number(item.totalAmount || 0);

              return (
                <View key={item.categoryId || idx} style={styles.catCard}>
                  <View style={styles.catTopRow}>
                    <Text style={styles.catName}>{item.categoryName || 'General'}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Text style={styles.catPct}>{pct.toFixed(1)}%</Text>
                      <Text style={styles.catAmount}>${fmt(amount)}</Text>
                    </View>
                  </View>

                  <View style={styles.catProgressBg}>
                    <View
                      style={[
                        styles.catProgressFill,
                        {
                          width: `${Math.min(100, Math.max(2, pct))}%`,
                          backgroundColor:
                            pct > 35
                              ? FamilyMint.expense
                              : pct > 15
                              ? FamilyMint.accentSaving
                              : FamilyMint.primary,
                        },
                      ]}
                    />
                  </View>
                </View>
              );
            })
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: FamilyMint.background },
  contentContainer: { padding: 16, paddingTop: 48, paddingBottom: 40 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  screenTitle: { fontSize: 20, fontWeight: '800', color: FamilyMint.foreground },
  screenSub: { fontSize: 12, color: FamilyMint.foregroundSubtle, marginTop: 2 },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: FamilyMint.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  exportBtnText: { color: '#0A1128', fontWeight: '700', fontSize: 13 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  statCard: {
    width: '48%',
    backgroundColor: FamilyMint.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: FamilyMint.border,
  },
  statIconRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statLabel: { fontSize: 10, color: FamilyMint.foregroundSubtle, fontWeight: '700', textTransform: 'uppercase' },
  statValue: { fontSize: 16, fontWeight: '800', marginTop: 6 },
  sectionCard: {
    backgroundColor: FamilyMint.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: FamilyMint.border,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: FamilyMint.foreground },
  sectionSubText: { fontSize: 12, color: FamilyMint.foregroundMuted, marginVertical: 8 },
  progressBg: { height: 8, backgroundColor: FamilyMint.surfaceElevated, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  distributionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionHeader: { fontSize: 15, fontWeight: '700', color: FamilyMint.foreground },
  totalDistributionText: { fontSize: 12, color: FamilyMint.foregroundSubtle },
  catCard: {
    backgroundColor: FamilyMint.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: FamilyMint.border,
  },
  catTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  catName: { color: FamilyMint.foreground, fontSize: 13, fontWeight: '600' },
  catPct: { color: FamilyMint.foregroundSubtle, fontSize: 12, fontWeight: '700' },
  catAmount: { color: FamilyMint.foreground, fontSize: 13, fontWeight: '700' },
  catProgressBg: { height: 6, backgroundColor: FamilyMint.surfaceElevated, borderRadius: 3, overflow: 'hidden' },
  catProgressFill: { height: '100%', borderRadius: 3 },
  emptyText: {
    color: FamilyMint.foregroundSubtle,
    fontSize: 13,
    textAlign: 'center',
    marginVertical: 24,
  },
});
