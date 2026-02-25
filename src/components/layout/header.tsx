import { eq } from 'drizzle-orm';
import { getDb } from '@/db';
import { organizationSettings } from '@/db/schema';
import { Navigation } from './navigation';

async function getShortName(): Promise<string> {
  try {
    const db = getDb();
    const row = await db
      .select({ shortName: organizationSettings.shortName })
      .from(organizationSettings)
      .where(eq(organizationSettings.id, 'main'))
      .limit(1)
      .then((rows) => rows[0]);
    return row?.shortName ?? 'ABC Canada';
  } catch {
    return 'ABC Canada';
  }
}

export async function Header() {
  const shortName = await getShortName();
  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm">
      <Navigation shortName={shortName} />
    </header>
  );
}
