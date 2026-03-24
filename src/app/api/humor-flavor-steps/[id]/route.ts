import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { isAdmin } from "@/lib/auth";
import { updateHumorFlavorStepSchema, reorderStepSchema } from "@/lib/validators";

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    // Check if this is a reorder request
    if ("from_order" in body && "to_order" in body) {
      const validated = reorderStepSchema.parse(body);

      // Get the step to find its flavor_id
      const { data: step, error: stepError } = await supabase
        .from("humor_flavor_steps")
        .select("humor_flavor_id, order_by")
        .eq("id", params.id)
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
      const updates = [];
      if (validated.from_order < validated.to_order) {
        // Moving down
        allSteps?.forEach((s) => {
          if (s.order_by > validated.from_order && s.order_by <= validated.to_order) {
            updates.push({
              id: s.id,
              new_order: s.order_by - 1,
            });
          } else if (s.id === parseInt(params.id)) {
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
          } else if (s.id === parseInt(params.id)) {
            updates.push({
              id: s.id,
              new_order: validated.to_order,
            });
          }
        });
      }

      // Apply updates
      for (const update of updates) {
        await supabase
          .from("humor_flavor_steps")
          .update({
            order_by: update.new_order,
            modified_by_user_id: session.user.id,
            modified_datetime_utc: new Date().toISOString(),
          })
          .eq("id", update.id);
      }

      return NextResponse.json({ success: true });
    }

    // Regular update
    const validated = updateHumorFlavorStepSchema.parse(body);

    const { data, error } = await supabase
      .from("humor_flavor_steps")
      .update({
        ...validated,
        modified_by_user_id: session.user.id,
        modified_datetime_utc: new Date().toISOString(),
      })
      .eq("id", params.id)
      .select()
      .single();

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
  request: Request,
  { params }: { params: { id: string } }
) {
  const isAdminUser = await isAdmin();
  if (!isAdminUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("humor_flavor_steps")
    .delete()
    .eq("id", params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
