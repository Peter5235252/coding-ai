const OFFLINE_MODE_KEY = 'zenith_gemini_offline_v1';

/**
 * Offline mode is only a UI preference. It never stores a key and never
 * bypasses the server-side vault; it simply lets the studio start without
 * prompting for a Gemini key.
 */
export function isOfflineModeEnabled(): boolean {
  try {
    return localStorage.getItem(OFFLINE_MODE_KEY) === '1';
  } catch {
    return false;
  }
}

export function markOfflineMode(): void {
  try {
    localStorage.setItem(OFFLINE_MODE_KEY, '1');
  } catch {
    // Storage can be unavailable in private browsing; the session still works.
  }
}

export function clearOfflineMode(): void {
  try {
    localStorage.removeItem(OFFLINE_MODE_KEY);
  } catch {
    // Ignore.
  }
}
