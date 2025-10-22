import { router, publicProcedure } from "../trpc";
import { z } from "zod";
import { prisma } from "../prismaClient";

export const teamRouter = router({
  create: publicProcedure
    .input(
      z.object({
        name: z.string(),
        quizId: z.number(),
      })
    )
    .mutation(({ input }) => prisma.team.create({ data: input })),

  getAll: publicProcedure.query(() =>
    prisma.team.findMany({ include: { games: true, answers: true } })
  ),

  getByQuiz: publicProcedure
    .input(z.object({ quizId: z.number() }))
    .query(({ input }) =>
      prisma.team.findMany({
        where: { quizId: input.quizId },
        include: { games: true, answers: true },
      })
    ),

  update: publicProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().optional(),
      })
    )
    .mutation(({ input }) =>
      prisma.team.update({
        where: { id: input.id },
        data: { name: input.name },
      })
    ),

  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) =>
      prisma.team.delete({ where: { id: input.id } })
    ),
});
