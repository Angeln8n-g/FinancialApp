import { Platform } from 'react-native';

let LocalAuthentication: any = null;
try {
  LocalAuthentication = require('expo-local-authentication');
} catch (e) {}

export async function checkBiometricsAvailable() {
  if (Platform.OS === 'web' || !LocalAuthentication) return false;
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  const isEnrolled = await LocalAuthentication.isEnrolledAsync();
  return hasHardware && isEnrolled;
}

export async function authenticateWithBiometrics(promptMessage: string = 'Autenticación Biométrica de HogarIQ') {
  if (Platform.OS === 'web' || !LocalAuthentication) return true;

  const result = await LocalAuthentication.authenticateAsync({
    promptMessage,
    fallbackLabel: 'Ingresar con contraseña',
    cancelLabel: 'Cancelar',
  });

  return result.success;
}
