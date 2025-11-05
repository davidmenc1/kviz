import { prisma } from "../prisma/db";
import { beforeAll, afterAll, beforeEach } from "bun:test";

beforeAll(async () => {
  // Clean up test database
  await prisma.$executeRaw`PRAGMA foreign_keys = OFF`;
  await prisma.$executeRaw`DELETE FROM Session`;
  await prisma.$executeRaw`DELETE FROM InviteCode`;
  await prisma.$executeRaw`DELETE FROM Option`;
  await prisma.$executeRaw`DELETE FROM Question`;
  await prisma.$executeRaw`DELETE FROM Quiz`;
  await prisma.$executeRaw`DELETE FROM Admin`;
  await prisma.$executeRaw`PRAGMA foreign_keys = ON`;
});

afterAll(async () => {
  // Clean up after all tests
  await prisma.$executeRaw`PRAGMA foreign_keys = OFF`;
  await prisma.$executeRaw`DELETE FROM Session`;
  await prisma.$executeRaw`DELETE FROM InviteCode`;
  await prisma.$executeRaw`DELETE FROM Option`;
  await prisma.$executeRaw`DELETE FROM Question`;
  await prisma.$executeRaw`DELETE FROM Quiz`;
  await prisma.$executeRaw`DELETE FROM Admin`;
  await prisma.$executeRaw`PRAGMA foreign_keys = ON`;
  await prisma.$disconnect();
});

beforeEach(async () => {
  // Clean up before each test
  await prisma.$executeRaw`PRAGMA foreign_keys = OFF`;
  await prisma.$executeRaw`DELETE FROM Session`;
  await prisma.$executeRaw`DELETE FROM InviteCode`;
  await prisma.$executeRaw`DELETE FROM Option`;
  await prisma.$executeRaw`DELETE FROM Question`;
  await prisma.$executeRaw`DELETE FROM Quiz`;
  await prisma.$executeRaw`DELETE FROM Admin`;
  await prisma.$executeRaw`PRAGMA foreign_keys = ON`;
});

export { prisma };

