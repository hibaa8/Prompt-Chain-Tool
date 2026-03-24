import { NextResponse } from "next/server";
import { almostCrackdFetch } from "@/lib/almostCrackdClient";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export async function POST(request: Request) {
  try {
    const { imageId, humorFlavorId } = (await request.json()) as {
      imageId?: string;
      humorFlavorId?: number;
    };

    if (!imageId) {
      return NextResponse.json({ error: "Missing imageId." }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      return NextResponse.json({ error: "Missing access token." }, { status: 401 });
    }

    const body: Record<string, unknown> = { imageId };
    if (typeof humorFlavorId === "number") {
      body.humorFlavorId = humorFlavorId;
    }

    const response = await almostCrackdFetch(
      "/pipeline/generate-captions",
      {
        method: "POST",
        body: JSON.stringify(body),
      },
      session.access_token
    );

    const contentType = response.headers.get("content-type") || "";
    let payload: unknown;

    if (contentType.includes("application/json")) {
      payload = await response.json();
    } else {
      const text = await response.text();
      payload = { error: text || "Unexpected non-JSON response from caption API." };
    }

    if (!response.ok) {
      console.error(`[generate-captions] Upstream error ${response.status}:`, payload);
    }

    return NextResponse.json(payload, { status: response.status });
  } catch (error) {
    console.error("[generate-captions] Unexpected error:", error);
    return NextResponse.json(
      { error: "Failed to generate captions. Network or upstream error." },
      { status: 502 }
    );
  }
}
