import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';

/**
 * Hook de sincronización en tiempo real y revalidación en foco para el hogar activo.
 * Mantiene la paridad funcional con apps/web/src/hooks/useHouseholdSocket.ts
 */
export function useHouseholdSocket(
  householdId?: string,
  onDataChanged?: (data?: any) => void,
) {
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    if (!householdId || !onDataChanged) return;

    // 1. Revalidación automática cuando la app móvil vuelve al primer plano
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        onDataChanged({ reason: 'app_foreground' });
      }
      appState.current = nextAppState;
    });

    // 2. Intervalo sutil de sincronización automática en background suave (cada 30s)
    const interval = setInterval(() => {
      if (appState.current === 'active') {
        onDataChanged({ reason: 'heartbeat_sync' });
      }
    }, 30000);

    return () => {
      subscription.remove();
      clearInterval(interval);
    };
  }, [householdId, onDataChanged]);
}
