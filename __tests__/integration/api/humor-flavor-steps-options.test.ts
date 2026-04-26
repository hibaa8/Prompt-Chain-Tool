jest.mock("@/lib/supabaseServer", () => ({ createSupabaseServerClient: jest.fn() }));
jest.mock("@/lib/auth", () => ({ isAdmin: jest.fn(), getCurrentUser: jest.fn() }));

import { GET } from "@/app/api/humor-flavor-steps/options/route";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { isAdmin } from "@/lib/auth";
import { createMockSupabase } from "../../helpers/supabaseMock";

const mockCreateClient = jest.mocked(createSupabaseServerClient);
const mockIsAdmin = jest.mocked(isAdmin);

beforeEach(() => jest.clearAllMocks());

function makeOptionsSupabase(overrides: {
  models?: unknown;
  inputTypes?: unknown;
  outputTypes?: unknown;
  stepTypes?: unknown;
  error?: { message: string };
}) {
  const supabase = createMockSupabase();

  const modelsChain = {
    select: jest.fn().mockReturnThis(),
    order: jest.fn().mockResolvedValue({
      data: overrides.models ?? [],
      error: overrides.error ?? null,
    }),
  };
  const inputTypesChain = {
    select: jest.fn().mockReturnThis(),
    order: jest.fn().mockResolvedValue({
      data: overrides.inputTypes ?? [],
      error: null,
    }),
  };
  const outputTypesChain = {
    select: jest.fn().mockReturnThis(),
    order: jest.fn().mockResolvedValue({
      data: overrides.outputTypes ?? [],
      error: null,
    }),
  };
  const stepTypesChain = {
    select: jest.fn().mockReturnThis(),
    order: jest.fn().mockResolvedValue({
      data: overrides.stepTypes ?? [],
      error: null,
    }),
  };

  supabase.from
    .mockReturnValueOnce(modelsChain as any)
    .mockReturnValueOnce(inputTypesChain as any)
    .mockReturnValueOnce(outputTypesChain as any)
    .mockReturnValueOnce(stepTypesChain as any);

  return supabase;
}

describe("GET /api/humor-flavor-steps/options", () => {
  it("returns 401 when not admin", async () => {
    mockIsAdmin.mockResolvedValue(false);
    const supabase = createMockSupabase();
    mockCreateClient.mockResolvedValue(supabase as any);

    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns 200 with all option lists", async () => {
    mockIsAdmin.mockResolvedValue(true);
    const models = [{ id: 1, name: "GPT-4" }];
    const inputTypes = [{ id: 1, slug: "image" }];
    const outputTypes = [{ id: 1, slug: "json" }];
    const stepTypes = [{ id: 1, slug: "caption" }];

    const supabase = makeOptionsSupabase({ models, inputTypes, outputTypes, stepTypes });
    mockCreateClient.mockResolvedValue(supabase as any);

    const res = await GET();
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.llm_models).toEqual(models);
    expect(json.data.llm_input_types).toEqual(inputTypes);
    expect(json.data.llm_output_types).toEqual(outputTypes);
    expect(json.data.humor_flavor_step_types).toEqual(stepTypes);
  });

  it("returns 500 when any lookup query fails", async () => {
    mockIsAdmin.mockResolvedValue(true);
    const supabase = makeOptionsSupabase({ error: { message: "models query failed" } });
    mockCreateClient.mockResolvedValue(supabase as any);

    const res = await GET();
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.error).toBe("models query failed");
  });
});
