import { describe, it, expect, beforeEach } from "bun:test";
import { appRouter } from "../router";
import { prisma } from "./setup";
import { nanoid } from "nanoid";

describe("Admin Routes", () => {
  beforeEach(async () => {
    await prisma.$executeRaw`PRAGMA foreign_keys = OFF`;
    await prisma.$executeRaw`DELETE FROM Session`;
    await prisma.$executeRaw`DELETE FROM InviteCode`;
    await prisma.$executeRaw`DELETE FROM Admin`;
    await prisma.$executeRaw`PRAGMA foreign_keys = ON`;
  });

  it("should create admin", async () => {
    const caller = appRouter.createCaller({ admin: null });
    const result = await caller.admin.createAdmin({
      username: "admin",
      password: "pass123",
    });
    expect(result.admin.username).toBe("admin");
  });

  it("should login", async () => {
    await prisma.admin.create({
      data: {
        id: nanoid(),
        username: "admin",
        password: await Bun.password.hash("pass123"),
      },
    });

    const caller = appRouter.createCaller({ admin: null });
    const result = await caller.admin.login({
      username: "admin",
      password: "pass123",
    });
    expect(result.admin.username).toBe("admin");
  });

  it("should get admin info when authenticated", async () => {
    const admin = await prisma.admin.create({
      data: {
        id: nanoid(),
        username: "admin",
        password: await Bun.password.hash("pass123"),
      },
    });

    const caller = appRouter.createCaller({
      admin: { id: admin.id, username: admin.username },
    });
    const result = await caller.admin.me();
    expect(result.username).toBe("admin");
  });

  it("should create invite code", async () => {
    const admin = await prisma.admin.create({
      data: {
        id: nanoid(),
        username: "admin",
        password: await Bun.password.hash("pass123"),
      },
    });

    const caller = appRouter.createCaller({
      admin: { id: admin.id, username: admin.username },
    });
    const result = await caller.admin.createInviteCode({ expiresInDays: 30 });
    expect(result.code).toBeDefined();
  });
});
