import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import Logo from '@/components/Logo';
import { FamilyMint } from '@/constants/Colors';
import { getApiUrl, setApiUrl, setAuthToken, setUser, setHousehold, getAuthToken } from '@/constants/Api';
import { checkBiometricsAvailable, authenticateWithBiometrics } from '@/constants/Biometrics';

export default function MobileLoginScreen() {
  const router = useRouter();

  const [isRegister, setIsRegister] = useState(false);
  const [isChildAccount, setIsChildAccount] = useState(false);
  const [parentEmail, setParentEmail] = useState('');
  const [apiUrlInput, setApiUrlInput] = useState(getApiUrl());
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showServerConfig, setShowServerConfig] = useState(false);
  const [biometricsAvailable, setBiometricsAvailable] = useState(false);

  useEffect(() => {
    checkBiometricsAvailable().then((avail) => {
      setBiometricsAvailable(avail && !!getAuthToken());
    });
  }, []);

  const handleBiometricUnlock = async () => {
    const success = await authenticateWithBiometrics('Desbloquear HogarIQ con Huella / FaceID');
    if (success) {
      router.replace('/(tabs)' as any);
    }
  };

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('Campos requeridos', 'Por favor ingresa correo y contraseña.');
      return;
    }

    if (isRegister && isChildAccount) {
      if (!parentEmail.trim() || !parentEmail.includes('@')) {
        Alert.alert('Control Parental Requerido', 'Debes ingresar el correo del padre o tutor para enlazar la cuenta de niño.');
        return;
      }
      if (parentEmail.trim().toLowerCase() === email.trim().toLowerCase()) {
        Alert.alert('Correo Inválido', 'El correo del padre o tutor debe ser distinto al correo de la cuenta de niño.');
        return;
      }
    }

    setLoading(true);

    try {
      let cleanUrl = apiUrlInput.trim();
      if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
        cleanUrl = `https://${cleanUrl}`;
      }
      setApiUrl(cleanUrl);

      const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
      const payload = isRegister
        ? {
            email: email.trim(),
            password,
            fullName: fullName.trim(),
            isChildAccount,
            ...(isChildAccount ? { parentEmail: parentEmail.trim().toLowerCase() } : {}),
          }
        : { email: email.trim(), password };

      const response = await fetch(`${cleanUrl}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        const msg = Array.isArray(data.message) ? data.message[0] : data.message;
        throw new Error(msg || 'Error al autenticar');
      }

      setAuthToken(data.accessToken);
      setUser(data.user);
      setHousehold(data.household);

      Alert.alert(
        '¡Bienvenido!',
        isRegister
          ? isChildAccount
            ? `Cuenta de niño creada y enlazada al control parental de ${parentEmail}`
            : 'Cuenta creada exitosamente.'
          : `Sesión iniciada como ${data.user?.fullName || email}`
      );

      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert(
        'Error de Conexión',
        `${error.message || 'No se pudo conectar con el servidor.'}\n\nVerifica que la URL del servidor API sea correcta.`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          {/* Header Branding */}
          <View style={styles.brandHeader}>
            <Logo size="lg" showText={true} />
            <Text style={styles.subtext}>
              {isRegister
                ? isChildAccount
                  ? 'Cuenta de Niño con Control Parental'
                  : 'Crea la cuenta para tu hogar'
                : 'Asistente Financiero Familiar con IA'}
            </Text>
          </View>

          {/* Formulario */}
          <View style={styles.formGroup}>
            {isRegister && (
              <>
                <View style={styles.field}>
                  <Text style={styles.label}>¿Qué tipo de cuenta deseas crear?</Text>
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <TouchableOpacity
                      onPress={() => setIsChildAccount(false)}
                      style={[
                        styles.accountTypeBtn,
                        !isChildAccount && styles.accountTypeBtnActive,
                      ]}
                    >
                      <Text style={[styles.accountTypeTitle, !isChildAccount && { color: FamilyMint.primary }]}>
                        Cuenta Adulto
                      </Text>
                      <Text style={styles.accountTypeSub}>Control del hogar</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => setIsChildAccount(true)}
                      style={[
                        styles.accountTypeBtn,
                        isChildAccount && styles.accountTypeBtnChildActive,
                      ]}
                    >
                      <Text style={[styles.accountTypeTitle, isChildAccount && { color: '#FBBF24' }]}>
                        Cuenta Niño
                      </Text>
                      <Text style={styles.accountTypeSub}>Control parental</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {isChildAccount && (
                  <View style={styles.childBox}>
                    <Text style={styles.childBoxInfo}>
                      Esta cuenta tendrá acceso exclusivo a la Cuenta de Niño y se enlazará automáticamente al padre/tutor.
                    </Text>
                    <Text style={[styles.label, { color: '#FBBF24', marginTop: 8 }]}>
                      Correo del Padre / Tutor (Control Parental) *
                    </Text>
                    <TextInput
                      style={[styles.input, { borderColor: '#F59E0B', marginTop: 4 }]}
                      value={parentEmail}
                      onChangeText={setParentEmail}
                      placeholder="padre.tutor@ejemplo.com"
                      placeholderTextColor="#64748B"
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>
                )}

                <View style={styles.field}>
                  <Text style={styles.label}>{isChildAccount ? 'Nombre del Niño(a)' : 'Nombre Completo'}</Text>
                  <TextInput
                    style={styles.input}
                    value={fullName}
                    onChangeText={setFullName}
                    placeholder={isChildAccount ? 'Ej. Mateo Fraga' : 'Ej. Angela Fraga'}
                    placeholderTextColor="#64748B"
                    autoCapitalize="words"
                  />
                </View>
              </>
            )}

            <View style={styles.field}>
              <Text style={styles.label}>
                {isRegister && isChildAccount ? 'Correo de la Cuenta del Niño' : 'Correo Electrónico'}
              </Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="correo@ejemplo.com"
                placeholderTextColor="#64748B"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Contraseña</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor="#64748B"
                secureTextEntry
              />
            </View>

            {/* Toggle Configuración de Servidor */}
            <TouchableOpacity
              onPress={() => setShowServerConfig(!showServerConfig)}
              style={styles.serverToggle}
            >
              <Text style={styles.serverToggleText}>
                ⚙️ {showServerConfig ? 'Ocultar Servidor API' : 'Configurar Servidor API (Producción/IP)'}
              </Text>
            </TouchableOpacity>

            {showServerConfig && (
              <View style={styles.field}>
                <Text style={styles.label}>URL Servidor Backend API</Text>
                <TextInput
                  style={[styles.input, { borderColor: '#A855F7' }]}
                  value={apiUrlInput}
                  onChangeText={setApiUrlInput}
                  placeholder="https://api.tudominio.com"
                  placeholderTextColor="#64748B"
                  autoCapitalize="none"
                />
                <Text style={styles.hint}>
                  Ingresa la URL de producción (ej. https://api-hogariq.tudominio.com) o la IP local de tu servidor.
                </Text>
              </View>
            )}

            {biometricsAvailable && (
              <TouchableOpacity
                onPress={handleBiometricUnlock}
                style={{
                  backgroundColor: 'rgba(168, 85, 247, 0.15)',
                  borderColor: '#A855F7',
                  borderWidth: 1,
                  borderRadius: 14,
                  paddingVertical: 12,
                  alignItems: 'center',
                  marginTop: 6,
                }}
              >
                <Text style={{ color: FamilyMint.primary, fontSize: 14, fontWeight: '700' }}>
                  🔒 Desbloquear con Huella / FaceID
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.btnSubmit, isRegister && isChildAccount && { backgroundColor: '#D97706' }]}
              onPress={handleAuth}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.btnSubmitText}>
                  {isRegister
                    ? isChildAccount
                      ? 'Crear Cuenta Niño y Enlazar Padre'
                      : 'Crear Cuenta'
                    : 'Iniciar Sesión'}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setIsRegister(!isRegister);
                setIsChildAccount(false);
              }}
              style={styles.toggleAuth}
            >
              <Text style={styles.toggleAuthText}>
                {isRegister ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate gratis'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: FamilyMint.background,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: FamilyMint.surface,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: FamilyMint.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 8,
  },
  brandHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  subtext: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 8,
    textAlign: 'center',
  },
  formGroup: {
    gap: 14,
  },
  field: {
    gap: 6,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#CBD5E1',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  input: {
    backgroundColor: FamilyMint.surfaceElevated,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#F8FAFC',
    borderWidth: 1,
    borderColor: FamilyMint.border,
  },
  accountTypeBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: FamilyMint.border,
    backgroundColor: FamilyMint.surfaceElevated,
  },
  accountTypeBtnActive: {
    borderColor: FamilyMint.primary,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
  },
  accountTypeBtnChildActive: {
    borderColor: '#F59E0B',
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
  },
  accountTypeTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  accountTypeSub: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
  },
  childBox: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
  },
  childBoxInfo: {
    fontSize: 11,
    color: '#FDE68A',
    lineHeight: 16,
  },
  hint: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  serverToggle: {
    paddingVertical: 6,
    alignItems: 'center',
  },
  serverToggleText: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '600',
  },
  btnSubmit: {
    backgroundColor: FamilyMint.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  btnSubmitText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  toggleAuth: {
    alignItems: 'center',
    marginTop: 10,
  },
  toggleAuthText: {
    color: '#C084FC',
    fontSize: 13,
    fontWeight: '600',
  },
});
