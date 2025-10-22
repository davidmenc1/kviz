import { router } from "./trpc";
import { quizRouter } from "./routers/quizRouter";
import { gameRouter } from "./routers/gameRouter";
import { questionRouter } from "./routers/questionRouter";
import { optionRouter } from "./routers/optionRouter";
import { teamRouter } from "./routers/teamRouter";
import { answerRouter } from "./routers/answerRouter";

export const appRouter = router({
  quiz: quizRouter,
  game: gameRouter,
  question: questionRouter,
  option: optionRouter,
  team: teamRouter,
  answer: answerRouter,
});

export type AppRouter = typeof appRouter;
