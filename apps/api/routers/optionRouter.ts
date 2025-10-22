import { router, publicProcedure } from "../trpc";
import { z } from "zod";
import { prisma } from "../prismaClient";

export const optionRouter = router({
  create: publicProcedure
    .input(
      z.object({
        questionId: z.number(),
        text: z.string(),
        isCorrect: z.boolean(),
      })
    )
    .mutation(({ input }) => prisma.option.create({ data: input })),

  getAll: publicProcedure.query(() =>
    prisma.option.findMany({ include: { question: true } })
  ),

  getByQuestion: publicProcedure
    .input(z.object({ questionId: z.number() }))
    .query(({ input }) =>
      prisma.option.findMany({ where: { questionId: input.questionId } })
    ),

  update: publicProcedure
    .input(
      z.object({
        id: z.number(),
        text: z.string().optional(),
        isCorrect: z.boolean().optional(),
      })
    )
    .mutation(({ input }) =>
      prisma.option.update({
        where: { id: input.id },
        data: { text: input.text, isCorrect: input.isCorrect },
      })
    ),

  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) =>
      prisma.option.delete({ where: { id: input.id } })
    ),
});
