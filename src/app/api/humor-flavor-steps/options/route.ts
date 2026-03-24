import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { isAdmin } from "@/lib/auth";

export async function GET() {
  const isAdminUser = await isAdmin();
  if (!isAdminUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createSupabaseServerClient();

  const [modelsRes, inputTypesRes, outputTypesRes, stepTypesRes] = await Promise.all([
    supabase.from("llm_models").select("id, name").order("id"),
    supabase.from("llm_input_types").select("id, slug, description").order("id"),
    supabase.from("llm_output_types").select("id, slug, description").order("id"),
    supabase.from("humor_flavor_step_types").select("id, slug, description").order("id"),
  ]);

  const firstError =
    modelsRes.error || inputTypesRes.error || outputTypesRes.error || stepTypesRes.error;
  if (firstError) {
    return NextResponse.json({ error: firstError.message }, { status: 500 });
  }

  return NextResponse.json({
    data: {
      llm_models: modelsRes.data ?? [],
      llm_input_types: inputTypesRes.data ?? [],
      llm_output_types: outputTypesRes.data ?? [],
      humor_flavor_step_types: stepTypesRes.data ?? [],
    },
  });
}
