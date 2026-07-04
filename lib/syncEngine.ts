import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import { logger } from './logger';

const SYNC_QUEUE_STORAGE_KEY = '@vitaweave_sync_queue';

export const SYNC_TABLES = [
  'patients',
  'referrals',
  'medication_reminders',
  'vaccinations',
  'medical_records',
  'dashboard_tasks',
  'community_alerts',
  'symptom_reports',
  'weekly_alerts',
  'appointments',
  'patient_vitals',
  'profiles',
  'campaigns',
  'video_calls',
  'push_tokens',
  'scoring_audit',
  'audit_log',
  'asha_compliance_logs',
] as const;

export type SyncAction = 'insert' | 'update' | 'delete';

export type SyncOperation = {
  id: string;
  table: string;
  action: SyncAction;
  recordId?: number | string;
  payload: Record<string, unknown>;
  timestamp: number;
  conflictKey: string;
};

type SyncListener = (pendingCount: number) => void;
const listeners = new Set<SyncListener>();

function generateQueueId() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function subscribeSyncStatus(listener: SyncListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

async function emitSyncStatus() {
  const count = (await getSyncQueue()).length;
  listeners.forEach((l) => l(count));
}

export async function getSyncQueue(): Promise<SyncOperation[]> {
  try {
    const raw = await AsyncStorage.getItem(SYNC_QUEUE_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SyncOperation[];
  } catch {
    return [];
  }
}

export async function getPendingSyncCount(): Promise<number> {
  return (await getSyncQueue()).length;
}

async function setSyncQueue(queue: SyncOperation[]) {
  await AsyncStorage.setItem(SYNC_QUEUE_STORAGE_KEY, JSON.stringify(queue));
  await emitSyncStatus();
}

export async function enqueueSyncOperation(operation: Omit<SyncOperation, 'id'>) {
  const queue = await getSyncQueue();
  const existing = queue.findIndex((q) => q.conflictKey === operation.conflictKey);
  const entry: SyncOperation = { id: generateQueueId(), ...operation };
  if (existing >= 0) {
    queue[existing] = entry;
  } else {
    queue.push(entry);
  }
  await setSyncQueue(queue);
}

function getRowTimestamp(row: Record<string, unknown>): number {
  const timestamp = row.updated_at || row.created_at;
  return timestamp ? Date.parse(String(timestamp)) : 0;
}

function mergeRemoteWithLocal(
  remote: Record<string, unknown>,
  localPayload: Record<string, unknown>,
  opTimestamp: number
) {
  const merged = { ...remote };
  const remoteTimestamp = getRowTimestamp(remote);
  for (const key of Object.keys(localPayload)) {
    const localValue = localPayload[key];
    if (remoteTimestamp > opTimestamp && remote[key] !== undefined && remote[key] !== localValue) {
      continue;
    }
    merged[key] = localValue;
  }
  merged.updated_at = new Date(Math.max(remoteTimestamp, opTimestamp)).toISOString();
  return merged;
}

async function processSyncOperation(operation: SyncOperation): Promise<boolean> {
  try {
    if (operation.action === 'insert') {
      const { error } = await supabase.from(operation.table).insert([operation.payload]);
      if (error) throw error;
      return true;
    }
    if (operation.action === 'delete') {
      if (operation.recordId === undefined) return true;
      const { error } = await supabase.from(operation.table).delete().eq('id', operation.recordId);
      if (error) throw error;
      return true;
    }
    if (operation.action === 'update') {
      if (operation.recordId === undefined) return true;
      const { data: remoteRow, error: fetchError } = await supabase
        .from(operation.table)
        .select('*')
        .eq('id', operation.recordId)
        .maybeSingle();

      if (fetchError || !remoteRow) {
        const { error } = await supabase
          .from(operation.table)
          .upsert([{ id: operation.recordId, ...operation.payload }], { onConflict: 'id' });
        if (error) throw error;
        return true;
      }

      const merged = mergeRemoteWithLocal(remoteRow, operation.payload, operation.timestamp);
      const { error } = await supabase.from(operation.table).upsert([merged], { onConflict: 'id' });
      if (error) throw error;
      return true;
    }
    return false;
  } catch (error) {
    logger.warn('Sync operation failed, will retry:', operation.table, error);
    return false;
  }
}

export async function syncQueue(): Promise<void> {
  const queue = await getSyncQueue();
  if (!queue.length) {
    await emitSyncStatus();
    return;
  }

  const nextQueue: SyncOperation[] = [];
  for (const operation of queue) {
    const success = await processSyncOperation(operation);
    if (!success) nextQueue.push(operation);
  }
  await setSyncQueue(nextQueue);
}

/**
 * Queue-first write: always persist locally, flush immediately when online.
 */
export async function writeThroughQueue<T>(params: {
  table: string;
  action: SyncAction;
  recordId?: string | number;
  payload: Record<string, unknown>;
  conflictKey: string;
  online: () => Promise<{ data: T | null; error: unknown }>;
}): Promise<{ data: T | null; error: unknown }> {
  await enqueueSyncOperation({
    table: params.table,
    action: params.action,
    recordId: params.recordId,
    payload: params.payload,
    timestamp: Date.now(),
    conflictKey: params.conflictKey,
  });

  try {
    const result = await params.online();
    if (!result.error) {
      await syncQueue();
    }
    return result;
  } catch (error) {
    await syncQueue();
    return { data: null, error };
  }
}

export async function queueTableUpdate(
  table: string,
  recordId: number | string,
  payload: Record<string, unknown>
) {
  return writeThroughQueue({
    table,
    action: 'update',
    recordId,
    payload,
    conflictKey: `${table}:${recordId}`,
    online: async () => {
      const { data, error } = await supabase
        .from(table)
        .update(payload)
        .eq('id', recordId)
        .select()
        .maybeSingle();
      return { data, error };
    },
  });
}
