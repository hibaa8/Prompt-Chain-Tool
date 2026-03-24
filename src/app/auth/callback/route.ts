import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const error_description = searchParams.get("error_description");

  if (error) {
    return NextResponse.redirect(
      `${new URL(request.url).origin}/login?error=${encodeURIComponent(
        error_description || error
      )}`
    );
  }

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (!exchangeError) {
      return NextResponse.redirect(`${new URL(request.url).origin}/`);
    }
  }

  return NextResponse.redirect(`${new URL(request.url).origin}/login?error=Unable to authenticate`);
}
