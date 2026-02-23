import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create admin user
  const adminEmail = process.env.ADMIN_EMAIL || 'pankaj9um@gmail.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  const adminReferralCode = process.env.ADMIN_REFERRAL_CODE || 'BHIM-ABC-7K2M';

  // Hash the password
  const passwordHash = await bcrypt.hash(adminPassword, 12);

  // Check if admin already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail }
  });

  if (existingAdmin) {
    console.log('Admin user already exists, skipping...');
    return;
  }

  // Create admin user
  const admin = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: adminEmail,
      passwordHash,
      role: 'ADMIN',
      emailVerified: new Date(),
    }
  });

  // Create admin referral code
  await prisma.referralCode.create({
    data: {
      code: adminReferralCode,
      ownerId: admin.id,
      maxUses: 50, // Admin gets more uses
      currentUses: 0,
      active: true,
    }
  });

  console.log(`Created admin user: ${adminEmail}`);
  console.log(`Created referral code: ${adminReferralCode}`);
  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });