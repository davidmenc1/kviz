"use client";

import { useTRPC } from "@/trpc";
import { useQuery } from "@tanstack/react-query";
import { useSubscription } from "@trpc/tanstack-react-query";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";

export default function AppPage() {
  const trpc = useTRPC();
  const userQuery = useQuery(trpc.hello.queryOptions());
  const subscription = useSubscription(trpc.ping.subscriptionOptions());

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Quiz Game</CardTitle>
          <CardDescription>
            Join a quiz game or access admin panel
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Link href="/app/game" className="block">
            <Button className="w-full" size="lg">
              Join Game
            </Button>
          </Link>
          <Link href="/app/admin/quizzes" className="block">
            <Button variant="outline" className="w-full" size="lg">
              Admin Panel
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
