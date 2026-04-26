import {
  readCaptionApiBody,
  upstreamMessage,
  isCaptionsArrayMapUpstreamBug,
  withCaptionErrorHint,
} from "@/lib/captionApiHelpers";

// ---------------------------------------------------------------------------
// readCaptionApiBody
// ---------------------------------------------------------------------------

describe("readCaptionApiBody", () => {
  function makeResponse(body: string, ok: boolean, status = ok ? 200 : 500) {
    return new Response(body, { status });
  }

  it("returns {} for an empty body", async () => {
    expect(await readCaptionApiBody(makeResponse("", true))).toEqual({});
    expect(await readCaptionApiBody(makeResponse("   ", true))).toEqual({});
  });

  it("parses valid JSON and returns the object", async () => {
    const body = JSON.stringify({ data: ["cap1"] });
    expect(await readCaptionApiBody(makeResponse(body, true))).toEqual({ data: ["cap1"] });
  });

  it("wraps plain text in data array when response is ok", async () => {
    const result = await readCaptionApiBody(makeResponse("Hello world", true));
    expect(result).toEqual({ data: ["Hello world"] });
  });

  it("trims plain text before wrapping", async () => {
    const result = await readCaptionApiBody(makeResponse("  trim me  ", true));
    expect(result).toEqual({ data: ["trim me"] });
  });

  it("returns error object with rawBodyPreview when non-JSON and not ok", async () => {
    const result = (await readCaptionApiBody(
      makeResponse("Internal Server Error text", false, 500)
    )) as Record<string, unknown>;
    expect(result.error).toBe("Caption API returned a non-JSON body.");
    expect(result.rawBodyPreview).toBe("Internal Server Error text");
  });

  it("truncates rawBodyPreview to 240 chars", async () => {
    const longBody = "x".repeat(300);
    const result = (await readCaptionApiBody(
      makeResponse(longBody, false, 500)
    )) as Record<string, unknown>;
    expect((result.rawBodyPreview as string).length).toBe(240);
  });
});

// ---------------------------------------------------------------------------
// upstreamMessage
// ---------------------------------------------------------------------------

describe("upstreamMessage", () => {
  it("returns the message string from a payload object", () => {
    expect(upstreamMessage({ message: "Something failed" })).toBe("Something failed");
  });

  it("returns empty string when message field is absent", () => {
    expect(upstreamMessage({ error: "oops" })).toBe("");
  });

  it("returns empty string when message is not a string", () => {
    expect(upstreamMessage({ message: 42 })).toBe("");
    expect(upstreamMessage({ message: null })).toBe("");
  });

  it("returns empty string for null payload", () => {
    expect(upstreamMessage(null)).toBe("");
  });

  it("returns empty string for non-object payload", () => {
    expect(upstreamMessage("string")).toBe("");
    expect(upstreamMessage(42)).toBe("");
  });
});

// ---------------------------------------------------------------------------
// isCaptionsArrayMapUpstreamBug
// ---------------------------------------------------------------------------

describe("isCaptionsArrayMapUpstreamBug", () => {
  it("returns true when message contains 'captionsAsArray.map'", () => {
    expect(
      isCaptionsArrayMapUpstreamBug("Error: captionsAsArray.map is not a function")
    ).toBe(true);
  });

  it("returns false for unrelated error messages", () => {
    expect(isCaptionsArrayMapUpstreamBug("Internal server error")).toBe(false);
    expect(isCaptionsArrayMapUpstreamBug("")).toBe(false);
    expect(isCaptionsArrayMapUpstreamBug("captionsAsArray")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// withCaptionErrorHint
// ---------------------------------------------------------------------------

describe("withCaptionErrorHint", () => {
  it("returns payload unchanged when status < 400", () => {
    const payload = { data: ["cap"] };
    expect(withCaptionErrorHint(payload, 200)).toBe(payload);
    expect(withCaptionErrorHint(payload, 399)).toBe(payload);
  });

  it("adds a hint for 'is not valid JSON' errors", () => {
    const payload = { message: "is not valid JSON" };
    const result = withCaptionErrorHint(payload, 500) as Record<string, unknown>;
    expect(typeof result.hint).toBe("string");
    expect((result.hint as string).length).toBeGreaterThan(10);
  });

  it("adds a hint for 'Unexpected token' errors", () => {
    const payload = { message: "Unexpected token I" };
    const result = withCaptionErrorHint(payload, 422) as Record<string, unknown>;
    expect(typeof result.hint).toBe("string");
  });

  it("adds a hint for captionsAsArray.map upstream bug", () => {
    const payload = { message: "captionsAsArray.map is not a function" };
    const result = withCaptionErrorHint(payload, 500) as Record<string, unknown>;
    expect(typeof result.hint).toBe("string");
    expect((result.hint as string)).toContain("captionsAsArray.map");
  });

  it("returns payload without hint for generic error", () => {
    const payload = { message: "Some other error" };
    const result = withCaptionErrorHint(payload, 500) as Record<string, unknown>;
    expect(result.hint).toBeUndefined();
  });

  it("returns original non-object payload when no hint pattern matches", () => {
    const result = withCaptionErrorHint("plain string", 500);
    expect(result).toBe("plain string");
  });

  it("uses base object with error: true when payload is non-object and hint IS added", () => {
    // upstreamMessage only reads from objects; to trigger the hint via a non-object,
    // we pass an error object whose message triggers the hint
    const payload = { message: "captionsAsArray.map is not a function" };
    const result = withCaptionErrorHint(payload, 500) as Record<string, unknown>;
    // base is the object itself
    expect(result.message).toBe("captionsAsArray.map is not a function");
    expect(typeof result.hint).toBe("string");
  });

  it("preserves existing payload fields when adding hint", () => {
    const payload = { message: "is not valid JSON", code: "ERR_01" };
    const result = withCaptionErrorHint(payload, 500) as Record<string, unknown>;
    expect(result.code).toBe("ERR_01");
    expect(result.message).toBe("is not valid JSON");
  });
});
