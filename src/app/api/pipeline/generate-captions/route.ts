import { NextResponse } from "next/server";
import { almostCrackdFetch } from "@/lib/almostCrackdClient";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { normalizeGeneratedCaptions } from "@/lib/normalizeGeneratedCaptions";
import {
  readCaptionApiBody,
  upstreamMessage,
  isCaptionsArrayMapUpstreamBug,
  withCaptionErrorHint,
} from "@/lib/captionApiHelpers";

async function persistCaptionsFromUpstream(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  params: {
    userId: string;
    imageId: string;
    humorFlavorId: number | undefined;
    payload: unknown;
  }
) {
  const { userId, imageId, humorFlavorId, payload } = params;

  const forNormalize =
    payload && typeof payload === "object" && payload !== null
      ? { ...(payload as Record<string, unknown>), humorFlavorId: humorFlavorId ?? null }
      : payload;

  const normalized = normalizeGeneratedCaptions(forNormalize);

  const rows = normalized
    .map((c) => {
      const content = String(c.content || c.text || "").trim();
      if (!content) return null;
      return {
        content,
        image_id: imageId,
        humor_flavor_id: humorFlavorId ?? null,
        profile_id: userId,
        created_by_user_id: userId,
        modified_by_user_id: userId,
        is_public: true,
      };
    })
    .filter((row): row is NonNullable<typeof row> => row !== null);

  if (rows.length === 0) return;

  const { error } = await supabase.from("captions").insert(rows);
  if (error) {
    console.error("[generate-captions] Failed to save captions to database:", error.message);
  }
}

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

    if (!session?.access_token || !session?.user?.id) {
      return NextResponse.json({ error: "Missing access token." }, { status: 401 });
    }

    const flavorId =
      typeof humorFlavorId === "number" && Number.isFinite(humorFlavorId)
        ? humorFlavorId
        : undefined;

    const primary: Record<string, unknown> = { imageId };
    if (flavorId != null) {
      primary.humorFlavorId = flavorId;
    }

    const doUpstream = (body: Record<string, unknown>) =>
      almostCrackdFetch(
        "/pipeline/generate-captions",
        { method: "POST", body: JSON.stringify(body) },
        session.access_token
      );

    let response = await doUpstream(primary);
    let payload = await readCaptionApiBody(response);

    if (
      !response.ok &&
      response.status === 500 &&
      flavorId != null &&
      isCaptionsArrayMapUpstreamBug(upstreamMessage(payload))
    ) {
      response = await doUpstream({ imageId, humor_flavor_id: flavorId });
      payload = await readCaptionApiBody(response);
    }

    if (
      !response.ok &&
      response.status === 500 &&
      flavorId != null &&
      isCaptionsArrayMapUpstreamBug(upstreamMessage(payload))
    ) {
      response = await doUpstream({ imageId });
      payload = await readCaptionApiBody(response);
    }

    const out = withCaptionErrorHint(payload, response.status);

    if (!response.ok) {
      console.error(`[generate-captions] Upstream error ${response.status}:`, out);
    }

    if (response.ok) {
      await persistCaptionsFromUpstream(supabase, {
        userId: session.user.id,
        imageId,
        humorFlavorId: flavorId,
        payload: out,
      });
    }

    return NextResponse.json(out, { status: response.status });
  } catch (error) {
    console.error("[generate-captions] Unexpected error:", error);
    return NextResponse.json(
      { error: "Failed to generate captions. Network or upstream error." },
      { status: 502 }
    );
  }
}
