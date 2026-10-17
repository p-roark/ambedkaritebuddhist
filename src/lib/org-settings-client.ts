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
