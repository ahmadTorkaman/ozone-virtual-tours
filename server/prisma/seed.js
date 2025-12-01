// ===========================================
// Ozone Virtual Tours - Database Seed Script
// ===========================================
// Run with: npm run db:seed
// Or automatically with: npx prisma migrate reset

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // -------------------------------------------
  // Seed Branding Settings
  // -------------------------------------------
  const existingBranding = await prisma.brandingSettings.findFirst();

  if (!existingBranding) {
    const branding = await prisma.brandingSettings.create({
      data: {
        companyName: 'Lube VR',
        primaryColor: '#7c8cfb',
        secondaryColor: '#9b72f2',
        poweredByText: 'powered by Ozone',
      },
    });
    console.log('✅ Created default branding settings:', branding.companyName);
  } else {
    console.log('ℹ️  Branding settings already exist, skipping...');
  }

  // -------------------------------------------
  // Seed First Admin User (for development)
  // -------------------------------------------
  // In production, the first user registers via invite bootstrap
  if (process.env.NODE_ENV === 'development') {
    const existingAdmin = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
    });

    if (!existingAdmin) {
      const admin = await prisma.user.create({
        data: {
          email: 'admin@example.com',
          name: 'Admin User',
          role: 'ADMIN',
        },
      });
      console.log('✅ Created development admin user:', admin.email);
    } else {
      console.log('ℹ️  Admin user already exists, skipping...');
    }
  }

  console.log('🌱 Database seed completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
