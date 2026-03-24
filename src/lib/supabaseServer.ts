import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const supabaseAnonKey =
  process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseProjectId = process.env.SUPABASE_PROJECT_ID;
const supabaseUrl =
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  (supabaseProjectId ? `https://${supabaseProjectId}.supabase.co` : undefined);

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing SUPABASE_URL (or SUPABASE_PROJECT_ID) and SUPABASE_ANON_KEY."
  );
}

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  const url = supabaseUrl;
  const anonKey = supabaseAnonKey;

  if (!url || !anonKey) {
    throw new Error(
      "Missing SUPABASE_URL (or SUPABASE_PROJECT_ID) and SUPABASE_ANON_KEY."
    );
  }

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          try {
            cookieStore.set(name, value, options);
          } catch {
            // Ignore cookie write errors in read-only contexts.
          }
        });
      },
    },
  });
}
