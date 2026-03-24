import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const humorFlavorId = searchParams.get("humor_flavor_id");

  const supabase = await createSupabaseServerClient();

  let query = supabase
    .from("captions")
    .select("id, content, humor_flavor_id, image_id, created_datetime_utc, images(id, url, image_description)")
    .order("created_datetime_utc", { ascending: false });

  if (humorFlavorId) {
    query = query.eq("humor_flavor_id", parseInt(humorFlavorId));
  }

  const { data, error } = await query.limit(100);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}
