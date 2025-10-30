import { router } from "./trpc";
import { publicProcedure } from "./trpc";
import { EventEmitter, on } from "events";
import { adminRoutes } from "./routes/admin";
import { questionRoutes } from "./routes/question";
import { quizRoutes } from "./routes/quiz";
import { gameRoutes } from "./routes/game";

const ee = new EventEmitter();

export const appRouter = router({
  hello: publicProcedure.query(() => {
    ee.emit("ping");
    return "Hello, world!";
  }),
  ping: publicProcedure.subscription(async function* (opts) {
    for await (const [data] of on(ee, "ping", {
      // Passing the AbortSignal from the request automatically cancels the event emitter when the request is aborted
      signal: opts.signal,
    })) {
      yield "pong"; // implementovat tracked https://trpc.io/docs/server/subscriptions#tracked
    }
  }),
  admin: adminRoutes,
  quiz: quizRoutes,
  question: questionRoutes,
  game: gameRoutes,
});

export type AppRouter = typeof appRouter;
