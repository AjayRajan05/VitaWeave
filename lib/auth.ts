import { supabase } from './supabase';
import { normalizeRole, type UserRole } from './roles';
import { persistSession, clearSession } from './authGuard';
import { SentryManager } from './sentry';
import { Analytics } from './analytics';

export type { UserRole };

/**
 * Sign in with Email and Password
 */
export async function signInWithEmail(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        console.error('Sign In error:', error.message);
        return { error };
    }

    return { data };
}

/**
 * Sign up with Email and Password — stores lowercase role in profiles.
 */
export async function signUpWithEmail(
    email: string,
    password: string,
    name: string,
    role: UserRole | 'ASHA' | 'Doctor' | 'Patient'
) {
    const normalizedRole = normalizeRole(role);
    if (!normalizedRole) {
        return { error: new Error('Invalid role') };
    }

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: name,
            },
        },
    });

    if (error) {
        console.error('Sign Up error:', error.message);
        return { error };
    }

    if (data.user) {
        const { error: profileError } = await supabase.from('profiles').upsert({
            id: data.user.id,
            email,
            name,
            role: normalizedRole,
        });

        if (profileError) {
            console.error('Profile Creation error:', profileError.message);
            return { error: profileError };
        }

        if (normalizedRole === 'patient') {
            const { error: patientError } = await supabase.from('patients').insert({
                name,
                age: 0,
                gender: 'Not Specified',
                condition: 'General',
                status: 'Stable',
                risk_level: 'Low',
                profile_id: data.user.id,
            });

            if (patientError) {
                console.error('Patient record creation error:', patientError.message);
            }
        }
    }

    return { data };
}

/**
 * Verify session + profile role after login, then persist routing state.
 */
export async function completeRoleLogin(expectedRole: UserRole) {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !sessionData.session?.user) {
        throw new Error('Authentication session not found. Please log in again.');
    }

    const user = sessionData.session.user;
    const { data: profile, error: profileError } = await getUserProfile(user.id);

    if (profileError || !profile) {
        await clearSession();
        throw new Error('User profile not found. Please contact support.');
    }

    const role = normalizeRole(profile.role);
    if (role !== expectedRole) {
        await clearSession();
        throw new Error(
            `This account is registered as ${role ?? 'unknown'}. Please use the correct portal.`
        );
    }

    await persistSession(role, user.id);

    SentryManager.setUser({
      id: user.id,
      email: user.email,
      username: profile.name,
    });
    Analytics.trackAuth('login', role);

    return { user, profile, role };
}

/**
 * Sign out and clear local session state.
 */
export async function signOutUser() {
    SentryManager.clearUser();
    Analytics.trackAuth('logout');
    await clearSession();
}

/** Kept for existing imports */
export async function signOut() {
    await clearSession();
}

/**
 * Get current session user
 */
export async function getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
}

/**
 * Get profile data for the logged in user
 */
export async function getUserProfile(userId: string) {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    return { data, error };
}
