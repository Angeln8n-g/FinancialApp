import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, View, Text, ActivityIndicator } from 'react-native';
import { fetchWithAuth } from '@/constants/Api';

export default function MobileReportsScreen() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);

  const loadData = async () => {
    try {
      const [resSum, resCat] = await Promise.all([
        fetchWithAuth('/api/transactions/summary'),
        fetchWithAuth('/api/categories'),
      ]);

      if (resSum.ok) {
        setSummary(await resSum.json());
      }
      if (resCat.ok) {
        const catData = await resCat.json();
        if (Array.isArray(catData)) setCategories(catData);
      }
    } catch (e) {
      console.log('Error cargando reportes:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const fmt = (n: any) => {
    const val = Number(n);
    return isNaN(val) ? '0.00' : val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const totalIncome = summary?.monthlyIncome || 0;
  const totalExpense = summary?.monthlyExpense || 0;
  const netSavings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? Math.max(0, Math.round((netSavings / totalIncome) * 100)) : 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.screenTitle}>📊 Reportes Financieros</Text>
          <Text style={styles.screenSub}>Análisis de ingresos, gastos y ahorro del hogar</Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#9333ea" style={{ marginTop: 40 }} />
      ) : (
        <>
          {/* 💡 TARJETAS RESUMEN DE SALUD FINANCIERA */}
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Ingresos del Mes</Text>
              <Text style={[styles.statValue, { color: '#34d399' }]}>+RD${fmt(totalIncome)}</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Gastos del Mes</Text>
              <Text style={[styles.statValue, { color: '#f43f5e' }]}>-RD${fmt(totalExpense)}</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Superávit / Ahorro</Text>
              <Text style={[styles.statValue, { color: netSavings >= 0 ? '#38bdf8' : '#fb7185' }]}>
                {netSavings >= 0 ? '+' : ''}RD${fmt(netSavings)}
              </Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Tasa de Ahorro</Text>
              <Text style={[styles.statValue, { color: '#c084fc' }]}>{savingsRate}%</Text>
            </View>
          </View>

          {/* 📈 COMPARATIVA DE SALUD DE PRESUPUESTO */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>🎯 Eficiencia Presupuestaria</Text>
            <Text style={styles.sectionSubText}>
              {netSavings >= 0
                ? '🟢 Excelente balance: Tus ingresos superan tus gastos mensuales.'
                : '🔴 Cuidado: Tus gastos han superado tus ingresos de este mes.'}
            </Text>
            <View style={styles.progressBg}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.min(100, totalIncome > 0 ? Math.round((totalExpense / totalIncome) * 100) : 100)}%`,
                    backgroundColor: totalExpense > totalIncome ? '#f43f5e' : '#34d399',
                  },
                ]}
              />
            </View>
          </View>

          {/* 🏷️ DISTRIBUCIÓN POR CATEGORÍAS */}
          <Text style={styles.sectionHeader}>Categorías de Gastos Activas</Text>
          {categories.map((c) => (
            <View key={c.id} style={styles.catCard}>
              <View style={styles.catLeft}>
                <Text style={styles.catIcon}>{c.icon || '📦'}</Text>
                <Text style={styles.catName}>{c.name}</Text>
              </View>
              <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: c.color || '#9333ea' }} />
            </View>
          ))}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090d16' },
  contentContainer: { padding: 16, paddingTop: 48, paddingBottom: 40 },
  headerRow: { marginBottom: 20 },
  screenTitle: { fontSize: 20, fontWeight: 'bold', color: '#ffffff' },
  screenSub: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  statCard: { width: '48%', backgroundColor: 'rgba(30, 41, 59, 0.8)', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#1e293b' },
  statLabel: { fontSize: 10, color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase' },
  statValue: { fontSize: 16, fontWeight: '900', marginTop: 4 },
  sectionCard: { backgroundColor: 'rgba(30, 41, 59, 0.8)', borderRadius: 16, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(168, 85, 247, 0.3)' },
  sectionTitle: { fontSize: 15, fontWeight: 'bold', color: '#ffffff' },
  sectionSubText: { fontSize: 11, color: '#cbd5e1', marginVertical: 8 },
  progressBg: { height: 10, backgroundColor: '#0f172a', borderRadius: 5, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 5 },
  sectionHeader: { fontSize: 15, fontWeight: 'bold', color: '#ffffff', marginBottom: 12 },
  catCard: { backgroundColor: 'rgba(30, 41, 59, 0.8)', borderRadius: 12, padding: 12, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#1e293b' },
  catLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  catIcon: { fontSize: 18 },
  catName: { color: '#ffffff', fontSize: 13, fontWeight: 'bold' },
});
