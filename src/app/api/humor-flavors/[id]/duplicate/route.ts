import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { isAdmin } from "@/lib/auth";
import { duplicateHumorFlavorSchema } from "@/lib/validators";

type StepRow = {
  humor_flavor_id: number;
  order_by: number;
  description?: string | null;
  llm_system_prompt?: string | null;
  llm_user_prompt?: string | null;
  llm_temperature?: number | null;
  llm_model_id: number;
  llm_input_type_id: number;
  llm_output_type_id: number;
  humor_flavor_step_type_id: number;
};

function stepPayload(step: Record<string, unknown>, humorFlavorId: number): StepRow {
  return {
    humor_flavor_id: humorFlavorId,
    order_by: Number(step.order_by ?? 0),
    description: (step.description as string) ?? undefined,
    llm_system_prompt: (step.llm_system_prompt as string) ?? undefined,
    llm_user_prompt: (step.llm_user_prompt as string) ?? undefined,
    llm_temperature:
      step.llm_temperature === null || step.llm_temperature === undefined
        ? undefined
        : Number(step.llm_temperature),
    llm_model_id: Number(step.llm_model_id),
    llm_input_type_id: Number(step.llm_input_type_id),
    llm_output_type_id: Number(step.llm_output_type_id),
    humor_flavor_step_type_id: Number(step.humor_flavor_step_type_id),
  };
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: sourceId } = await params;
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = duplicateHumorFlavorSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors.name?.[0] ?? "Invalid name" },
      { status: 400 }
    );
  }

  const newName = parsed.data.name.trim();

  const { data: source, error: sourceError } = await supabase
    .from("humor_flavors")
    .select(
      `
      *,
      humor_flavor_steps(*)
    `
    )
    .eq("id", sourceId)
    .single();

  if (sourceError || !source) {
    return NextResponse.json({ error: "Source flavor not found" }, { status: 404 });
  }

  // Use * so we never reference columns that may not exist (e.g. name vs slug only).
  const { data: existingRows, error: existingError } = await supabase
    .from("humor_flavors")
    .select("*");

  if (existingError) {
    return NextResponse.json({ error: existingError.message }, { status: 500 });
  }

  const nameTaken = (existingRows ?? []).some((row: Record<string, unknown>) => {
    const n = row.name != null && row.name !== "" ? String(row.name).trim() : "";
    const s = row.slug != null && row.slug !== "" ? String(row.slug).trim() : "";
    return n === newName || s === newName;
  });

  if (nameTaken) {
    return NextResponse.json(
      { error: "A flavor with this name already exists. Choose a different name." },
      { status: 409 }
    );
  }

  const description = source.description as string | undefined;

  const flavorCandidates: Array<Record<string, unknown>> = [
    {
      name: newName,
      description,
      created_by_user_id: user.id,
      modified_by_user_id: user.id,
    },
    {
      slug: newName,
      description,
      created_by_user_id: user.id,
      modified_by_user_id: user.id,
    },
    { name: newName, description },
    { slug: newName, description },
  ];

  let newFlavor: { id: number } | null = null;
  let flavorInsertError: { message: string } | null = null;

  for (const payload of flavorCandidates) {
    const result = await supabase
      .from("humor_flavors")
      .insert(payload)
      .select("id")
      .single();
    if (!result.error && result.data) {
      newFlavor = result.data as { id: number };
      flavorInsertError = null;
      break;
    }
    flavorInsertError = { message: result.error?.message ?? "Insert failed" };
  }

  if (!newFlavor || flavorInsertError) {
    return NextResponse.json(
      { error: flavorInsertError?.message ?? "Failed to create duplicate flavor" },
      { status: 500 }
    );
  }

  const newFlavorId = newFlavor.id;
  const rawSteps = (source as { humor_flavor_steps?: Record<string, unknown>[] })
    .humor_flavor_steps;
  const steps = Array.isArray(rawSteps)
    ? [...rawSteps].sort(
        (a, b) => Number(a.order_by ?? 0) - Number(b.order_by ?? 0)
      )
    : [];

  const rollbackFlavor = async () => {
    await supabase.from("humor_flavor_steps").delete().eq("humor_flavor_id", newFlavorId);
    await supabase.from("humor_flavors").delete().eq("id", newFlavorId);
  };

  for (const step of steps) {
    const base = stepPayload(step, newFlavorId);
    const candidates: Array<Record<string, unknown>> = [
      {
        ...base,
        created_by_user_id: user.id,
        modified_by_user_id: user.id,
      },
      base,
    ];

    let stepErr: string | null = null;
    let inserted = false;
    for (const payload of candidates) {
      const res = await supabase.from("humor_flavor_steps").insert(payload).select("id").single();
      if (!res.error) {
        inserted = true;
        break;
      }
      stepErr = res.error.message;
    }

    if (!inserted) {
      await rollbackFlavor();
      return NextResponse.json(
        { error: stepErr ?? "Failed to duplicate a step" },
        { status: 500 }
      );
    }
  }

  const { data: fullFlavor, error: fetchErr } = await supabase
    .from("humor_flavors")
    .select(
      `
      *,
      humor_flavor_steps(*)
    `
    )
    .eq("id", newFlavorId)
    .single();

  if (fetchErr) {
    return NextResponse.json({ data: { id: newFlavorId } }, { status: 201 });
  }

  return NextResponse.json({ data: fullFlavor }, { status: 201 });
}
