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

  const [currentQuestion, setCurrentQuestion] = useState<{
    text: string;
    imageUrl: string | null;
    type: "MULTIPLE_CHOICE" | "YES_NO" | "RANGE";
    minValue?: number | null;
    maxValue?: number | null;
  } | null>(null);
  const [currentOptions, setCurrentOptions] = useState<
    Array<{ id: string; text: string }>
  >([]);
  const [correctOptionId, setCorrectOptionId] = useState<string | null>(null);
  const [correctValue, setCorrectValue] = useState<number | null>(null);

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
      setCurrentQuestion({
        text: gameQuery.data.currentQuestion.text,
        imageUrl: gameQuery.data.currentQuestion.imageUrl ?? null,
        type: gameQuery.data.currentQuestion.type as
          | "MULTIPLE_CHOICE"
          | "YES_NO"
          | "RANGE",
        minValue: gameQuery.data.currentQuestion.minValue ?? null,
        maxValue: gameQuery.data.currentQuestion.maxValue ?? null,
      });
      setCurrentOptions(
        gameQuery.data.currentQuestion.options.map((opt) => ({
          id: opt.id,
          text: opt.text,
        }))
      );
      // If we're in results state, show the correct answer
      if (gameQuery.data.state === "results") {
        if (gameQuery.data.currentQuestion.type === "RANGE") {
          setCorrectValue(gameQuery.data.currentQuestion.correctValue ?? null);
        } else {
          const correctOption = gameQuery.data.currentQuestion.options.find(
            (opt) => opt.isCorrect
          );
          if (correctOption) {
            setCorrectOptionId(correctOption.id);
          }
        }
      }
    }
  }, [gameQuery.data, currentQuestion]);

  // Handle event changes
  useEffect(() => {
    const eventData = gameEventsSubscription.data as EventData | undefined;
    if (!eventData) return;

    if (eventData.type === "new_question") {
      setCurrentQuestion({
        text: eventData.question,
        imageUrl: eventData.imageUrl ?? null,
        type: eventData.questionType,
        minValue: eventData.minValue ?? null,
        maxValue: eventData.maxValue ?? null,
      });
      setCurrentOptions(eventData.options);
      setCorrectOptionId(null);
      setCorrectValue(null);
    } else if (eventData.type === "correct_option") {
      if (eventData.questionType === "RANGE") {
        setCorrectValue(eventData.correctValue ?? null);
      } else {
        setCorrectOptionId(eventData.optionId ?? null);
      }
    } else if (eventData.type === "end") {
      // Keep showing the last question
    }
  }, [gameEventsSubscription.data]);

  const eventData = gameEventsSubscription.data as EventData | undefined;
  const gameState = gameQuery.data?.state;

  if (gameQuery.isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-black text-white overflow-hidden">
        <div className="text-3xl">Loading...</div>
      </div>
    );
  }

  if (gameQuery.error || !gameQuery.data) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-black text-white overflow-hidden">
        <div className="text-3xl">Game not found</div>
      </div>
    );
  }

  // Beginning state - game not started yet
  if (!eventData && gameState === "not-started") {
    return (
      <div className="h-screen w-screen bg-black text-white p-8 flex flex-col items-center justify-center overflow-hidden">
        <div className="max-w-6xl w-full text-center space-y-8">
          <h1 className="text-5xl md:text-7xl font-bold">
            {gameQuery.data.name}
          </h1>
          <p className="text-3xl md:text-4xl text-gray-400">
            Game Starting Soon...
          </p>
          {gameQuery.data.teams && gameQuery.data.teams.length > 0 && (
            <div className="mt-8">
              <p className="text-2xl md:text-3xl text-gray-300">
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
      <div className="h-screen w-screen bg-black text-white p-6 flex flex-col items-center justify-center overflow-hidden">
        <div className="max-w-6xl w-full h-full flex flex-col justify-center space-y-6">
          <div className="text-center flex-shrink-0">
            <div className="text-6xl mb-4">🎉</div>
            <h1 className="text-5xl md:text-6xl font-bold mb-2">Game Over!</h1>
            <p className="text-2xl md:text-3xl text-gray-400">Final Results</p>
          </div>

          {teams.length > 0 && (
            <div className="space-y-3 overflow-y-auto flex-1 min-h-0">
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
                        {index === 0 && <div className="text-4xl">🏆</div>}
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
      <div className="h-screen w-screen bg-black text-white p-4 flex flex-col items-center justify-center overflow-hidden">
        <div className="max-w-6xl w-full h-full flex flex-col justify-between py-2">
          {currentQuestion && (
            <div className="flex-shrink-0">
              <div className="text-center mb-3">
                <h1 className="text-2xl md:text-3xl font-bold leading-tight line-clamp-2">
                  {currentQuestion.text}
                </h1>
              </div>

              {currentQuestion.imageUrl && (
                <div className="flex justify-center mb-3">
                  <img
                    src={currentQuestion.imageUrl}
                    alt="Question illustration"
                    className="max-h-[25vh] w-auto rounded-lg object-contain shadow-2xl"
                  />
                </div>
              )}

              <div className="mt-3">
                {currentQuestion.type === "RANGE" ? (
                  <div className="p-4 rounded-lg border-4 bg-green-600 border-green-400 text-white">
                    <div className="text-center space-y-2">
                      <div className="text-lg md:text-xl font-medium">
                        Correct Answer
                      </div>
                      <div className="text-4xl md:text-5xl font-bold">
                        {correctValue}
                      </div>
                      <div className="text-sm md:text-base opacity-90">
                        Range: {currentQuestion.minValue} -{" "}
                        {currentQuestion.maxValue}
                      </div>
                    </div>
                  </div>
                ) : (
                  correctOption && (
                    <div className="p-3 rounded-lg border-4 bg-green-600 border-green-400 text-white">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl md:text-3xl font-bold text-white">
                          {String.fromCharCode(65 + correctOptionIndex)}.
                        </div>
                        <div className="text-xl md:text-2xl font-semibold flex-1 line-clamp-2">
                          {correctOption.text}
                        </div>
                        <div className="text-2xl md:text-3xl">✓</div>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          )}

          {/* Teams Leaderboard */}
          <div className="flex-shrink min-h-0 flex flex-col mt-3">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-2">
              Leaderboard
            </h2>
            <div className="space-y-2 overflow-y-auto flex-1">
              {teams
                .sort((a, b) => b.score - a.score)
                .map((team, index) => (
                  <div
                    key={team.id}
                    className={`p-3 rounded-lg border-3 transition-all flex-shrink-0 ${
                      index === 0
                        ? "bg-yellow-600 border-yellow-400"
                        : "bg-gray-900 border-gray-700"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {index === 0 && (
                          <div className="text-2xl md:text-3xl">🏆</div>
                        )}
                        <div className="text-lg md:text-xl font-bold line-clamp-1">
                          {team.name}
                        </div>
                      </div>
                      <div className="text-xl md:text-2xl font-bold">
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
    <div className="h-screen w-screen bg-black text-white p-4 flex flex-col items-center justify-center overflow-hidden">
      <div className="max-w-6xl w-full h-full flex flex-col justify-center py-4">
        {currentQuestion ? (
          <>
            <div className="text-center flex-shrink-0 mb-4">
              <h1 className="text-3xl md:text-4xl font-bold leading-tight line-clamp-3">
                {currentQuestion.text}
              </h1>
            </div>

            {currentQuestion.imageUrl && (
              <div className="flex justify-center flex-shrink-0 mb-4">
                <img
                  src={currentQuestion.imageUrl}
                  alt="Question illustration"
                  className="max-h-[30vh] w-auto rounded-lg object-contain shadow-2xl"
                />
              </div>
            )}

            {currentQuestion.type === "RANGE" ? (
              <div className="flex-shrink-0">
                <div className="p-6 rounded-lg border-4 bg-gray-900 border-gray-700 text-white">
                  <div className="text-center space-y-3">
                    <div className="text-xl md:text-2xl font-medium">
                      Enter a number between
                    </div>
                    <div className="text-3xl md:text-4xl font-bold">
                      {currentQuestion.minValue} - {currentQuestion.maxValue}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3 flex-shrink-0">
                {currentOptions.map((option, index) => {
                  const isCorrect = correctOptionId === option.id;
                  return (
                    <div
                      key={option.id}
                      className={`p-4 rounded-lg border-4 transition-all ${
                        isCorrect
                          ? "bg-green-600 border-green-400 text-white"
                          : "bg-gray-900 border-gray-700 text-white"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`text-3xl md:text-4xl font-bold ${
                            isCorrect ? "text-white" : "text-gray-400"
                          }`}
                        >
                          {String.fromCharCode(65 + index)}.
                        </div>
                        <div className="text-2xl md:text-3xl font-semibold flex-1 line-clamp-2">
                          {option.text}
                        </div>
                        {isCorrect && (
                          <div className="text-3xl md:text-4xl">✓</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold">
              {gameQuery.data.name}
            </h1>
            <p className="text-2xl md:text-3xl mt-6 text-gray-400">
              Waiting for question...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
