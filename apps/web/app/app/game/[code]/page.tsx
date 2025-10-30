"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTRPC } from "@/trpc";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

export default function GamePage() {
  const params = useParams();
  const router = useRouter();
  const code = params.code as string;
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [showJoinTeam, setShowJoinTeam] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [newTeamName, setNewTeamName] = useState("");
  const [playerName, setPlayerName] = useState("");

  const gameQuery = useQuery(trpc.game.getGameByCode.queryOptions({ code }));
  const createTeamMutation = useMutation(
    trpc.game.createTeam.mutationOptions()
  );
  const joinGameMutation = useMutation(trpc.game.joinGame.mutationOptions());

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gameQuery.data || !newTeamName.trim()) return;

    try {
      const team = await createTeamMutation.mutateAsync({
        gameId: gameQuery.data.id,
        teamName: newTeamName.trim(),
      });
      setNewTeamName("");
      setShowCreateTeam(false);
      setSelectedTeamId(team.id);
      setShowJoinTeam(true);
      queryClient.invalidateQueries({
        queryKey: trpc.game.getGameByCode.queryKey({ code }),
      });
    } catch (err) {
      console.error("Create team error:", err);
    }
  };

  const handleJoinTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gameQuery.data || !selectedTeamId || !playerName.trim()) return;

    try {
      const player = await joinGameMutation.mutateAsync({
        gameId: gameQuery.data.id,
        teamId: selectedTeamId,
        playerName: playerName.trim(),
      });
      // Redirect to player page
      router.push(`/app/game/${code}/${player.id}`);
    } catch (err) {
      console.error("Join game error:", err);
    }
  };

  if (gameQuery.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Loading game...</div>
      </div>
    );
  }

  if (gameQuery.error || !gameQuery.data) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Game Not Found</CardTitle>
            <CardDescription>
              The game code you entered is invalid or the game has ended.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/app/game")} className="w-full">
              Back to Join
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const game = gameQuery.data;

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto pt-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{game.name}</CardTitle>
            <CardDescription>Join a team to start playing</CardDescription>
            <div className="mt-2">
              <Badge variant="outline">{game.state}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Existing Teams */}
            {game.teams.length > 0 && (
              <div className="space-y-2">
                <Label>Join Existing Team</Label>
                <div className="grid gap-2">
                  {game.teams.map((team) => (
                    <Button
                      key={team.id}
                      variant={
                        selectedTeamId === team.id ? "default" : "outline"
                      }
                      onClick={() => {
                        setSelectedTeamId(team.id);
                        setShowJoinTeam(true);
                      }}
                      className="justify-start h-auto py-3"
                    >
                      <div className="flex-1 text-left">
                        <div className="font-semibold">{team.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {team.playerCount} player
                          {team.playerCount !== 1 ? "s" : ""}
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Create New Team */}
            <div className="space-y-2">
              <Label>Or Create New Team</Label>
              <Dialog open={showCreateTeam} onOpenChange={setShowCreateTeam}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full">
                    Create New Team
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Team</DialogTitle>
                    <DialogDescription>
                      Create a new team for this game
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateTeam} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="teamName">Team Name</Label>
                      <Input
                        id="teamName"
                        value={newTeamName}
                        onChange={(e) => setNewTeamName(e.target.value)}
                        placeholder="Enter team name"
                        required
                        autoFocus
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setShowCreateTeam(false);
                          setNewTeamName("");
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={createTeamMutation.isPending}
                      >
                        {createTeamMutation.isPending
                          ? "Creating..."
                          : "Create"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {/* Join Team Dialog */}
            <Dialog open={showJoinTeam} onOpenChange={setShowJoinTeam}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Join Team</DialogTitle>
                  <DialogDescription>
                    Enter your name to join the team
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleJoinTeam} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="playerName">Your Name</Label>
                    <Input
                      id="playerName"
                      value={playerName}
                      onChange={(e) => setPlayerName(e.target.value)}
                      placeholder="Enter your name"
                      required
                      autoFocus
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowJoinTeam(false);
                        setPlayerName("");
                        setSelectedTeamId(null);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={joinGameMutation.isPending}>
                      {joinGameMutation.isPending ? "Joining..." : "Join"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
