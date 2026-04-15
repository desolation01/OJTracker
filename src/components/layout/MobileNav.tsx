"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Clock3, ListChecks, Settings, Shield } from "lucide-react";

import { cn } from "@/lib/utils";

const links = [
  { href: "/dashboard", label: "Home", icon: CalendarDays },
  { href: "/dashboard/entries", label: "Entries", icon: ListChecks },
  { href: "/dashboard/timeclock", label: "Clock", icon: Clock3 },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

interface MobileNavProps {
  isAdmin?: boolean;
}

export function MobileNav({ isAdmin = false }: MobileNavProps) {
  const pathname = usePathname();

  const allLinks = isAdmin
    ? [{ href: "/dashboard/admin", label: "Admin", icon: Shield }, ...links]
    : links;

  const colCount = allLinks.length;

  return (
    <nav className="glass fixed bottom-0 left-0 right-0 z-30 border-t border-border p-2 lg:hidden">
      <ul className={cn("grid gap-1", colCount === 5 ? "grid-cols-5" : "grid-cols-4")}>
        {allLinks.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;

          return (
            <li key={link.href}>
              <Link
                href={link.href}
                className={cn(
                  "flex flex-col items-center rounded-lg px-2 py-2 text-[11px] font-medium transition-all duration-200",
                  isActive ? "text-primary" : "text-muted hover:text-foreground",
                )}
              >
                <Icon className={cn("mb-1 h-4 w-4 transition-colors duration-200", isActive && "text-primary")} />
                {link.label}
                {isActive && <div className="mt-1 h-1 w-1 rounded-full bg-primary" />}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
