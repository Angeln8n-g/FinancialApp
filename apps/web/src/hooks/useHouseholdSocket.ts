'use client';

import { useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { API_URL } from '../lib/api';

/**
 * Hook para suscribirse en tiempo real a los eventos de sincronización del hogar familiar.
 */
export function useHouseholdSocket(
  householdId?: string,
  onDataChanged?: (data: any) => void,
) {
  useEffect(() => {
    if (!householdId) return;

    const socket: Socket = io(API_URL, {
      transports: ['websocket', 'polling'],
    });

    socket.emit('join_household', { householdId });

    if (onDataChanged) {
      socket.on('household_data_changed', (data) => {
        onDataChanged(data);
      });
    }

    return () => {
      socket.disconnect();
    };
  }, [householdId, onDataChanged]);
}
