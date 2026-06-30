import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('👑 Seeding root orchestrator...');
  
  const email = 'orchestrator@communityhero.dev';
  const password = await bcrypt.hash('supersecret', 10);
  
  const orchestrator = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      name: 'System Orchestrator',
      role: 'ORCHESTRATOR',
      password,
      karma: 0,
    },
  });

  console.log(`✅ Root Orchestrator created: ${orchestrator.email}`);
  console.log(`Password: supersecret`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding orchestrator:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
