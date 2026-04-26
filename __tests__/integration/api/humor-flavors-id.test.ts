jest.mock("@/lib/supabaseServer", () => ({ createSupabaseServerClient: jest.fn() }));
jest.mock("@/lib/auth", () => ({ isAdmin: jest.fn(), getCurrentUser: jest.fn() }));

import { GET, PUT, DELETE } from "@/app/api/humor-flavors/[id]/route";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { isAdmin } from "@/lib/auth";
import { NextRequest } from "next/server";
import { createMockChain, createMockSupabase, mockSession } from "../../helpers/supabaseMock";

const mockCreateClient = jest.mocked(createSupabaseServerClient);
const mockIsAdmin = jest.mocked(isAdmin);
const routeParams = { params: Promise.resolve({ id: "42" }) };

function makeRequest(method: string, body?: unknown) {
  return new NextRequest(`http://localhost/api/humor-flavors/42`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

beforeEach(() => jest.clearAllMocks());

// ---------------------------------------------------------------------------
// GET /api/humor-flavors/[id]
// ---------------------------------------------------------------------------

describe("GET /api/humor-flavors/[id]", () => {
  it("returns 200 with flavor data on success", async () => {
    const flavor = { id: 42, slug: "dry-wit", humor_flavor_steps: [] };
    const chain = createMockChain({ data: flavor, error: null });
    const supabase = createMockSupabase(chain);
    mockCreateClient.mockResolvedValue(supabase as any);

    const res = await GET(makeRequest("GET"), routeParams);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data).toEqual(flavor);
  });

  it("returns 404 when the flavor is not found", async () => {
    const chain = createMockChain({ data: null, error: { message: "Row not found" } });
    const supabase = createMockSupabase(chain);
    mockCreateClient.mockResolvedValue(supabase as any);

    const res = await GET(makeRequest("GET"), routeParams);
    expect(res.status).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// PUT /api/humor-flavors/[id]
// ---------------------------------------------------------------------------

describe("PUT /api/humor-flavors/[id]", () => {
  it("returns 401 when not admin", async () => {
    mockIsAdmin.mockResolvedValue(false);
    const supabase = createMockSupabase();
    mockCreateClient.mockResolvedValue(supabase as any);

    const res = await PUT(makeRequest("PUT", { name: "New Name" }), routeParams);
    expect(res.status).toBe(401);
  });

  it("returns 401 when no session", async () => {
    mockIsAdmin.mockResolvedValue(true);
    const supabase = createMockSupabase();
    supabase.auth.getSession.mockResolvedValue({ data: { session: null } });
    mockCreateClient.mockResolvedValue(supabase as any);

    const res = await PUT(makeRequest("PUT", { name: "New Name" }), routeParams);
    expect(res.status).toBe(401);
  });

  it("returns 400 on invalid body", async () => {
    mockIsAdmin.mockResolvedValue(true);
    const supabase = createMockSupabase();
    supabase.auth.getSession.mockResolvedValue(mockSession() as any);
    mockCreateClient.mockResolvedValue(supabase as any);

    const res = await PUT(makeRequest("PUT", { name: "" }), routeParams);
    expect(res.status).toBe(400);
  });

  it("returns 200 on successful update", async () => {
    mockIsAdmin.mockResolvedValue(true);
    const updated = { id: 42, slug: "new-name" };
    const chain = createMockChain({ data: updated, error: null });
    const supabase = createMockSupabase(chain);
    supabase.auth.getSession.mockResolvedValue(mockSession() as any);
    mockCreateClient.mockResolvedValue(supabase as any);

    const res = await PUT(makeRequest("PUT", { name: "New Name" }), routeParams);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data).toEqual(updated);
  });

  it("falls back to next update candidate on first failure", async () => {
    mockIsAdmin.mockResolvedValue(true);
    const updated = { id: 42, slug: "new-name" };
    const chain = createMockChain();
    chain.single
      .mockResolvedValueOnce({ data: null, error: { message: "column name does not exist" } })
      .mockResolvedValueOnce({ data: updated, error: null });
    const supabase = createMockSupabase(chain);
    supabase.auth.getSession.mockResolvedValue(mockSession() as any);
    mockCreateClient.mockResolvedValue(supabase as any);

    const res = await PUT(makeRequest("PUT", { name: "New Name" }), routeParams);
    expect(res.status).toBe(200);
  });

  it("returns 500 when all update candidates fail", async () => {
    mockIsAdmin.mockResolvedValue(true);
    const chain = createMockChain();
    chain.single.mockResolvedValue({ data: null, error: { message: "all failed" } });
    const supabase = createMockSupabase(chain);
    supabase.auth.getSession.mockResolvedValue(mockSession() as any);
    mockCreateClient.mockResolvedValue(supabase as any);

    const res = await PUT(makeRequest("PUT", { name: "New Name" }), routeParams);
    expect(res.status).toBe(500);
  });
});

// ---------------------------------------------------------------------------
// DELETE /api/humor-flavors/[id]
// ---------------------------------------------------------------------------

describe("DELETE /api/humor-flavors/[id]", () => {
  it("returns 401 when not admin", async () => {
    mockIsAdmin.mockResolvedValue(false);
    const supabase = createMockSupabase();
    mockCreateClient.mockResolvedValue(supabase as any);

    const res = await DELETE(makeRequest("DELETE"), routeParams);
    expect(res.status).toBe(401);
  });

  it("returns 200 on successful deletion", async () => {
    mockIsAdmin.mockResolvedValue(true);
    const chain = createMockChain();
    chain.eq.mockResolvedValue({ error: null });
    const supabase = createMockSupabase(chain);
    mockCreateClient.mockResolvedValue(supabase as any);

    const res = await DELETE(makeRequest("DELETE"), routeParams);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
  });

  it("returns 500 when deletion fails", async () => {
    mockIsAdmin.mockResolvedValue(true);
    const chain = createMockChain();
    chain.eq.mockResolvedValue({ error: { message: "FK constraint" } });
    const supabase = createMockSupabase(chain);
    mockCreateClient.mockResolvedValue(supabase as any);

    const res = await DELETE(makeRequest("DELETE"), routeParams);
    expect(res.status).toBe(500);
  });
});
