const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabasePublishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function getSupabaseConfig() {
  if (!supabaseUrl || supabaseUrl.includes("your-project-ref.supabase.co")) {
    throw new Error(
      "Invalid NEXT_PUBLIC_SUPABASE_URL. Replace the placeholder with your real Supabase Project URL and restart dev server.",
    );
  }

  if (
    !supabasePublishableKey ||
    supabasePublishableKey.includes("your-supabase-publishable-or-anon-key")
  ) {
    throw new Error(
      "Invalid NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY). Replace placeholder key and restart dev server.",
    );
  }

  return {
    url: supabaseUrl,
    publishableKey: supabasePublishableKey,
  };
}
