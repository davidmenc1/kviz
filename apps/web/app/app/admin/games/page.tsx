"use client";

import { useTRPC } from "@/trpc";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function GamesPage() {
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedQuizId, setSelectedQuizId] = useState<string>("");

  const gamesQuery = useQuery(trpc.game.getGames.queryOptions());
  const quizzesQuery = useQuery(trpc.quiz.getQuizzes.queryOptions());
  const createGameMutation = useMutation(
    trpc.game.createGame.mutationOptions()
  );

  const handleCreateGame = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    if (!selectedQuizId) {
      return;
    }
    try {
      await createGameMutation.mutateAsync({ name, quizId: selectedQuizId });
      queryClient.invalidateQueries({
        queryKey: trpc.game.getGames.queryKey(),
      });
      setShowCreateDialog(false);
      setSelectedQuizId("");
    } catch (err) {
      console.error("Create game error:", err);
    }
  };

  const getStateBadge = (state: string) => {
    const variants: Record<
      string,
      "default" | "secondary" | "destructive" | "outline"
    > = {
      "not-started": "secondary",
      started: "default",
      questioning: "default",
      results: "outline",
      ended: "destructive",
    };
    return (
      <Badge variant={variants[state] || "secondary"}>
        {state.replace("-", " ")}
      </Badge>
    );
  };

  if (gamesQuery.isLoading || quizzesQuery.isLoading) {
    return <div>Loading games...</div>;
  }

  if (gamesQuery.error) {
    return (
      <div className="text-destructive">Error: {gamesQuery.error.message}</div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold">Games</h2>
          <p className="text-sm text-muted-foreground">
            Manage active quiz games
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>Create Game</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Game</DialogTitle>
              <DialogDescription>
                Start a new quiz game session
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateGame} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Game Name</Label>
                <Input id="name" name="name" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quizId">Quiz</Label>
                <Select
                  value={selectedQuizId}
                  onValueChange={setSelectedQuizId}
                  required
                >
                  <SelectTrigger id="quizId">
                    <SelectValue placeholder="Select a quiz" />
                  </SelectTrigger>
                  <SelectContent>
                    {quizzesQuery.data?.map((quiz) => (
                      <SelectItem key={quiz.id} value={quiz.id}>
                        {quiz.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateDialog(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createGameMutation.isPending}>
                  {createGameMutation.isPending ? "Creating..." : "Create"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {gamesQuery.data && gamesQuery.data.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              No games yet. Create your first game!
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>State</TableHead>
                <TableHead>Question</TableHead>
                <TableHead>Teams</TableHead>
                <TableHead>Players</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {gamesQuery.data?.map((game) => (
                <TableRow
                  key={game.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/app/admin/games/${game.id}`)}
                >
                  <TableCell className="font-medium">{game.name}</TableCell>
                  <TableCell>
                    <code className="px-2 py-1 bg-muted rounded text-sm font-mono">
                      {game.code}
                    </code>
                  </TableCell>
                  <TableCell>{getStateBadge(game.state)}</TableCell>
                  <TableCell>{game.questionNumber}</TableCell>
                  <TableCell>{game.teamCount}</TableCell>
                  <TableCell>{game.playerCount}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/app/admin/games/${game.id}`);
                      }}
                    >
                      Control
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
