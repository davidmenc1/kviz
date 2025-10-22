import { router, publicProcedure } from "../trpc";
import { z } from "zod";
import { prisma } from "../prismaClient";

export const questionRouter = router({
  create: publicProcedure
    .input(
      z.object({
        quizId: z.number(),
        order: z.number(),
        text: z.string(),
      })
    )
    .mutation(({ input }) =>
      prisma.question.create({ data: input })
    ),

  getAll: publicProcedure.query(() =>
    prisma.question.findMany({ include: { quiz: true, options: true } })
  ),

  getByQuiz: publicProcedure
    .input(z.object({ quizId: z.number() }))
    .query(({ input }) =>
      prisma.question.findMany({
        where: { quizId: input.quizId },
        include: { options: true },
      })
    ),

  update: publicProcedure
    .input(
      z.object({
        id: z.number(),
        text: z.string().optional(),
        order: z.number().optional(),
      })
    )
    .mutation(({ input }) =>
      prisma.question.update({
        where: { id: input.id },
        data: { text: input.text, order: input.order },
      })
    ),

  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) =>
      prisma.question.delete({ where: { id: input.id } })
    ),
});
