import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/server";
import { isPwaLocalMode } from "@/lib/pwa-mode";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { MobileNav } from "@/components/layout/MobileNav";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  if (isPwaLocalMode) {
    return (
      <div className="min-h-screen lg:grid lg:grid-cols-[256px_1fr]">
        <Sidebar hasActiveSession={false} isAdmin={false} />
        <div className="pb-16 lg:pb-0">
          <Header name="Local User" hasActiveSession={false} isAdmin={false} />
          <main className="p-6">{children}</main>
        </div>
        <MobileNav isAdmin={false} />
      </div>
    );
  }

  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }

  const activeSession = await prisma.clockSession.findFirst({
    where: {
      userId: user.id,
      clockOut: null,
    },
    select: {
      id: true,
    },
  });

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[256px_1fr]">
      <Sidebar hasActiveSession={Boolean(activeSession)} isAdmin={user.role === "ADMIN"} />
      <div className="pb-16 lg:pb-0">
        <Header name={user.name} hasActiveSession={Boolean(activeSession)} isAdmin={user.role === "ADMIN"} />
        <main className="p-6">{children}</main>
      </div>
      <MobileNav isAdmin={user.role === "ADMIN"} />
    </div>
  );
}
