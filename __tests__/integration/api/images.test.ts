jest.mock("@/lib/supabaseServer", () => ({ createSupabaseServerClient: jest.fn() }));

import { GET } from "@/app/api/images/route";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { createMockSupabase } from "../../helpers/supabaseMock";

const mockCreateClient = jest.mocked(createSupabaseServerClient);

beforeEach(() => jest.clearAllMocks());

describe("GET /api/images", () => {
  it("returns 200 with common-use images", async () => {
    const images = [
      { id: "img-1", url: "https://example.com/a.jpg", image_description: "A cat", is_common_use: true },
    ];
    const chain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue({ data: images, error: null }),
    };
    const supabase = createMockSupabase(chain as any);
    mockCreateClient.mockResolvedValue(supabase as any);

    const res = await GET();
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data).toEqual(images);
    expect(chain.eq).toHaveBeenCalledWith("is_common_use", true);
    expect(chain.limit).toHaveBeenCalledWith(50);
  });

  it("returns 500 when the database query fails", async () => {
    const chain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue({ data: null, error: { message: "Query error" } }),
    };
    const supabase = createMockSupabase(chain as any);
    mockCreateClient.mockResolvedValue(supabase as any);

    const res = await GET();
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.error).toBe("Query error");
  });
});
