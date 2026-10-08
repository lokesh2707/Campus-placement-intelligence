import { PrismaClient, Role, UserStatus } from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting development database seed...');

  if (process.env.NODE_ENV === 'production') {
    throw new Error('❌ Refusing to run dev seed script in production!');
  }

  // Development password for all seeded test accounts
  const DEFAULT_DEV_PASSWORD = 'Password123!';
  const passwordHash = await argon2.hash(DEFAULT_DEV_PASSWORD, {
    type: argon2.argon2id,
  });

  const seedUsers = [
    {
      email: 'superadmin@campus.edu',
      firstName: 'System',
      lastName: 'Administrator',
      role: Role.SUPER_ADMIN,
      phone: '+919000000001',
    },
    {
      email: 'placementadmin@campus.edu',
      firstName: 'Placement',
      lastName: 'Director',
      role: Role.PLACEMENT_ADMIN,
      phone: '+919000000002',
    },
    {
      email: 'placementcoord@campus.edu',
      firstName: 'Placement',
      lastName: 'Coordinator',
      role: Role.PLACEMENT_COORDINATOR,
      phone: '+919000000003',
    },
    {
      email: 'deptcoord@campus.edu',
      firstName: 'CSE Department',
      lastName: 'Coordinator',
      role: Role.DEPARTMENT_COORDINATOR,
      phone: '+919000000004',
    },
    {
      email: 'recruiter@techcorp.com',
      firstName: 'Corporate',
      lastName: 'Recruiter',
      role: Role.RECRUITER,
      phone: '+919000000005',
    },
    {
      email: 'student@campus.edu',
      firstName: 'Aarav',
      lastName: 'Sharma',
      role: Role.STUDENT,
      phone: '+919000000006',
    },
  ];

  for (const user of seedUsers) {
    const upserted = await prisma.user.upsert({
      where: { email: user.email },
      update: {
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        status: UserStatus.ACTIVE,
        emailVerified: true,
      },
      create: {
        email: user.email,
        passwordHash,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        role: user.role,
        status: UserStatus.ACTIVE,
        emailVerified: true,
      },
    });

    console.log(`  ✓ Seeded ${user.role}: ${upserted.email} (Password: ${DEFAULT_DEV_PASSWORD})`);
  }

  console.log('✅ Development database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
