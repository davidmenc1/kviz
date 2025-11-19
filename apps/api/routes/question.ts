import { nanoid } from "nanoid";
import { prisma } from "../prisma/db";
import { adminProcedure, router } from "../trpc";
import z from "zod";
import { gemini } from "../ai/ai";
import { Type } from "@google/genai";

export const questionRoutes = router({
  createQuestion: adminProcedure
    .input(
      z.object({
        quizId: z.string(),
        text: z.string(),
        order: z.number(),
        imageUrl: z.string().url().optional().nullable(),
        type: z.enum(["MULTIPLE_CHOICE", "YES_NO", "RANGE"]).optional(),
        minValue: z.number().optional().nullable(),
        maxValue: z.number().optional().nullable(),
        correctValue: z.number().optional().nullable(),
      })
    )
    .mutation(async ({ input }) => {
      const data: any = {
        id: nanoid(),
        quizId: input.quizId,
        text: input.text,
        order: input.order,
        imageUrl: input.imageUrl ?? null,
        type: input.type ?? "MULTIPLE_CHOICE",
        minValue: input.minValue ?? null,
        maxValue: input.maxValue ?? null,
        correctValue: input.correctValue ?? null,
      };
      const question = await prisma.question.create({
        data,
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
    .input(
      z.object({
        id: z.string(),
        text: z.string(),
        order: z.number(),
        imageUrl: z.string().url().optional().nullable(),
        type: z.enum(["MULTIPLE_CHOICE", "YES_NO", "RANGE"]).optional(),
        minValue: z.number().optional().nullable(),
        maxValue: z.number().optional().nullable(),
        correctValue: z.number().optional().nullable(),
      })
    )
    .mutation(async ({ input }) => {
      const data: any = {
        text: input.text,
        order: input.order,
        imageUrl: input.imageUrl ?? null,
        type: input.type ?? "MULTIPLE_CHOICE",
        minValue: input.minValue ?? null,
        maxValue: input.maxValue ?? null,
        correctValue: input.correctValue ?? null,
      };
      const question = await prisma.question.update({
        where: { id: input.id },
        data,
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
            typ: z.enum(["MULTIPLE_CHOICE", "YES_NO", "RANGE"]),
            odpovedi: z
              .array(
                z.object({
                  spravne: z.boolean(),
                  odpoved: z.string(),
                })
              )
              .nullable()
              .optional(),
            minHodnota: z.number().nullable().optional(),
            maxHodnota: z.number().nullable().optional(),
            spravnaHodnota: z.number().nullable().optional(),
          })
        ),
      });

      const response = await gemini.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Udělej kvíz podle tohoto promptu, dej tam cca 15 otázek. Použij různé typy otázek:
        - MULTIPLE_CHOICE: otázky s více možnostmi (odpovedi pole)
        - YES_NO: otázky ano/ne (odpovedi bude automaticky generováno)
        - RANGE: otázky s číselnou odpovědí (minHodnota, maxHodnota, spravnaHodnota)
        
        Prompt: ${input.prompt}`,
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
                    typ: {
                      type: Type.STRING,
                      enum: ["MULTIPLE_CHOICE", "YES_NO", "RANGE"],
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
                      nullable: true,
                    },
                    minHodnota: {
                      type: Type.NUMBER,
                      nullable: true,
                    },
                    maxHodnota: {
                      type: Type.NUMBER,
                      nullable: true,
                    },
                    spravnaHodnota: {
                      type: Type.NUMBER,
                      nullable: true,
                    },
                  },
                  propertyOrdering: [
                    "otazka",
                    "typ",
                    "odpovedi",
                    "minHodnota",
                    "maxHodnota",
                    "spravnaHodnota",
                  ],
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
            create: parsedResponse.otazky.map((otazka, index) => {
              const baseQuestion = {
                id: nanoid(),
                text: otazka.otazka,
                order: index + 1,
                imageUrl: null,
                type: otazka.typ,
              };

              if (otazka.typ === "RANGE") {
                return {
                  ...baseQuestion,
                  minValue: otazka.minHodnota ?? 0,
                  maxValue: otazka.maxHodnota ?? 100,
                  correctValue: otazka.spravnaHodnota ?? 50,
                };
              } else if (otazka.typ === "YES_NO") {
                // Auto-generate yes/no options
                // Check if there are odpovedi and find the correct answer
                let correctAnswer = true; // default to Yes
                if (otazka.odpovedi && otazka.odpovedi.length > 0) {
                  const correctOpt = otazka.odpovedi.find((o) => o.spravne);
                  if (correctOpt) {
                    const answerText = correctOpt.odpoved.toLowerCase();
                    correctAnswer =
                      answerText.includes("ano") || answerText.includes("yes");
                  }
                }
                return {
                  ...baseQuestion,
                  options: {
                    create: [
                      {
                        id: nanoid(),
                        text: "Ano",
                        isCorrect: correctAnswer,
                      },
                      {
                        id: nanoid(),
                        text: "Ne",
                        isCorrect: !correctAnswer,
                      },
                    ],
                  },
                };
              } else {
                // MULTIPLE_CHOICE
                return {
                  ...baseQuestion,
                  options: {
                    create: (otazka.odpovedi && otazka.odpovedi.length > 0
                      ? otazka.odpovedi
                      : []
                    ).map((odpoved) => ({
                      id: nanoid(),
                      text: odpoved.odpoved,
                      isCorrect: odpoved.spravne,
                    })),
                  },
                };
              }
            }),
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
