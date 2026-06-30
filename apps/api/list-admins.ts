import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const admins = await prisma.user.findMany({ where: { role: 'ADMIN' } });
  console.log('--- ADMIN ACCOUNTS ---');
  admins.forEach(a => {
    console.log(`Email: ${a.email}`);
    // Password is mathematically hashed by bcrypt, we cannot print it in plain text!
  });
}
main().finally(() => prisma.$disconnect());
