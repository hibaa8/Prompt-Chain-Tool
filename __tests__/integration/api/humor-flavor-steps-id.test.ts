jest.mock("@/lib/supabaseServer", () => ({ createSupabaseServerClient: jest.fn() }));
jest.mock("@/lib/auth", () => ({ isAdmin: jest.fn(), getCurrentUser: jest.fn() }));

import { GET, PUT, DELETE } from "@/app/api/humor-flavor-steps/[id]/route";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { isAdmin } from "@/lib/auth";
import { NextRequest } from "next/server";
import { createMockChain, createMockSupabase, mockUser } from "../../helpers/supabaseMock";

const mockCreateClient = jest.mocked(createSupabaseServerClient);
const mockIsAdmin = jest.mocked(isAdmin);
const routeParams = { params: Promise.resolve({ id: "10" }) };

function makeRequest(method: string, body?: unknown) {
  return new NextRequest("http://localhost/api/humor-flavor-steps/10", {
    method,
    headers: { "Content-Type": "application/json" },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

beforeEach(() => jest.clearAllMocks());

// ---------------------------------------------------------------------------
// GET /api/humor-flavor-steps/[id]
// ---------------------------------------------------------------------------

describe("GET /api/humor-flavor-steps/[id]", () => {
  it("returns 200 with step data", async () => {
    const step = { id: 10, humor_flavor_id: 1, order_by: 0 };
    const chain = createMockChain({ data: step, error: null });
    const supabase = createMockSupabase(chain);
    mockCreateClient.mockResolvedValue(supabase as any);

    const res = await GET(makeRequest("GET"), routeParams);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data).toEqual(step);
  });

  it("returns 404 when step not found", async () => {
    const chain = createMockChain({ data: null, error: { message: "Not found" } });
    const supabase = createMockSupabase(chain);
    mockCreateClient.mockResolvedValue(supabase as any);

    const res = await GET(makeRequest("GET"), routeParams);
    expect(res.status).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// PUT /api/humor-flavor-steps/[id] — regular update
// ---------------------------------------------------------------------------

describe("PUT /api/humor-flavor-steps/[id] (update)", () => {
  it("returns 401 when not admin", async () => {
    mockIsAdmin.mockResolvedValue(false);
    const supabase = createMockSupabase();
    mockCreateClient.mockResolvedValue(supabase as any);

    const res = await PUT(makeRequest("PUT", { description: "Updated" }), routeParams);
    expect(res.status).toBe(401);
  });

  it("returns 401 when no user", async () => {
    mockIsAdmin.mockResolvedValue(true);
    const supabase = createMockSupabase();
    supabase.auth.getUser.mockResolvedValue({ data: { user: null } });
    mockCreateClient.mockResolvedValue(supabase as any);

    const res = await PUT(makeRequest("PUT", { description: "Updated" }), routeParams);
    expect(res.status).toBe(401);
  });

  it("returns 400 on invalid body", async () => {
    mockIsAdmin.mockResolvedValue(true);
    const supabase = createMockSupabase();
    supabase.auth.getUser.mockResolvedValue(mockUser() as any);
    mockCreateClient.mockResolvedValue(supabase as any);

    // llm_temperature out of range
    const res = await PUT(makeRequest("PUT", { llm_temperature: 5 }), routeParams);
    expect(res.status).toBe(400);
  });

  it("returns 200 on successful update", async () => {
    mockIsAdmin.mockResolvedValue(true);
    const updatedStep = { id: 10, description: "Updated", order_by: 0 };
    const chain = createMockChain({ data: updatedStep, error: null });
    const supabase = createMockSupabase(chain);
    supabase.auth.getUser.mockResolvedValue(mockUser() as any);
    mockCreateClient.mockResolvedValue(supabase as any);

    const res = await PUT(makeRequest("PUT", { description: "Updated" }), routeParams);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data).toEqual(updatedStep);
  });

  it("falls back to next candidate when first update fails", async () => {
    mockIsAdmin.mockResolvedValue(true);
    const updatedStep = { id: 10, description: "Updated" };
    const chain = createMockChain();
    chain.single
      .mockResolvedValueOnce({
        data: null,
        error: { message: "column modified_by_user_id does not exist" },
      })
      .mockResolvedValueOnce({ data: updatedStep, error: null });
    const supabase = createMockSupabase(chain);
    supabase.auth.getUser.mockResolvedValue(mockUser() as any);
    mockCreateClient.mockResolvedValue(supabase as any);

    const res = await PUT(makeRequest("PUT", { description: "Updated" }), routeParams);
    expect(res.status).toBe(200);
  });
});

// ---------------------------------------------------------------------------
// PUT /api/humor-flavor-steps/[id] — reorder
// ---------------------------------------------------------------------------

describe("PUT /api/humor-flavor-steps/[id] (reorder)", () => {
  it("returns 401 when not admin", async () => {
    mockIsAdmin.mockResolvedValue(false);
    const supabase = createMockSupabase();
    mockCreateClient.mockResolvedValue(supabase as any);

    const res = await PUT(makeRequest("PUT", { from_order: 0, to_order: 2 }), routeParams);
    expect(res.status).toBe(401);
  });

  it("returns 404 when the step is not found during reorder", async () => {
    mockIsAdmin.mockResolvedValue(true);
    const chain = createMockChain();
    chain.single.mockResolvedValue({ data: null, error: { message: "not found" } });
    const supabase = createMockSupabase(chain);
    supabase.auth.getUser.mockResolvedValue(mockUser() as any);
    mockCreateClient.mockResolvedValue(supabase as any);

    const res = await PUT(makeRequest("PUT", { from_order: 0, to_order: 2 }), routeParams);
    expect(res.status).toBe(404);
  });

  function buildReorderSupabase(
    step: unknown,
    allSteps: { id: number; order_by: number }[]
  ) {
    const supabase = createMockSupabase();
    supabase.auth.getUser.mockResolvedValue(mockUser() as any);

    // Each `from()` call returns a different chain object
    supabase.from
      // 1st call: SELECT step by id
      .mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: step, error: null }),
      } as any)
      // 2nd call: SELECT all steps for flavor
      .mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: allSteps, error: null }),
      } as any)
      // 3rd+ calls: UPDATE individual step
      .mockReturnValue({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: null }),
      } as any);

    return supabase;
  }

  it("reorders steps moving down (from < to)", async () => {
    mockIsAdmin.mockResolvedValue(true);
    const step = { humor_flavor_id: 1, order_by: 0 };
    const allSteps = [
      { id: 10, order_by: 0 },
      { id: 11, order_by: 1 },
      { id: 12, order_by: 2 },
    ];
    mockCreateClient.mockResolvedValue(buildReorderSupabase(step, allSteps) as any);

    const res = await PUT(makeRequest("PUT", { from_order: 0, to_order: 2 }), routeParams);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
  });

  it("reorders steps moving up (from > to)", async () => {
    mockIsAdmin.mockResolvedValue(true);
    // Step id=10 starts at order_by=2 (= from_order). id=20,21 are in shift range.
    const step = { humor_flavor_id: 1, order_by: 2 };
    const allSteps = [
      { id: 20, order_by: 0 },
      { id: 21, order_by: 1 },
      { id: 10, order_by: 2 }, // the step being moved (id matches route param)
    ];
    mockCreateClient.mockResolvedValue(buildReorderSupabase(step, allSteps) as any);

    const res = await PUT(makeRequest("PUT", { from_order: 2, to_order: 0 }), routeParams);
    expect(res.status).toBe(200);
  });

  it("applies fallback update (without modified_by_user_id) during reorder", async () => {
    mockIsAdmin.mockResolvedValue(true);
    const step = { humor_flavor_id: 1, order_by: 0 };
    const allSteps = [{ id: 10, order_by: 0 }, { id: 11, order_by: 1 }];

    const supabase = createMockSupabase();
    supabase.auth.getUser.mockResolvedValue(mockUser() as any);

    supabase.from
      .mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: step, error: null }),
      } as any)
      .mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: allSteps, error: null }),
      } as any)
      // First update: error mentioning modified_by_user_id → triggers fallback
      .mockReturnValueOnce({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          error: { message: "column modified_by_user_id does not exist" },
        }),
      } as any)
      // Fallback update for same step
      .mockReturnValue({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: null }),
      } as any);

    mockCreateClient.mockResolvedValue(supabase as any);

    const res = await PUT(makeRequest("PUT", { from_order: 0, to_order: 1 }), routeParams);
    expect(res.status).toBe(200);
  });
});

// ---------------------------------------------------------------------------
// DELETE /api/humor-flavor-steps/[id]
// ---------------------------------------------------------------------------

describe("DELETE /api/humor-flavor-steps/[id]", () => {
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
    chain.eq.mockResolvedValue({ error: { message: "FK violation" } });
    const supabase = createMockSupabase(chain);
    mockCreateClient.mockResolvedValue(supabase as any);

    const res = await DELETE(makeRequest("DELETE"), routeParams);
    expect(res.status).toBe(500);
  });
});
