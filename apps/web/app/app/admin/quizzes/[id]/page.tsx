"use client";

import { useTRPC } from "@/trpc";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter, useParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function QuizDetailPage() {
  const router = useRouter();
  const params = useParams();
  const quizId = params.id as string;
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [showCreateQuestion, setShowCreateQuestion] = useState(false);
  const [showCreateOption, setShowCreateOption] = useState<string | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<{
    id: string;
    text: string;
    order: number;
  } | null>(null);
  const [editingOption, setEditingOption] = useState<{
    id: string;
    text: string;
    isCorrect: boolean;
  } | null>(null);
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);

  const questionsQuery = useQuery({
    ...trpc.question.getQuestions.queryOptions({ quizId }),
    enabled: !!quizId,
  });
  const createQuestionMutation = useMutation(
    trpc.question.createQuestion.mutationOptions()
  );
  const updateQuestionMutation = useMutation(
    trpc.question.updateQuestion.mutationOptions()
  );
  const deleteQuestionMutation = useMutation(
    trpc.question.deleteQuestion.mutationOptions()
  );
  const createOptionMutation = useMutation(
    trpc.question.createOption.mutationOptions()
  );
  const updateOptionMutation = useMutation(
    trpc.question.updateOption.mutationOptions()
  );
  const deleteOptionMutation = useMutation(
    trpc.question.deleteOption.mutationOptions()
  );

  const handleCreateQuestion = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const text = formData.get("text") as string;
    const order = parseInt(formData.get("order") as string);
    try {
      await createQuestionMutation.mutateAsync({
        quizId,
        text,
        order,
      });
      queryClient.invalidateQueries({
        queryKey: trpc.question.getQuestions.queryKey({ quizId }),
      });
      setShowCreateQuestion(false);
      e.currentTarget.reset();
    } catch (err) {
      console.error("Create question error:", err);
    }
  };

  const handleUpdateQuestion = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingQuestion) return;
    const formData = new FormData(e.currentTarget);
    const text = formData.get("text") as string;
    const order = parseInt(formData.get("order") as string);
    try {
      await updateQuestionMutation.mutateAsync({
        id: editingQuestion.id,
        text,
        order,
      });
      queryClient.invalidateQueries({
        queryKey: trpc.question.getQuestions.queryKey({ quizId }),
      });
      setEditingQuestion(null);
    } catch (err) {
      console.error("Update question error:", err);
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    try {
      await deleteQuestionMutation.mutateAsync({ id });
      queryClient.invalidateQueries({
        queryKey: trpc.question.getQuestions.queryKey({ quizId }),
      });
      if (expandedQuestion === id) {
        setExpandedQuestion(null);
      }
    } catch (err) {
      console.error("Delete question error:", err);
    }
  };

  const [newOptionText, setNewOptionText] = useState("");
  const [newOptionCorrect, setNewOptionCorrect] = useState("false");

  const handleCreateOption = async (
    e: React.FormEvent<HTMLFormElement>,
    questionId: string
  ) => {
    e.preventDefault();
    const isCorrect = newOptionCorrect === "true";
    try {
      await createOptionMutation.mutateAsync({
        questionId,
        text: newOptionText,
        isCorrect,
      });
      queryClient.invalidateQueries({
        queryKey: trpc.question.getQuestions.queryKey({ quizId }),
      });
      setShowCreateOption(null);
      setNewOptionText("");
      setNewOptionCorrect("false");
    } catch (err) {
      console.error("Create option error:", err);
    }
  };

  const [editOptionText, setEditOptionText] = useState("");
  const [editOptionCorrect, setEditOptionCorrect] = useState("false");

  const handleUpdateOption = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingOption) return;
    const isCorrect = editOptionCorrect === "true";
    try {
      await updateOptionMutation.mutateAsync({
        id: editingOption.id,
        text: editOptionText,
        isCorrect,
      });
      queryClient.invalidateQueries({
        queryKey: trpc.question.getQuestions.queryKey({ quizId }),
      });
      setEditingOption(null);
      setEditOptionText("");
      setEditOptionCorrect("false");
    } catch (err) {
      console.error("Update option error:", err);
    }
  };

  const handleDeleteOption = async (id: string) => {
    try {
      await deleteOptionMutation.mutateAsync({ id });
      queryClient.invalidateQueries({
        queryKey: trpc.question.getQuestions.queryKey({ quizId }),
      });
    } catch (err) {
      console.error("Delete option error:", err);
    }
  };

  if (questionsQuery.isLoading) {
    return <div>Loading questions...</div>;
  }

  if (questionsQuery.error) {
    return (
      <div className="text-destructive">Error: {questionsQuery.error.message}</div>
    );
  }

  const questions = questionsQuery.data?.sort((a, b) => a.order - b.order) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/app/admin/quizzes">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h2 className="text-2xl font-semibold">Quiz Questions</h2>
          <p className="text-sm text-muted-foreground">
            Manage questions and options for this quiz
          </p>
        </div>
        <Dialog open={showCreateQuestion} onOpenChange={setShowCreateQuestion}>
          <DialogTrigger asChild>
            <Button>Add Question</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Question</DialogTitle>
              <DialogDescription>
                Add a new question to this quiz
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateQuestion} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="question-text">Question Text</Label>
                <Textarea id="question-text" name="text" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="question-order">Order</Label>
                <Input
                  id="question-order"
                  name="order"
                  type="number"
                  min="1"
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateQuestion(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createQuestionMutation.isPending}>
                  {createQuestionMutation.isPending ? "Creating..." : "Create"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {questions.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              No questions yet. Add your first question!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {questions.map((question) => (
            <Card key={question.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline">Order: {question.order}</Badge>
                    </div>
                    <CardTitle className="text-lg">{question.text}</CardTitle>
                  </div>
                  <div className="flex gap-2">
                    <Dialog
                      open={editingQuestion?.id === question.id}
                      onOpenChange={(open) => {
                        if (open) {
                          setEditingQuestion({
                            id: question.id,
                            text: question.text,
                            order: question.order,
                          });
                        } else {
                          setEditingQuestion(null);
                        }
                      }}
                    >
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setEditingQuestion({
                              id: question.id,
                              text: question.text,
                              order: question.order,
                            })
                          }
                        >
                          Edit
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit Question</DialogTitle>
                          <DialogDescription>
                            Update question information
                          </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleUpdateQuestion} className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="edit-question-text">Question Text</Label>
                            <Textarea
                              id="edit-question-text"
                              name="text"
                              defaultValue={editingQuestion?.text || question.text}
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="edit-question-order">Order</Label>
                            <Input
                              id="edit-question-order"
                              name="order"
                              type="number"
                              defaultValue={editingQuestion?.order || question.order}
                              min="1"
                              required
                            />
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setEditingQuestion(null)}
                            >
                              Cancel
                            </Button>
                            <Button
                              type="submit"
                              disabled={updateQuestionMutation.isPending}
                            >
                              {updateQuestionMutation.isPending ? "Saving..." : "Save"}
                            </Button>
                          </div>
                        </form>
                      </DialogContent>
                    </Dialog>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete this question and all its
                            options.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteQuestion(question.id)}
                            className="bg-destructive text-destructive-foreground"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">Options</h4>
                    <Dialog
                      open={showCreateOption === question.id}
                      onOpenChange={(open) =>
                        setShowCreateOption(open ? question.id : null)
                      }
                    >
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setShowCreateOption(question.id);
                            setNewOptionText("");
                            setNewOptionCorrect("false");
                          }}
                        >
                          Add Option
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Create Option</DialogTitle>
                          <DialogDescription>
                            Add a new answer option
                          </DialogDescription>
                        </DialogHeader>
                        <form
                          onSubmit={(e) => handleCreateOption(e, question.id)}
                          className="space-y-4"
                        >
                          <div className="space-y-2">
                            <Label htmlFor="option-text">Option Text</Label>
                            <Input
                              id="option-text"
                              value={newOptionText}
                              onChange={(e) => setNewOptionText(e.target.value)}
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="option-correct">Is Correct?</Label>
                            <Select
                              value={newOptionCorrect}
                              onValueChange={setNewOptionCorrect}
                              required
                            >
                              <SelectTrigger id="option-correct">
                                <SelectValue placeholder="Select correctness" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="false">Incorrect</SelectItem>
                                <SelectItem value="true">Correct</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setShowCreateOption(null)}
                            >
                              Cancel
                            </Button>
                            <Button
                              type="submit"
                              disabled={createOptionMutation.isPending}
                            >
                              {createOptionMutation.isPending
                                ? "Creating..."
                                : "Create"}
                            </Button>
                          </div>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>

                  {question.options.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No options yet. Add options for this question.
                    </p>
                  ) : (
                    <div className="space-y-2">
                          {question.options.map((option) => (
                        <div key={option.id}>
                          {editingOption?.id === option.id ? (
                            <Card>
                              <CardContent className="pt-4">
                                <form
                                  onSubmit={handleUpdateOption}
                                  className="space-y-4"
                                >
                                  <div className="space-y-2">
                                    <Label htmlFor="edit-option-text">
                                      Option Text
                                    </Label>
                                    <Input
                                      id="edit-option-text"
                                      value={editOptionText}
                                      onChange={(e) =>
                                        setEditOptionText(e.target.value)
                                      }
                                      required
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="edit-option-correct">
                                      Is Correct?
                                    </Label>
                                    <Select
                                      value={editOptionCorrect}
                                      onValueChange={setEditOptionCorrect}
                                      required
                                    >
                                      <SelectTrigger id="edit-option-correct">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="false">
                                          Incorrect
                                        </SelectItem>
                                        <SelectItem value="true">Correct</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="flex justify-end gap-2">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      onClick={() => setEditingOption(null)}
                                    >
                                      Cancel
                                    </Button>
                                    <Button
                                      type="submit"
                                      disabled={updateOptionMutation.isPending}
                                    >
                                      {updateOptionMutation.isPending
                                        ? "Saving..."
                                        : "Save"}
                                    </Button>
                                  </div>
                                </form>
                              </CardContent>
                            </Card>
                          ) : (
                            <div className="flex items-center justify-between p-3 border rounded-md">
                              <div className="flex items-center gap-2">
                                <Badge
                                  variant={
                                    option.isCorrect ? "default" : "secondary"
                                  }
                                >
                                  {option.isCorrect ? "Correct" : "Incorrect"}
                                </Badge>
                                <span>{option.text}</span>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setEditingOption({
                                      id: option.id,
                                      text: option.text,
                                      isCorrect: option.isCorrect,
                                    });
                                    setEditOptionText(option.text);
                                    setEditOptionCorrect(
                                      option.isCorrect.toString()
                                    );
                                  }}
                                >
                                  Edit
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="destructive" size="sm">
                                      Delete
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>
                                        Are you sure?
                                      </AlertDialogTitle>
                                      <AlertDialogDescription>
                                        This will permanently delete this option.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() =>
                                          handleDeleteOption(option.id)
                                        }
                                        className="bg-destructive text-destructive-foreground"
                                      >
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

