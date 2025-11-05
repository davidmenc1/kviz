"use client";

import { useTRPC } from "@/trpc";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export default function AIGeneratorPage() {
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [prompt, setPrompt] = useState("");

  const createAIMutation = useMutation(
    trpc.question.createQuestionsWithAi.mutationOptions()
  );

  const handleGenerate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const result = await createAIMutation.mutateAsync({ prompt });
      queryClient.invalidateQueries({
        queryKey: trpc.quiz.getQuizzes.queryKey(),
      });
      setPrompt("");
      router.push(`/app/admin/quizzes/${result.id}`);
    } catch (err) {
      console.error("AI generation error:", err);
    }
  };

  return (
    <form onSubmit={handleGenerate} className="space-y-4">
      <Textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Enter your prompt..."
        disabled={createAIMutation.isPending}
      />
      <Button
        type="submit"
        disabled={createAIMutation.isPending || !prompt.trim()}
      >
        {createAIMutation.isPending ? "Generating..." : "Generate"}
      </Button>
    </form>
  );
}
