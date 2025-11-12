import { describe, it, expect, beforeEach } from "bun:test";
import { appRouter } from "../router";
import { prisma } from "./setup";
import { nanoid } from "nanoid";

describe("Quiz Routes", () => {
  let adminId: string;

  beforeEach(async () => {
    await prisma.$executeRaw`PRAGMA foreign_keys = OFF`;
    await prisma.$executeRaw`DELETE FROM Option`;
    await prisma.$executeRaw`DELETE FROM Question`;
    await prisma.$executeRaw`DELETE FROM Quiz`;
    await prisma.$executeRaw`DELETE FROM Admin`;
    await prisma.$executeRaw`PRAGMA foreign_keys = ON`;

    const admin = await prisma.admin.create({
      data: {
        id: nanoid(),
        username: "admin",
        password: await Bun.password.hash("pass123"),
      },
    });
    adminId = admin.id;
  });

  it("should create a quiz", async () => {
    const caller = appRouter.createCaller({
      admin: { id: adminId, username: "admin" },
    });
    const result = await caller.quiz.createQuiz({
      name: "Test Quiz",
      description: "Test Description",
    });
    expect(result.name).toBe("Test Quiz");
  });

  it("should get all quizzes", async () => {
    await prisma.quiz.create({
      data: { id: nanoid(), name: "Quiz 1", description: "Desc 1" },
    });
    await prisma.quiz.create({
      data: { id: nanoid(), name: "Quiz 2", description: "Desc 2" },
    });

    const caller = appRouter.createCaller({
      admin: { id: adminId, username: "admin" },
    });
    const result = await caller.quiz.getQuizzes();
    expect(result.length).toBe(2);
  });

  it("should get a quiz by id", async () => {
    const quiz = await prisma.quiz.create({
      data: { id: nanoid(), name: "Test Quiz", description: "Test" },
    });

    const caller = appRouter.createCaller({
      admin: { id: adminId, username: "admin" },
    });
    const result = await caller.quiz.getQuiz({ id: quiz.id });
    expect(result?.name).toBe("Test Quiz");
  });

  it("should update a quiz", async () => {
    const quiz = await prisma.quiz.create({
      data: { id: nanoid(), name: "Old Name", description: "Old Desc" },
    });

    const caller = appRouter.createCaller({
      admin: { id: adminId, username: "admin" },
    });
    const result = await caller.quiz.updateQuiz({
      id: quiz.id,
      name: "New Name",
      description: "New Desc",
    });
    expect(result.name).toBe("New Name");
  });

  it("should delete a quiz", async () => {
    const quiz = await prisma.quiz.create({
      data: { id: nanoid(), name: "Test Quiz", description: "Test" },
    });

    const caller = appRouter.createCaller({
      admin: { id: adminId, username: "admin" },
    });
    const result = await caller.quiz.deleteQuiz({ id: quiz.id });
    expect(result.success).toBe(true);
  });
});


