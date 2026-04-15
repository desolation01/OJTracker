"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { isPwaLocalMode } from "@/lib/pwa-mode";

interface HeaderProps {
  name?: string | null;
  hasActiveSession?: boolean;
  isAdmin?: boolean;
}

export function Header({ name, hasActiveSession = false }: HeaderProps) {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      toast.error(error.message);
      return;
    }

    router.push("/login");
    router.refresh();
  }

  return (
    <header className="glass sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border px-6">
      <div>
        <p className="font-display text-lg font-semibold tracking-tight">Welcome{name ? `, ${name}` : ""}</p>
        <p className="text-xs text-muted">Track today, finish sooner.</p>
      </div>

      <div className="flex items-center gap-3">
        {isPwaLocalMode ? <Badge variant="default">Local Mode</Badge> : null}
        {hasActiveSession ? <Badge variant="success">Session Active</Badge> : <Badge variant="muted">No Session</Badge>}
        {!isPwaLocalMode ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="gap-1.5 text-muted hover:text-danger"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        ) : null}
      </div>
    </header>
  );
}
