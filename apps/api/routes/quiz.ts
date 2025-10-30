import z from "zod";
import { prisma } from "../prisma/db";
import { adminProcedure, router } from "../trpc";
import { nanoid } from "nanoid";

export const quizRoutes = router({
  createQuiz: adminProcedure
    .input(
      z.object({
        name: z.string(),
        description: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const quiz = await prisma.quiz.create({
        data: {
          id: nanoid(),
          name: input.name,
          description: input.description,
        },
      });
      return quiz;
    }),
  getQuizzes: adminProcedure.query(async () => {
    const quizzes = await prisma.quiz.findMany();
    return quizzes;
  }),
  getQuiz: adminProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const quiz = await prisma.quiz.findUnique({ where: { id: input.id } });
      return quiz;
    }),
  updateQuiz: adminProcedure
    .input(
      z.object({ id: z.string(), name: z.string(), description: z.string() })
    )
    .mutation(async ({ input }) => {
      const quiz = await prisma.quiz.update({
        where: { id: input.id },
        data: { name: input.name, description: input.description },
      });
      return quiz;
    }),
  deleteQuiz: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      await prisma.quiz.delete({ where: { id: input.id } });
      return { success: true };
    }),
});
