import { PrismaClient, Role, IssueCategory, IssueSeverity } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ── Departments ──
  const departments = await Promise.all([
    prisma.department.upsert({
      where: { name: 'Public Works' },
      update: {},
      create: {
        name: 'Public Works',
        contactEmail: 'publicworks@city.gov',
        issueCategories: [
          IssueCategory.POTHOLE,
          IssueCategory.ROAD_DAMAGE,
          IssueCategory.STREETLIGHT,
          IssueCategory.TRAFFIC_SIGNAL,
        ],
      },
    }),
    prisma.department.upsert({
      where: { name: 'Sanitation' },
      update: {},
      create: {
        name: 'Sanitation',
        contactEmail: 'sanitation@city.gov',
        issueCategories: [
          IssueCategory.GARBAGE,
          IssueCategory.ILLEGAL_DUMPING,
          IssueCategory.SEWAGE,
        ],
      },
    }),
    prisma.department.upsert({
      where: { name: 'Water & Utilities' },
      update: {},
      create: {
        name: 'Water & Utilities',
        contactEmail: 'water@city.gov',
        issueCategories: [IssueCategory.WATER_SUPPLY],
      },
    }),
    prisma.department.upsert({
      where: { name: 'Parks & Recreation' },
      update: {},
      create: {
        name: 'Parks & Recreation',
        contactEmail: 'parks@city.gov',
        issueCategories: [IssueCategory.PARK_MAINTENANCE],
      },
    }),
    prisma.department.upsert({
      where: { name: 'Public Safety' },
      update: {},
      create: {
        name: 'Public Safety',
        contactEmail: 'safety@city.gov',
        issueCategories: [
          IssueCategory.PUBLIC_SAFETY,
          IssueCategory.NOISE_COMPLAINT,
        ],
      },
    }),
  ]);

  console.log(`  ✅ ${departments.length} departments seeded`);

  // ── Admin user ──
  const admin = await prisma.user.upsert({
    where: { email: 'admin@communityhero.dev' },
    update: {},
    create: {
      email: 'admin@communityhero.dev',
      name: 'Platform Admin',
      role: Role.ADMIN,
      karma: 0,
    },
  });

  console.log(`  ✅ Admin user seeded: ${admin.email}`);

  // ── Badges ──
  const badges = await Promise.all([
    prisma.badge.upsert({
      where: { name: 'First Report' },
      update: {},
      create: {
        name: 'First Report',
        description: 'Reported your first civic issue',
        iconUrl: '/badges/first-report.svg',
        condition: '{"type":"issue_count","threshold":1}',
      },
    }),
    prisma.badge.upsert({
      where: { name: 'Watchdog' },
      update: {},
      create: {
        name: 'Watchdog',
        description: 'Reported 10 civic issues',
        iconUrl: '/badges/watchdog.svg',
        condition: '{"type":"issue_count","threshold":10}',
      },
    }),
    prisma.badge.upsert({
      where: { name: 'Community Verifier' },
      update: {},
      create: {
        name: 'Community Verifier',
        description: 'Verified 5 issues reported by others',
        iconUrl: '/badges/verifier.svg',
        condition: '{"type":"verify_count","threshold":5}',
      },
    }),
    prisma.badge.upsert({
      where: { name: 'Karma Champion' },
      update: {},
      create: {
        name: 'Karma Champion',
        description: 'Accumulated 100 karma points',
        iconUrl: '/badges/karma-champion.svg',
        condition: '{"type":"karma_threshold","threshold":100}',
      },
    }),
    prisma.badge.upsert({
      where: { name: 'Resolver' },
      update: {},
      create: {
        name: 'Resolver',
        description: 'Had 5 of your reported issues resolved',
        iconUrl: '/badges/resolver.svg',
        condition: '{"type":"resolved_count","threshold":5}',
      },
    }),
  ]);

  console.log(`  ✅ ${badges.length} badges seeded`);

  console.log('');
  console.log('✅ Seeding complete.');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
