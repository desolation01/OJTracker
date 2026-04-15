import { redirect } from "next/navigation";

import { getSessionUser } from "@/lib/server";
import { isPwaLocalMode } from "@/lib/pwa-mode";

export default async function HomePage() {
  if (isPwaLocalMode) {
    redirect("/dashboard");
  }

  const user = await getSessionUser();
  if (user) {
    redirect("/dashboard");
  }
  redirect("/login");
}
