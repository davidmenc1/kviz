import { nanoid } from "nanoid";
import { prisma } from "../prisma/db";
import { adminProcedure, router } from "../trpc";
import z from "zod";
import { gemini } from "../ai/ai";
import { Type } from "@google/genai";

export const questionRoutes = router({
  createQuestion: adminProcedure
    .input(
      z.object({ quizId: z.string(), text: z.string(), order: z.number() })
    )
    .mutation(async ({ input }) => {
      const question = await prisma.question.create({
        data: {
          id: nanoid(),
          quizId: input.quizId,
          text: input.text,
          order: input.order,
        },
      });
      return question;
    }),
  getQuestions: adminProcedure
    .input(z.object({ quizId: z.string() }))
    .query(async ({ input }) => {
      const questions = await prisma.question.findMany({
        where: { quizId: input.quizId },
        include: { options: true },
      });
      return questions;
    }),
  getQuestion: adminProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const question = await prisma.question.findUnique({
        where: { id: input.id },
        include: { options: true },
      });
      return question;
    }),
  updateQuestion: adminProcedure
    .input(z.object({ id: z.string(), text: z.string(), order: z.number() }))
    .mutation(async ({ input }) => {
      const question = await prisma.question.update({
        where: { id: input.id },
        data: { text: input.text, order: input.order },
      });
      return question;
    }),
  deleteQuestion: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      await prisma.question.delete({ where: { id: input.id } });
      return { success: true };
    }),

  // OPTIONS

  createOption: adminProcedure
    .input(
      z.object({
        questionId: z.string(),
        text: z.string(),
        isCorrect: z.boolean(),
      })
    )
    .mutation(async ({ input }) => {
      const option = await prisma.option.create({
        data: {
          id: nanoid(),
          questionId: input.questionId,
          text: input.text,
          isCorrect: input.isCorrect,
        },
      });
      return option;
    }),
  updateOption: adminProcedure
    .input(
      z.object({ id: z.string(), text: z.string(), isCorrect: z.boolean() })
    )
    .mutation(async ({ input }) => {
      const option = await prisma.option.update({
        where: { id: input.id },
        data: { text: input.text, isCorrect: input.isCorrect },
      });
      return option;
    }),
  deleteOption: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      await prisma.option.delete({ where: { id: input.id } });
      return { success: true };
    }),

  // AI

  createQuestionsWithAi: adminProcedure
    .input(z.object({ prompt: z.string() }))
    .mutation(async ({ input }) => {
      const aiResponseSchema = z.object({
        jmeno: z.string(),
        otazky: z.array(
          z.object({
            otazka: z.string(),
            odpovedi: z.array(
              z.object({
                spravne: z.boolean(),
                odpoved: z.string(),
              })
            ),
          })
        ),
      });

      const response = await gemini.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Udělej kvíz podle tohoto promptu, dej tam cca 15 otázek:
        ${input.prompt}
        `,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              jmeno: {
                type: Type.STRING,
              },
              otazky: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    otazka: {
                      type: Type.STRING,
                    },
                    odpovedi: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          spravne: {
                            type: Type.BOOLEAN,
                          },
                          odpoved: {
                            type: Type.STRING,
                          },
                        },
                        propertyOrdering: ["spravne", "odpoved"],
                      },
                    },
                  },
                  propertyOrdering: ["otazka", "odpovedi"],
                },
              },
            },
            propertyOrdering: ["jmeno", "otazky"],
          },
        },
      });

      if (!response.text) {
        throw new Error("AI response text is undefined");
      }

      const parsedResponse = aiResponseSchema.parse(JSON.parse(response.text));

      // Create the quiz
      const quiz = await prisma.quiz.create({
        data: {
          id: nanoid(),
          name: parsedResponse.jmeno,
          description: "",
          questions: {
            create: parsedResponse.otazky.map((otazka, index) => ({
              id: nanoid(),
              text: otazka.otazka,
              order: index + 1,
              options: {
                create: otazka.odpovedi.map((odpoved) => ({
                  id: nanoid(),
                  text: odpoved.odpoved,
                  isCorrect: odpoved.spravne,
                })),
              },
            })),
          },
        },
        include: {
          questions: {
            include: {
              options: true,
            },
          },
        },
      });

      return quiz;
    }),
});
