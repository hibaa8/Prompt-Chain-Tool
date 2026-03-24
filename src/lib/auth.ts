import { createSupabaseServerClient } from "./supabaseServer";

export async function getCurrentUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return session?.user;
}

export async function isAdmin() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user?.id) {
    return false;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_superadmin, is_matrix_admin")
    .eq("id", session.user.id)
    .single();

  return profile?.is_superadmin || profile?.is_matrix_admin;
}
