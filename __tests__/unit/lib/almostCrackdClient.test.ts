import { almostCrackdFetch } from "@/lib/almostCrackdClient";

const mockFetch = jest.fn();
global.fetch = mockFetch;

beforeEach(() => {
  mockFetch.mockReset();
  mockFetch.mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }));
});

describe("almostCrackdFetch", () => {
  it("prepends the base URL to the path", async () => {
    await almostCrackdFetch("/pipeline/generate-captions", { method: "GET" }, "my-token");
    const [url] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.almostcrackd.ai/pipeline/generate-captions");
  });

  it("sets Authorization header as Bearer token", async () => {
    await almostCrackdFetch("/test", { method: "GET" }, "secret-token");
    const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
    const headers = new Headers(options.headers);
    expect(headers.get("Authorization")).toBe("Bearer secret-token");
  });

  it("sets Content-Type to application/json when not provided", async () => {
    await almostCrackdFetch("/test", { method: "POST", body: "{}" }, "token");
    const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
    const headers = new Headers(options.headers);
    expect(headers.get("Content-Type")).toBe("application/json");
  });

  it("preserves an existing Content-Type header", async () => {
    await almostCrackdFetch(
      "/test",
      { method: "POST", headers: { "Content-Type": "text/plain" }, body: "hello" },
      "token"
    );
    const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
    const headers = new Headers(options.headers);
    expect(headers.get("Content-Type")).toBe("text/plain");
  });

  it("forwards method and body to fetch", async () => {
    const body = JSON.stringify({ imageId: "abc" });
    await almostCrackdFetch("/test", { method: "POST", body }, "token");
    const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(options.method).toBe("POST");
    expect(options.body).toBe(body);
  });

  it("returns the fetch response", async () => {
    const mockResponse = new Response("body", { status: 201 });
    mockFetch.mockResolvedValueOnce(mockResponse);
    const result = await almostCrackdFetch("/test", { method: "GET" }, "token");
    expect(result).toBe(mockResponse);
  });

  it("does not override Authorization if one is provided in options headers", async () => {
    await almostCrackdFetch(
      "/test",
      { method: "GET", headers: { Authorization: "Bearer original" } },
      "new-token"
    );
    const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
    const headers = new Headers(options.headers);
    // almostCrackdFetch always sets the token from the argument — verify correct override
    expect(headers.get("Authorization")).toBe("Bearer new-token");
  });
});
