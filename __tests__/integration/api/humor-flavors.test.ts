jest.mock("@/lib/supabaseServer", () => ({ createSupabaseServerClient: jest.fn() }));
jest.mock("@/lib/auth", () => ({ isAdmin: jest.fn(), getCurrentUser: jest.fn() }));

import { GET, POST } from "@/app/api/humor-flavors/route";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { isAdmin } from "@/lib/auth";
import { createMockChain, createMockSupabase, mockSession } from "../../helpers/supabaseMock";

const mockCreateClient = jest.mocked(createSupabaseServerClient);
const mockIsAdmin = jest.mocked(isAdmin);

beforeEach(() => jest.clearAllMocks());

// ---------------------------------------------------------------------------
// GET /api/humor-flavors
// ---------------------------------------------------------------------------

describe("GET /api/humor-flavors", () => {
  it("returns 200 with data on success", async () => {
    const flavors = [{ id: 1, slug: "dry-wit" }];
    const chain = createMockChain();
    chain.order.mockResolvedValue({ data: flavors, error: null });
    const supabase = createMockSupabase(chain);
    mockCreateClient.mockResolvedValue(supabase as any);

    const res = await GET();
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data).toEqual(flavors);
  });

  it("returns 500 when the database query fails", async () => {
    const chain = createMockChain();
    chain.order.mockResolvedValue({ data: null, error: { message: "DB failure" } });
    const supabase = createMockSupabase(chain);
    mockCreateClient.mockResolvedValue(supabase as any);

    const res = await GET();
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.error).toBe("DB failure");
  });
});

// ---------------------------------------------------------------------------
// POST /api/humor-flavors
// ---------------------------------------------------------------------------

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/humor-flavors", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/humor-flavors", () => {
  it("returns 401 when user is not an admin", async () => {
    mockIsAdmin.mockResolvedValue(false);
    const supabase = createMockSupabase();
    mockCreateClient.mockResolvedValue(supabase as any);

    const res = await POST(makeRequest({ name: "Test" }));
    expect(res.status).toBe(401);
  });

  it("returns 401 when session is missing despite admin check passing", async () => {
    mockIsAdmin.mockResolvedValue(true);
    const supabase = createMockSupabase();
    supabase.auth.getSession.mockResolvedValue({ data: { session: null } });
    mockCreateClient.mockResolvedValue(supabase as any);

    const res = await POST(makeRequest({ name: "Test" }));
    expect(res.status).toBe(401);
  });

  it("returns 400 on invalid request body", async () => {
    mockIsAdmin.mockResolvedValue(true);
    const supabase = createMockSupabase();
    supabase.auth.getSession.mockResolvedValue(mockSession() as any);
    mockCreateClient.mockResolvedValue(supabase as any);

    const res = await POST(makeRequest({ name: "" }));
    expect(res.status).toBe(400);
  });

  it("returns 201 on successful creation using first candidate", async () => {
    mockIsAdmin.mockResolvedValue(true);
    const newFlavor = { id: 1, slug: "dry-wit", description: "Very dry" };
    const chain = createMockChain({ data: newFlavor, error: null });
    chain.single.mockResolvedValue({ data: newFlavor, error: null });
    const supabase = createMockSupabase(chain);
    supabase.auth.getSession.mockResolvedValue(mockSession() as any);
    mockCreateClient.mockResolvedValue(supabase as any);

    const res = await POST(makeRequest({ name: "Dry Wit", description: "Very dry" }));
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.data).toEqual(newFlavor);
  });

  it("falls back to next candidate when first insert fails", async () => {
    mockIsAdmin.mockResolvedValue(true);
    const newFlavor = { id: 2, slug: "puns" };
    const chain = createMockChain();
    chain.single
      .mockResolvedValueOnce({ data: null, error: { message: "column name does not exist" } })
      .mockResolvedValueOnce({ data: newFlavor, error: null });
    const supabase = createMockSupabase(chain);
    supabase.auth.getSession.mockResolvedValue(mockSession() as any);
    mockCreateClient.mockResolvedValue(supabase as any);

    const res = await POST(makeRequest({ name: "Puns" }));
    expect(res.status).toBe(201);
  });

  it("returns 500 when all insert candidates fail", async () => {
    mockIsAdmin.mockResolvedValue(true);
    const chain = createMockChain();
    chain.single.mockResolvedValue({ data: null, error: { message: "all failed" } });
    const supabase = createMockSupabase(chain);
    supabase.auth.getSession.mockResolvedValue(mockSession() as any);
    mockCreateClient.mockResolvedValue(supabase as any);

    const res = await POST(makeRequest({ name: "Test" }));
    expect(res.status).toBe(500);
  });

  it("returns 400 when body is not valid JSON", async () => {
    mockIsAdmin.mockResolvedValue(true);
    const supabase = createMockSupabase();
    supabase.auth.getSession.mockResolvedValue(mockSession() as any);
    mockCreateClient.mockResolvedValue(supabase as any);

    const badReq = new Request("http://localhost/api/humor-flavors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not-json",
    });
    const res = await POST(badReq);
    expect(res.status).toBe(400);
  });
});
