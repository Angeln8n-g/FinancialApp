import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';

export async function checkBiometricsAvailable() {
  if (Platform.OS === 'web') return false;
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  const isEnrolled = await LocalAuthentication.isEnrolledAsync();
  return hasHardware && isEnrolled;
}

export async function authenticateWithBiometrics(promptMessage: string = 'Autenticación Biométrica de HogarIQ') {
  if (Platform.OS === 'web') return true;

  const result = await LocalAuthentication.authenticateAsync({
    promptMessage,
    fallbackLabel: 'Ingresar con contraseña',
    cancelLabel: 'Cancelar',
  });

  return result.success;
}
