import { NextResponse } from "next/server";
import { almostCrackdFetch } from "@/lib/almostCrackdClient";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export async function POST(request: Request) {
  try {
    const startedAt = Date.now();
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

    const makeRequest = (includeFlavorId: boolean) =>
      almostCrackdFetch(
        "/pipeline/generate-captions",
        {
          method: "POST",
          body: JSON.stringify({
            imageId,
            ...(includeFlavorId && typeof humorFlavorId === "number"
              ? { humorFlavorId }
              : {}),
          }),
        },
        session.access_token
      );

    let response = await makeRequest(true);

    // Backward compatibility: older API versions may reject humorFlavorId.
    // Retry without it only for request-shape errors, not upstream outages.
    const shouldRetryWithoutFlavorId =
      !response.ok &&
      typeof humorFlavorId === "number" &&
      [400, 401, 404, 422].includes(response.status);

    if (shouldRetryWithoutFlavorId) {
      response = await makeRequest(false);
    }

    const contentType = response.headers.get("content-type") || "";
    let payload: unknown;

    if (contentType.includes("application/json")) {
      payload = await response.json();
    } else {
      const text = await response.text();
      payload = { error: text || "Unexpected non-JSON response from caption API." };
    }

    if (!response.ok && response.status >= 500) {
      return NextResponse.json(
        {
          error: `Caption API unavailable (${response.status}). Please try again.`,
          upstream: payload,
          elapsedMs: Date.now() - startedAt,
        },
        { status: response.status }
      );
    }

    return NextResponse.json(payload, { status: response.status });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to generate captions. Network or upstream error." },
      { status: 502 }
    );
  }
}
