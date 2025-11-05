"use client";

import { useTRPC } from "@/trpc";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { useSubscription } from "@trpc/tanstack-react-query";
import { useState, useEffect, useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { EventData } from "../../../../../../api/routes/game";

export default function PlayerGamePage() {
  const params = useParams();
  const router = useRouter();
  const code = params.code as string;
  const playerId = params.playerId as string;
  const trpc = useTRPC();

  // Track selected option for current question
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const selectedOptionIdRef = useRef<string | null>(null);
  const [currentQuestionId, setCurrentQuestionId] = useState<string | null>(
    null
  );
  const [currentOptions, setCurrentOptions] = useState<
    Array<{ id: string; text: string }>
  >([]);
  const [lastAnswerFeedback, setLastAnswerFeedback] = useState<{
    optionId: string;
    isCorrect: boolean;
  } | null>(null);

  // Get game by code to get gameId
  const gameQuery = useQuery(trpc.game.getGameByCode.queryOptions({ code }));

  // Mutation to submit answer
  const submitAnswerMutation = useMutation(
    trpc.game.submitAnswer.mutationOptions()
  );

  // Subscribe to game events - this is our state management
  const gameEventsSubscription = useSubscription(
    trpc.game.gameEvents.subscriptionOptions(
      {
        gameId: gameQuery.data?.id || "",
        playerId: playerId,
      },
      {
        enabled: !!gameQuery.data?.id && !!playerId,
      }
    )
  );

  // Handle event changes
  useEffect(() => {
    const eventData = gameEventsSubscription.data as EventData | undefined;
    if (!eventData) return;

    if (eventData.type === "new_question") {
      // Reset selection for new question
      setSelectedOptionId(null);
      selectedOptionIdRef.current = null;
      setCurrentQuestionId(eventData.questionId);
      setCurrentOptions(eventData.options);
      setLastAnswerFeedback(null);
    } else if (eventData.type === "correct_option") {
      // Show feedback for the last selected option
      const currentSelected = selectedOptionIdRef.current;
      if (currentSelected) {
        setLastAnswerFeedback({
          optionId: currentSelected,
          isCorrect: currentSelected === eventData.optionId,
        });
      }
    }
  }, [gameEventsSubscription.data]);

  // Helper function to get option text by ID
  const getOptionText = (optionId: string): string => {
    const option = currentOptions.find((opt) => opt.id === optionId);
    return option?.text || optionId;
  };

  // Get current player's score
  const getPlayerScore = () => {
    const eventData = gameEventsSubscription.data as EventData | undefined;
    if (
      eventData &&
      (eventData.type === "correct_option" || eventData.type === "end")
    ) {
      for (const team of eventData.teams) {
        const player = team.players.find(
          (p: { id: string; name: string; score: number }) => p.id === playerId
        );
        if (player) return player.score;
      }
    }
    return 0;
  };

  // Get player name
  const getPlayerName = () => {
    const eventData = gameEventsSubscription.data as EventData | undefined;
    if (
      eventData &&
      (eventData.type === "correct_option" || eventData.type === "end")
    ) {
      for (const team of eventData.teams) {
        const player = team.players.find(
          (p: { id: string; name: string; score: number }) => p.id === playerId
        );
        if (player) return player.name;
      }
    }
    return null;
  };

  if (gameQuery.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="text-2xl font-semibold">Loading game...</div>
          <div className="text-muted-foreground">Please wait</div>
        </div>
      </div>
    );
  }

  if (gameQuery.error || !gameQuery.data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
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
  const eventData = gameEventsSubscription.data as EventData | undefined;
  const playerName = getPlayerName();
  const playerScore = getPlayerScore();

  // Handle option selection
  const handleOptionClick = async (optionId: string) => {
    if (!gameQuery.data?.id || !currentQuestionId) return;
    if (eventData?.type !== "new_question") return;

    setSelectedOptionId(optionId);
    selectedOptionIdRef.current = optionId;
    try {
      await submitAnswerMutation.mutateAsync({
        gameId: gameQuery.data.id,
        playerId: playerId,
        questionId: currentQuestionId,
        optionId: optionId,
      });
    } catch (error) {
      console.error("Failed to submit answer:", error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">{game.name}</h1>
          {playerName && (
            <p className="text-muted-foreground">Playing as {playerName}</p>
          )}
          {playerScore > 0 && (
            <div className="mt-4 inline-block">
              <Badge variant="secondary" className="text-lg px-4 py-2">
                Your Score: {playerScore}
              </Badge>
            </div>
          )}
        </div>

        {/* Main Content */}
        {!eventData ? (
          <Card>
            <CardContent className="py-16">
              <div className="text-center space-y-4">
                <div className="text-xl font-semibold">
                  Waiting for game to start
                </div>
                <div className="text-muted-foreground">
                  The host will begin the game shortly
                </div>
              </div>
            </CardContent>
          </Card>
        ) : eventData.type === "new_question" ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Question</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-lg leading-relaxed">
                {eventData.question}
              </div>

              <div className="space-y-3 pt-4">
                {eventData.options.map((option, index) => {
                  const isSelected = selectedOptionId === option.id;
                  return (
                    <button
                      key={option.id}
                      onClick={() => handleOptionClick(option.id)}
                      disabled={submitAnswerMutation.isPending || isSelected}
                      className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                        isSelected
                          ? "border-primary bg-primary/10 shadow-md scale-[1.02]"
                          : "border-border bg-card hover:bg-muted/50 hover:border-primary/50"
                      } ${
                        submitAnswerMutation.isPending || isSelected
                          ? "cursor-default"
                          : "cursor-pointer active:scale-[0.98]"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{option.text}</span>
                        {isSelected && <Badge className="ml-3">Selected</Badge>}
                      </div>
                    </button>
                  );
                })}
              </div>

              {selectedOptionId && (
                <div className="pt-2 text-center text-sm text-muted-foreground">
                  Answer submitted! Waiting for results...
                </div>
              )}
            </CardContent>
          </Card>
        ) : eventData.type === "correct_option" ? (
          <div className="space-y-6">
            {/* Answer Feedback */}
            {lastAnswerFeedback && (
              <Card
                className={
                  lastAnswerFeedback.isCorrect
                    ? "border-green-500"
                    : "border-red-500"
                }
              >
                <CardContent className="py-6">
                  <div className="text-center space-y-3">
                    <div
                      className={`text-4xl ${lastAnswerFeedback.isCorrect ? "text-green-500" : "text-red-500"}`}
                    >
                      {lastAnswerFeedback.isCorrect ? "✓" : "✗"}
                    </div>
                    <div
                      className={`text-xl font-semibold ${lastAnswerFeedback.isCorrect ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"}`}
                    >
                      {lastAnswerFeedback.isCorrect ? "Correct!" : "Incorrect"}
                    </div>
                    <div className="text-muted-foreground">
                      The correct answer was:{" "}
                      <span className="font-medium">
                        {getOptionText(eventData.optionId)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Leaderboard */}
            <Card>
              <CardHeader>
                <CardTitle>Leaderboard</CardTitle>
                <CardDescription>Current team scores</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {eventData.teams
                    .sort((a, b) => b.score - a.score)
                    .map((team, index) => (
                      <div
                        key={team.id}
                        className={`p-4 rounded-lg border ${
                          index === 0
                            ? "border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20"
                            : "bg-card"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            {index === 0 && (
                              <span className="text-2xl">🏆</span>
                            )}
                            <span className="font-semibold text-lg">
                              {team.name}
                            </span>
                          </div>
                          <Badge
                            variant={index === 0 ? "default" : "secondary"}
                            className="text-base px-3 py-1"
                          >
                            {team.score} pts
                          </Badge>
                        </div>
                        <div className="space-y-1.5 pl-8">
                          {team.players.map((player) => (
                            <div
                              key={player.id}
                              className={`flex justify-between text-sm ${
                                player.id === playerId
                                  ? "font-semibold text-foreground"
                                  : "text-muted-foreground"
                              }`}
                            >
                              <span>
                                {player.name}
                                {player.id === playerId && " (You)"}
                              </span>
                              <span>{player.score} pts</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : eventData.type === "end" ? (
          <div className="space-y-6">
            <Card>
              <CardContent className="py-12">
                <div className="text-center space-y-4">
                  <div className="text-4xl mb-4">🎉</div>
                  <h2 className="text-3xl font-bold">Game Over!</h2>
                  <p className="text-muted-foreground text-lg">
                    Thank you for playing!
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Final Leaderboard */}
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Final Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {eventData.teams
                    .sort((a, b) => b.score - a.score)
                    .map((team, index) => (
                      <div
                        key={team.id}
                        className={`p-5 rounded-lg border-2 ${
                          index === 0
                            ? "border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20"
                            : "border-border bg-card"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            {index === 0 && (
                              <span className="text-3xl">🏆</span>
                            )}
                            <span className="font-bold text-xl">
                              {team.name}
                            </span>
                            {index === 0 && (
                              <Badge className="ml-2">Winner</Badge>
                            )}
                          </div>
                          <Badge
                            variant={index === 0 ? "default" : "secondary"}
                            className="text-lg px-4 py-1.5"
                          >
                            {team.score} pts
                          </Badge>
                        </div>
                        <div className="space-y-2 pl-11">
                          {team.players.map((player) => (
                            <div
                              key={player.id}
                              className={`flex justify-between ${
                                player.id === playerId ? "font-semibold" : ""
                              }`}
                            >
                              <span>
                                {player.name}
                                {player.id === playerId && " (You)"}
                              </span>
                              <span>{player.score} pts</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}
      </div>
    </div>
  );
}
