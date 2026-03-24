import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { isAdmin } from "@/lib/auth";
import { createHumorFlavorSchema } from "@/lib/validators";

export async function GET() {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("humor_flavors")
    .select("id, slug, description, created_datetime_utc, modified_datetime_utc")
    .order("created_datetime_utc", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  const isAdminUser = await isAdmin();
  if (!isAdminUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "No session" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validated = createHumorFlavorSchema.parse(body);

    const { data, error } = await supabase
      .from("humor_flavors")
      .insert({
        slug: validated.slug,
        description: validated.description,
        created_by_user_id: session.user.id,
        modified_by_user_id: session.user.id,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}
