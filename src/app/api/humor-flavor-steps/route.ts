import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { isAdmin } from "@/lib/auth";
import { createHumorFlavorStepSchema } from "@/lib/validators";

export async function POST(request: Request) {
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
    const validated = createHumorFlavorStepSchema.parse(body);

    const { data: flavor, error: flavorError } = await supabase
      .from("humor_flavors")
      .select("id")
      .eq("id", validated.humor_flavor_id)
      .maybeSingle();

    if (flavorError) {
      return NextResponse.json({ error: flavorError.message }, { status: 500 });
    }

    if (!flavor) {
      return NextResponse.json(
        { error: `Humor flavor ${validated.humor_flavor_id} does not exist.` },
        { status: 400 }
      );
    }

    const basePayload = {
      humor_flavor_id: validated.humor_flavor_id,
      order_by: validated.order_by,
      description: validated.description,
      llm_system_prompt: validated.llm_system_prompt,
      llm_user_prompt: validated.llm_user_prompt,
      llm_temperature: validated.llm_temperature,
      llm_model_id: validated.llm_model_id,
      llm_input_type_id: validated.llm_input_type_id,
      llm_output_type_id: validated.llm_output_type_id,
      humor_flavor_step_type_id: validated.humor_flavor_step_type_id,
    };

    const candidates: Array<Record<string, unknown>> = [
      {
        ...basePayload,
        created_by_user_id: user.id,
        modified_by_user_id: user.id,
      },
      basePayload,
    ];

    let data: unknown = null;
    let error: { message: string } | null = null;

    for (const payload of candidates) {
      const result = await supabase
        .from("humor_flavor_steps")
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
