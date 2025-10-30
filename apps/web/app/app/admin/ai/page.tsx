"use client";

import { useTRPC } from "@/trpc";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Sparkles } from "lucide-react";

export default function AIGeneratorPage() {
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [prompt, setPrompt] = useState("");
  const [error, setError] = useState<string | null>(null);

  const createAIMutation = useMutation(
    trpc.question.createQuestionsWithAi.mutationOptions()
  );

  const handleGenerate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    try {
      const result = await createAIMutation.mutateAsync({ prompt });
      queryClient.invalidateQueries({
        queryKey: trpc.quiz.getQuizzes.queryKey(),
      });
      setPrompt("");
      router.push(`/app/admin/quizzes/${result.id}`);
    } catch (err) {
      console.error("AI generation error:", err);
      setError(err instanceof Error ? err.message : "Failed to generate quiz");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <Sparkles className="h-6 w-6" />
          AI Quiz Generator
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Generate complete quizzes with questions and answers using AI
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Generate Quiz</CardTitle>
          <CardDescription>
            Describe the quiz you want to generate. The AI will create a
            complete quiz with questions and multiple choice answers.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleGenerate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="prompt">Quiz Description</Label>
              <Textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={8}
                placeholder="Example: Create a quiz about JavaScript basics with 5 questions covering variables, functions, arrays, objects, and ES6 features. Each question should have 4 options with one correct answer."
                required
                disabled={createAIMutation.isPending}
              />
              <p className="text-xs text-muted-foreground">
                Be specific about the topic, number of questions, and difficulty
                level for best results.
              </p>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={createAIMutation.isPending || !prompt.trim()}
                size="lg"
              >
                {createAIMutation.isPending ? (
                  <>
                    <Sparkles className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Quiz
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tips for Better Results</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
            <li>Specify the topic or subject clearly</li>
            <li>Mention the number of questions you want</li>
            <li>Include difficulty level (beginner, intermediate, advanced)</li>
            <li>Request specific topics or concepts to cover</li>
            <li>Ask for a certain number of answer options per question</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
