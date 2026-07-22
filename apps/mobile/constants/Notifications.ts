import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configurar comportamiento por defecto de notificaciones
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function requestNotificationPermissions() {
  if (Platform.OS === 'web') return true;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  return finalStatus === 'granted';
}

export async function sendLocalNotification(title: string, body: string) {
  if (Platform.OS === 'web') {
    console.log(`[Push Notification Web] ${title}: ${body}`);
    return;
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: 'default',
    },
    trigger: null, // Despacho inmediato
  });
}
