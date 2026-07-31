/**
 * Local-first WatermelonDB bootstrap (plan 2B).
 * Native: SQLiteAdapter | Web/tests: LokiJSAdapter
 */
import { Platform } from 'react-native';
import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import LokiJSAdapter from '@nozbe/watermelondb/adapters/lokijs';
import { watermelonSchema, LOCAL_DB_NAME } from './watermelonSchema';
import { migrations } from './migrations';
import { modelClasses } from './models';
import { logger } from '../logger';

let databasePromise: Promise<Database> | null = null;

function createLokiAdapter() {
  return new LokiJSAdapter({
    schema: watermelonSchema,
    migrations,
    useWebWorker: false,
    useIncrementalIndexedDB: Platform.OS === 'web',
    dbName: LOCAL_DB_NAME,
  });
}

function createAdapter() {
  if (Platform.OS === 'web') {
    return createLokiAdapter();
  }

  try {
    return new SQLiteAdapter({
      schema: watermelonSchema,
      migrations,
      dbName: LOCAL_DB_NAME,
      // Expo 57 / New Architecture: prefer bridge mode until JSI path is validated on device
      jsi: false,
      onSetUpError: (error) => {
        logger.error('WatermelonDB SQLite setup failed', error);
      },
    });
  } catch (error) {
    logger.warn('SQLiteAdapter unavailable, falling back to LokiJS', error);
    return createLokiAdapter();
  }
}

async function openDatabase(): Promise<Database> {
  const adapter = createAdapter();
  const database = new Database({
    adapter,
    modelClasses,
  });
  logger.info('WatermelonDB ready', { platform: Platform.OS, db: LOCAL_DB_NAME });
  return database;
}

export async function getWatermelonDatabase(): Promise<Database> {
  if (!databasePromise) {
    databasePromise = openDatabase().catch(async (error) => {
      logger.warn('WatermelonDB open failed, retrying with LokiJS', error);
      return new Database({
        adapter: createLokiAdapter(),
        modelClasses,
      });
    });
  }
  return databasePromise;
}

/** @deprecated Prefer getWatermelonDatabase - kept for call-site compatibility during migration */
export async function getDatabase(): Promise<Database> {
  return getWatermelonDatabase();
}

export async function resetLocalDatabaseForTests(): Promise<void> {
  if (databasePromise) {
    try {
      const db = await databasePromise;
      await db.write(async () => {
        await db.unsafeResetDatabase();
      });
    } catch {
      // ignore
    }
  }
  databasePromise = null;
}

export function newLocalId(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }
  return `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}
