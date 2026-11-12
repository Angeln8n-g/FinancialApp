'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  getOfflineQueue,
  enqueueOfflineTransaction,
  flushOfflineQueue,
  QueuedTransaction,
} from '@/lib/offlineSync';

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncResult, setLastSyncResult] = useState<{ success: number; failed: number } | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  const getToken = () => (typeof window !== 'undefined' ? localStorage.getItem('hogariq_token') : null);

  const updateStatus = useCallback(() => {
    if (typeof window !== 'undefined') {
      setIsOnline(navigator.onLine);
      setPendingCount(getOfflineQueue().length);
    }
  }, []);

  const syncNow = useCallback(async () => {
    const token = getToken();
    if (!token || !navigator.onLine || isSyncing) return { success: 0, failed: 0 };

    setIsSyncing(true);
    try {
      const result = await flushOfflineQueue(API_URL, token);
      setLastSyncResult(result);
      updateStatus();
      return result;
    } finally {
      setIsSyncing(false);
    }
  }, [API_URL, isSyncing, updateStatus]);

  useEffect(() => {
    updateStatus();

    const handleOnline = () => {
      setIsOnline(true);
      // Auto-sincronizar inmediatamente al volver a tener red
      syncNow();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    const handleQueueChange = () => {
      setPendingCount(getOfflineQueue().length);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('hogariq_offline_event', handleQueueChange);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('hogariq_offline_event', handleQueueChange);
    };
  }, [syncNow, updateStatus]);

  const queueTransaction = useCallback(
    (payload: QueuedTransaction['payload']) => {
      const item = enqueueOfflineTransaction(payload);
      updateStatus();
      return item;
    },
    [updateStatus]
  );

  return {
    isOnline,
    pendingCount,
    isSyncing,
    lastSyncResult,
    queueTransaction,
    syncNow,
  };
}
