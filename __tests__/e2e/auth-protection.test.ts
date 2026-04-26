/**
 * E2E: Auth & authorization protection.
 *
 * Verifies that all mutating API endpoints reject unauthenticated and
 * non-admin callers, and that admin callers can proceed.
 */

jest.mock("@/lib/supabaseServer", () => ({ createSupabaseServerClient: jest.fn() }));
jest.mock("@/lib/auth", () => ({ isAdmin: jest.fn(), getCurrentUser: jest.fn() }));

import { POST as createFlavorRoute } from "@/app/api/humor-flavors/route";
import { PUT as updateFlavorRoute, DELETE as deleteFlavorRoute } from "@/app/api/humor-flavors/[id]/route";
import { POST as createStepRoute } from "@/app/api/humor-flavor-steps/route";
import { PUT as updateStepRoute, DELETE as deleteStepRoute } from "@/app/api/humor-flavor-steps/[id]/route";
import { GET as getOptionsRoute } from "@/app/api/humor-flavor-steps/options/route";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { isAdmin } from "@/lib/auth";
import { NextRequest } from "next/server";
import { createMockSupabase, mockSession } from "../helpers/supabaseMock";

const mockCreateClient = jest.mocked(createSupabaseServerClient);
const mockIsAdmin = jest.mocked(isAdmin);

function jsonRequest(url: string, body: unknown, method = "POST") {
  return new NextRequest(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const idParams = { params: Promise.resolve({ id: "1" }) };

beforeEach(() => {
  jest.clearAllMocks();
  const supabase = createMockSupabase();
  mockCreateClient.mockResolvedValue(supabase as any);
});

describe("Auth protection — non-admin users are rejected", () => {
  beforeEach(() => {
    mockIsAdmin.mockResolvedValue(false);
  });

  it("POST /api/humor-flavors returns 401", async () => {
    const res = await createFlavorRoute(
      jsonRequest("http://localhost/api/humor-flavors", { name: "Test" })
    );
    expect(res.status).toBe(401);
  });

  it("PUT /api/humor-flavors/[id] returns 401", async () => {
    const res = await updateFlavorRoute(
      jsonRequest("http://localhost/api/humor-flavors/1", { name: "Test" }, "PUT"),
      idParams
    );
    expect(res.status).toBe(401);
  });

  it("DELETE /api/humor-flavors/[id] returns 401", async () => {
    const res = await deleteFlavorRoute(
      jsonRequest("http://localhost/api/humor-flavors/1", {}, "DELETE"),
      idParams
    );
    expect(res.status).toBe(401);
  });

  it("POST /api/humor-flavor-steps returns 401", async () => {
    const res = await createStepRoute(
      jsonRequest("http://localhost/api/humor-flavor-steps", {
        humor_flavor_id: 1,
        order_by: 0,
        llm_model_id: 1,
        llm_input_type_id: 1,
        llm_output_type_id: 1,
        humor_flavor_step_type_id: 1,
      })
    );
    expect(res.status).toBe(401);
  });

  it("PUT /api/humor-flavor-steps/[id] returns 401", async () => {
    const res = await updateStepRoute(
      jsonRequest("http://localhost/api/humor-flavor-steps/1", { description: "X" }, "PUT"),
      idParams
    );
    expect(res.status).toBe(401);
  });

  it("DELETE /api/humor-flavor-steps/[id] returns 401", async () => {
    const res = await deleteStepRoute(
      jsonRequest("http://localhost/api/humor-flavor-steps/1", {}, "DELETE"),
      idParams
    );
    expect(res.status).toBe(401);
  });

  it("GET /api/humor-flavor-steps/options returns 401", async () => {
    const res = await getOptionsRoute();
    expect(res.status).toBe(401);
  });
});

describe("Auth protection — admin users are permitted", () => {
  beforeEach(() => {
    mockIsAdmin.mockResolvedValue(true);
    const supabase = createMockSupabase();
    supabase.auth.getSession.mockResolvedValue(mockSession() as any);
    supabase.auth.getUser.mockResolvedValue({ data: { user: { id: "admin-1" } } });
    // Return a flavor for insert
    supabase._chain.single.mockResolvedValue({ data: { id: 1, slug: "test" }, error: null });
    mockCreateClient.mockResolvedValue(supabase as any);
  });

  it("POST /api/humor-flavors succeeds for admin", async () => {
    const res = await createFlavorRoute(
      jsonRequest("http://localhost/api/humor-flavors", { name: "Test Flavor" })
    );
    expect(res.status).toBe(201);
  });

  it("DELETE /api/humor-flavors/[id] succeeds for admin (with DB success)", async () => {
    const supabase = createMockSupabase();
    supabase._chain.eq.mockResolvedValue({ error: null });
    mockCreateClient.mockResolvedValue(supabase as any);

    const res = await deleteFlavorRoute(
      jsonRequest("http://localhost/api/humor-flavors/1", {}, "DELETE"),
      idParams
    );
    expect(res.status).toBe(200);
  });
});
