import { router, publicProcedure } from "../trpc";
import { z } from "zod";
import { prisma } from "../prismaClient";

export const quizRouter = router({
  create: publicProcedure
    .input(
      z.object({
        name: z.string(),
        description: z.string().optional(),
      })
    )
    .mutation(({ input }) => prisma.quiz.create({ data: input })),

  getAll: publicProcedure.query(() =>
    prisma.quiz.findMany({ include: { questions: true, games: true } })
  ),

  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) =>
      prisma.quiz.findUnique({
        where: { id: input.id },
        include: { questions: true, games: true },
      })
    ),

  update: publicProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
      })
    )
    .mutation(({ input }) =>
      prisma.quiz.update({
        where: { id: input.id },
        data: { name: input.name, description: input.description },
      })
    ),

  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) =>
      prisma.quiz.delete({ where: { id: input.id } })
    ),
});
