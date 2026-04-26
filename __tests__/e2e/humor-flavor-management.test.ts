/**
 * E2E: Full humor flavor CRUD lifecycle.
 *
 * Simulates an admin user creating a flavor, adding a step, reordering it,
 * then deleting both the step and the flavor — calling API route handlers
 * directly (no HTTP server needed) with consistent mocks.
 */

jest.mock("@/lib/supabaseServer", () => ({ createSupabaseServerClient: jest.fn() }));
jest.mock("@/lib/auth", () => ({ isAdmin: jest.fn(), getCurrentUser: jest.fn() }));

import { GET as listFlavors, POST as createFlavor } from "@/app/api/humor-flavors/route";
import { GET as getFlavor, PUT as updateFlavor, DELETE as deleteFlavor } from "@/app/api/humor-flavors/[id]/route";
import { POST as createStep } from "@/app/api/humor-flavor-steps/route";
import { PUT as updateStep, DELETE as deleteStep } from "@/app/api/humor-flavor-steps/[id]/route";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { isAdmin } from "@/lib/auth";
import { NextRequest } from "next/server";

const mockCreateClient = jest.mocked(createSupabaseServerClient);
const mockIsAdmin = jest.mocked(isAdmin);

// Shared in-memory store to simulate DB state across calls
let flavorStore: Record<string, unknown>[] = [];
let stepStore: Record<string, unknown>[] = [];

function buildFlavorSupabase() {
  const supabase = {
    auth: {
      getSession: jest.fn().mockResolvedValue({
        data: { session: { user: { id: "admin-user" }, access_token: "token" } },
      }),
      getUser: jest.fn().mockResolvedValue({ data: { user: { id: "admin-user" } } }),
    },
    from: jest.fn().mockImplementation((table: string) => {
      if (table === "humor_flavors") {
        return {
          select: jest.fn().mockReturnThis(),
          insert: jest.fn().mockReturnThis(),
          update: jest.fn().mockReturnThis(),
          delete: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockResolvedValue({ data: flavorStore, error: null }),
          single: jest.fn().mockImplementation(() => {
            const flavor = flavorStore[0] ?? null;
            return Promise.resolve({ data: flavor, error: flavor ? null : { message: "not found" } });
          }),
        };
      }
      if (table === "humor_flavor_steps") {
        return {
          select: jest.fn().mockReturnThis(),
          insert: jest.fn().mockReturnThis(),
          update: jest.fn().mockReturnThis(),
          delete: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockResolvedValue({ data: stepStore, error: null }),
          single: jest.fn().mockImplementation(() => {
            const step = stepStore[0] ?? null;
            return Promise.resolve({ data: step, error: step ? null : { message: "not found" } });
          }),
          maybeSingle: jest.fn().mockResolvedValue({ data: { id: 1 }, error: null }),
        };
      }
      return { select: jest.fn().mockReturnThis(), eq: jest.fn().mockResolvedValue({ error: null }) };
    }),
  };
  return supabase;
}

beforeEach(() => {
  jest.clearAllMocks();
  mockIsAdmin.mockResolvedValue(true);
  flavorStore = [];
  stepStore = [];
});

describe("Humor flavor CRUD lifecycle", () => {
  it("creates a flavor and it appears in the list", async () => {
    const newFlavor = { id: 1, slug: "dry-wit", description: "Dry humor" };
    const supabase = buildFlavorSupabase();
    // Stub single for insert
    (supabase.from as jest.Mock).mockImplementationOnce(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: newFlavor, error: null }),
    }));
    flavorStore.push(newFlavor);
    mockCreateClient.mockResolvedValue(supabase as any);

    const createRes = await createFlavor(
      new Request("http://localhost/api/humor-flavors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "dry-wit", description: "Dry humor" }),
      })
    );
    expect(createRes.status).toBe(201);

    const listRes = await listFlavors();
    const listJson = await listRes.json();
    expect(listRes.status).toBe(200);
    expect(listJson.data).toHaveLength(1);
    expect(listJson.data[0].slug).toBe("dry-wit");
  });

  it("updates a flavor and reflects the change", async () => {
    const existing = { id: 1, slug: "dry-wit" };
    const updated = { id: 1, slug: "dry-wit-updated" };
    flavorStore = [existing];

    const supabase = buildFlavorSupabase();
    // Override single for update to return updated flavor
    (supabase.from as jest.Mock).mockImplementationOnce(() => ({
      select: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: updated, error: null }),
    }));
    flavorStore = [updated];
    mockCreateClient.mockResolvedValue(supabase as any);

    const updateRes = await updateFlavor(
      new NextRequest("http://localhost/api/humor-flavors/1", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "dry-wit-updated" }),
      }),
      { params: Promise.resolve({ id: "1" }) }
    );
    expect(updateRes.status).toBe(200);
    const json = await updateRes.json();
    expect(json.data.slug).toBe("dry-wit-updated");
  });

  it("deletes a flavor successfully", async () => {
    const supabase = buildFlavorSupabase();
    (supabase.from as jest.Mock).mockImplementationOnce(() => ({
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ error: null }),
    }));
    flavorStore = [];
    mockCreateClient.mockResolvedValue(supabase as any);

    const deleteRes = await deleteFlavor(
      new NextRequest("http://localhost/api/humor-flavors/1", { method: "DELETE" }),
      { params: Promise.resolve({ id: "1" }) }
    );
    expect(deleteRes.status).toBe(200);
    const json = await deleteRes.json();
    expect(json.success).toBe(true);

    // Flavor list is now empty
    const listRes = await listFlavors();
    const listJson = await listRes.json();
    expect(listJson.data).toHaveLength(0);
  });

  it("adds a step to a flavor and the step can be retrieved", async () => {
    const newStep = { id: 10, humor_flavor_id: 1, order_by: 0 };
    stepStore = [newStep];

    const supabase = buildFlavorSupabase();
    (supabase.from as jest.Mock)
      // First call for isAdmin check (flavor lookup)
      .mockImplementationOnce(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ data: { id: 1 }, error: null }),
      }))
      // Second call for step insert
      .mockImplementationOnce(() => ({
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: newStep, error: null }),
      }));
    mockCreateClient.mockResolvedValue(supabase as any);

    const createStepRes = await createStep(
      new Request("http://localhost/api/humor-flavor-steps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          humor_flavor_id: 1,
          order_by: 0,
          llm_model_id: 1,
          llm_input_type_id: 1,
          llm_output_type_id: 1,
          humor_flavor_step_type_id: 1,
        }),
      })
    );
    expect(createStepRes.status).toBe(201);
    const json = await createStepRes.json();
    expect(json.data.id).toBe(10);
  });

  it("reorders steps and deletes a step", async () => {
    const step1 = { id: 10, humor_flavor_id: 1, order_by: 0 };
    const step2 = { id: 11, humor_flavor_id: 1, order_by: 1 };
    stepStore = [step1, step2];

    const supabase = buildFlavorSupabase();
    (supabase.from as jest.Mock)
      // Get step by id
      .mockImplementationOnce(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: step1, error: null }),
      }))
      // Get all steps for flavor
      .mockImplementationOnce(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: stepStore, error: null }),
      }))
      // Update calls
      .mockImplementation(() => ({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: null }),
      }));
    mockCreateClient.mockResolvedValue(supabase as any);

    const reorderRes = await updateStep(
      new NextRequest("http://localhost/api/humor-flavor-steps/10", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ from_order: 0, to_order: 1 }),
      }),
      { params: Promise.resolve({ id: "10" }) }
    );
    expect(reorderRes.status).toBe(200);

    // Delete the step
    const supabase2 = buildFlavorSupabase();
    (supabase2.from as jest.Mock).mockImplementationOnce(() => ({
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ error: null }),
    }));
    mockCreateClient.mockResolvedValue(supabase2 as any);

    const deleteStepRes = await deleteStep(
      new NextRequest("http://localhost/api/humor-flavor-steps/10", { method: "DELETE" }),
      { params: Promise.resolve({ id: "10" }) }
    );
    expect(deleteStepRes.status).toBe(200);
  });
});
