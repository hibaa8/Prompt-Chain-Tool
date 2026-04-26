/**
 * Shared Supabase mock factory used across integration tests.
 * Returns a mock Supabase client with chainable query builder methods.
 */

export interface MockQueryChain {
  select: jest.Mock;
  insert: jest.Mock;
  update: jest.Mock;
  delete: jest.Mock;
  eq: jest.Mock;
  single: jest.Mock;
  maybeSingle: jest.Mock;
  order: jest.Mock;
  limit: jest.Mock;
}

export function createMockChain(terminalValue?: { data: unknown; error: unknown }): MockQueryChain {
  const resolved = terminalValue ?? { data: null, error: null };
  const chain: MockQueryChain = {
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue(resolved),
    maybeSingle: jest.fn().mockResolvedValue(resolved),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockResolvedValue(resolved),
  };
  return chain;
}

export interface MockSupabaseClient {
  auth: {
    getSession: jest.Mock;
    getUser: jest.Mock;
  };
  from: jest.Mock;
  _chain: MockQueryChain;
}

export function createMockSupabase(chain?: MockQueryChain): MockSupabaseClient {
  const mockChain = chain ?? createMockChain();
  return {
    auth: {
      getSession: jest.fn().mockResolvedValue({ data: { session: null } }),
      getUser: jest.fn().mockResolvedValue({ data: { user: null } }),
    },
    from: jest.fn().mockReturnValue(mockChain),
    _chain: mockChain,
  };
}

export function mockSession(userId = "user-123", accessToken = "test-token") {
  return {
    data: {
      session: {
        user: { id: userId },
        access_token: accessToken,
      },
    },
  };
}

export function mockUser(userId = "user-123") {
  return { data: { user: { id: userId } } };
}
