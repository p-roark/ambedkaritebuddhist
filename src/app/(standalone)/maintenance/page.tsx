const DEFAULT_MESSAGE =
  'www.ambedkaritebuddhist.org is the official web presence for the Ambedkarite Buddhist Community of Canada.';

export default function MaintenancePage({
  searchParams,
}: {
  searchParams: { org?: string; msg?: string };
}) {
  const orgName = searchParams.org ?? 'Ambedkarite Buddhist Community of Canada';
  const message = searchParams.msg ?? DEFAULT_MESSAGE;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#2D4D9B] to-[#7F56D9] p-6">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full px-10 py-12 flex flex-col items-center text-center gap-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/logo.png"
          alt={`${orgName} logo`}
          width={80}
          height={80}
          className="rounded-xl"
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
