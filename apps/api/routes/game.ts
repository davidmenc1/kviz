import z from "zod";
import { adminProcedure, publicProcedure, router } from "../trpc";
import { games, type Game, type Player, type Team } from "../game/game";
import { nanoid } from "nanoid";
import { EventEmitter, on } from "events";
import { TRPCError } from "@trpc/server";
import { prisma } from "../prisma/db";

export const eventData = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("new_question"),
    question: z.string(),
    questionId: z.string(),
    options: z.array(
      z.object({
        id: z.string(),
        text: z.string(),
      })
    ),
  }),
  z.object({
    type: z.literal("correct_option"),
    optionId: z.string(),
    questionId: z.string(),
    teams: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        score: z.number(),
        players: z.array(
          z.object({
            id: z.string(),
            name: z.string(),
            score: z.number(),
          })
        ),
      })
    ),
  }),
  z.object({
    type: z.literal("end"),
    teams: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        score: z.number(),
        players: z.array(
          z.object({
            id: z.string(),
            name: z.string(),
            score: z.number(),
          })
        ),
      })
    ),
  }),
]);

export type EventData = z.infer<typeof eventData>;

export const gameRoutes = router({
  getGames: adminProcedure.query(async () => {
    return Array.from(games.values()).map((game) => ({
      id: game.id,
      name: game.name,
      quizId: game.quizId,
      questionNumber: game.questionNumber,
      state: game.state,
      code: game.code,
      teamCount: game.teams.length,
      playerCount: game.teams.reduce(
        (sum, team) => sum + team.players.length,
        0
      ),
    }));
  }),
  getGame: adminProcedure
    .input(z.object({ gameId: z.string() }))
    .query(async ({ input }) => {
      const game = games.get(input.gameId);
      if (!game) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Game not found",
        });
      }
      return {
        id: game.id,
        name: game.name,
        quizId: game.quizId,
        questionNumber: game.questionNumber,
        state: game.state,
        code: game.code,
        teams: game.teams.map((team) => ({
          id: team.id,
          name: team.name,
          players: team.players.map((player) => ({
            id: player.id,
            name: player.name,
            score: player.score,
          })),
        })),
      };
    }),
  getGameByCode: publicProcedure
    .input(z.object({ code: z.string() }))
    .query(async ({ input }) => {
      const game = Array.from(games.values()).find(
        (g) => g.code === input.code
      );
      if (!game) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Game not found",
        });
      }
      return {
        id: game.id,
        name: game.name,
        state: game.state,
        code: game.code,
        teams: game.teams.map((team) => ({
          id: team.id,
          name: team.name,
          playerCount: team.players.length,
        })),
      };
    }),
  createGame: adminProcedure
    .input(z.object({ name: z.string(), quizId: z.string() }))
    .mutation(async ({ input }) => {
      // create a 8 letter code
      const code =
        Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15);
      const game = {
        id: nanoid(),
        name: input.name,
        quizId: input.quizId,
        questionNumber: 0,
        state: "not-started",
        code,
        teams: [],
        ee: new EventEmitter(),
        playerAnswers: new Map<string, Map<string, string>>(),
      } satisfies Game;

      games.set(game.id, game);

      return game;
    }),
  createTeam: publicProcedure
    .input(z.object({ gameId: z.string(), teamName: z.string() }))
    .mutation(async ({ input }) => {
      const game = games.get(input.gameId);
      if (!game) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Game not found",
        });
      }
      const team = {
        id: nanoid(),
        name: input.teamName,
        players: [],
      } satisfies Team;
      game.teams.push(team);
      return team;
    }),
  joinGame: publicProcedure
    .input(
      z.object({
        gameId: z.string(),
        teamId: z.string(),
        playerName: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const game = games.get(input.gameId);
      if (!game) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Game not found",
        });
      }
      const team = game.teams.find((team) => team.id === input.teamId);
      if (!team) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Team not found",
        });
      }

      const player = {
        id: nanoid(),
        name: input.playerName,
        score: 0,
        teamId: input.teamId,
        team: team,
      } satisfies Player;

      team.players.push(player);

      return { id: player.id, name: player.name };
    }),
  submitAnswer: publicProcedure
    .input(
      z.object({
        gameId: z.string(),
        playerId: z.string(),
        questionId: z.string(),
        optionId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const game = games.get(input.gameId);
      if (!game) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Game not found",
        });
      }

      if (game.state !== "questioning") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Can only submit answers during questioning phase",
        });
      }

      // Verify player exists
      const player = game.teams
        .flatMap((team) => team.players)
        .find((p) => p.id === input.playerId);
      if (!player) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Player not found",
        });
      }

      // Store the answer
      if (!game.playerAnswers.has(input.questionId)) {
        game.playerAnswers.set(input.questionId, new Map());
      }
      const questionAnswers = game.playerAnswers.get(input.questionId)!;
      questionAnswers.set(input.playerId, input.optionId);

      return { success: true };
    }),
  gameEvents: publicProcedure
    .input(z.object({ gameId: z.string(), playerId: z.string() }))
    .subscription(async function* (opts) {
      const game = games.get(opts.input.gameId);
      if (!game) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Game not found",
        });
      }
      for await (const [data] of on(game.ee, "data", {
        signal: opts.signal,
      })) {
        yield data satisfies EventData;
      }
    }),
  nextQuestion: adminProcedure
    .input(z.object({ gameId: z.string() }))
    .mutation(async ({ input }) => {
      const game = games.get(input.gameId);
      if (!game) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Game not found",
        });
      }

      switch (game.state) {
        case "results":
        case "not-started":
          game.questionNumber++;
          const question = await prisma.question.findFirst({
            where: { quizId: game.quizId, order: game.questionNumber },
            include: { options: true },
          });

          if (!question) {
            // No more questions - end the game
            game.state = "ended";

            // Calculate final team scores
            const finalTeamsWithScores = game.teams.map((team) => ({
              id: team.id,
              name: team.name,
              score: team.players.reduce(
                (sum, player) => sum + player.score,
                0
              ),
              players: team.players.map((player) => ({
                id: player.id,
                name: player.name,
                score: player.score,
              })),
            }));

            const endData = {
              type: "end",
              teams: finalTeamsWithScores,
            } satisfies EventData;
            game.ee.emit("data", endData);
            break;
          }

          game.state = "questioning";
          const data = {
            type: "new_question",
            question: question.text,
            questionId: question.id,
            options: question.options.map((option) => ({
              id: option.id,
              text: option.text,
            })),
          } satisfies EventData;
          game.ee.emit("data", data);
          break;
        case "questioning":
          game.state = "results";
          const currentQuestion = await prisma.question.findFirst({
            where: { quizId: game.quizId, order: game.questionNumber },
            include: { options: { where: { isCorrect: true } } },
          });
          if (!currentQuestion?.options[0]) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Question not found",
            });
          }

          const correctOptionId = currentQuestion.options[0].id;
          const questionId = currentQuestion.id;

          // Get player answers for this question
          const questionAnswers =
            game.playerAnswers.get(questionId) || new Map();

          // Calculate scores for each player
          for (const team of game.teams) {
            for (const player of team.players) {
              const playerAnswer = questionAnswers.get(player.id);
              if (playerAnswer === correctOptionId) {
                player.score += 1;
              }
            }
          }

          // Calculate team scores (sum of all players' scores)
          const teamsWithScores = game.teams.map((team) => ({
            id: team.id,
            name: team.name,
            score: team.players.reduce((sum, player) => sum + player.score, 0),
            players: team.players.map((player) => ({
              id: player.id,
              name: player.name,
              score: player.score,
            })),
          }));

          const correctOptionData = {
            type: "correct_option",
            optionId: correctOptionId,
            questionId: questionId,
            teams: teamsWithScores,
          } satisfies EventData;
          game.ee.emit("data", correctOptionData);
          break;
      }
      return game.questionNumber;
    }),
});
