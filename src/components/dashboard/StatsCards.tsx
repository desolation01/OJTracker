"use client";

import type { StatsResult } from "@/lib/calculations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StatsCardsProps {
  stats?: StatsResult;
}

export function StatsCards({ stats }: StatsCardsProps) {
  const items = [
    {
      label: "Logged Hours",
      value: stats ? stats.totalHours.toFixed(2) : "--",
      suffix: "h",
      accent: "text-primary",
    },
    {
      label: "Remaining Hours",
      value: stats ? stats.remainingHours.toFixed(2) : "--",
      suffix: "h",
      accent: "text-foreground",
    },
    {
      label: "Est. Days Left",
      value: stats ? String(stats.estimatedDaysLeft) : "--",
      suffix: "days",
      accent: "text-foreground",
    },
    {
      label: "Est. End Date",
      value: stats?.estimatedCompletionDate ?? "--",
      suffix: "",
      accent: "text-primary",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item, i) => (
        <Card
          key={item.label}
          className="animate-slideUp hover:shadow-subtle-lg hover:border-primary/20"
          style={{ animationDelay: `${i * 60}ms` }}
        >
          <CardHeader>
            <CardTitle className="text-sm text-muted">{item.label}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`font-display text-3xl tracking-tight ${item.accent}`}>
              {item.value}
              <span className="ml-1 text-sm text-muted">{item.suffix}</span>
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
