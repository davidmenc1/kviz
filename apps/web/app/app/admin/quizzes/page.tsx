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
import { Textarea } from "@/components/ui/textarea";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function QuizzesPage() {
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<{
    id: string;
    name: string;
    description: string;
  } | null>(null);

  const quizzesQuery = useQuery(trpc.quiz.getQuizzes.queryOptions());
  const createQuizMutation = useMutation(
    trpc.quiz.createQuiz.mutationOptions()
  );
  const updateQuizMutation = useMutation(
    trpc.quiz.updateQuiz.mutationOptions()
  );
  const deleteQuizMutation = useMutation(
    trpc.quiz.deleteQuiz.mutationOptions()
  );

  const handleCreateQuiz = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    try {
      await createQuizMutation.mutateAsync({ name, description });
      queryClient.invalidateQueries({
        queryKey: trpc.quiz.getQuizzes.queryKey(),
      });
      setShowCreateDialog(false);
    } catch (err) {
      console.error("Create quiz error:", err);
    }
  };

  const handleUpdateQuiz = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingQuiz) return;
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    try {
      await updateQuizMutation.mutateAsync({
        id: editingQuiz.id,
        name,
        description,
      });
      queryClient.invalidateQueries({
        queryKey: trpc.quiz.getQuizzes.queryKey(),
      });
      setEditingQuiz(null);
    } catch (err) {
      console.error("Update quiz error:", err);
    }
  };

  const handleDeleteQuiz = async (id: string) => {
    try {
      await deleteQuizMutation.mutateAsync({ id });
      queryClient.invalidateQueries({
        queryKey: trpc.quiz.getQuizzes.queryKey(),
      });
    } catch (err) {
      console.error("Delete quiz error:", err);
    }
  };

  if (quizzesQuery.isLoading) {
    return <div>Loading quizzes...</div>;
  }

  if (quizzesQuery.error) {
    return (
      <div className="text-destructive">
        Error: {quizzesQuery.error.message}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold">Quizzes</h2>
          <p className="text-sm text-muted-foreground">
            Manage your quiz collection
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>Create Quiz</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Quiz</DialogTitle>
              <DialogDescription>
                Add a new quiz to your collection
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateQuiz} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Quiz Name</Label>
                <Input id="name" name="name" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" required />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateDialog(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createQuizMutation.isPending}>
                  {createQuizMutation.isPending ? "Creating..." : "Create"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {quizzesQuery.data && quizzesQuery.data.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              No quizzes yet. Create your first quiz!
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {quizzesQuery.data?.map((quiz) => (
                <TableRow
                  key={quiz.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/app/admin/quizzes/${quiz.id}`)}
                >
                  <TableCell className="font-medium">{quiz.name}</TableCell>
                  <TableCell>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {quiz.description || "No description"}
                    </p>
                  </TableCell>
                  <TableCell>
                    {new Date(quiz.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Dialog
                        open={editingQuiz?.id === quiz.id}
                        onOpenChange={(open) =>
                          open
                            ? setEditingQuiz({
                                id: quiz.id,
                                name: quiz.name,
                                description: quiz.description || "",
                              })
                            : setEditingQuiz(null)
                        }
                      >
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Edit
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Edit Quiz</DialogTitle>
                            <DialogDescription>
                              Update quiz information
                            </DialogDescription>
                          </DialogHeader>
                          <form
                            onSubmit={handleUpdateQuiz}
                            className="space-y-4"
                          >
                            <div className="space-y-2">
                              <Label htmlFor="edit-name">Quiz Name</Label>
                              <Input
                                id="edit-name"
                                name="name"
                                defaultValue={quiz.name}
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="edit-description">
                                Description
                              </Label>
                              <Textarea
                                id="edit-description"
                                name="description"
                                defaultValue={quiz.description || ""}
                                required
                              />
                            </div>
                            <div className="flex justify-end gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => setEditingQuiz(null)}
                              >
                                Cancel
                              </Button>
                              <Button
                                type="submit"
                                disabled={updateQuizMutation.isPending}
                              >
                                {updateQuizMutation.isPending
                                  ? "Saving..."
                                  : "Save"}
                              </Button>
                            </div>
                          </form>
                        </DialogContent>
                      </Dialog>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will
                              permanently delete the quiz and all its questions.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteQuiz(quiz.id)}
                              className="bg-destructive text-destructive-foreground"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
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
