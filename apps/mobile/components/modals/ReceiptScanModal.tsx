import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Switch,
} from 'react-native';
import {
  X,
  Camera,
  Receipt,
  Sparkles,
  Check,
  Building2,
  Calendar,
  CreditCard,
  FileText,
  RotateCcw,
  Tag,
} from 'lucide-react-native';
import { FamilyMint } from '@/constants/Colors';
import { fetchWithAuth } from '@/constants/Api';

interface ReceiptScanModalProps {
  visible: boolean;
  onClose: () => void;
  accounts: any[];
  categories: any[];
  onSuccess: () => void;
}

export default function ReceiptScanModal({
  visible,
  onClose,
  accounts,
  categories,
  onSuccess,
}: ReceiptScanModalProps) {
  const [samples, setSamples] = useState<any[]>([]);
  const [rawText, setRawText] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [candidate, setCandidate] = useState<any>(null);

  // Formulario del comprobante extraído
  const [merchantName, setMerchantName] = useState('');
  const [amount, setAmount] = useState('');
  const [taxAmount, setTaxAmount] = useState('');
  const [date, setDate] = useState('');
  const [accountId, setAccountId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [isShared, setIsShared] = useState(false);
  const [lineItems, setLineItems] = useState<Array<{ description: string; price: number }>>([]);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (visible) {
      if (accounts.length > 0 && !accountId) setAccountId(accounts[0].id);
      if (categories.length > 0 && !categoryId) setCategoryId(categories[0].id);

      // Cargar ejemplos OCR desde el backend
      fetchWithAuth('/api/ocr/samples')
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.samples) setSamples(data.samples);
        })
        .catch(() => {});
    }
  }, [visible]);

  const handleAnalyzeText = async (textToParse: string) => {
    if (!textToParse.trim()) {
      Alert.alert('Texto Vacío', 'Por favor ingresa o selecciona el texto de un comprobante.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetchWithAuth('/api/ocr/parse', {
        method: 'POST',
        body: JSON.stringify({ rawText: textToParse }),
      });

      if (res.ok) {
        const data = await res.json();
        const c = data.candidate || {};
        setCandidate(c);
        setMerchantName(c.merchantName || '');
        setAmount(c.totalAmount ? String(c.totalAmount) : '');
        setTaxAmount(c.taxAmount ? String(c.taxAmount) : '0.00');
        setDate(c.date || new Date().toISOString().split('T')[0]);
        if (c.accountId) setAccountId(c.accountId);
        if (c.categoryId) setCategoryId(c.categoryId);
        setIsShared(c.isSharedSuggestion || false);
        setLineItems(c.lineItems || []);
        setNotes(`Recibo analizado de ${c.merchantName || 'Comercio'}`);
      } else {
        const err = await res.json().catch(() => ({}));
        Alert.alert('Error', err.message || 'No se pudo analizar el comprobante.');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Error de conexión.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSample = (s: any) => {
    setRawText(s.rawText || '');
    handleAnalyzeText(s.rawText);
  };

  const handleConfirm = async () => {
    const parsedAmount = parseFloat(amount.replace(',', '.'));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert('Monto Inválido', 'Ingresa un monto numérico mayor a cero.');
      return;
    }
    if (!accountId) {
      Alert.alert('Cuenta Requerida', 'Selecciona una cuenta para debitar este gasto.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetchWithAuth('/api/ocr/confirm', {
        method: 'POST',
        body: JSON.stringify({
          accountId,
          categoryId: categoryId || undefined,
          amount: parsedAmount,
          merchantName: merchantName.trim() || 'Comprobante OCR',
          date: date || new Date().toISOString(),
          isShared,
          lineItems,
          notes,
        }),
      });

      if (res.ok) {
        Alert.alert('¡Comprobante Guardado!', `Se registró "${merchantName || 'Gasto'}" por $${parsedAmount.toFixed(2)}.`);
        handleReset();
        onSuccess();
        onClose();
      } else {
        const err = await res.json().catch(() => ({}));
        Alert.alert('Error', err.message || 'No se pudo guardar la transacción.');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Error de conexión.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setCandidate(null);
    setRawText('');
    setMerchantName('');
    setAmount('');
    setTaxAmount('');
    setDate('');
    setLineItems([]);
    setNotes('');
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalBg}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={styles.headerIconWrap}>
                <Receipt size={18} color={FamilyMint.primary} />
              </View>
              <View>
                <Text style={styles.title}>Escanear Recibo (OCR)</Text>
                <Text style={styles.subtitle}>Extracción inteligente con IA de tickets y facturas</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color={FamilyMint.foregroundSubtle} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
            {!candidate ? (
              <>
                {/* Selector de Comprobantes de Muestra */}
                <Text style={styles.sectionHeading}>Muestras Rápidas de Facturas</Text>
                <Text style={styles.sectionSub}>Selecciona un comprobante real para probar el extractor:</Text>

                <View style={styles.samplesGrid}>
                  {(samples.length > 0
                    ? samples
                    : [
                        {
                          id: 's1',
                          merchant: 'Supermercado Nacional',
                          amount: 47.32,
                          category: 'Alimentos',
                          rawText:
                            'SUPERMERCADO NACIONAL\nFECHA: 24/10/2026\nLECHE ENTERA 1L $3.50\nARROZ PREMIUM 5LB $6.80\nPOLLO FRESCO 1KG $9.20\nACEITE VEGETAL $5.40\nITBIS / IVA: $4.20\nTOTAL: $47.32\nPAGO CON TARJETA DEBITO',
                        },
                        {
                          id: 's2',
                          merchant: 'Farmacia Carol',
                          amount: 18.9,
                          category: 'Salud',
                          rawText:
                            'FARMACIA CAROL S.A.\nFECHA: 25/10/2026\nIBUPROFENO 400MG $6.50\nVITAMINA C 1000MG $12.40\nTOTAL: $18.90\nPAGO CON TARJETA',
                        },
                        {
                          id: 's3',
                          merchant: 'Estación de Combustible',
                          amount: 35.0,
                          category: 'Transporte',
                          rawText:
                            'TOTAL ESTACION CENTRAL\nCOMBUSTIBLE GASOLINA PREMIUM\nLITROS: 35.20\nTOTAL A PAGAR: $35.00\nPAGO: EFECTIVO',
                        },
                        {
                          id: 's4',
                          merchant: 'Ristorante Bella Italia',
                          amount: 56.4,
                          category: 'Restaurante',
                          rawText:
                            'RISTORANTE BELLA ITALIA\nPIZZA MARGHERITA $16.00\nPASTA BOLOGNESE $18.50\nBEBIDAS $8.00\nPROPINA LEGAL 10%: $4.25\nTOTAL A PAGAR: $56.40',
                        },
                      ]
                  ).map((s: any) => (
                    <TouchableOpacity
                      key={s.id || s.merchant}
                      style={styles.sampleCard}
                      onPress={() => handleSelectSample(s)}
                    >
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={styles.sampleMerchant}>{s.merchant}</Text>
                        <Text style={styles.sampleAmount}>${Number(s.amount).toFixed(2)}</Text>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                        <Sparkles size={11} color={FamilyMint.primary} />
                        <Text style={styles.sampleCategory}>{s.category || 'Gasto'}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Entrada de Texto Libre */}
                <View style={{ marginTop: 16 }}>
                  <Text style={styles.sectionHeading}>O Pega el Texto del Recibo</Text>
                  <TextInput
                    style={styles.textArea}
                    multiline
                    numberOfLines={4}
                    value={rawText}
                    onChangeText={setRawText}
                    placeholder="Pega aquí el texto extraído de la foto del recibo o factura..."
                    placeholderTextColor={FamilyMint.foregroundSubtle}
                  />

                  <TouchableOpacity
                    style={[styles.analyzeBtn, (!rawText.trim() || loading) && { opacity: 0.6 }]}
                    onPress={() => handleAnalyzeText(rawText)}
                    disabled={!rawText.trim() || loading}
                  >
                    {loading ? (
                      <ActivityIndicator size="small" color="#0A1128" />
                    ) : (
                      <>
                        <Sparkles size={16} color="#0A1128" />
                        <Text style={styles.analyzeBtnText}>Analizar con IA (OCR)</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              /* Vista de Confirmación del Comprobante */
              <View>
                <View style={styles.detectedBanner}>
                  <Sparkles size={16} color={FamilyMint.primary} />
                  <Text style={styles.detectedBannerText}>
                    ¡Comprobante extraído con éxito! Revisa y confirma los datos:
                  </Text>
                </View>

                {/* Comercio y Monto */}
                <Text style={styles.label}>Establecimiento Comercial</Text>
                <TextInput
                  style={styles.input}
                  value={merchantName}
                  onChangeText={setMerchantName}
                  placeholder="Nombre de la tienda o negocio"
                  placeholderTextColor={FamilyMint.foregroundSubtle}
                />

                <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
                  <View style={{ flex: 2 }}>
                    <Text style={styles.label}>Total Pagado ($)</Text>
                    <TextInput
                      style={[styles.input, { fontSize: 16, fontWeight: '700', color: FamilyMint.foreground }]}
                      value={amount}
                      onChangeText={setAmount}
                      keyboardType="numeric"
                      placeholder="0.00"
                      placeholderTextColor={FamilyMint.foregroundSubtle}
                    />
                  </View>

                  <View style={{ flex: 1.5 }}>
                    <Text style={styles.label}>Impuestos / ITBIS</Text>
                    <TextInput
                      style={styles.input}
                      value={taxAmount}
                      onChangeText={setTaxAmount}
                      keyboardType="numeric"
                      placeholder="0.00"
                      placeholderTextColor={FamilyMint.foregroundSubtle}
                    />
                  </View>
                </View>

                {/* Fecha */}
                <Text style={styles.label}>Fecha del Comprobante</Text>
                <TextInput
                  style={styles.input}
                  value={date}
                  onChangeText={setDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={FamilyMint.foregroundSubtle}
                />

                {/* Cuenta de Cargo */}
                <Text style={styles.label}>Cuenta a Debitar</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 6 }}>
                  {accounts.map((acc) => (
                    <TouchableOpacity
                      key={acc.id}
                      onPress={() => setAccountId(acc.id)}
                      style={[styles.chip, accountId === acc.id && styles.chipActive]}
                    >
                      <CreditCard size={12} color={accountId === acc.id ? '#0A1128' : FamilyMint.foregroundMuted} />
                      <Text style={[styles.chipText, accountId === acc.id && styles.chipTextActive]}>
                        {acc.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {/* Categoría */}
                <Text style={styles.label}>Categoría</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 6 }}>
                  {categories.map((cat) => (
                    <TouchableOpacity
                      key={cat.id}
                      onPress={() => setCategoryId(cat.id)}
                      style={[styles.chip, categoryId === cat.id && styles.chipActive]}
                    >
                      <Tag size={12} color={categoryId === cat.id ? '#0A1128' : FamilyMint.foregroundMuted} />
                      <Text style={[styles.chipText, categoryId === cat.id && styles.chipTextActive]}>
                        {cat.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {/* Gasto Compartido 50/50 */}
                <View style={styles.sharedRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.sharedTitle}>🤝 Gasto Familiar Compartido</Text>
                    <Text style={styles.sharedSub}>Divide el gasto equitativamente entre los miembros del hogar</Text>
                  </View>
                  <Switch
                    value={isShared}
                    onValueChange={setIsShared}
                    trackColor={{ false: '#1E2B4D', true: FamilyMint.primary }}
                    thumbColor="#FFFFFF"
                  />
                </View>

                {/* Ítems Detectados */}
                {lineItems.length > 0 && (
                  <View style={styles.itemsBox}>
                    <Text style={styles.itemsTitle}>🧾 Detalle de Productos ({lineItems.length}):</Text>
                    {lineItems.map((item, idx) => (
                      <View key={idx} style={styles.itemRow}>
                        <Text style={styles.itemDesc} numberOfLines={1}>
                          • {item.description}
                        </Text>
                        <Text style={styles.itemPrice}>${Number(item.price).toFixed(2)}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Notas */}
                <Text style={styles.label}>Notas adicionales</Text>
                <TextInput
                  style={styles.input}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Detalles de la compra..."
                  placeholderTextColor={FamilyMint.foregroundSubtle}
                />

                {/* Botón Reintentar con otra muestra */}
                <TouchableOpacity onPress={handleReset} style={styles.resetBtn}>
                  <RotateCcw size={14} color={FamilyMint.foregroundSubtle} />
                  <Text style={styles.resetBtnText}>Escanear otro comprobante</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity onPress={onClose} style={styles.cancelBtn} disabled={submitting}>
              <Text style={styles.cancelBtnText}>Cancelar</Text>
            </TouchableOpacity>

            {candidate && (
              <TouchableOpacity
                onPress={handleConfirm}
                style={styles.saveBtn}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#0A1128" />
                ) : (
                  <>
                    <Check size={16} color="#0A1128" />
                    <Text style={styles.saveBtnText}>Confirmar y Registrar</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: FamilyMint.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: FamilyMint.border,
    maxHeight: '92%',
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: FamilyMint.border,
  },
  headerIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: FamilyMint.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: FamilyMint.foreground,
  },
  subtitle: {
    fontSize: 11,
    color: FamilyMint.foregroundMuted,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 10,
    backgroundColor: FamilyMint.surfaceElevated,
  },
  scrollArea: {
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: FamilyMint.foreground,
    marginBottom: 4,
  },
  sectionSub: {
    fontSize: 11,
    color: FamilyMint.foregroundSubtle,
    marginBottom: 10,
  },
  samplesGrid: {
    gap: 8,
  },
  sampleCard: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: FamilyMint.surfaceElevated,
    borderWidth: 1,
    borderColor: FamilyMint.border,
  },
  sampleMerchant: {
    fontSize: 13,
    fontWeight: '700',
    color: FamilyMint.foreground,
  },
  sampleAmount: {
    fontSize: 13,
    fontWeight: '700',
    color: FamilyMint.primary,
  },
  sampleCategory: {
    fontSize: 10,
    fontWeight: '600',
    color: FamilyMint.primary,
  },
  textArea: {
    backgroundColor: FamilyMint.surfaceElevated,
    borderWidth: 1,
    borderColor: FamilyMint.border,
    borderRadius: 12,
    padding: 12,
    color: FamilyMint.foreground,
    fontSize: 13,
    textAlignVertical: 'top',
    minHeight: 80,
  },
  analyzeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 10,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: FamilyMint.primary,
  },
  analyzeBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0A1128',
  },
  detectedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 10,
    backgroundColor: FamilyMint.primaryMuted,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    marginBottom: 12,
  },
  detectedBannerText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '600',
    color: FamilyMint.primary,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: FamilyMint.foregroundMuted,
    marginBottom: 6,
    marginTop: 8,
  },
  input: {
    backgroundColor: FamilyMint.surfaceElevated,
    borderWidth: 1,
    borderColor: FamilyMint.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: FamilyMint.foreground,
    fontSize: 13,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: FamilyMint.surfaceElevated,
    borderWidth: 1,
    borderColor: FamilyMint.border,
    marginRight: 8,
  },
  chipActive: {
    backgroundColor: FamilyMint.primary,
    borderColor: FamilyMint.primary,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: FamilyMint.foregroundMuted,
  },
  chipTextActive: {
    color: '#0A1128',
    fontWeight: '700',
  },
  sharedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    backgroundColor: FamilyMint.surfaceElevated,
    borderWidth: 1,
    borderColor: FamilyMint.border,
    marginTop: 12,
  },
  sharedTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: FamilyMint.foreground,
  },
  sharedSub: {
    fontSize: 10,
    color: FamilyMint.foregroundSubtle,
    marginTop: 2,
  },
  itemsBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: FamilyMint.surfaceElevated,
    borderWidth: 1,
    borderColor: FamilyMint.border,
  },
  itemsTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: FamilyMint.foregroundMuted,
    marginBottom: 6,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  itemDesc: {
    fontSize: 11,
    color: FamilyMint.foreground,
    flex: 1,
    paddingRight: 8,
  },
  itemPrice: {
    fontSize: 11,
    fontWeight: '600',
    color: FamilyMint.primary,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    marginTop: 14,
  },
  resetBtnText: {
    fontSize: 12,
    color: FamilyMint.foregroundSubtle,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: FamilyMint.border,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: FamilyMint.border,
    alignItems: 'center',
    backgroundColor: FamilyMint.surfaceElevated,
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: FamilyMint.foregroundMuted,
  },
  saveBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: FamilyMint.primary,
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0A1128',
  },
});
