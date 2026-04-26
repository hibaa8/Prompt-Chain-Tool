jest.mock("@supabase/ssr", () => ({ createServerClient: jest.fn() }));

import { middleware } from "../../middleware";
import { createServerClient } from "@supabase/ssr";
import { NextRequest } from "next/server";

const mockCreateServerClient = jest.mocked(createServerClient);

function buildRequest(pathname: string) {
  return new NextRequest(`http://localhost${pathname}`);
}

function buildMockSupabase({
  user = null as { id: string } | null,
  profile = null as { is_superadmin: boolean; is_matrix_admin: boolean } | null,
} = {}) {
  const mockChain = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: profile }),
  };
  return {
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user } }),
    },
    from: jest.fn().mockReturnValue(mockChain),
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  // Ensure env vars are set so the middleware doesn't early-return
  process.env.SUPABASE_URL = "https://test.supabase.co";
  process.env.SUPABASE_ANON_KEY = "test-anon-key";
});

describe("middleware", () => {
  it("passes through public /login route without auth check", async () => {
    const req = buildRequest("/login");
    const res = await middleware(req);
    // Supabase client should not be created for public routes
    expect(mockCreateServerClient).not.toHaveBeenCalled();
    expect(res.status).toBe(200);
  });

  it("passes through /auth/ routes without auth check", async () => {
    const req = buildRequest("/auth/callback");
    await middleware(req);
    expect(mockCreateServerClient).not.toHaveBeenCalled();
  });

  it("redirects unauthenticated users to /login", async () => {
    const supabase = buildMockSupabase({ user: null });
    mockCreateServerClient.mockReturnValue(supabase as any);

    const res = await middleware(buildRequest("/"));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/login");
  });

  it("redirects non-admin users to /unauthorized", async () => {
    const supabase = buildMockSupabase({
      user: { id: "u1" },
      profile: { is_superadmin: false, is_matrix_admin: false },
    });
    mockCreateServerClient.mockReturnValue(supabase as any);

    const res = await middleware(buildRequest("/"));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/unauthorized");
  });

  it("passes through for superadmin users", async () => {
    const supabase = buildMockSupabase({
      user: { id: "u1" },
      profile: { is_superadmin: true, is_matrix_admin: false },
    });
    mockCreateServerClient.mockReturnValue(supabase as any);

    const res = await middleware(buildRequest("/"));
    expect(res.status).toBe(200);
  });

  it("passes through for matrix_admin users", async () => {
    const supabase = buildMockSupabase({
      user: { id: "u1" },
      profile: { is_superadmin: false, is_matrix_admin: true },
    });
    mockCreateServerClient.mockReturnValue(supabase as any);

    const res = await middleware(buildRequest("/api/humor-flavors"));
    expect(res.status).toBe(200);
  });

  it("passes through without env vars (early return)", async () => {
    process.env.SUPABASE_URL = "";
    process.env.SUPABASE_ANON_KEY = "";
    process.env.NEXT_PUBLIC_SUPABASE_URL = "";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "";

    const res = await middleware(buildRequest("/protected"));
    expect(res.status).toBe(200);

    // Restore
    process.env.SUPABASE_URL = "https://test.supabase.co";
    process.env.SUPABASE_ANON_KEY = "test-anon-key";
  });
});
