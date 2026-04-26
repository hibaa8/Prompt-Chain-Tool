import { normalizeGeneratedCaptions } from "@/lib/normalizeGeneratedCaptions";

describe("normalizeGeneratedCaptions", () => {
  describe("source field resolution", () => {
    it("reads captions from payload.data", () => {
      const result = normalizeGeneratedCaptions({ data: [{ id: "1", text: "Ha!" }] });
      expect(result).toHaveLength(1);
      expect(result[0].text).toBe("Ha!");
    });

    it("reads captions from payload.captions", () => {
      const result = normalizeGeneratedCaptions({ captions: [{ id: "1", text: "Ha!" }] });
      expect(result).toHaveLength(1);
    });

    it("reads captions from payload.generatedCaptions", () => {
      const result = normalizeGeneratedCaptions({
        generatedCaptions: [{ id: "1", text: "Ha!" }],
      });
      expect(result).toHaveLength(1);
    });

    it("reads captions from payload.result.captions", () => {
      const result = normalizeGeneratedCaptions({
        result: { captions: [{ id: "1", text: "Ha!" }] },
      });
      expect(result).toHaveLength(1);
    });

    it("reads captions from payload.result when it is an array", () => {
      const result = normalizeGeneratedCaptions({ result: [{ id: "1", text: "Ha!" }] });
      expect(result).toHaveLength(1);
    });

    it("reads captions when payload itself is an array", () => {
      const result = normalizeGeneratedCaptions([{ id: "1", text: "Ha!" }]);
      expect(result).toHaveLength(1);
    });
  });

  describe("string items", () => {
    it("wraps plain strings as captions with generated IDs", () => {
      const result = normalizeGeneratedCaptions({ data: ["Caption A", "Caption B"] });
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe("generated-0");
      expect(result[0].text).toBe("Caption A");
      expect(result[1].id).toBe("generated-1");
    });

    it("assigns humorFlavorId from payload when items are strings", () => {
      const result = normalizeGeneratedCaptions({
        data: ["Caption A"],
        humorFlavorId: 42,
      });
      expect(result[0].humor_flavor_id).toBe(42);
    });
  });

  describe("object items", () => {
    it("maps id, text, content from object items", () => {
      const result = normalizeGeneratedCaptions({
        data: [{ id: "cap-1", text: "Funny!", content: "Funny!", humor_flavor_id: 7 }],
      });
      expect(result[0].id).toBe("cap-1");
      expect(result[0].text).toBe("Funny!");
      expect(result[0].content).toBe("Funny!");
      expect(result[0].humor_flavor_id).toBe(7);
    });

    it("falls back to item.content when text is missing", () => {
      const result = normalizeGeneratedCaptions({
        data: [{ id: "1", content: "Content only" }],
      });
      expect(result[0].text).toBe("Content only");
    });

    it("falls back to item.caption field", () => {
      const result = normalizeGeneratedCaptions({
        data: [{ id: "1", caption: "From caption field" }],
      });
      expect(result[0].text).toBe("From caption field");
    });

    it("falls back to item.generated_caption field", () => {
      const result = normalizeGeneratedCaptions({
        data: [{ id: "1", generated_caption: "Generated one" }],
      });
      expect(result[0].text).toBe("Generated one");
    });

    it("generates an id when item.id is missing", () => {
      const result = normalizeGeneratedCaptions({ data: [{ text: "No ID" }] });
      expect(result[0].id).toBe("generated-0");
    });

    it("uses payload humorFlavorId when item has no humor_flavor_id", () => {
      const result = normalizeGeneratedCaptions({
        data: [{ text: "Hi" }],
        humorFlavorId: 99,
      });
      expect(result[0].humor_flavor_id).toBe(99);
    });
  });

  describe("filtering", () => {
    it("filters out items with no text or content", () => {
      const result = normalizeGeneratedCaptions({
        data: [{ id: "1" }, { id: "2", text: "Valid" }],
      });
      expect(result).toHaveLength(1);
      expect(result[0].text).toBe("Valid");
    });

    it("filters out null items", () => {
      const result = normalizeGeneratedCaptions({ data: [null, { id: "1", text: "OK" }] });
      expect(result).toHaveLength(1);
    });

    it("returns empty array for non-array candidates", () => {
      expect(normalizeGeneratedCaptions({ data: "not-an-array" })).toEqual([]);
      expect(normalizeGeneratedCaptions({})).toEqual([]);
      expect(normalizeGeneratedCaptions(null)).toEqual([]);
      expect(normalizeGeneratedCaptions("string")).toEqual([]);
    });

    it("returns empty array when payload is undefined", () => {
      expect(normalizeGeneratedCaptions(undefined)).toEqual([]);
    });
  });
});
