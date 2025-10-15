import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "./router";

Bun.serve({
    port: 3001,
    async fetch(req) {
        const res = await fetchRequestHandler({
            endpoint: '/',
            req,
            router: appRouter,
          });

          res.headers.set('Access-Control-Allow-Origin', '*');
          res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');

          return res;
    }
})