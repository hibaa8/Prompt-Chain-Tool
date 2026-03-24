import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

async function handleSignOut(request: Request) {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();

  const origin = new URL(request.url).origin;
  return NextResponse.redirect(`${origin}/`);
}

export async function GET(request: Request) {
  return handleSignOut(request);
}

export async function POST(request: Request) {
  return handleSignOut(request);
}
