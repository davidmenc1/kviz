"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function AdminNav() {
  const pathname = usePathname();

  const navItems = [
    { href: "/app/admin/quizzes", label: "Quizzes" },
    { href: "/app/admin/games", label: "Games" },
    { href: "/app/admin/ai", label: "AI Generator" },
  ];

  return (
    <nav className="flex gap-2 border-b pb-4 mb-6">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link key={item.href} href={item.href}>
            <Button
              variant={isActive ? "default" : "ghost"}
              className={cn(isActive && "bg-primary text-primary-foreground")}
            >
              {item.label}
            </Button>
          </Link>
        );
      })}
    </nav>
  );
}

