jest.mock("@/lib/supabaseServer", () => ({ createSupabaseServerClient: jest.fn() }));

import { GET } from "@/app/api/captions/route";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { createMockSupabase } from "../../helpers/supabaseMock";

const mockCreateClient = jest.mocked(createSupabaseServerClient);

beforeEach(() => jest.clearAllMocks());

function makeRequest(search = "") {
  return new Request(`http://localhost/api/captions${search}`);
}

describe("GET /api/captions", () => {
  it("returns 200 with all captions when no filter", async () => {
    const captions = [
      { id: "c1", content: "Funny!", humor_flavor_id: 1, image_id: "img-1" },
    ];
    const chain = {
      select: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue({ data: captions, error: null }),
    };
    const supabase = createMockSupabase(chain as any);
    mockCreateClient.mockResolvedValue(supabase as any);

    const res = await GET(makeRequest());
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data).toEqual(captions);
  });

  it("filters by humor_flavor_id when query param is provided", async () => {
    const captions = [{ id: "c2", content: "Wit!", humor_flavor_id: 5 }];
    const chain = {
      select: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue({ data: captions, error: null }),
    };
    const supabase = createMockSupabase(chain as any);
    mockCreateClient.mockResolvedValue(supabase as any);

    const res = await GET(makeRequest("?humor_flavor_id=5"));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data).toEqual(captions);
    expect(chain.eq).toHaveBeenCalledWith("humor_flavor_id", 5);
  });

  it("returns 500 when the database query fails", async () => {
    const chain = {
      select: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue({ data: null, error: { message: "DB error" } }),
    };
    const supabase = createMockSupabase(chain as any);
    mockCreateClient.mockResolvedValue(supabase as any);

    const res = await GET(makeRequest());
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.error).toBe("DB error");
  });
});
