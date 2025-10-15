"use client";

import { useTRPC } from "@/trpc";
import { useQuery } from "@tanstack/react-query";
import { useSubscription } from "@trpc/tanstack-react-query";

export default function AppPage() {
  const trpc = useTRPC();
  const userQuery = useQuery(trpc.hello.queryOptions());
  const subscription = useSubscription(trpc.ping.subscriptionOptions());

  return (
    <div>
      <p>{userQuery.data}</p>
      <p>data {JSON.stringify(subscription.data)}</p>
      <p>error {JSON.stringify(subscription.error)}</p>
    </div>
  );
}
