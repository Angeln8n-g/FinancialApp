import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  Linking,
  StyleSheet,
} from 'react-native';
import {
  Bot,
  Copy,
  Check,
  ExternalLink,
  X,
  Zap,
  Sparkles,
  ShieldCheck,
  Settings,
} from 'lucide-react-native';
import { FamilyMint } from '@/constants/Colors';
import { fetchWithAuth } from '@/constants/Api';

interface TelegramBotModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function TelegramBotModal({ visible, onClose }: TelegramBotModalProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [activeTab, setActiveTab] = useState<'quick' | 'custom' | 'examples'>('quick');

  const [botToken, setBotToken] = useState('');
  const [settingUp, setSettingUp] = useState(false);
  const [setupResult, setSetupResult] = useState<{ success: boolean; message: string } | null>(null);

  const fetchLink = async () => {
    try {
      setLoading(true);
      const res = await fetchWithAuth('/api/quick-entry/telegram-link');
      if (res.ok) {
        setData(await res.json());
      }
    } catch (err) {
      console.error('Error cargando enlace de Telegram:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      fetchLink();
    }
  }, [visible]);

  const handleCopy = (text: string, type: 'start' | 'webhook') => {
    if (type === 'start') {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else {
      setCopiedWebhook(true);
      setTimeout(() => setCopiedWebhook(false), 2000);
    }
    Alert.alert('Copiado al portapapeles', text);
  };

  const handleOpenTelegram = async () => {
    const url = data?.deepLink || `https://t.me/${data?.botUsername || 'HogarIQBot'}`;
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    } else {
      Alert.alert('Telegram no instalado', 'Por favor abre Telegram en tu navegador o instala la app.');
    }
  };

  const handleSetupCustomBot = async () => {
    if (!botToken.trim()) {
      Alert.alert('Token requerido', 'Ingresa el token de Telegram proporcionado por @BotFather.');
      return;
    }

    setSettingUp(true);
    setSetupResult(null);

    try {
      const res = await fetchWithAuth('/api/quick-entry/setup-telegram-bot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ botToken: botToken.trim() }),
      });

      const resData = await res.json();
      if (resData.success) {
        setSetupResult({ success: true, message: resData.message || '¡Bot configurado con éxito!' });
        Alert.alert('¡Éxito!', resData.message);
        await fetchLink();
        setBotToken('');
      } else {
        setSetupResult({ success: false, message: resData.message || 'Error al configurar el bot' });
        Alert.alert('Error', resData.message);
      }
    } catch (err: any) {
      setSetupResult({ success: false, message: err.message || 'Error de conexión' });
      Alert.alert('Error de conexión', err.message);
    } finally {
      setSettingUp(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.iconCircle}>
                <Bot size={22} color="#38BDF8" />
              </View>
              <View>
                <Text style={styles.title}>Bot de Telegram HogarIQ</Text>
                <Text style={styles.subtitle}>Registra gastos por chat en 1 segundo ⚡</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color={FamilyMint.foregroundMuted} />
            </TouchableOpacity>
          </View>

          {/* Tab Selector */}
          <View style={styles.tabsContainer}>
            <TouchableOpacity
              onPress={() => setActiveTab('quick')}
              style={[styles.tabBtn, activeTab === 'quick' && styles.tabBtnActive]}
            >
              <Text style={[styles.tabBtnText, activeTab === 'quick' && styles.tabBtnTextActive]}>
                1. Conectar
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setActiveTab('custom')}
              style={[styles.tabBtn, activeTab === 'custom' && styles.tabBtnActive]}
            >
              <Text style={[styles.tabBtnText, activeTab === 'custom' && styles.tabBtnTextActive]}>
                2. Bot Propio
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setActiveTab('examples')}
              style={[styles.tabBtn, activeTab === 'examples' && styles.tabBtnActive]}
            >
              <Text style={[styles.tabBtnText, activeTab === 'examples' && styles.tabBtnTextActive]}>
                3. Ejemplos
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {loading ? (
              <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                <ActivityIndicator size="large" color={FamilyMint.primary} />
                <Text style={{ color: FamilyMint.foregroundMuted, marginTop: 12, fontSize: 13 }}>
                  Cargando enlace de vinculación...
                </Text>
              </View>
            ) : (
              <>
                {/* TAB 1: CONECTAR BOT */}
                {activeTab === 'quick' && (
                  <View style={{ gap: 14 }}>
                    <View style={styles.card}>
                      <View style={styles.stepTitleRow}>
                        <Zap size={16} color="#F59E0B" />
                        <Text style={styles.stepTitle}>Paso 1: Abrir chat en Telegram</Text>
                      </View>
                      <Text style={styles.cardText}>
                        Abre la conversación con{' '}
                        <Text style={{ fontWeight: 'bold', color: FamilyMint.foreground }}>
                          @{data?.botUsername || 'HogarIQBot'}
                        </Text>{' '}
                        haciendo clic en el botón siguiente:
                      </Text>

                      <TouchableOpacity style={styles.actionBtn} onPress={handleOpenTelegram}>
                        <Bot size={18} color="#FFFFFF" />
                        <Text style={styles.actionBtnText}>
                          Abrir @{data?.botUsername || 'HogarIQBot'} en Telegram
                        </Text>
                        <ExternalLink size={16} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>

                    <View style={styles.card}>
                      <View style={styles.stepTitleRow}>
                        <ShieldCheck size={16} color={FamilyMint.primary} />
                        <Text style={styles.stepTitle}>Paso 2: Iniciar / Enlazar tu hogar</Text>
                      </View>
                      <Text style={styles.cardText}>
                        Al entrar en Telegram, presiona el botón <Text style={{ fontWeight: 'bold', color: FamilyMint.foreground }}>"INICIAR"</Text> o copia y envía este comando:
                      </Text>

                      <TouchableOpacity
                        style={styles.codeBox}
                        onPress={() => handleCopy(`/start ${data?.token}`, 'start')}
                      >
                        <Text style={styles.codeText} numberOfLines={1}>
                          /start {data?.token}
                        </Text>
                        <Copy size={16} color={copied ? FamilyMint.primary : FamilyMint.foregroundMuted} />
                      </TouchableOpacity>
                      {copied && (
                        <Text style={{ color: FamilyMint.primary, fontSize: 11, fontWeight: '600' }}>
                          ¡Comando copiado!
                        </Text>
                      )}

                      <Text style={{ color: FamilyMint.foregroundSubtle, fontSize: 11 }}>
                        ✅ El bot responderá inmediatamente confirmando que tu hogar está conectado.
                      </Text>
                    </View>
                  </View>
                )}

                {/* TAB 2: BOT PROPIO */}
                {activeTab === 'custom' && (
                  <View style={{ gap: 14 }}>
                    <View style={styles.card}>
                      <View style={styles.stepTitleRow}>
                        <Settings size={16} color="#F59E0B" />
                        <Text style={styles.stepTitle}>¿Quieres tu propio bot privado?</Text>
                      </View>
                      <Text style={styles.cardText}>
                        Puedes crear tu propio bot en Telegram para ti y tu familia en solo 1 minuto:
                      </Text>
                      <Text style={styles.instructionStep}>
                        1. Abre Telegram y busca a <Text style={{ color: '#38BDF8', fontWeight: 'bold' }}>@BotFather</Text>.
                      </Text>
                      <Text style={styles.instructionStep}>
                        2. Escríbele el comando <Text style={{ color: '#F59E0B', fontFamily: 'monospace' }}>/newbot</Text>.
                      </Text>
                      <Text style={styles.instructionStep}>
                        3. Asígnale el nombre y usuario que desees (ej: <Text style={{ fontStyle: 'italic' }}>MiHogarBot</Text>).
                      </Text>
                      <Text style={styles.instructionStep}>
                        4. Copia el <Text style={{ fontWeight: 'bold', color: FamilyMint.primary }}>HTTP API Token</Text> que te entregue BotFather.
                      </Text>
                    </View>

                    <View style={styles.card}>
                      <Text style={[styles.stepTitle, { marginBottom: 8 }]}>Pega el Token de @BotFather:</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Ej: 7123456789:AAHk..."
                        placeholderTextColor={FamilyMint.foregroundSubtle}
                        value={botToken}
                        onChangeText={setBotToken}
                        autoCapitalize="none"
                        autoCorrect={false}
                      />

                      <TouchableOpacity
                        style={[styles.actionBtn, { marginTop: 8 }]}
                        disabled={settingUp || !botToken.trim()}
                        onPress={handleSetupCustomBot}
                      >
                        {settingUp ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <>
                            <Check size={18} color="#FFFFFF" />
                            <Text style={styles.actionBtnText}>Vincular y Activar Webhook</Text>
                          </>
                        )}
                      </TouchableOpacity>

                      <View style={{ marginTop: 12, borderTopWidth: 1, borderTopColor: FamilyMint.border, paddingTop: 10 }}>
                        <Text style={{ fontSize: 11, color: FamilyMint.foregroundSubtle, marginBottom: 4 }}>
                          URL del Webhook de tu servidor HogarIQ:
                        </Text>
                        <TouchableOpacity
                          style={styles.codeBox}
                          onPress={() => handleCopy(data?.webhookUrl || 'https://api-hogariq.kasino21.com/api/quick-entry/telegram-webhook', 'webhook')}
                        >
                          <Text style={[styles.codeText, { fontSize: 10 }]} numberOfLines={1}>
                            {data?.webhookUrl || 'https://api-hogariq.kasino21.com/api/quick-entry/telegram-webhook'}
                          </Text>
                          <Copy size={14} color={FamilyMint.foregroundMuted} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                )}

                {/* TAB 3: EJEMPLOS */}
                {activeTab === 'examples' && (
                  <View style={{ gap: 12 }}>
                    <View style={styles.stepTitleRow}>
                      <Sparkles size={16} color="#F59E0B" />
                      <Text style={styles.stepTitle}>¿Cómo escribirle al Bot?</Text>
                    </View>
                    <Text style={styles.cardText}>
                      El bot entiende lenguaje natural. Solo escribe lo que gastaste o ingresaste:
                    </Text>

                    <View style={styles.exampleCard}>
                      <Text style={styles.exampleQuery}>"Almuerzo 12.50 tarjeta"</Text>
                      <Text style={styles.exampleDesc}>
                        Registra gasto de $12.50, categoría Alimentación, restado de tu cuenta Tarjeta.
                      </Text>
                    </View>

                    <View style={styles.exampleCard}>
                      <Text style={styles.exampleQuery}>"Supermercado 85 compartido"</Text>
                      <Text style={styles.exampleDesc}>
                        Divide el gasto 50/50 automáticamente con tu pareja o familiares.
                      </Text>
                    </View>

                    <View style={styles.exampleCard}>
                      <Text style={styles.exampleQuery}>"Gasolina 40 efectivo"</Text>
                      <Text style={styles.exampleDesc}>
                        Categoría Transporte de $40 restado de tu efectivo.
                      </Text>
                    </View>

                    <View style={styles.exampleCard}>
                      <Text style={styles.exampleQuery}>"Sueldo 1500 banco"</Text>
                      <Text style={styles.exampleDesc}>
                        Detecta ingreso (+) y lo suma al balance de tu cuenta bancaria.
                      </Text>
                    </View>
                  </View>
                )}
              </>
            )}
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.doneBtn} onPress={onClose}>
              <Text style={styles.doneBtnText}>Entendido / Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 10, 25, 0.85)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#101A36',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: FamilyMint.border,
    maxHeight: '90%',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: FamilyMint.foreground,
  },
  subtitle: {
    fontSize: 12,
    color: FamilyMint.foregroundMuted,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: FamilyMint.surfaceElevated,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#0A1128',
    borderRadius: 12,
    padding: 3,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: FamilyMint.border,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 9,
    alignItems: 'center',
  },
  tabBtnActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.4)',
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: FamilyMint.foregroundSubtle,
  },
  tabBtnTextActive: {
    color: '#38BDF8',
  },
  body: {
    maxHeight: 460,
  },
  card: {
    backgroundColor: '#0A1128',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: FamilyMint.border,
    padding: 14,
    gap: 10,
  },
  stepTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: FamilyMint.foreground,
    textTransform: 'uppercase',
  },
  cardText: {
    fontSize: 12,
    color: FamilyMint.foregroundMuted,
    lineHeight: 18,
  },
  instructionStep: {
    fontSize: 12,
    color: FamilyMint.foregroundMuted,
    lineHeight: 18,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0284C7',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  codeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#050B1B',
    borderWidth: 1,
    borderColor: FamilyMint.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  codeText: {
    fontFamily: 'SpaceMono',
    fontSize: 11,
    color: '#38BDF8',
    flex: 1,
  },
  input: {
    backgroundColor: '#050B1B',
    borderWidth: 1,
    borderColor: FamilyMint.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 12,
    color: FamilyMint.foreground,
  },
  exampleCard: {
    backgroundColor: '#0A1128',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: FamilyMint.border,
    padding: 12,
    gap: 4,
  },
  exampleQuery: {
    fontSize: 13,
    fontWeight: 'bold',
    color: FamilyMint.primary,
  },
  exampleDesc: {
    fontSize: 11,
    color: FamilyMint.foregroundMuted,
    lineHeight: 16,
  },
  footer: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: FamilyMint.border,
    marginTop: 10,
  },
  doneBtn: {
    backgroundColor: FamilyMint.surfaceElevated,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  doneBtnText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: FamilyMint.foreground,
  },
});
