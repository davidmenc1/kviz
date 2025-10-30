"use client";

import { useTRPC } from "@/trpc";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter, useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function GameControlPage() {
  const router = useRouter();
  const params = useParams();
  const gameId = params.id as string;
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);

  const gameQuery = useQuery(trpc.game.getGame.queryOptions({ gameId }));
  const nextQuestionMutation = useMutation(trpc.game.nextQuestion.mutationOptions());

  // Poll game state every 2 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      queryClient.invalidateQueries({
        queryKey: trpc.game.getGame.queryKey({ gameId }),
      });
    }, 2000);
    return () => clearInterval(interval);
  }, [gameId, queryClient, trpc]);

  const handleNextQuestion = async () => {
    try {
      await nextQuestionMutation.mutateAsync({ gameId });
      queryClient.invalidateQueries({
        queryKey: trpc.game.getGame.queryKey({ gameId }),
      });
    } catch (err) {
      console.error("Next question error:", err);
    }
  };

  const copyCode = () => {
    if (gameQuery.data?.code) {
      navigator.clipboard.writeText(gameQuery.data.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getStateBadge = (state: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      "not-started": "secondary",
      "started": "default",
      "questioning": "default",
      "results": "outline",
      "ended": "destructive",
    };
    return (
      <Badge variant={variants[state] || "secondary"}>
        {state.replace("-", " ")}
      </Badge>
    );
  };

  if (gameQuery.isLoading) {
    return <div>Loading game...</div>;
  }

  if (gameQuery.error || !gameQuery.data) {
    return <div className="text-destructive">Error: Game not found</div>;
  }

  const game = gameQuery.data;
  const canAdvance = game.state === "not-started" || game.state === "results" || game.state === "questioning";

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold">{game.name}</h2>
          <p className="text-sm text-muted-foreground">
            Game Control Panel
          </p>
        </div>
        <Button variant="outline" onClick={() => router.push("/app/admin/games")}>
          Back to Games
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Game Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm text-muted-foreground">Game Code</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  value={game.code}
                  readOnly
                  className="font-mono"
                />
                <Button onClick={copyCode} variant="outline">
                  {copied ? "Copied!" : "Copy"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Share this code with players to join the game
              </p>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">State</Label>
              <div className="mt-1">{getStateBadge(game.state)}</div>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Current Question</Label>
              <div className="mt-1 text-lg font-semibold">{game.questionNumber}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={handleNextQuestion}
              disabled={!canAdvance || nextQuestionMutation.isPending}
              className="w-full"
              size="lg"
            >
              {game.state === "not-started" || game.state === "results"
                ? "Start / Next Question"
                : game.state === "questioning"
                ? "Show Answer"
                : "End Game"}
            </Button>
            <p className="text-xs text-muted-foreground">
              {game.state === "not-started" && "Click to start the first question"}
              {game.state === "questioning" && "Click to reveal the correct answer"}
              {game.state === "results" && "Click to proceed to the next question"}
              {game.state === "ended" && "Game has ended"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Teams & Players</CardTitle>
          <CardDescription>
            {game.teams.length} team{game.teams.length !== 1 ? "s" : ""} •{" "}
            {game.teams.reduce((sum, team) => sum + team.players.length, 0)} player
            {game.teams.reduce((sum, team) => sum + team.players.length, 0) !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {game.teams.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              No teams joined yet
            </p>
          ) : (
            <div className="space-y-4">
              {game.teams.map((team) => (
                <div key={team.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold">{team.name}</h3>
                    <Badge variant="outline">
                      {team.players.length} player{team.players.length !== 1 ? "s" : ""}
                    </Badge>
                  </div>
                  {team.players.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Player</TableHead>
                          <TableHead className="text-right">Score</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {team.players.map((player) => (
                          <TableRow key={player.id}>
                            <TableCell>{player.name}</TableCell>
                            <TableCell className="text-right font-semibold">
                              {player.score}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-sm text-muted-foreground">No players yet</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

