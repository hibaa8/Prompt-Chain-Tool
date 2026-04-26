jest.mock("@/lib/supabaseServer", () => ({
  createSupabaseServerClient: jest.fn(),
}));

import { getCurrentUser, isAdmin } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

const mockCreateClient = jest.mocked(createSupabaseServerClient);

function buildMockSupabase({
  session = null as { user: { id: string } } | null,
  profile = null as { is_superadmin: boolean; is_matrix_admin: boolean } | null,
  profileError = null as { message: string } | null,
} = {}) {
  const mockChain = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: profile, error: profileError }),
  };
  return {
    auth: {
      getSession: jest
        .fn()
        .mockResolvedValue({ data: { session } }),
    },
    from: jest.fn().mockReturnValue(mockChain),
    _chain: mockChain,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("getCurrentUser", () => {
  it("returns the user when a session exists", async () => {
    const user = { id: "user-abc" };
    const supabase = buildMockSupabase({ session: { user } as any });
    mockCreateClient.mockResolvedValue(supabase as any);

    const result = await getCurrentUser();
    expect(result).toEqual(user);
  });

  it("returns undefined when there is no session", async () => {
    const supabase = buildMockSupabase({ session: null });
    mockCreateClient.mockResolvedValue(supabase as any);

    const result = await getCurrentUser();
    expect(result).toBeUndefined();
  });
});

describe("isAdmin", () => {
  it("returns true when profile has is_superadmin = true", async () => {
    const supabase = buildMockSupabase({
      session: { user: { id: "u1" } } as any,
      profile: { is_superadmin: true, is_matrix_admin: false },
    });
    mockCreateClient.mockResolvedValue(supabase as any);

    expect(await isAdmin()).toBe(true);
  });

  it("returns true when profile has is_matrix_admin = true", async () => {
    const supabase = buildMockSupabase({
      session: { user: { id: "u1" } } as any,
      profile: { is_superadmin: false, is_matrix_admin: true },
    });
    mockCreateClient.mockResolvedValue(supabase as any);

    expect(await isAdmin()).toBe(true);
  });

  it("returns false when neither flag is set", async () => {
    const supabase = buildMockSupabase({
      session: { user: { id: "u1" } } as any,
      profile: { is_superadmin: false, is_matrix_admin: false },
    });
    mockCreateClient.mockResolvedValue(supabase as any);

    expect(await isAdmin()).toBe(false);
  });

  it("returns false when there is no session", async () => {
    const supabase = buildMockSupabase({ session: null });
    mockCreateClient.mockResolvedValue(supabase as any);

    expect(await isAdmin()).toBe(false);
  });

  it("returns falsy when the profile query returns null", async () => {
    const supabase = buildMockSupabase({
      session: { user: { id: "u1" } } as any,
      profile: null,
    });
    mockCreateClient.mockResolvedValue(supabase as any);

    expect(await isAdmin()).toBeFalsy();
  });
});
