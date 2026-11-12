/**
 * HogarIQ - Motor de Sincronización Resiliente y Cola Offline (PWA)
 * Permite registrar movimientos sin conexión y sincronizarlos automáticamente
 * cuando el dispositivo recupera la red.
 */

export interface QueuedTransaction {
  id: string;
  createdAt: string;
  attempts: number;
  payload: {
    accountId: string;
    destinationAccountId?: string;
    categoryId?: string;
    type: 'EXPENSE' | 'INCOME' | 'TRANSFER';
    amount: number;
    description?: string;
    date?: string;
  };
}

const STORAGE_KEY = 'hogariq_offline_queue';
const SYNC_EVENT_NAME = 'hogariq_offline_event';

export function getOfflineQueue(): QueuedTransaction[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Error leyendo cola offline:', e);
    return [];
  }
}

export function saveOfflineQueue(queue: QueuedTransaction[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
    notifyOfflineQueueChange();
  } catch (e) {
    console.error('Error guardando cola offline:', e);
  }
}

export function enqueueOfflineTransaction(payload: QueuedTransaction['payload']): QueuedTransaction {
  const queue = getOfflineQueue();
  const newItem: QueuedTransaction = {
    id: `offline_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    createdAt: new Date().toISOString(),
    attempts: 0,
    payload,
  };
  queue.push(newItem);
  saveOfflineQueue(queue);
  return newItem;
}

export function removeOfflineTransaction(id: string): void {
  const queue = getOfflineQueue().filter((item) => item.id !== id);
  saveOfflineQueue(queue);
}

export function clearOfflineQueue(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
  notifyOfflineQueueChange();
}

function notifyOfflineQueueChange(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(SYNC_EVENT_NAME, { detail: { count: getOfflineQueue().length } }));
}

/**
 * Procesa la cola offline contra el backend de HogarIQ
 */
export async function flushOfflineQueue(
  apiUrl: string,
  token: string,
  onItemSynced?: (item: QueuedTransaction) => void
): Promise<{ success: number; failed: number }> {
  const queue = getOfflineQueue();
  if (queue.length === 0 || !token) {
    return { success: 0, failed: 0 };
  }

  let successCount = 0;
  let failCount = 0;
  const remainingQueue: QueuedTransaction[] = [];

  for (const item of queue) {
    try {
      const res = await fetch(`${apiUrl}/api/transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(item.payload),
      });

      if (res.ok) {
        successCount++;
        if (onItemSynced) onItemSynced(item);
      } else {
        // Error de validación o del servidor (no de conectividad)
        item.attempts += 1;
        if (item.attempts < 5) {
          remainingQueue.push(item);
        }
        failCount++;
      }
    } catch (networkErr) {
      // Fallo de red continuo: conservar en cola y abortar procesamiento del lote actual
      remainingQueue.push(item);
      failCount++;
      break;
    }
  }

  saveOfflineQueue(remainingQueue);
  return { success: successCount, failed: failCount };
}
