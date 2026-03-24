import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { isAdmin } from "@/lib/auth";
import { updateHumorFlavorSchema } from "@/lib/validators";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("humor_flavors")
    .select(
      `
      *,
      humor_flavor_steps(*)
    `
    )
    .eq("id", id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }

  return NextResponse.json({ data });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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
    const validated = updateHumorFlavorSchema.parse(body);
    const nowIso = new Date().toISOString();
    const candidates: Array<Record<string, unknown>> = [
      {
        name: validated.name,
        description: validated.description,
        modified_by_user_id: session.user.id,
        modified_datetime_utc: nowIso,
      },
      {
        slug: validated.name,
        description: validated.description,
        modified_by_user_id: session.user.id,
        modified_datetime_utc: nowIso,
      },
      {
        name: validated.name,
        description: validated.description,
        modified_datetime_utc: nowIso,
      },
      {
        slug: validated.name,
        description: validated.description,
        modified_datetime_utc: nowIso,
      },
    ];

    let data: unknown = null;
    let error: { message: string } | null = null;

    for (const payload of candidates) {
      const result = await supabase
        .from("humor_flavors")
        .update(payload)
        .eq("id", id)
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

    return NextResponse.json({ data });
  } catch (err) {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const isAdminUser = await isAdmin();
  if (!isAdminUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("humor_flavors")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
