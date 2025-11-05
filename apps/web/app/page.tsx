import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="flex flex-col items-center gap-6">
        <Link href="/app/game">
          <Button size="lg" className="text-lg px-12 py-8 h-auto">
            Join Game
          </Button>
        </Link>
        <Link href="/app/login">
          <Button variant="outline" size="sm">
            Log In
          </Button>
        </Link>
      </div>
    </div>
  );
}
