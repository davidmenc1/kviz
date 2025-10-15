import { router } from "./trpc";
import { publicProcedure } from "./trpc";
import { EventEmitter, on } from "events";

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
});

export type AppRouter = typeof appRouter;
