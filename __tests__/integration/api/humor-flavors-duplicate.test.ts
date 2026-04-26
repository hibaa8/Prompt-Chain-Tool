jest.mock("@/lib/supabaseServer", () => ({ createSupabaseServerClient: jest.fn() }));
jest.mock("@/lib/auth", () => ({ isAdmin: jest.fn(), getCurrentUser: jest.fn() }));

import { POST } from "@/app/api/humor-flavors/[id]/duplicate/route";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { isAdmin } from "@/lib/auth";
import { NextRequest } from "next/server";
import { createMockSupabase, mockUser } from "../../helpers/supabaseMock";

const mockCreateClient = jest.mocked(createSupabaseServerClient);
const mockIsAdmin = jest.mocked(isAdmin);
const routeParams = { params: Promise.resolve({ id: "1" }) };

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost/api/humor-flavors/1/duplicate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const sourceFlavor = {
  id: 1,
  slug: "original",
  description: "Original flavor",
  humor_flavor_steps: [
    {
      id: 10,
      humor_flavor_id: 1,
      order_by: 0,
      llm_model_id: 1,
      llm_input_type_id: 1,
      llm_output_type_id: 1,
      humor_flavor_step_type_id: 1,
      description: "Step 1",
    },
  ],
};

beforeEach(() => jest.clearAllMocks());

describe("POST /api/humor-flavors/[id]/duplicate", () => {
  it("returns 401 when not admin", async () => {
    mockIsAdmin.mockResolvedValue(false);
    const supabase = createMockSupabase();
    mockCreateClient.mockResolvedValue(supabase as any);

    const res = await POST(makeRequest({ name: "Copy" }), routeParams);
    expect(res.status).toBe(401);
  });

  it("returns 401 when no user", async () => {
    mockIsAdmin.mockResolvedValue(true);
    const supabase = createMockSupabase();
    supabase.auth.getUser.mockResolvedValue({ data: { user: null } });
    mockCreateClient.mockResolvedValue(supabase as any);

    const res = await POST(makeRequest({ name: "Copy" }), routeParams);
    expect(res.status).toBe(401);
  });

  it("returns 400 on invalid body (empty name)", async () => {
    mockIsAdmin.mockResolvedValue(true);
    const supabase = createMockSupabase();
    supabase.auth.getUser.mockResolvedValue(mockUser() as any);
    mockCreateClient.mockResolvedValue(supabase as any);

    const res = await POST(makeRequest({ name: "" }), routeParams);
    expect(res.status).toBe(400);
  });

  it("returns 400 when body is not valid JSON", async () => {
    mockIsAdmin.mockResolvedValue(true);
    const supabase = createMockSupabase();
    supabase.auth.getUser.mockResolvedValue(mockUser() as any);
    mockCreateClient.mockResolvedValue(supabase as any);

    const badReq = new NextRequest("http://localhost/api/humor-flavors/1/duplicate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not-json",
    });
    const res = await POST(badReq, routeParams);
    expect(res.status).toBe(400);
  });

  it("returns 404 when source flavor is not found", async () => {
    mockIsAdmin.mockResolvedValue(true);
    const supabase = createMockSupabase();
    supabase.auth.getUser.mockResolvedValue(mockUser() as any);
    supabase.from.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: { message: "not found" } }),
    } as any);
    mockCreateClient.mockResolvedValue(supabase as any);

    const res = await POST(makeRequest({ name: "Copy" }), routeParams);
    expect(res.status).toBe(404);
  });

  it("returns 409 when the new name already exists", async () => {
    mockIsAdmin.mockResolvedValue(true);
    const supabase = createMockSupabase();
    supabase.auth.getUser.mockResolvedValue(mockUser() as any);

    supabase.from
      // Source flavor fetch
      .mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: sourceFlavor, error: null }),
      } as any)
      // Existing rows check
      .mockReturnValueOnce({
        select: jest.fn().mockResolvedValue({
          data: [{ slug: "copy", name: "" }],
          error: null,
        }),
      } as any);
    mockCreateClient.mockResolvedValue(supabase as any);

    const res = await POST(makeRequest({ name: "copy" }), routeParams);
    const json = await res.json();

    expect(res.status).toBe(409);
    expect(json.error).toContain("already exists");
  });

  it("returns 500 when existing rows query fails", async () => {
    mockIsAdmin.mockResolvedValue(true);
    const supabase = createMockSupabase();
    supabase.auth.getUser.mockResolvedValue(mockUser() as any);

    supabase.from
      .mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: sourceFlavor, error: null }),
      } as any)
      .mockReturnValueOnce({
        select: jest.fn().mockResolvedValue({ data: null, error: { message: "DB error" } }),
      } as any);
    mockCreateClient.mockResolvedValue(supabase as any);

    const res = await POST(makeRequest({ name: "Unique Name" }), routeParams);
    expect(res.status).toBe(500);
  });

  it("returns 500 when flavor insert fails", async () => {
    mockIsAdmin.mockResolvedValue(true);
    const supabase = createMockSupabase();
    supabase.auth.getUser.mockResolvedValue(mockUser() as any);

    supabase.from
      .mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: sourceFlavor, error: null }),
      } as any)
      .mockReturnValueOnce({
        select: jest.fn().mockResolvedValue({ data: [], error: null }),
      } as any)
      // All flavor insert candidates fail
      .mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: { message: "insert error" } }),
      } as any);
    mockCreateClient.mockResolvedValue(supabase as any);

    const res = await POST(makeRequest({ name: "New Name" }), routeParams);
    expect(res.status).toBe(500);
  });

  it("returns 201 on successful duplication without steps", async () => {
    mockIsAdmin.mockResolvedValue(true);
    const supabase = createMockSupabase();
    supabase.auth.getUser.mockResolvedValue(mockUser() as any);

    const newFlavor = { id: 2, slug: "copy", humor_flavor_steps: [] };
    const sourceFlavorNoSteps = { ...sourceFlavor, humor_flavor_steps: [] };

    supabase.from
      .mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: sourceFlavorNoSteps, error: null }),
      } as any)
      .mockReturnValueOnce({
        select: jest.fn().mockResolvedValue({ data: [], error: null }),
      } as any)
      // Flavor insert succeeds
      .mockReturnValueOnce({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: { id: 2 }, error: null }),
      } as any)
      // Final fetch of full flavor
      .mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: newFlavor, error: null }),
      } as any);
    mockCreateClient.mockResolvedValue(supabase as any);

    const res = await POST(makeRequest({ name: "copy" }), routeParams);
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.data.id).toBe(2);
  });

  it("returns 201 on successful duplication with steps", async () => {
    mockIsAdmin.mockResolvedValue(true);
    const supabase = createMockSupabase();
    supabase.auth.getUser.mockResolvedValue(mockUser() as any);

    const newFlavor = { id: 2, slug: "copy", humor_flavor_steps: [{ id: 20, order_by: 0 }] };

    supabase.from
      .mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: sourceFlavor, error: null }),
      } as any)
      .mockReturnValueOnce({
        select: jest.fn().mockResolvedValue({ data: [], error: null }),
      } as any)
      // Flavor insert succeeds
      .mockReturnValueOnce({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: { id: 2 }, error: null }),
      } as any)
      // Step insert succeeds
      .mockReturnValueOnce({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: { id: 20 }, error: null }),
      } as any)
      // Final fetch
      .mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: newFlavor, error: null }),
      } as any);
    mockCreateClient.mockResolvedValue(supabase as any);

    const res = await POST(makeRequest({ name: "copy" }), routeParams);
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.data.humor_flavor_steps).toHaveLength(1);
  });

  it("rolls back and returns 500 when step insert fails", async () => {
    mockIsAdmin.mockResolvedValue(true);
    const supabase = createMockSupabase();
    supabase.auth.getUser.mockResolvedValue(mockUser() as any);

    supabase.from
      .mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: sourceFlavor, error: null }),
      } as any)
      .mockReturnValueOnce({
        select: jest.fn().mockResolvedValue({ data: [], error: null }),
      } as any)
      // Flavor insert succeeds
      .mockReturnValueOnce({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: { id: 2 }, error: null }),
      } as any)
      // Step insert fails (both candidates)
      .mockReturnValueOnce({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: { message: "step error" } }),
      } as any)
      .mockReturnValueOnce({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: { message: "step error" } }),
      } as any)
      // Rollback: delete steps
      .mockReturnValueOnce({
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: null }),
      } as any)
      // Rollback: delete flavor
      .mockReturnValueOnce({
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: null }),
      } as any);
    mockCreateClient.mockResolvedValue(supabase as any);

    const res = await POST(makeRequest({ name: "copy" }), routeParams);
    expect(res.status).toBe(500);
  });

  it("returns 201 with partial data when final flavor fetch fails", async () => {
    mockIsAdmin.mockResolvedValue(true);
    const supabase = createMockSupabase();
    supabase.auth.getUser.mockResolvedValue(mockUser() as any);

    supabase.from
      .mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: { ...sourceFlavor, humor_flavor_steps: [] }, error: null }),
      } as any)
      .mockReturnValueOnce({
        select: jest.fn().mockResolvedValue({ data: [], error: null }),
      } as any)
      .mockReturnValueOnce({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: { id: 2 }, error: null }),
      } as any)
      // Final fetch fails
      .mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: { message: "fetch failed" } }),
      } as any);
    mockCreateClient.mockResolvedValue(supabase as any);

    const res = await POST(makeRequest({ name: "copy" }), routeParams);
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.data.id).toBe(2);
  });
});
