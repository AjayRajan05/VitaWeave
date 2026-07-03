/** Canonical user roles — always lowercase in DB and routing. */
export type UserRole = 'asha' | 'doctor' | 'patient' | 'admin';

const ROLE_ALIASES: Record<string, UserRole> = {
  asha: 'asha',
  doctor: 'doctor',
  patient: 'patient',
  admin: 'admin',
  // Legacy / display casing from older schema and UI
  ASHA: 'asha',
  Doctor: 'doctor',
  Patient: 'patient',
  Admin: 'admin',
};

export function normalizeRole(role: string | null | undefined): UserRole | null {
  if (!role) return null;
  return ROLE_ALIASES[role] ?? null;
}

export function isUserRole(value: string | null | undefined): value is UserRole {
  return normalizeRole(value) !== null;
}

export function roleRoute(role: UserRole): '/(asha)' | '/(doctor)' | '/(patient)' {
  switch (role) {
    case 'asha':
      return '/(asha)';
    case 'doctor':
      return '/(doctor)';
    case 'patient':
      return '/(patient)';
    default:
      return '/(asha)';
  }
}

export function roleLoginPath(role: UserRole): '/asha-login' | '/doctor-login' | '/patient-login' {
  switch (role) {
    case 'asha':
      return '/asha-login';
    case 'doctor':
      return '/doctor-login';
    case 'patient':
      return '/patient-login';
    default:
      return '/asha-login';
  }
}
