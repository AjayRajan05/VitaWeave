import AsyncStorage from '@react-native-async-storage/async-storage';
import type { UserRole } from './roles';

const USER_ROLE_KEY = 'user_role';
const USER_ID_KEY = 'user_id';

export async function persistSession(role: UserRole, userId?: string): Promise<void> {
  await AsyncStorage.setItem(USER_ROLE_KEY, role);
  if (userId) {
    await AsyncStorage.setItem(USER_ID_KEY, userId);
  }
}

export async function clearSessionStorage(): Promise<void> {
  await AsyncStorage.multiRemove([USER_ROLE_KEY, USER_ID_KEY]);
}

export async function getStoredUserId(): Promise<string | null> {
  return AsyncStorage.getItem(USER_ID_KEY);
}

export async function getStoredRole(): Promise<string | null> {
  return AsyncStorage.getItem(USER_ROLE_KEY);
}
