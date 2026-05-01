/**
 * E2E: End-to-end caption generation flow.
 *
 * Simulates a user:
 *  1. Fetching available images
 *  2. Generating captions for a selected image + flavor
 *  3. Receiving and normalising the response
 *  4. Loading previously saved captions for the flavor
 */

jest.mock("@/lib/supabaseServer", () => ({ createSupabaseServerClient: jest.fn() }));
jest.mock("@/lib/almostCrackdClient", () => ({ almostCrackdFetch: jest.fn() }));

import { GET as getImages } from "@/app/api/images/route";
import { GET as getCaptions } from "@/app/api/captions/route";
import { POST as generateCaptions } from "@/app/api/pipeline/generate-captions/route";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { almostCrackdFetch } from "@/lib/almostCrackdClient";
import { normalizeGeneratedCaptions } from "@/lib/normalizeGeneratedCaptions";

const mockCreateClient = jest.mocked(createSupabaseServerClient);
const mockAlmostCrackdFetch = jest.mocked(almostCrackdFetch);

const testImages = [
  { id: "img-001", url: "https://example.com/cat.jpg", image_description: "A cat", is_common_use: true },
  { id: "img-002", url: "https://example.com/dog.jpg", image_description: "A dog", is_common_use: true },
];

const existingCaptions = [
  { id: "c1", content: "Why did the cat sit on the keyboard?", humor_flavor_id: 3, image_id: "img-001" },
];

function buildSupabase() {
  return {
    auth: {
      getSession: jest.fn().mockResolvedValue({
        data: {
          session: { user: { id: "user-1" }, access_token: "valid-token" },
        },
      }),
      getUser: jest.fn().mockResolvedValue({ data: { user: { id: "user-1" } } }),
    },
    from: jest.fn().mockImplementation((table: string) => {
      if (table === "images") {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          limit: jest.fn().mockResolvedValue({ data: testImages, error: null }),
        };
      }
      if (table === "captions") {
        return {
          select: jest.fn().mockReturnThis(),
          insert: jest.fn().mockResolvedValue({ data: null, error: null }),
          order: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          limit: jest.fn().mockResolvedValue({ data: existingCaptions, error: null }),
        };
      }
      return {};
    }),
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  mockCreateClient.mockResolvedValue(buildSupabase() as any);
});

describe("Caption generation flow", () => {
  it("fetches available images", async () => {
    const res = await getImages();
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data).toHaveLength(2);
    expect(json.data[0].id).toBe("img-001");
  });

  it("generates captions for a selected image and flavor", async () => {
    const upstreamPayload = {
      data: [
        { id: "gen-1", text: "Cat on keyboard is a classic.", content: "Cat on keyboard is a classic." },
        { id: "gen-2", text: "Purring at 3 AM.", content: "Purring at 3 AM." },
      ],
    };
    mockAlmostCrackdFetch.mockResolvedValue(
      new Response(JSON.stringify(upstreamPayload), { status: 200 })
    );

    const res = await generateCaptions(
      new Request("http://localhost/api/pipeline/generate-captions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageId: "img-001", humorFlavorId: 3 }),
      })
    );
    const json = await res.json();

    expect(res.status).toBe(200);

    // Normalise the response the same way the front-end does
    const normalized = normalizeGeneratedCaptions(json);
    expect(normalized).toHaveLength(2);
    expect(normalized[0].text).toBe("Cat on keyboard is a classic.");
    expect(normalized[1].text).toBe("Purring at 3 AM.");
  });

  it("loads existing saved captions for the flavor", async () => {
    const res = await getCaptions(
      new Request("http://localhost/api/captions?humor_flavor_id=3")
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data).toHaveLength(1);
    expect(json.data[0].humor_flavor_id).toBe(3);
  });

  it("full flow: images → generate → normalize → saved captions", async () => {
    // Step 1: fetch images
    const imagesRes = await getImages();
    const imagesJson = await imagesRes.json();
    const selectedImageId = imagesJson.data[0].id;
    expect(selectedImageId).toBe("img-001");

    // Step 2: generate
    mockAlmostCrackdFetch.mockResolvedValue(
      new Response(JSON.stringify({ data: ["Caption A", "Caption B"] }), { status: 200 })
    );
    const genRes = await generateCaptions(
      new Request("http://localhost/api/pipeline/generate-captions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageId: selectedImageId, humorFlavorId: 3 }),
      })
    );
    const genJson = await genRes.json();
    expect(genRes.status).toBe(200);

    // Step 3: normalise
    const normalized = normalizeGeneratedCaptions(genJson);
    expect(normalized.length).toBeGreaterThan(0);
    expect(normalized.every((c) => !!(c.text || c.content))).toBe(true);

    // Step 4: load saved
    const savedRes = await getCaptions(
      new Request("http://localhost/api/captions?humor_flavor_id=3")
    );
    const savedJson = await savedRes.json();
    expect(savedRes.status).toBe(200);
    expect(Array.isArray(savedJson.data)).toBe(true);
  });
});
