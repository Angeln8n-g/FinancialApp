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
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { fetchWithAuth } from '@/constants/Api';

export default function MobilePatrimonyScreen() {
  const [patrimony, setPatrimony] = useState<any>({
    totalAssets: 0,
    liquidAssets: 0,
    fixedAssets: 0,
    totalLiabilities: 0,
    netWorth: 0,
    liquidNetWorth: 0,
    solvencyRatio: 1,
    debtToAssetRatio: 0,
    totalAppreciation: 0,
    assetAllocation: [],
    assetsList: [],
    accountsList: [],
    liabilitiesList: [],
  });
  const [debts, setDebts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('ALL');

  // Modal Registrar Activo
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [assetName, setAssetName] = useState('');
  const [assetType, setAssetType] = useState('REAL_ESTATE');
  const [assetValue, setAssetValue] = useState('');
  const [assetPurchasePrice, setAssetPurchasePrice] = useState('');
  const [assetAcquisitionDate, setAssetAcquisitionDate] = useState('');
  const [assetDebtId, setAssetDebtId] = useState('');
  const [assetNotes, setAssetNotes] = useState('');

  // Modal Revalorizar Activo
  const [showValuationModal, setShowValuationModal] = useState(false);
  const [selectedAssetForValuation, setSelectedAssetForValuation] = useState<any>(null);
  const [newValuationValue, setNewValuationValue] = useState('');
  const [valuationNotes, setValuationNotes] = useState('');

  const loadData = useCallback(async () => {
    try {
      const [resPatrimony, resDebts] = await Promise.all([
        fetchWithAuth('/api/patrimony/net-worth'),
        fetchWithAuth('/api/debts'),
      ]);

      if (resPatrimony.ok) {
        const data = await resPatrimony.json();
        setPatrimony(data);
      }
      if (resDebts.ok) {
        const dData = await resDebts.json();
        if (Array.isArray(dData)) {
          setDebts(dData);
        }
      }
    } catch (e) {
      console.log('Error cargando patrimonio:', e);
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

  const handleCreateAsset = async () => {
    if (!assetName.trim() || !assetValue.trim()) {
      Alert.alert('Campos requeridos', 'Ingresa el nombre y el valor actual del activo.');
      return;
    }

    const val = parseFloat(assetValue);
    if (isNaN(val) || val <= 0) {
      Alert.alert('Valor inválido', 'El valor debe ser un monto mayor a cero.');
      return;
    }

    try {
      const body: any = {
        name: assetName.trim(),
        type: assetType,
        value: val,
      };

      if (assetPurchasePrice.trim()) {
        body.purchasePrice = parseFloat(assetPurchasePrice);
      }
      if (assetAcquisitionDate.trim()) {
        body.acquisitionDate = assetAcquisitionDate.trim();
      }
      if (assetDebtId) {
        body.debtId = assetDebtId;
      }
      if (assetNotes.trim()) {
        body.notes = assetNotes.trim();
      }

      const res = await fetchWithAuth('/api/patrimony/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setShowAssetModal(false);
        setAssetName('');
        setAssetValue('');
        setAssetPurchasePrice('');
        setAssetAcquisitionDate('');
        setAssetDebtId('');
        setAssetNotes('');
        Alert.alert('¡Éxito!', 'Activo registrado correctamente en el patrimonio.');
        loadData();
      } else {
        const err = await res.json();
        Alert.alert('Error', err.message || 'No se pudo registrar el activo.');
      }
    } catch (e) {
      Alert.alert('Error de conexión', 'No se pudo conectar con el servidor.');
    }
  };

  const handleOpenValuation = (asset: any) => {
    setSelectedAssetForValuation(asset);
    setNewValuationValue(asset.value ? asset.value.toString() : '');
    setValuationNotes('');
    setShowValuationModal(true);
  };

  const handleUpdateValuation = async () => {
    if (!selectedAssetForValuation || !newValuationValue.trim()) return;

    const val = parseFloat(newValuationValue);
    if (isNaN(val) || val < 0) {
      Alert.alert('Monto inválido', 'Ingresa una tasación válida.');
      return;
    }

    try {
      const res = await fetchWithAuth(
        `/api/patrimony/assets/${selectedAssetForValuation.id}/valuation`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            value: val,
            notes: valuationNotes.trim() || undefined,
          }),
        },
      );

      if (res.ok) {
        setShowValuationModal(false);
        setSelectedAssetForValuation(null);
        Alert.alert('¡Tasación Actualizada!', 'El nuevo valor de mercado ha sido registrado.');
        loadData();
      } else {
        const err = await res.json();
        Alert.alert('Error', err.message || 'No se pudo actualizar la tasación.');
      }
    } catch (e) {
      Alert.alert('Error', 'No se pudo guardar la tasación.');
    }
  };

  const handleDeleteAsset = (id: string, name: string) => {
    Alert.alert(
      'Eliminar Activo',
      `¿Deseas eliminar "${name}" del patrimonio familiar?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await fetchWithAuth(`/api/patrimony/assets/${id}`, {
                method: 'DELETE',
              });
              if (res.ok) {
                Alert.alert('Eliminado', 'El activo ha sido borrado.');
                loadData();
              }
            } catch (e) {
              Alert.alert('Error', 'No se pudo eliminar el activo.');
            }
          },
        },
      ],
    );
  };

  const fmt = (n: any) => {
    const val = Number(n);
    return isNaN(val) ? '0.00' : val.toLocaleString('en-US', { minimumFractionDigits: 2 });
  };

  const getAssetIcon = (type: string) => {
    switch (type) {
      case 'REAL_ESTATE':
        return '🏠';
      case 'VEHICLE':
        return '🚗';
      case 'INVESTMENT':
        return '📈';
      case 'CRYPTO':
        return '🪙';
      default:
        return '💵';
    }
  };

  const getCategoryLabel = (type: string) => {
    switch (type) {
      case 'REAL_ESTATE':
        return 'Inmueble';
      case 'VEHICLE':
        return 'Vehículo';
      case 'INVESTMENT':
        return 'Inversión';
      case 'CRYPTO':
        return 'Cripto';
      case 'CASH_ACCOUNTS':
        return 'Cuentas';
      default:
        return 'Otro';
    }
  };

  const getCategoryColor = (type: string) => {
    switch (type) {
      case 'REAL_ESTATE':
        return '#10b981';
      case 'VEHICLE':
        return '#f59e0b';
      case 'INVESTMENT':
        return '#0284c7';
      case 'CRYPTO':
        return '#8b5cf6';
      case 'CASH_ACCOUNTS':
        return '#14b8a6';
      default:
        return '#64748b';
    }
  };

  const filteredAssets = (patrimony.assetsList || []).filter((a: any) => {
    if (selectedFilter === 'ALL') return true;
    if (selectedFilter === 'LIQUID') {
      return ['INVESTMENT', 'CRYPTO', 'CASH_OTHER'].includes(a.type);
    }
    return a.type === selectedFilter;
  });

  const solvency = patrimony.solvencyRatio || 1;
  const leverage = patrimony.debtToAssetRatio || 0;

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10b981" />}
    >
      {/* CABECERA */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.screenTitle}>Patrimonio Familiar</Text>
          <Text style={styles.screenSub}>Salud financiera, bienes y solvencia</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={() => setShowAssetModal(true)}>
          <Text style={styles.addButtonText}>+ Activo</Text>
        </TouchableOpacity>
      </View>

      {/* 🏆 TARJETA NET WORTH CONSOLIDADO */}
      <View style={styles.netWorthCard}>
        <Text style={styles.netWorthLabel}>PATRIMONIO NETO CONSOLIDADO</Text>
        <Text style={styles.netWorthValue}>RD${fmt(patrimony.netWorth)}</Text>

        {/* Badges de Salud Financiera */}
        <View style={styles.badgesRow}>
          <View
            style={[
              styles.healthBadge,
              solvency >= 2.0
                ? styles.badgeGreen
                : solvency >= 1.2
                ? styles.badgeAmber
                : styles.badgeRed,
            ]}
          >
            <Text style={styles.badgeText}>
              Solvencia: {solvency}x ({solvency >= 2.0 ? 'Sólida' : solvency >= 1.2 ? 'Estable' : 'Ajustada'})
            </Text>
          </View>

          <View
            style={[
              styles.healthBadge,
              leverage <= 35
                ? styles.badgeGreen
                : leverage <= 55
                ? styles.badgeAmber
                : styles.badgeRed,
            ]}
          >
            <Text style={styles.badgeText}>
              Deuda: {leverage}% ({leverage <= 35 ? 'Bajo' : leverage <= 55 ? 'Moderado' : 'Alto'})
            </Text>
          </View>
        </View>

        {/* Métricas Principales */}
        <View style={styles.netWorthRow}>
          <View style={styles.netWorthSubItem}>
            <Text style={styles.assetLabel}>TOTAL ACTIVOS</Text>
            <Text style={styles.assetValueText}>+RD${fmt(patrimony.totalAssets)}</Text>
            <Text style={styles.miniMeta}>
              Líq: RD${fmt(patrimony.liquidAssets)} • Fijo: RD${fmt(patrimony.fixedAssets)}
            </Text>
          </View>
          <View style={styles.netWorthSubItem}>
            <Text style={styles.liabLabel}>TOTAL PASIVOS</Text>
            <Text style={styles.liabValueText}>-RD${fmt(patrimony.totalLiabilities)}</Text>
            <Text style={styles.miniMeta}>
              {patrimony.liabilitiesList?.length || 0} deudas activas
            </Text>
          </View>
        </View>

        {/* Plusvalía Neta Acumulada */}
        {patrimony.totalAppreciation !== 0 && (
          <View style={styles.appreciationRow}>
            <Text style={styles.appreciationLabel}>Plusvalía Neta Acumulada:</Text>
            <Text
              style={[
                styles.appreciationValue,
                patrimony.totalAppreciation >= 0 ? styles.gainText : styles.lossText,
              ]}
            >
              {patrimony.totalAppreciation >= 0 ? '+' : ''}RD${fmt(patrimony.totalAppreciation)}
            </Text>
          </View>
        )}
      </View>

      {/* 📊 ASSET ALLOCATION (DISTRIBUCIÓN DE ACTIVOS) */}
      {patrimony.assetAllocation?.length > 0 && Number(patrimony.totalAssets) > 0 && (
        <View style={styles.allocationCard}>
          <Text style={styles.cardHeaderTitle}>Distribución de Cartera</Text>
          <View style={styles.allocationBarBg}>
            {patrimony.assetAllocation.map((alloc: any) => {
              if (alloc.percentage <= 0) return null;
              return (
                <View
                  key={alloc.type}
                  style={[
                    styles.allocationBarSegment,
                    {
                      width: `${alloc.percentage}%`,
                      backgroundColor: getCategoryColor(alloc.type),
                    },
                  ]}
                />
              );
            })}
          </View>

          {/* Chips de Categorías */}
          <View style={styles.chipsRow}>
            {patrimony.assetAllocation.map((alloc: any) => {
              if (alloc.amount <= 0) return null;
              return (
                <TouchableOpacity
                  key={alloc.type}
                  style={[
                    styles.chipButton,
                    selectedFilter === alloc.type && styles.chipActive,
                  ]}
                  onPress={() =>
                    setSelectedFilter(selectedFilter === alloc.type ? 'ALL' : alloc.type)
                  }
                >
                  <View
                    style={[
                      styles.chipDot,
                      { backgroundColor: getCategoryColor(alloc.type) },
                    ]}
                  />
                  <Text style={styles.chipText}>
                    {getCategoryLabel(alloc.type)} {alloc.percentage}%
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      {/* 💎 LISTA DE ACTIVOS Y BIENES */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionHeader}>Activos y Bienes Registrados</Text>
        <Text style={styles.countText}>{filteredAssets.length} activos</Text>
      </View>

      {filteredAssets.length === 0 ? (
        <Text style={styles.emptyText}>No hay activos registrados en esta categoría.</Text>
      ) : (
        filteredAssets.map((a: any) => {
          const hasAppreciation = a.appreciationAmount !== null;
          const isGain = (a.appreciationAmount || 0) >= 0;
          const hasDebt = !!a.linkedDebt;

          return (
            <View key={a.id} style={styles.assetCard}>
              <View style={styles.cardTopRow}>
                <View style={styles.cardLeft}>
                  <Text style={styles.assetIcon}>{getAssetIcon(a.type)}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{a.name}</Text>
                    <Text style={styles.assetType}>{getCategoryLabel(a.type)}</Text>
                  </View>
                </View>
                <Text style={styles.assetAmount}>+RD${fmt(a.value)}</Text>
              </View>

              {/* Detalle de Costo y Plusvalía */}
              {hasAppreciation && (
                <View style={styles.equityRow}>
                  <Text style={styles.equityLabel}>
                    Costo: RD${fmt(a.purchasePrice)}
                  </Text>
                  <Text
                    style={[
                      styles.appreciationBadge,
                      isGain ? styles.gainBadge : styles.lossBadge,
                    ]}
                  >
                    {isGain ? '+' : ''}RD${fmt(a.appreciationAmount)} ({isGain ? '+' : ''}
                    {a.appreciationPercentage}%)
                  </Text>
                </View>
              )}

              {/* Equity Neto si tiene Deuda Vinculada */}
              {hasDebt ? (
                <View style={styles.linkedDebtBox}>
                  <Text style={styles.linkedDebtText}>
                    Deuda ({a.linkedDebt.contactName}): -RD${fmt(a.linkedDebt.remainingAmount)}
                  </Text>
                  <Text style={styles.netEquityText}>
                    Equity Neto Real: RD${fmt(a.netEquity)}
                  </Text>
                </View>
              ) : (
                <Text style={styles.freeEquityText}>✓ 100% Patrimonio Propio</Text>
              )}

              {/* Botones de Acción */}
              <View style={styles.actionsRow}>
                <TouchableOpacity
                  style={styles.revalueBtn}
                  onPress={() => handleOpenValuation(a)}
                >
                  <Text style={styles.revalueBtnText}>📈 Revalorizar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => handleDeleteAsset(a.id, a.name)}
                >
                  <Text style={styles.deleteBtnText}>🗑️</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })
      )}

      {/* 🏦 CUENTAS BANCARIAS Y LIQUIDEZ */}
      <Text style={styles.sectionHeader}>Liquidez en Cuentas</Text>
      {(patrimony.accountsList || []).map((acc: any) => (
        <View key={acc.id} style={styles.accountCard}>
          <Text style={styles.accountName}>{acc.name} ({acc.type})</Text>
          <Text style={styles.accountBalance}>+RD${fmt(acc.balance)}</Text>
        </View>
      ))}

      {/* 📉 PASIVOS REGISTRADOS */}
      <Text style={styles.sectionHeader}>Pasivos y Préstamos</Text>
      {(patrimony.liabilitiesList || []).length === 0 ? (
        <Text style={styles.emptyText}>Sin deudas activas registradas.</Text>
      ) : (
        (patrimony.liabilitiesList || []).map((l: any) => (
          <View key={l.id} style={styles.liabCard}>
            <View>
              <Text style={styles.cardTitle}>{l.name}</Text>
              <Text style={styles.assetType}>
                {l.hasLinkedAsset ? 'Garantía vinculada' : 'Préstamo personal'}
              </Text>
            </View>
            <Text style={styles.liabAmount}>-RD${fmt(l.value)}</Text>
          </View>
        ))
      )}

      {/* MODAL REGISTRAR ACTIVO */}
      <Modal visible={showAssetModal} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Registrar Nuevo Activo</Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Nombre del activo (ej. Casa, Carro, Fondo)"
              placeholderTextColor="#94a3b8"
              value={assetName}
              onChangeText={setAssetName}
            />

            {/* Selector de Tipo */}
            <View style={styles.typeSelectorRow}>
              {[
                { id: 'REAL_ESTATE', label: 'Inmueble' },
                { id: 'VEHICLE', label: 'Vehículo' },
                { id: 'INVESTMENT', label: 'Inversión' },
                { id: 'CRYPTO', label: 'Cripto' },
                { id: 'CASH_OTHER', label: 'Otro' },
              ].map((t) => (
                <TouchableOpacity
                  key={t.id}
                  style={[
                    styles.typeSelectorBtn,
                    assetType === t.id && styles.typeSelectorBtnActive,
                  ]}
                  onPress={() => setAssetType(t.id)}
                >
                  <Text
                    style={[
                      styles.typeSelectorText,
                      assetType === t.id && styles.typeSelectorTextActive,
                    ]}
                  >
                    {t.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={styles.modalInput}
              placeholder="Valor Estimado Actual (RD$)"
              placeholderTextColor="#94a3b8"
              keyboardType="numeric"
              value={assetValue}
              onChangeText={setAssetValue}
            />

            <TextInput
              style={styles.modalInput}
              placeholder="Costo de Compra Original (RD$) - Opcional"
              placeholderTextColor="#94a3b8"
              keyboardType="numeric"
              value={assetPurchasePrice}
              onChangeText={setAssetPurchasePrice}
            />

            <TextInput
              style={styles.modalInput}
              placeholder="Fecha de Compra (AAAA-MM-DD) - Opcional"
              placeholderTextColor="#94a3b8"
              value={assetAcquisitionDate}
              onChangeText={setAssetAcquisitionDate}
            />

            {/* Selector de Deuda Vinculada */}
            {debts.length > 0 && (
              <View style={styles.debtSelectorBox}>
                <Text style={styles.debtSelectorLabel}>Vincular Pasivo / Hipoteca:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 6 }}>
                  <TouchableOpacity
                    style={[styles.debtChip, !assetDebtId && styles.debtChipActive]}
                    onPress={() => setAssetDebtId('')}
                  >
                    <Text style={styles.debtChipText}>Sin Deuda</Text>
                  </TouchableOpacity>
                  {debts.map((d: any) => (
                    <TouchableOpacity
                      key={d.id}
                      style={[styles.debtChip, assetDebtId === d.id && styles.debtChipActive]}
                      onPress={() => setAssetDebtId(d.id)}
                    >
                      <Text style={styles.debtChipText}>
                        {d.contactName || d.name} (RD${fmt(d.remainingAmount || d.value)})
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            <TextInput
              style={styles.modalInput}
              placeholder="Notas o Identificador - Opcional"
              placeholderTextColor="#94a3b8"
              value={assetNotes}
              onChangeText={setAssetNotes}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowAssetModal(false)}>
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleCreateAsset}>
                <Text style={styles.saveBtnText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL REVALORIZAR ACTIVO */}
      <Modal visible={showValuationModal} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Actualizar Tasación</Text>
            {selectedAssetForValuation && (
              <Text style={styles.modalSub}>
                {selectedAssetForValuation.name} • Valor actual: RD${fmt(selectedAssetForValuation.value)}
              </Text>
            )}

            <TextInput
              style={styles.modalInput}
              placeholder="Nuevo Valor Tasado (RD$)"
              placeholderTextColor="#94a3b8"
              keyboardType="numeric"
              value={newValuationValue}
              onChangeText={setNewValuationValue}
            />

            <TextInput
              style={styles.modalInput}
              placeholder="Motivo del Ajuste (ej. Tasación anual, Plusvalía)"
              placeholderTextColor="#94a3b8"
              value={valuationNotes}
              onChangeText={setValuationNotes}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowValuationModal(false)}>
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleUpdateValuation}>
                <Text style={styles.saveBtnText}>Guardar Tasación</Text>
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
  centerContainer: { flex: 1, backgroundColor: '#090d16', justifyContent: 'center', alignItems: 'center' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  screenTitle: { fontSize: 20, fontWeight: 'bold', color: '#ffffff' },
  screenSub: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  addButton: { backgroundColor: '#10b981', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  addButtonText: { color: '#ffffff', fontSize: 12, fontWeight: 'bold' },
  netWorthCard: { backgroundColor: '#101a36', borderRadius: 20, padding: 18, marginBottom: 16, borderWidth: 1, borderColor: '#1e2b4d' },
  netWorthLabel: { fontSize: 10, fontWeight: 'bold', color: '#10b981', letterSpacing: 1 },
  netWorthValue: { fontSize: 30, fontWeight: '900', color: '#ffffff', marginTop: 4 },
  badgesRow: { flexDirection: 'row', gap: 8, marginTop: 10, flexWrap: 'wrap' },
  healthBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  badgeGreen: { backgroundColor: 'rgba(16, 185, 129, 0.15)', borderColor: '#10b981' },
  badgeAmber: { backgroundColor: 'rgba(245, 158, 11, 0.15)', borderColor: '#f59e0b' },
  badgeRed: { backgroundColor: 'rgba(244, 63, 94, 0.15)', borderColor: '#f43f5e' },
  badgeText: { fontSize: 10, fontWeight: 'bold', color: '#f8fafc' },
  netWorthRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#1e2b4d' },
  netWorthSubItem: { flex: 1 },
  assetLabel: { fontSize: 9, fontWeight: 'bold', color: '#34d399' },
  assetValueText: { fontSize: 15, fontWeight: 'bold', color: '#34d399', marginTop: 2 },
  liabLabel: { fontSize: 9, fontWeight: 'bold', color: '#fb7185' },
  liabValueText: { fontSize: 15, fontWeight: 'bold', color: '#fb7185', marginTop: 2 },
  miniMeta: { fontSize: 9, color: '#64748b', marginTop: 2 },
  appreciationRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#1e2b4d' },
  appreciationLabel: { fontSize: 11, color: '#94a3b8' },
  appreciationValue: { fontSize: 12, fontWeight: 'bold' },
  gainText: { color: '#34d399' },
  lossText: { color: '#fb7185' },
  allocationCard: { backgroundColor: '#101a36', borderRadius: 16, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: '#1e2b4d' },
  cardHeaderTitle: { fontSize: 12, fontWeight: 'bold', color: '#e2e8f0', marginBottom: 8 },
  allocationBarBg: { height: 8, borderRadius: 4, backgroundColor: '#090d16', flexDirection: 'row', overflow: 'hidden' },
  allocationBarSegment: { height: 8 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  chipButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: '#090d16', borderWidth: 1, borderColor: '#1e2b4d' },
  chipActive: { borderColor: '#10b981', backgroundColor: '#162347' },
  chipDot: { width: 6, height: 6, borderRadius: 3, marginRight: 5 },
  chipText: { fontSize: 10, color: '#cbd5e1' },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, marginBottom: 10 },
  sectionHeader: { fontSize: 14, fontWeight: 'bold', color: '#ffffff' },
  countText: { fontSize: 11, color: '#64748b' },
  emptyText: { color: '#94a3b8', fontSize: 12, marginVertical: 8 },
  assetCard: { backgroundColor: '#101a36', borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#1e2b4d' },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  assetIcon: { fontSize: 22, marginRight: 10 },
  cardTitle: { fontSize: 13, fontWeight: 'bold', color: '#ffffff' },
  assetType: { fontSize: 10, color: '#94a3b8' },
  assetAmount: { fontSize: 15, fontWeight: 'bold', color: '#34d399' },
  equityRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  equityLabel: { fontSize: 10, color: '#94a3b8' },
  appreciationBadge: { fontSize: 10, fontWeight: 'bold', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  gainBadge: { backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#34d399' },
  lossBadge: { backgroundColor: 'rgba(244, 63, 94, 0.15)', color: '#fb7185' },
  linkedDebtBox: { marginTop: 8, padding: 8, borderRadius: 8, backgroundColor: '#090d16', borderWidth: 1, borderColor: '#1e2b4d' },
  linkedDebtText: { fontSize: 10, color: '#fb7185' },
  netEquityText: { fontSize: 11, fontWeight: 'bold', color: '#34d399', marginTop: 2 },
  freeEquityText: { fontSize: 10, color: '#34d399', marginTop: 6 },
  actionsRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#1e2b4d' },
  revalueBtn: { backgroundColor: '#162347', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, borderWidth: 1, borderColor: '#10b981' },
  revalueBtnText: { color: '#34d399', fontSize: 11, fontWeight: 'bold' },
  deleteBtn: { padding: 4 },
  deleteBtnText: { fontSize: 14 },
  accountCard: { backgroundColor: '#101a36', borderRadius: 10, padding: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, borderWidth: 1, borderColor: '#1e2b4d' },
  accountName: { fontSize: 12, fontWeight: 'bold', color: '#ffffff' },
  accountBalance: { fontSize: 13, fontWeight: 'bold', color: '#14b8a6' },
  liabCard: { backgroundColor: '#101a36', borderRadius: 10, padding: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, borderWidth: 1, borderColor: 'rgba(244, 63, 94, 0.2)' },
  liabAmount: { fontSize: 13, fontWeight: 'bold', color: '#fb7185' },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#101a36', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#1e2b4d' },
  modalTitle: { fontSize: 17, fontWeight: 'bold', color: '#ffffff', marginBottom: 14 },
  modalSub: { fontSize: 11, color: '#94a3b8', marginBottom: 12 },
  modalInput: { backgroundColor: '#090d16', borderRadius: 10, padding: 12, color: '#ffffff', marginBottom: 10, borderWidth: 1, borderColor: '#1e2b4d', fontSize: 13 },
  typeSelectorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  typeSelectorBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: '#090d16', borderWidth: 1, borderColor: '#1e2b4d' },
  typeSelectorBtnActive: { backgroundColor: '#162347', borderColor: '#10b981' },
  typeSelectorText: { color: '#94a3b8', fontSize: 11 },
  typeSelectorTextActive: { color: '#34d399', fontWeight: 'bold' },
  debtSelectorBox: { marginBottom: 10 },
  debtSelectorLabel: { fontSize: 11, color: '#94a3b8', marginBottom: 4 },
  debtChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: '#090d16', borderWidth: 1, borderColor: '#1e2b4d', marginRight: 6 },
  debtChipActive: { backgroundColor: '#162347', borderColor: '#fb7185' },
  debtChipText: { fontSize: 11, color: '#cbd5e1' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 12 },
  cancelBtn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8, backgroundColor: '#1e2b4d' },
  cancelBtnText: { color: '#cbd5e1', fontSize: 12, fontWeight: 'bold' },
  saveBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, backgroundColor: '#10b981' },
  saveBtnText: { color: '#ffffff', fontSize: 12, fontWeight: 'bold' },
});
