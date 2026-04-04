import Image from 'next/image';

export const runtime = 'edge';

const DEFAULT_MESSAGE =
  "We're currently performing scheduled maintenance. We'll be back shortly — thank you for your patience.";

async function getMaintenanceInfo(): Promise<{ orgName: string; message: string }> {
  try {
    const [{ eq }, { getDb }, { organizationSettings }] = await Promise.all([
      import('drizzle-orm'),
      import('@/db'),
      import('@/db/schema'),
    ]);
    const db = getDb();
    const rows = await db
      .select({
        orgName: organizationSettings.orgName,
        maintenanceMessage: organizationSettings.maintenanceMessage,
      })
      .from(organizationSettings)
      .where(eq(organizationSettings.id, 'main'))
      .limit(1);

    const row = rows[0];
    return {
      orgName: row?.orgName ?? 'Ambedkarite Buddhist Community of Canada',
      message: row?.maintenanceMessage ?? DEFAULT_MESSAGE,
    };
  } catch {
    return { orgName: 'Ambedkarite Buddhist Community of Canada', message: DEFAULT_MESSAGE };
  }
}

export default async function MaintenancePage() {
  const { orgName, message } = await getMaintenanceInfo();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#2D4D9B] to-[#7F56D9] p-6">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full px-10 py-12 flex flex-col items-center text-center gap-6">
        <Image
          src="/images/logo.png"
          alt={`${orgName} logo`}
          width={80}
          height={80}
          className="rounded-xl"
          priority
        />
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">{orgName}</h1>
          <p className="text-sm font-semibold text-[#2D4D9B] uppercase tracking-widest">Under Maintenance</p>
        </div>
        <div className="w-12 h-px bg-gray-200" />
        <p className="text-gray-600 text-sm leading-relaxed">{message}</p>
        <p className="text-xs text-gray-400 mt-2">☸ Please check back soon</p>
      </div>
    </div>
  );
}
