"use client";

import { useTRPC } from "@/trpc";
import { useAuth } from "@/contexts/auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function AdminHeader() {
  const router = useRouter();
  const trpc = useTRPC();
  const { setSessionId } = useAuth();

  const adminQuery = useQuery(trpc.admin.me.queryOptions());
  const logoutMutation = useMutation(trpc.admin.logout.mutationOptions());

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      setSessionId(null);
      router.push("/app/login");
    }
  };

  if (adminQuery.isLoading) {
    return (
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex justify-between items-center mb-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        {adminQuery.data && (
          <p className="text-sm text-muted-foreground mt-1">
            Logged in as {adminQuery.data.username}
          </p>
        )}
      </div>
      <Button
        onClick={handleLogout}
        disabled={logoutMutation.isPending}
        variant="destructive"
      >
        {logoutMutation.isPending ? "Logging out..." : "Logout"}
      </Button>
    </div>
  );
}

