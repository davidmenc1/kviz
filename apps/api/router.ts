import { router } from './trpc';
import { publicProcedure } from './trpc';

export const appRouter = router({
  hello: publicProcedure.query(() => 'Hello, world!'),
});

export type AppRouter = typeof appRouter;