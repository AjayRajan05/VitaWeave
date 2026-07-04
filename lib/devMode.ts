/**
 * Demo / skip-login only when explicitly enabled — never in production/pilot builds.
 */
export function isDevModeEnabled(): boolean {
  if (process.env.NODE_ENV === 'production') {
    return process.env.EXPO_PUBLIC_DEV_MODE === 'true';
  }
  if (process.env.EXPO_PUBLIC_DEV_MODE === 'false') {
    return false;
  }
  if (process.env.EXPO_PUBLIC_DEV_MODE === 'true') {
    return true;
  }
  return typeof __DEV__ !== 'undefined' && __DEV__;
}
