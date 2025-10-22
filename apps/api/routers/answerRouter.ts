import { router, publicProcedure } from "../trpc";
import { z } from "zod";
import { prisma } from "../prismaClient";

export const answerRouter = router({
  create: publicProcedure
    .input(
      z.object({
        teamId: z.number(),
        gameId: z.number(),
        questionId: z.number(),
        optionId: z.number().optional(),
        customText: z.string().optional(),
      })
    )
    .mutation(({ input }) =>
      prisma.answer.upsert({
        where: {
          teamId_questionId_gameId: {
            teamId: input.teamId,
            questionId: input.questionId,
            gameId: input.gameId,
          },
        },
        update: { optionId: input.optionId, customText: input.customText },
        create: input,
      })
    ),

  getAll: publicProcedure.query(() =>
    prisma.answer.findMany({
      include: { team: true, game: true, question: true, option: true },
    })
  ),

  getByGame: publicProcedure
    .input(z.object({ gameId: z.number() }))
    .query(({ input }) =>
      prisma.answer.findMany({
        where: { gameId: input.gameId },
        include: { team: true, question: true, option: true },
      })
    ),

  delete: publicProcedure
    .input(
      z.object({
        teamId: z.number(),
        questionId: z.number(),
        gameId: z.number(),
      })
    )
    .mutation(({ input }) =>
      prisma.answer.delete({
        where: {
          teamId_questionId_gameId: {
            teamId: input.teamId,
            questionId: input.questionId,
            gameId: input.gameId,
          },
        },
      })
    ),
});
