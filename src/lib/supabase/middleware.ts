import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { getSupabaseConfig } from "@/lib/supabase/config";

export async function updateSession(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  const pendingCookies: Array<{ name: string; value: string; options: Parameters<typeof NextResponse.prototype.cookies.set>[2] }> =
    [];

  let response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  const { url, publishableKey } = getSupabaseConfig();

  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        pendingCookies.length = 0;
        pendingCookies.push(...cookiesToSet);

        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));

        response = NextResponse.next({
          request: {
            headers: requestHeaders,
          },
        });

        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user?.email) {
    requestHeaders.set("x-oj-user-email", user.email.toLowerCase());
  } else {
    requestHeaders.delete("x-oj-user-email");
  }

  response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  pendingCookies.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options);
  });

  return { response, user };
}
