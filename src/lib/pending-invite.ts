// Remembers the invite code from /join for the browser tab, so an invitee who
// navigates away before finishing registration is sent back to the form.
const STORAGE_KEY = 'abcc.pendingInviteCode';

export function readPendingInviteCode(): string | null {
  try {
    return window.sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function savePendingInviteCode(code: string) {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, code);
  } catch {
    // Storage unavailable (private mode) — the invite link still works on its own
  }
}

export function clearPendingInviteCode() {
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
