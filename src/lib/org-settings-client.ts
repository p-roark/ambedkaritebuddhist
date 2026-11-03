// Shared client-side loader for the public org settings. The header, footer
// and contact page all need them; sharing one request per page load (plus the
// browser cache set by the API) avoids extra Worker invocations.
type OrgSettingsResponse = { settings?: unknown; donationEmail?: string };

let pending: Promise<OrgSettingsResponse> | null = null;

export function fetchOrgSettings<T>(): Promise<{ settings?: T }> {
  if (!pending) {
    pending = fetch('/api/events?resource=org-settings')
      .then((r) => {
        if (!r.ok) throw new Error(`Failed to load org settings (${r.status})`);
        return r.json() as Promise<OrgSettingsResponse>;
      })
      .catch((error: unknown) => {
        pending = null; // allow a retry on the next call
        throw error;
      });
  }
  return pending as Promise<{ settings?: T }>;
}

/** Interac e-Transfer address for donations (Settings → Email → Donations, or the organization email). */
export async function fetchDonationEmail(): Promise<string | null> {
  const data = (await fetchOrgSettings().catch(() => ({}))) as OrgSettingsResponse;
  return data.donationEmail ?? null;
}
