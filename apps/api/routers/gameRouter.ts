import { router, publicProcedure } from "../trpc";
import { z } from "zod";
import { prisma } from "../prismaClient";

export const gameRouter = router({
  create: publicProcedure
    .input(
      z.object({
        quizId: z.number(),
        teamId: z.number(),
      })
    )
    .mutation(({ input }) =>
      prisma.game.create({ data: input })
    ),

  getAll: publicProcedure.query(() =>
    prisma.game.findMany({ include: { quiz: true, team: true } })
  ),

  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) =>
      prisma.game.findUnique({
        where: { id: input.id },
        include: { quiz: true, team: true, answers: true },
      })
    ),

  update: publicProcedure
    .input(
      z.object({
        id: z.number(),
        quizId: z.number().optional(),
        teamId: z.number().optional(),
      })
    )
    .mutation(({ input }) =>
      prisma.game.update({
        where: { id: input.id },
        data: { quizId: input.quizId, teamId: input.teamId },
      })
    ),

  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) =>
      prisma.game.delete({ where: { id: input.id } })
    ),
});
