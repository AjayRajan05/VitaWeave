import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import { getCurrentUser, getUserProfile } from './auth';
import { isDevModeEnabled } from './devMode';
import { normalizeRole, type UserRole } from './roles';

const USER_ROLE_KEY = 'user_role';
const USER_ID_KEY = 'user_id';

export async function persistSession(role: UserRole, userId?: string): Promise<void> {
  await AsyncStorage.setItem(USER_ROLE_KEY, role);
  if (userId) {
    await AsyncStorage.setItem(USER_ID_KEY, userId);
  }
}

export async function clearSession(): Promise<void> {
  await AsyncStorage.multiRemove([USER_ROLE_KEY, USER_ID_KEY]);
  await supabase.auth.signOut();
}

export async function verifyRoleAccess(requiredRole: UserRole): Promise<{
  allowed: boolean;
  userId?: string;
  reason?: string;
}> {
  const user = await getCurrentUser();

  if (!user) {
    if (isDevModeEnabled()) {
      const storedRole = await AsyncStorage.getItem(USER_ROLE_KEY);
      if (storedRole === requiredRole) {
        return { allowed: true };
      }
    }
    return { allowed: false, reason: 'not_authenticated' };
  }

  const { data: profile, error } = await getUserProfile(user.id);
  if (error || !profile) {
    return { allowed: false, reason: 'profile_missing' };
  }

  const role = normalizeRole(profile.role);
  if (role !== requiredRole) {
    return { allowed: false, reason: 'role_mismatch', userId: user.id };
  }

  await persistSession(role, user.id);
  return { allowed: true, userId: user.id };
}

export function useRoleGuard(requiredRole: UserRole) {
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);
  const [userId, setUserId] = useState<string | undefined>();

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const result = await verifyRoleAccess(requiredRole);
      if (cancelled) return;

      if (!result.allowed) {
        if (result.reason === 'role_mismatch') {
          await clearSession();
        }
        router.replace('/login');
        return;
      }

      setUserId(result.userId);
      setIsReady(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [requiredRole, router]);

  return { isReady, userId };
}

export async function getStoredUserId(): Promise<string | null> {
  const fromStorage = await AsyncStorage.getItem(USER_ID_KEY);
  if (fromStorage) return fromStorage;

  const user = await getCurrentUser();
  return user?.id ?? null;
}
