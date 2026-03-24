import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(`${origin}/login`);
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(`${origin}/login`);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const userEmail = user?.email?.toLowerCase().trim();
  if (!userEmail) {
    return NextResponse.redirect(`${origin}/unauthorized`);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("email, is_superadmin, is_matrix_admin")
    .ilike("email", userEmail)
    .maybeSingle<{
      email: string | null;
      is_superadmin: boolean;
      is_matrix_admin: boolean;
    }>();

  if (!profile?.email || (!profile.is_superadmin && !profile.is_matrix_admin)) {
    return NextResponse.redirect(`${origin}/unauthorized`);
  }

  return NextResponse.redirect(`${origin}/`);
}
