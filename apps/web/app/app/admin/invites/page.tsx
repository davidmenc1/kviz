"use client";

import { useTRPC } from "@/trpc";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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

export default function InvitesPage() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [expiresInDays, setExpiresInDays] = useState("30");

  const inviteCodesQuery = useQuery(trpc.admin.getInviteCodes.queryOptions());
  const createInviteCodeMutation = useMutation(
    trpc.admin.createInviteCode.mutationOptions()
  );
  const deleteInviteCodeMutation = useMutation(
    trpc.admin.deleteInviteCode.mutationOptions()
  );

  const handleCreateInviteCode = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();
    try {
      await createInviteCodeMutation.mutateAsync({
        expiresInDays: parseInt(expiresInDays, 10),
      });
      queryClient.invalidateQueries({
        queryKey: trpc.admin.getInviteCodes.queryKey(),
      });
      setShowCreateDialog(false);
      setExpiresInDays("30");
    } catch (err) {
      console.error("Create invite code error:", err);
    }
  };

  const handleDeleteInviteCode = async (id: string) => {
    try {
      await deleteInviteCodeMutation.mutateAsync({ id });
      queryClient.invalidateQueries({
        queryKey: trpc.admin.getInviteCodes.queryKey(),
      });
    } catch (err) {
      console.error("Delete invite code error:", err);
    }
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
  };

  const isExpired = (expiresAt: Date) => {
    return new Date(expiresAt) < new Date();
  };

  if (inviteCodesQuery.isLoading) {
    return <div>Loading invite codes...</div>;
  }

  if (inviteCodesQuery.error) {
    return (
      <div className="text-destructive">
        Error: {inviteCodesQuery.error.message}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold">Invite Codes</h2>
          <p className="text-sm text-muted-foreground">
            Manage admin invite codes for registration
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>Create Invite Code</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Invite Code</DialogTitle>
              <DialogDescription>
                Generate a new invite code for admin registration
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateInviteCode} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="expiresInDays">Expires In (Days)</Label>
                <Input
                  id="expiresInDays"
                  name="expiresInDays"
                  type="number"
                  min="1"
                  max="365"
                  value={expiresInDays}
                  onChange={(e) => setExpiresInDays(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Enter number of days until expiration (1-365)
                </p>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createInviteCodeMutation.isPending}
                >
                  {createInviteCodeMutation.isPending
                    ? "Creating..."
                    : "Create"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {inviteCodesQuery.data && inviteCodesQuery.data.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              No invite codes yet. Create your first invite code!
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inviteCodesQuery.data?.map((inviteCode) => {
                const expired = isExpired(new Date(inviteCode.expiresAt));
                return (
                  <TableRow key={inviteCode.id}>
                    <TableCell className="font-mono font-medium">
                      {inviteCode.code}
                    </TableCell>
                    <TableCell>
                      {new Date(inviteCode.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {new Date(inviteCode.expiresAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant={expired ? "destructive" : "default"}>
                        {expired ? "Expired" : "Active"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(inviteCode.code)}
                        >
                          Copy
                        </Button>
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
                                This action cannot be undone. This will
                                permanently delete the invite code.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() =>
                                  handleDeleteInviteCode(inviteCode.id)
                                }
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
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
