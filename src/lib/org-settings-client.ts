// Shared client-side loader for the public org settings. The header, footer
// and contact page all need them; sharing one request per page load (plus the
// browser cache set by the API) avoids extra Worker invocations.
let pending: Promise<{ settings?: unknown }> | null = null;

export function fetchOrgSettings<T>(): Promise<{ settings?: T }> {
  if (!pending) {
    pending = fetch('/api/events?resource=org-settings')
      .then((r) => {
        if (!r.ok) throw new Error(`Failed to load org settings (${r.status})`);
        return r.json() as Promise<{ settings?: unknown }>;
      })
      .catch((error: unknown) => {
        pending = null; // allow a retry on the next call
        throw error;
      });
  }
  return pending as Promise<{ settings?: T }>;
}

// The donation address has its own short-cached request (see /api/donation-email)
// so a change in Settings shows within a minute; shared by the pop-up and page.
let pendingDonationEmail: Promise<string | null> | null = null;

/**
 * Interac e-Transfer address for donations (Settings → Email → Donations, or
 * the organization email). Falls back to the organization email from the org
 * settings if that request fails, and to null if both fail.
 */
export function fetchDonationEmail(): Promise<string | null> {
  if (!pendingDonationEmail) {
    pendingDonationEmail = fetch('/api/donation-email')
      .then((r) => (r.ok ? (r.json() as Promise<{ email?: string }>) : Promise.reject(new Error(String(r.status)))))
      .then((data) => data.email ?? null)
      .catch(async () => {
        pendingDonationEmail = null; // allow a retry on the next call
        const { settings } = await fetchOrgSettings<{ email?: string }>().catch(() => ({ settings: undefined }));
        return settings?.email ?? null;
      });
  }
  return pendingDonationEmail;
}
