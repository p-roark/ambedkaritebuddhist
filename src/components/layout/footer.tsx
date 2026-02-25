import { eq } from 'drizzle-orm';
import { getDb } from '@/db';
import { organizationSettings } from '@/db/schema';

async function getOrgSettings() {
  try {
    const db = getDb();
    return await db
      .select({ orgName: organizationSettings.orgName, shortName: organizationSettings.shortName, email: organizationSettings.email, description: organizationSettings.description })
      .from(organizationSettings)
      .where(eq(organizationSettings.id, 'main'))
      .limit(1)
      .then((rows) => rows[0]);
  } catch {
    return null;
  }
}

export async function Footer() {
  const currentYear = new Date().getFullYear();
  const org = await getOrgSettings();
  const shortName = org?.shortName ?? 'ABC Canada';
  const email = org?.email ?? 'info@ambedkaritebuddhist.ca';
  const orgName = org?.orgName ?? 'Ambedkarite Buddhist Organization Canada';
  const description = org?.description ?? 'Fostering unity, education, and social welfare.';

  return (
    <footer className="bg-text-dark text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-4">
          {/* Logo/Name */}
          <div>
            <h3 className="font-poppins text-xl font-bold mb-2 text-primary-saffron">🪷 {shortName}</h3>
            <p className="text-gray-300 text-sm leading-relaxed font-noto-sans max-w-2xl mx-auto">
              {description}
            </p>
          </div>

          {/* Contact */}
          <div className="pt-6 pb-6">
            <p className="text-gray-300 text-sm">
              Email: <a href={`mailto:${email}`} className="hover:text-primary-saffron transition-colors">{email}</a>
            </p>
          </div>

          {/* Copyright */}
          <div className="border-t border-gray-700 pt-6">
            <p className="text-gray-400 text-sm">
              © {currentYear} {orgName}. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
