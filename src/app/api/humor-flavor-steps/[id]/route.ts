import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { isAdmin } from "@/lib/auth";
import { updateHumorFlavorStepSchema, reorderStepSchema } from "@/lib/validators";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("humor_flavor_steps")
    .select("*")
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
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) {
    return NextResponse.json({ error: "No authenticated user" }, { status: 401 });
  }

  try {
    const body = await request.json();

    // Check if this is a reorder request
    if ("from_order" in body && "to_order" in body) {
      const validated = reorderStepSchema.parse(body);

      // Get the step to find its flavor_id
      const { data: step, error: stepError } = await supabase
        .from("humor_flavor_steps")
        .select("humor_flavor_id, order_by")
        .eq("id", id)
        .single();

      if (stepError || !step) {
        return NextResponse.json({ error: "Step not found" }, { status: 404 });
      }

      // Get all steps for this flavor
      const { data: allSteps } = await supabase
        .from("humor_flavor_steps")
        .select("id, order_by")
        .eq("humor_flavor_id", step.humor_flavor_id)
        .order("order_by");

      // Update order_by values
      const updates: Array<{ id: number; new_order: number }> = [];
      if (validated.from_order < validated.to_order) {
        // Moving down
        allSteps?.forEach((s) => {
          if (s.order_by > validated.from_order && s.order_by <= validated.to_order) {
            updates.push({
              id: s.id,
              new_order: s.order_by - 1,
            });
          } else if (s.id === parseInt(id)) {
            updates.push({
              id: s.id,
              new_order: validated.to_order,
            });
          }
        });
      } else {
        // Moving up
        allSteps?.forEach((s) => {
          if (s.order_by < validated.from_order && s.order_by >= validated.to_order) {
            updates.push({
              id: s.id,
              new_order: s.order_by + 1,
            });
          } else if (s.id === parseInt(id)) {
            updates.push({
              id: s.id,
              new_order: validated.to_order,
            });
          }
        });
      }

      // Apply updates
      for (const update of updates) {
        const updateWithAudit = await supabase
          .from("humor_flavor_steps")
          .update({
            order_by: update.new_order,
            modified_by_user_id: user.id,
            modified_datetime_utc: new Date().toISOString(),
          })
          .eq("id", update.id);

        if (updateWithAudit.error?.message?.includes("modified_by_user_id")) {
          await supabase
            .from("humor_flavor_steps")
            .update({
              order_by: update.new_order,
              modified_datetime_utc: new Date().toISOString(),
            })
            .eq("id", update.id);
        }
      }

      return NextResponse.json({ success: true });
    }

    // Regular update
    const validated = updateHumorFlavorStepSchema.parse(body);

    const nowIso = new Date().toISOString();
    const candidates: Array<Record<string, unknown>> = [
      {
        ...validated,
        modified_by_user_id: user.id,
        modified_datetime_utc: nowIso,
      },
      {
        ...validated,
        modified_datetime_utc: nowIso,
      },
    ];

    let data: unknown = null;
    let error: { message: string } | null = null;

    for (const payload of candidates) {
      const result = await supabase
        .from("humor_flavor_steps")
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
    .from("humor_flavor_steps")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
