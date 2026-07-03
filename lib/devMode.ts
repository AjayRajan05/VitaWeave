/**
 * Demo / skip-login is only available when explicitly enabled.
 * Set EXPO_PUBLIC_DEV_MODE=true in .env for local demos outside __DEV__ builds.
 */
export function isDevModeEnabled(): boolean {
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    return process.env.EXPO_PUBLIC_DEV_MODE !== 'false';
  }
  return process.env.EXPO_PUBLIC_DEV_MODE === 'true';
}
