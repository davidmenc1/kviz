"use client"

import { useTRPC } from "@/trpc";
import { useQuery } from "@tanstack/react-query";

export default function AppPage() {
    const trpc = useTRPC();
    const userQuery = useQuery(trpc.hello.queryOptions());
    return (
      <div>
        <p>{userQuery.data}</p>
      </div>
    );
}