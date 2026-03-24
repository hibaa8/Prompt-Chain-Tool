import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export async function POST() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();

  return NextResponse.redirect(new URL("/login", process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000"), {
    status: 302,
  });
}
