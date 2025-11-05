"use client";

import { useTRPC } from "@/trpc";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useSubscription } from "@trpc/tanstack-react-query";
import { useState, useEffect } from "react";
import type { EventData } from "../../../../../../api/routes/game";

export default function TVViewPage() {
  const params = useParams();
  const code = params.code as string;
  const trpc = useTRPC();

  const [currentQuestion, setCurrentQuestion] = useState<string | null>(null);
  const [currentOptions, setCurrentOptions] = useState<
    Array<{ id: string; text: string }>
  >([]);
  const [correctOptionId, setCorrectOptionId] = useState<string | null>(null);

  // Get game by code to verify it exists
  const gameQuery = useQuery(trpc.game.getGameByCode.queryOptions({ code }));

  // Subscribe to game events
  const gameEventsSubscription = useSubscription(
    trpc.game.gameEventsByCode.subscriptionOptions(
      { code },
      {
        enabled: !!code,
      }
    )
  );

  // Initialize with current question from game query if available
  useEffect(() => {
    if (gameQuery.data?.currentQuestion && !currentQuestion) {
      setCurrentQuestion(gameQuery.data.currentQuestion.text);
      setCurrentOptions(
        gameQuery.data.currentQuestion.options.map((opt) => ({
          id: opt.id,
          text: opt.text,
        }))
      );
      // If we're in results state, show the correct answer
      if (gameQuery.data.state === "results") {
        const correctOption = gameQuery.data.currentQuestion.options.find(
          (opt) => opt.isCorrect
        );
        if (correctOption) {
          setCorrectOptionId(correctOption.id);
        }
      }
    }
  }, [gameQuery.data, currentQuestion]);

  // Handle event changes
  useEffect(() => {
    const eventData = gameEventsSubscription.data as EventData | undefined;
    if (!eventData) return;

    if (eventData.type === "new_question") {
      setCurrentQuestion(eventData.question);
      setCurrentOptions(eventData.options);
      setCorrectOptionId(null);
    } else if (eventData.type === "correct_option") {
      setCorrectOptionId(eventData.optionId);
    } else if (eventData.type === "end") {
      // Keep showing the last question
    }
  }, [gameEventsSubscription.data]);

  const eventData = gameEventsSubscription.data as EventData | undefined;
  const gameState = gameQuery.data?.state;

  if (gameQuery.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="text-4xl">Loading...</div>
      </div>
    );
  }

  if (gameQuery.error || !gameQuery.data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="text-4xl">Game not found</div>
      </div>
    );
  }

  // Beginning state - game not started yet
  if (!eventData && gameState === "not-started") {
    return (
      <div className="min-h-screen bg-black text-white p-8 flex flex-col items-center justify-center">
        <div className="max-w-6xl w-full text-center space-y-12">
          <h1 className="text-6xl md:text-8xl font-bold">
            {gameQuery.data.name}
          </h1>
          <p className="text-4xl md:text-5xl mt-8 text-gray-400">
            Game Starting Soon...
          </p>
          {gameQuery.data.teams && gameQuery.data.teams.length > 0 && (
            <div className="mt-16">
              <p className="text-3xl md:text-4xl mb-8 text-gray-300">
                Teams Joined: {gameQuery.data.teams.length}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // End state
  if (eventData?.type === "end" || gameState === "ended") {
    const teams = eventData?.type === "end" ? eventData.teams : [];
    return (
      <div className="min-h-screen bg-black text-white p-8 flex flex-col items-center justify-center">
        <div className="max-w-6xl w-full space-y-12">
          <div className="text-center">
            <div className="text-8xl md:text-9xl mb-8">🎉</div>
            <h1 className="text-6xl md:text-8xl font-bold mb-4">Game Over!</h1>
            <p className="text-3xl md:text-4xl text-gray-400">Final Results</p>
          </div>

          {teams.length > 0 && (
            <div className="space-y-6 mt-16">
              {teams
                .sort((a, b) => b.score - a.score)
                .map((team, index) => (
                  <div
                    key={team.id}
                    className={`p-8 rounded-lg border-4 transition-all ${
                      index === 0
                        ? "bg-yellow-600 border-yellow-400"
                        : "bg-gray-900 border-gray-700"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {index === 0 && (
                          <div className="text-6xl md:text-7xl">🏆</div>
                        )}
                        <div className="text-4xl md:text-5xl font-bold">
                          {team.name}
                        </div>
                      </div>
                      <div className="text-5xl md:text-6xl font-bold">
                        {team.score} pts
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Results state - show teams and scores
  if (eventData?.type === "correct_option") {
    const teams = eventData.teams;
    // Only show the correct answer
    const correctOption = currentOptions.find(
      (opt) => opt.id === correctOptionId
    );
    const correctOptionIndex = currentOptions.findIndex(
      (opt) => opt.id === correctOptionId
    );

    return (
      <div className="h-screen bg-black text-white p-6 flex flex-col items-center justify-center overflow-hidden">
        <div className="max-w-6xl w-full h-full flex flex-col justify-between py-4">
          {currentQuestion && correctOption && (
            <div className="flex-shrink-0">
              <div className="text-center mb-6">
                <h1 className="text-4xl md:text-6xl font-bold leading-tight line-clamp-3">
                  {currentQuestion}
                </h1>
              </div>

              <div className="mt-8">
                <div className="p-6 rounded-lg border-4 bg-green-600 border-green-400 text-white">
                  <div className="flex items-center gap-4">
                    <div className="text-4xl md:text-5xl font-bold text-white">
                      {String.fromCharCode(65 + correctOptionIndex)}.
                    </div>
                    <div className="text-3xl md:text-4xl font-semibold flex-1">
                      {correctOption.text}
                    </div>
                    <div className="text-4xl md:text-5xl">✓</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Teams Leaderboard */}
          <div className="flex-shrink min-h-0 flex flex-col mt-6">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
              Leaderboard
            </h2>
            <div className="space-y-3 overflow-y-auto flex-1">
              {teams
                .sort((a, b) => b.score - a.score)
                .map((team, index) => (
                  <div
                    key={team.id}
                    className={`p-4 rounded-lg border-4 transition-all flex-shrink-0 ${
                      index === 0
                        ? "bg-yellow-600 border-yellow-400"
                        : "bg-gray-900 border-gray-700"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {index === 0 && (
                          <div className="text-4xl md:text-5xl">🏆</div>
                        )}
                        <div className="text-2xl md:text-3xl font-bold">
                          {team.name}
                        </div>
                      </div>
                      <div className="text-3xl md:text-4xl font-bold">
                        {team.score} pts
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Question state
  return (
    <div className="min-h-screen bg-black text-white p-8 flex flex-col items-center justify-center">
      <div className="max-w-6xl w-full space-y-12">
        {currentQuestion ? (
          <>
            <div className="text-center">
              <h1 className="text-6xl md:text-8xl font-bold leading-tight">
                {currentQuestion}
              </h1>
            </div>

            <div className="space-y-6 mt-16">
              {currentOptions.map((option, index) => {
                const isCorrect = correctOptionId === option.id;
                return (
                  <div
                    key={option.id}
                    className={`p-8 rounded-lg border-4 transition-all ${
                      isCorrect
                        ? "bg-green-600 border-green-400 text-white"
                        : "bg-gray-900 border-gray-700 text-white"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`text-5xl md:text-6xl font-bold ${
                          isCorrect ? "text-white" : "text-gray-400"
                        }`}
                      >
                        {String.fromCharCode(65 + index)}.
                      </div>
                      <div className="text-4xl md:text-5xl font-semibold flex-1">
                        {option.text}
                      </div>
                      {isCorrect && (
                        <div className="text-5xl md:text-6xl">✓</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="text-center">
            <h1 className="text-6xl md:text-8xl font-bold">
              {gameQuery.data.name}
            </h1>
            <p className="text-3xl md:text-4xl mt-8 text-gray-400">
              Waiting for question...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
