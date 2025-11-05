"use client";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminNav } from "@/components/admin/AdminNav";
import { usePathname } from "next/navigation";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isPrintPage = pathname?.includes("/print");

  return (
    <ProtectedRoute>
      {isPrintPage ? (
        children
      ) : (
        <div className="min-h-screen bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="space-y-6">
              <AdminHeader />
              <AdminNav />
              {children}
            </div>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}
