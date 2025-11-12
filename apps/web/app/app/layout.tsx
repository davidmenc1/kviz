"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createTRPCClient,
  httpBatchLink,
  httpSubscriptionLink,
  splitLink,
} from "@trpc/client";
import { useMemo } from "react";
import { TRPCProvider } from "../../trpc";
import type { AppRouter } from "../../../api/router";
import { AuthProvider, useAuth } from "../../contexts/auth";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // With SSR, we usually want to set some default staleTime
        // above 0 to avoid refetching immediately on the client
        staleTime: 60 * 1000,
      },
    },
  });
}
let browserQueryClient: QueryClient | undefined = undefined;
function getQueryClient() {
  if (typeof window === "undefined") {
    // Server: always make a new query client
    return makeQueryClient();
  } else {
    // Browser: make a new query client if we don't already have one
    // This is very important, so we don't re-make a new client if React
    // suspends during the initial render. This may not be needed if we
    // have a suspense boundary BELOW the creation of the query client
    if (!browserQueryClient) browserQueryClient = makeQueryClient();
    return browserQueryClient;
  }
}
function TRPCClientProvider({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();
  const { sessionId } = useAuth();

  const trpcClient = useMemo(
    () =>
      createTRPCClient<AppRouter>({
        links: [
          splitLink({
            // uses the httpSubscriptionLink for subscriptions
            condition: (op) => op.type === "subscription",
            true: httpSubscriptionLink({
              url: process.env.NEXT_PUBLIC_SERVER_HOST!,
            }),
            false: httpBatchLink({
              url: process.env.NEXT_PUBLIC_SERVER_HOST!,
              headers: () => {
                if (!sessionId) return {};
                return {
                  Authorization: `Bearer ${sessionId}`,
                };
              },
            }),
          }),
        ],
      }),
    [sessionId]
  );

  return (
    <QueryClientProvider client={queryClient}>
      <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
        {children}
      </TRPCProvider>
    </QueryClientProvider>
  );
}

export default function App({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <TRPCClientProvider>{children}</TRPCClientProvider>
    </AuthProvider>
  );
}
