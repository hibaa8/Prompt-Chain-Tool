import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { isAdmin } from "@/lib/auth";
import { createHumorFlavorSchema } from "@/lib/validators";

export async function GET() {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("humor_flavors")
    .select("*")
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
    const candidates: Array<Record<string, unknown>> = [
      {
        name: validated.name,
        description: validated.description,
        created_by_user_id: session.user.id,
        modified_by_user_id: session.user.id,
      },
      {
        slug: validated.name,
        description: validated.description,
        created_by_user_id: session.user.id,
        modified_by_user_id: session.user.id,
      },
      {
        name: validated.name,
        description: validated.description,
      },
      {
        slug: validated.name,
        description: validated.description,
      },
    ];

    let data: unknown = null;
    let error: { message: string } | null = null;

    for (const payload of candidates) {
      const result = await supabase
        .from("humor_flavors")
        .insert(payload)
        .select()
        .single();
      if (!result.error) {
        data = result.data;
        error = null;
        break;
      }
      error = { message: result.error.message };
    }

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
