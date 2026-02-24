import { ReactNode } from 'react';

export const runtime = 'edge';

export default function AdminEventLayout({
  children,
  params: _params,
}: {
  children: ReactNode;
  params: Promise<{ id: string }>;
}) {
  return children;
}
