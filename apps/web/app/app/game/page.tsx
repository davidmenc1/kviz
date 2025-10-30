"use client";

import { useTRPC } from "@/trpc";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function GameJoinPage() {
  const router = useRouter();
  const trpc = useTRPC();
  const [gameCode, setGameCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!gameCode.trim()) {
      setError("Please enter a game code");
      return;
    }
    try {
      router.push(`/app/game/${gameCode}`);
    } catch (err: any) {
      setError(err.message || "Game not found");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Join Game</CardTitle>
          <CardDescription>
            Enter the game code provided by your host
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleJoin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">Game Code</Label>
              <Input
                id="code"
                value={gameCode}
                onChange={(e) => {
                  setGameCode(e.target.value);
                  setError(null);
                }}
                placeholder="Enter game code"
                className="text-center text-2xl font-mono tracking-wider"
                maxLength={30}
                autoFocus
              />
            </div>
            {error && <div className="text-sm text-destructive">{error}</div>}
            <Button
              type="submit"
              className="w-full"
              size="lg"
              onSubmit={handleJoin}
            >
              Join Game
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
