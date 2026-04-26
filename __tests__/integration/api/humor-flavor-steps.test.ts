jest.mock("@/lib/supabaseServer", () => ({ createSupabaseServerClient: jest.fn() }));
jest.mock("@/lib/auth", () => ({ isAdmin: jest.fn(), getCurrentUser: jest.fn() }));

import { POST } from "@/app/api/humor-flavor-steps/route";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { isAdmin } from "@/lib/auth";
import { createMockChain, createMockSupabase, mockUser } from "../../helpers/supabaseMock";

const mockCreateClient = jest.mocked(createSupabaseServerClient);
const mockIsAdmin = jest.mocked(isAdmin);

const validStep = {
  humor_flavor_id: 1,
  order_by: 0,
  llm_model_id: 2,
  llm_input_type_id: 3,
  llm_output_type_id: 4,
  humor_flavor_step_type_id: 5,
};

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/humor-flavor-steps", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => jest.clearAllMocks());

describe("POST /api/humor-flavor-steps", () => {
  it("returns 401 when not admin", async () => {
    mockIsAdmin.mockResolvedValue(false);
    const supabase = createMockSupabase();
    mockCreateClient.mockResolvedValue(supabase as any);

    const res = await POST(makeRequest(validStep));
    expect(res.status).toBe(401);
  });

  it("returns 401 when no authenticated user", async () => {
    mockIsAdmin.mockResolvedValue(true);
    const supabase = createMockSupabase();
    supabase.auth.getUser.mockResolvedValue({ data: { user: null } });
    mockCreateClient.mockResolvedValue(supabase as any);

    const res = await POST(makeRequest(validStep));
    expect(res.status).toBe(401);
  });

  it("returns 400 on invalid body", async () => {
    mockIsAdmin.mockResolvedValue(true);
    const supabase = createMockSupabase();
    supabase.auth.getUser.mockResolvedValue(mockUser() as any);
    mockCreateClient.mockResolvedValue(supabase as any);

    const res = await POST(makeRequest({ humor_flavor_id: -1 }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when the referenced humor flavor does not exist", async () => {
    mockIsAdmin.mockResolvedValue(true);
    const chain = createMockChain();
    // maybeSingle returns no flavor
    chain.maybeSingle.mockResolvedValue({ data: null, error: null });
    const supabase = createMockSupabase(chain);
    supabase.auth.getUser.mockResolvedValue(mockUser() as any);
    mockCreateClient.mockResolvedValue(supabase as any);

    const res = await POST(makeRequest(validStep));
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toContain("does not exist");
  });

  it("returns 500 when flavor lookup fails with a DB error", async () => {
    mockIsAdmin.mockResolvedValue(true);
    const chain = createMockChain();
    chain.maybeSingle.mockResolvedValue({ data: null, error: { message: "query failed" } });
    const supabase = createMockSupabase(chain);
    supabase.auth.getUser.mockResolvedValue(mockUser() as any);
    mockCreateClient.mockResolvedValue(supabase as any);

    const res = await POST(makeRequest(validStep));
    expect(res.status).toBe(500);
  });

  it("returns 201 on successful creation", async () => {
    mockIsAdmin.mockResolvedValue(true);
    const newStep = { id: 10, humor_flavor_id: 1, order_by: 0 };
    const chain = createMockChain();
    // First call is flavor check (maybeSingle), second is step insert (single)
    chain.maybeSingle.mockResolvedValue({ data: { id: 1 }, error: null });
    chain.single.mockResolvedValue({ data: newStep, error: null });
    const supabase = createMockSupabase(chain);
    supabase.auth.getUser.mockResolvedValue(mockUser() as any);
    mockCreateClient.mockResolvedValue(supabase as any);

    const res = await POST(makeRequest(validStep));
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.data).toEqual(newStep);
  });

  it("falls back to payload without user ids when first insert fails", async () => {
    mockIsAdmin.mockResolvedValue(true);
    const newStep = { id: 10, humor_flavor_id: 1, order_by: 0 };
    const chain = createMockChain();
    chain.maybeSingle.mockResolvedValue({ data: { id: 1 }, error: null });
    chain.single
      .mockResolvedValueOnce({
        data: null,
        error: { message: "column created_by_user_id does not exist" },
      })
      .mockResolvedValueOnce({ data: newStep, error: null });
    const supabase = createMockSupabase(chain);
    supabase.auth.getUser.mockResolvedValue(mockUser() as any);
    mockCreateClient.mockResolvedValue(supabase as any);

    const res = await POST(makeRequest(validStep));
    expect(res.status).toBe(201);
  });

  it("returns 500 when all insert candidates fail", async () => {
    mockIsAdmin.mockResolvedValue(true);
    const chain = createMockChain();
    chain.maybeSingle.mockResolvedValue({ data: { id: 1 }, error: null });
    chain.single.mockResolvedValue({ data: null, error: { message: "DB error" } });
    const supabase = createMockSupabase(chain);
    supabase.auth.getUser.mockResolvedValue(mockUser() as any);
    mockCreateClient.mockResolvedValue(supabase as any);

    const res = await POST(makeRequest(validStep));
    expect(res.status).toBe(500);
  });
});
