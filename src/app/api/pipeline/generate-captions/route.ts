import { NextResponse } from "next/server";
import { almostCrackdFetch } from "@/lib/almostCrackdClient";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import {
  readCaptionApiBody,
  upstreamMessage,
  isCaptionsArrayMapUpstreamBug,
  withCaptionErrorHint,
} from "@/lib/captionApiHelpers";

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

    return NextResponse.json(out, { status: response.status });
  } catch (error) {
    console.error("[generate-captions] Unexpected error:", error);
    return NextResponse.json(
      { error: "Failed to generate captions. Network or upstream error." },
      { status: 502 }
    );
  }
}
