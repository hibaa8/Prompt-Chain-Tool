jest.mock("@/lib/supabaseServer", () => ({ createSupabaseServerClient: jest.fn() }));
jest.mock("@/lib/almostCrackdClient", () => ({ almostCrackdFetch: jest.fn() }));

import { POST } from "@/app/api/pipeline/generate-captions/route";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { almostCrackdFetch } from "@/lib/almostCrackdClient";
import { createMockSupabase, mockSession } from "../../helpers/supabaseMock";

const mockCreateClient = jest.mocked(createSupabaseServerClient);
const mockAlmostCrackdFetch = jest.mocked(almostCrackdFetch);

/** Mock client with insert that resolves (persist path calls from('captions').insert). */
function createSupabaseForGenerateCaptions() {
  const supabase = createMockSupabase();
  supabase._chain.insert = jest.fn().mockResolvedValue({ data: null, error: null });
  return supabase;
}

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/pipeline/generate-captions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function makeUpstreamResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

beforeEach(() => jest.clearAllMocks());

describe("POST /api/pipeline/generate-captions", () => {
  it("returns 400 when imageId is missing", async () => {
    const supabase = createSupabaseForGenerateCaptions();
    supabase.auth.getSession.mockResolvedValue(mockSession() as any);
    mockCreateClient.mockResolvedValue(supabase as any);

    const res = await POST(makeRequest({}));
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBe("Missing imageId.");
  });

  it("returns 401 when session has no access token", async () => {
    const supabase = createSupabaseForGenerateCaptions();
    supabase.auth.getSession.mockResolvedValue({ data: { session: null } });
    mockCreateClient.mockResolvedValue(supabase as any);

    const res = await POST(makeRequest({ imageId: "img-1" }));
    expect(res.status).toBe(401);
  });

  it("returns upstream response on success without flavorId", async () => {
    const supabase = createSupabaseForGenerateCaptions();
    supabase.auth.getSession.mockResolvedValue(mockSession() as any);
    mockCreateClient.mockResolvedValue(supabase as any);
    mockAlmostCrackdFetch.mockResolvedValue(
      makeUpstreamResponse({ data: ["Caption A"] })
    );

    const res = await POST(makeRequest({ imageId: "img-1" }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data).toEqual(["Caption A"]);
    expect(mockAlmostCrackdFetch).toHaveBeenCalledTimes(1);
  });

  it("inserts generated captions into the database when upstream succeeds", async () => {
    const supabase = createSupabaseForGenerateCaptions();
    supabase.auth.getSession.mockResolvedValue(mockSession("user-persist", "tok") as any);
    mockCreateClient.mockResolvedValue(supabase as any);
    mockAlmostCrackdFetch.mockResolvedValue(
      makeUpstreamResponse({ data: ["One", { content: "Two" }] })
    );

    const res = await POST(
      makeRequest({ imageId: "img-uuid", humorFlavorId: 9 })
    );
    expect(res.status).toBe(200);

    expect(supabase.from).toHaveBeenCalledWith("captions");
    expect(supabase._chain.insert).toHaveBeenCalledWith([
      expect.objectContaining({
        content: "One",
        image_id: "img-uuid",
        humor_flavor_id: 9,
        profile_id: "user-persist",
        created_by_user_id: "user-persist",
        modified_by_user_id: "user-persist",
        is_public: true,
      }),
      expect.objectContaining({
        content: "Two",
        image_id: "img-uuid",
        humor_flavor_id: 9,
        profile_id: "user-persist",
        is_public: true,
      }),
    ]);
  });

  it("includes humorFlavorId in upstream request when provided", async () => {
    const supabase = createSupabaseForGenerateCaptions();
    supabase.auth.getSession.mockResolvedValue(mockSession() as any);
    mockCreateClient.mockResolvedValue(supabase as any);
    mockAlmostCrackdFetch.mockResolvedValue(
      makeUpstreamResponse({ data: ["Caption B"] })
    );

    await POST(makeRequest({ imageId: "img-1", humorFlavorId: 7 }));

    const [, options] = mockAlmostCrackdFetch.mock.calls[0] as [string, RequestInit, string];
    const body = JSON.parse(options.body as string);
    expect(body.humorFlavorId).toBe(7);
  });

  it("retries with humor_flavor_id field on captionsAsArray.map 500 error", async () => {
    const supabase = createSupabaseForGenerateCaptions();
    supabase.auth.getSession.mockResolvedValue(mockSession() as any);
    mockCreateClient.mockResolvedValue(supabase as any);

    const bugError = makeUpstreamResponse(
      { message: "captionsAsArray.map is not a function" },
      500
    );
    const successResponse = makeUpstreamResponse({ data: ["Caption C"] });

    mockAlmostCrackdFetch
      .mockResolvedValueOnce(bugError)
      .mockResolvedValueOnce(successResponse);

    const res = await POST(makeRequest({ imageId: "img-1", humorFlavorId: 7 }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data).toEqual(["Caption C"]);
    expect(mockAlmostCrackdFetch).toHaveBeenCalledTimes(2);

    const [, secondOptions] = mockAlmostCrackdFetch.mock.calls[1] as [string, RequestInit, string];
    const secondBody = JSON.parse(secondOptions.body as string);
    expect(secondBody.humor_flavor_id).toBe(7);
  });

  it("retries without flavorId after two captionsAsArray.map failures", async () => {
    const supabase = createSupabaseForGenerateCaptions();
    supabase.auth.getSession.mockResolvedValue(mockSession() as any);
    mockCreateClient.mockResolvedValue(supabase as any);

    const bugError = () =>
      new Response(JSON.stringify({ message: "captionsAsArray.map is not a function" }), {
        status: 500,
      });
    const successResponse = makeUpstreamResponse({ data: ["Caption D"] });

    mockAlmostCrackdFetch
      .mockResolvedValueOnce(bugError())
      .mockResolvedValueOnce(bugError())
      .mockResolvedValueOnce(successResponse);

    const res = await POST(makeRequest({ imageId: "img-1", humorFlavorId: 7 }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data).toEqual(["Caption D"]);
    expect(mockAlmostCrackdFetch).toHaveBeenCalledTimes(3);

    const [, thirdOptions] = mockAlmostCrackdFetch.mock.calls[2] as [string, RequestInit, string];
    const thirdBody = JSON.parse(thirdOptions.body as string);
    expect(thirdBody.humorFlavorId).toBeUndefined();
  });

  it("does not retry when flavorId is absent (not the upstream bug path)", async () => {
    const supabase = createSupabaseForGenerateCaptions();
    supabase.auth.getSession.mockResolvedValue(mockSession() as any);
    mockCreateClient.mockResolvedValue(supabase as any);
    mockAlmostCrackdFetch.mockResolvedValue(
      makeUpstreamResponse({ message: "captionsAsArray.map is not a function" }, 500)
    );

    const res = await POST(makeRequest({ imageId: "img-1" }));

    expect(res.status).toBe(500);
    expect(mockAlmostCrackdFetch).toHaveBeenCalledTimes(1);
  });

  it("adds a hint for JSON parse errors from upstream", async () => {
    const supabase = createSupabaseForGenerateCaptions();
    supabase.auth.getSession.mockResolvedValue(mockSession() as any);
    mockCreateClient.mockResolvedValue(supabase as any);
    mockAlmostCrackdFetch.mockResolvedValue(
      makeUpstreamResponse({ message: "value is not valid JSON" }, 422)
    );

    const res = await POST(makeRequest({ imageId: "img-1" }));
    const json = await res.json();

    expect(res.status).toBe(422);
    expect(typeof json.hint).toBe("string");
  });

  it("handles non-JSON upstream response when ok", async () => {
    const supabase = createSupabaseForGenerateCaptions();
    supabase.auth.getSession.mockResolvedValue(mockSession() as any);
    mockCreateClient.mockResolvedValue(supabase as any);
    mockAlmostCrackdFetch.mockResolvedValue(
      new Response("Plain text caption", { status: 200 })
    );

    const res = await POST(makeRequest({ imageId: "img-1" }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data).toEqual(["Plain text caption"]);
  });

  it("handles non-JSON upstream response when not ok", async () => {
    const supabase = createSupabaseForGenerateCaptions();
    supabase.auth.getSession.mockResolvedValue(mockSession() as any);
    mockCreateClient.mockResolvedValue(supabase as any);
    mockAlmostCrackdFetch.mockResolvedValue(
      new Response("Internal Server Error", { status: 500 })
    );

    const res = await POST(makeRequest({ imageId: "img-1" }));
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.error).toBe("Caption API returned a non-JSON body.");
  });

  it("handles empty upstream response body", async () => {
    const supabase = createSupabaseForGenerateCaptions();
    supabase.auth.getSession.mockResolvedValue(mockSession() as any);
    mockCreateClient.mockResolvedValue(supabase as any);
    mockAlmostCrackdFetch.mockResolvedValue(new Response("", { status: 200 }));

    const res = await POST(makeRequest({ imageId: "img-1" }));
    expect(res.status).toBe(200);
  });

  it("returns 502 on a network / unexpected error", async () => {
    const supabase = createSupabaseForGenerateCaptions();
    supabase.auth.getSession.mockResolvedValue(mockSession() as any);
    mockCreateClient.mockResolvedValue(supabase as any);
    mockAlmostCrackdFetch.mockRejectedValue(new Error("Network failure"));

    const res = await POST(makeRequest({ imageId: "img-1" }));
    const json = await res.json();

    expect(res.status).toBe(502);
    expect(json.error).toContain("Failed to generate captions");
  });

  it("ignores non-finite humorFlavorId values", async () => {
    const supabase = createSupabaseForGenerateCaptions();
    supabase.auth.getSession.mockResolvedValue(mockSession() as any);
    mockCreateClient.mockResolvedValue(supabase as any);
    mockAlmostCrackdFetch.mockResolvedValue(makeUpstreamResponse({ data: ["Cap"] }));

    await POST(makeRequest({ imageId: "img-1", humorFlavorId: NaN }));

    const [, options] = mockAlmostCrackdFetch.mock.calls[0] as [string, RequestInit, string];
    const body = JSON.parse(options.body as string);
    expect(body.humorFlavorId).toBeUndefined();
  });
});
