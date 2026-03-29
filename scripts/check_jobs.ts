import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
  const jobs = await prisma.scriptJob.findMany({
    where: { status: { in: ['PENDING', 'PROCESSING'] } },
    select: { id: true, status: true, topic: true, videoUrl: true, createdAt: true, updatedAt: true }
  });
  console.table(jobs);
}

check().then(() => prisma.$disconnect());
