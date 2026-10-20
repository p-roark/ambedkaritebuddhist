import { getCloudflareContext } from '@opennextjs/cloudflare';

/**
 * Runs work after the response is sent. On Cloudflare Workers, unfinished
 * promises are cancelled once the response is returned unless they are
 * registered with ctx.waitUntil(), so background work (e.g. sending email)
 * must go through here. Failures are logged, never thrown.
 */
export function runInBackground(label: string, task: Promise<unknown>): void {
  const guarded = task.catch((error: unknown) => {
    console.error(`[background] ${label} failed:`, error);
  });

  try {
    getCloudflareContext().ctx.waitUntil(guarded);
  } catch {
    // Not running on Workers (tests, `next build`): the promise simply runs
  }
}
