"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Clock3, ListChecks, Settings, Shield } from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: CalendarDays },
  { href: "/dashboard/entries", label: "Entries", icon: ListChecks },
  { href: "/dashboard/timeclock", label: "Time Clock", icon: Clock3 },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

interface SidebarProps {
  hasActiveSession?: boolean;
  isAdmin?: boolean;
}

export function Sidebar({ hasActiveSession = false, isAdmin = false }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 flex-col border-r border-border bg-surface p-4 lg:flex">
      <div className="mb-8">
        <h1 className="font-display text-xl font-bold text-gradient-primary">OJTracker</h1>
        <p className="mt-1 text-xs text-muted">On-the-job training hours monitor</p>
      </div>

      <nav className="space-y-1">
        {isAdmin && (
          <Link
            href="/dashboard/admin"
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
              pathname === "/dashboard/admin"
                ? "bg-primary/10 text-primary shadow-glow"
                : "text-muted hover:bg-surface-elevated/50 hover:text-foreground",
            )}
          >
            <Shield className={cn("h-4 w-4 transition-colors duration-200", pathname === "/dashboard/admin" && "text-primary")} />
            <span>Admin Panel</span>
            {pathname === "/dashboard/admin" && <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />}
          </Link>
        )}
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;

          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-primary/10 text-primary shadow-glow"
                  : "text-muted hover:bg-surface-elevated/50 hover:text-foreground",
              )}
            >
              <Icon className={cn("h-4 w-4 transition-colors duration-200", isActive && "text-primary")} />
              <span>{link.label}</span>
              {isActive && <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto pt-4">
        {hasActiveSession ? <Badge variant="success">Clocked In</Badge> : <Badge variant="muted">Idle</Badge>}
      </div>
    </aside>
  );
}
