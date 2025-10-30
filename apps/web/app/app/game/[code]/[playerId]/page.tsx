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
    return option?.text || optionId; // Fallback to ID if not found
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
  const eventData = gameEventsSubscription.data as EventData | undefined;

  // Handle option selection
  const handleOptionClick = async (optionId: string) => {
    if (!gameQuery.data?.id || !currentQuestionId) return;
    if (eventData?.type !== "new_question") return; // Only allow selection during questioning

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

  // Get current player's score
  const getPlayerScore = () => {
    if (eventData?.type === "correct_option") {
      for (const team of eventData.teams) {
        const player = team.players.find((p) => p.id === playerId);
        if (player) return player.score;
      }
    }
    return 0;
  };

  // Display current subscription state
  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto pt-8 space-y-6">
        {/* Game Info Card */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl">{game.name}</CardTitle>
                <CardDescription>Player: {playerId}</CardDescription>
                {eventData?.type === "correct_option" && (
                  <div className="mt-2">
                    <Badge variant="secondary">
                      Your Score: {getPlayerScore()}
                    </Badge>
                  </div>
                )}
              </div>
              <Badge variant="outline">{game.state}</Badge>
            </div>
          </CardHeader>
        </Card>

        {/* Current Event Data */}
        <Card>
          <CardHeader>
            <CardTitle>Current Game Event</CardTitle>
            <CardDescription>Live data from game subscription</CardDescription>
          </CardHeader>
          <CardContent>
            {!eventData ? (
              <div className="text-center py-8 text-muted-foreground">
                No events received yet
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <Badge className="mb-2">Event Type: {eventData.type}</Badge>
                </div>

                {eventData.type === "new_question" && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-lg mb-2">Question</h3>
                      <p className="text-base">{eventData.question}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Options</h3>
                      <div className="space-y-2">
                        {eventData.options.map((option) => {
                          const isSelected = selectedOptionId === option.id;
                          return (
                            <button
                              key={option.id}
                              onClick={() => handleOptionClick(option.id)}
                              disabled={submitAnswerMutation.isPending}
                              className={`w-full p-3 border rounded-lg text-left transition-colors ${
                                isSelected
                                  ? "border-primary bg-primary/10 border-2"
                                  : "border-border bg-muted/50 hover:bg-muted"
                              } ${
                                submitAnswerMutation.isPending
                                  ? "opacity-50 cursor-not-allowed"
                                  : "cursor-pointer"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span>{option.text}</span>
                                {isSelected && (
                                  <Badge variant="outline" className="ml-2">
                                    Selected
                                  </Badge>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {eventData.type === "correct_option" && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-2">Correct Answer</h3>
                      <div className="p-3 border-2 border-green-500 rounded-lg bg-green-50">
                        <span className="text-base font-medium">
                          {getOptionText(eventData.optionId)}
                        </span>
                      </div>
                    </div>

                    {/* Show feedback for player's answer */}
                    {lastAnswerFeedback && (
                      <div>
                        <h3 className="font-semibold mb-2">Your Answer</h3>
                        <div
                          className={`p-3 border-2 rounded-lg ${
                            lastAnswerFeedback.isCorrect
                              ? "border-green-500 bg-green-50"
                              : "border-red-500 bg-red-50"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span>
                              {lastAnswerFeedback.isCorrect
                                ? "✓ Correct!"
                                : "✗ Wrong"}
                            </span>
                            <span className="text-base font-medium">
                              {getOptionText(lastAnswerFeedback.optionId)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Team Scores */}
                    <div>
                      <h3 className="font-semibold mb-2">Team Scores</h3>
                      <div className="space-y-2">
                        {eventData.teams.map((team) => (
                          <div
                            key={team.id}
                            className="p-3 border rounded-lg bg-muted/50"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium">{team.name}</span>
                              <Badge variant="secondary">
                                Score: {team.score}
                              </Badge>
                            </div>
                            <div className="text-sm text-muted-foreground space-y-1">
                              {team.players.map((player) => (
                                <div
                                  key={player.id}
                                  className={`flex justify-between ${
                                    player.id === playerId
                                      ? "font-semibold"
                                      : ""
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
                    </div>
                  </div>
                )}

                {eventData.type === "end" && (
                  <div className="space-y-4">
                    <div className="text-center py-4">
                      <h3 className="font-semibold text-lg mb-2">Game Ended</h3>
                      <p className="text-muted-foreground">
                        The game has finished. Thank you for playing!
                      </p>
                    </div>

                    {/* Final Scores */}
                    <div>
                      <h3 className="font-semibold mb-2">Final Scores</h3>
                      <div className="space-y-2">
                        {eventData.teams
                          .sort((a, b) => b.score - a.score)
                          .map((team, index) => (
                            <div
                              key={team.id}
                              className={`p-3 border rounded-lg ${
                                index === 0
                                  ? "border-yellow-500 bg-yellow-50"
                                  : "bg-muted/50"
                              }`}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  {index === 0 && (
                                    <span className="text-xl">🏆</span>
                                  )}
                                  <span className="font-medium">
                                    {team.name}
                                  </span>
                                </div>
                                <Badge
                                  variant={
                                    index === 0 ? "default" : "secondary"
                                  }
                                >
                                  Score: {team.score}
                                </Badge>
                              </div>
                              <div className="text-sm text-muted-foreground space-y-1">
                                {team.players.map((player) => (
                                  <div
                                    key={player.id}
                                    className={`flex justify-between ${
                                      player.id === playerId
                                        ? "font-semibold"
                                        : ""
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
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Back Button */}
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={() => router.push(`/app/game/${code}`)}
          >
            Back to Teams
          </Button>
        </div>
      </div>
    </div>
  );
}
