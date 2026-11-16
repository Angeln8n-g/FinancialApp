'use client';

import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { API_URL } from '../lib/api';

/**
 * Hook para suscribirse en tiempo real a los eventos de sincronización del hogar familiar.
 */
export function useHouseholdSocket(
  householdId?: string,
  onDataChanged?: (data: any) => void,
) {
  const onDataChangedRef = useRef(onDataChanged);

  useEffect(() => {
    onDataChangedRef.current = onDataChanged;
  }, [onDataChanged]);

  useEffect(() => {
    if (!householdId) return;

    const socket: Socket = io(API_URL, {
      transports: ['polling', 'websocket'],
    });

    const handleConnect = () => {
      socket.emit('join_household', { householdId });
    };

    if (socket.connected) {
      handleConnect();
    } else {
      socket.on('connect', handleConnect);
    }

    const handleDataChanged = (data: any) => {
      onDataChangedRef.current?.(data);
    };

    socket.on('household_data_changed', handleDataChanged);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('household_data_changed', handleDataChanged);
      if (socket.connected) {
        socket.disconnect();
      } else {
        socket.close();
      }
    };
  }, [householdId]);
}
