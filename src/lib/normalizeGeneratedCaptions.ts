export interface GeneratedCaption {
  id: string;
  text?: string;
  content?: string;
  humor_flavor_id: number;
}

/**
 * Normalises the varying response shapes returned by the Almost Crackd caption
 * generation API into a consistent array of `GeneratedCaption` objects.
 */
export function normalizeGeneratedCaptions(payload: unknown): GeneratedCaption[] {
  const p = payload as Record<string, unknown> | null | undefined;

  const candidates =
    p?.data ??
    p?.captions ??
    p?.generatedCaptions ??
    (p?.result as Record<string, unknown> | undefined)?.captions ??
    p?.result ??
    payload;

  if (!Array.isArray(candidates)) {
    return [];
  }

  const mapped: (GeneratedCaption | null)[] = (candidates as unknown[]).map(
    (item: unknown, idx: number) => {
      if (typeof item === "string") {
        return {
          id: `generated-${idx}`,
          text: item,
          humor_flavor_id: Number(p?.humorFlavorId ?? 0),
        };
      }

      if (item && typeof item === "object") {
        const obj = item as Record<string, unknown>;
        return {
          id: String(obj.id ?? `generated-${idx}`),
          text: (obj.text ?? obj.content ?? obj.caption ?? obj.generated_caption) as
            | string
            | undefined,
          content: (obj.content ?? obj.text ?? obj.caption ?? obj.generated_caption) as
            | string
            | undefined,
          humor_flavor_id: Number(obj.humor_flavor_id ?? p?.humorFlavorId ?? 0),
        };
      }

      return null;
    }
  );

  return mapped.filter(
    (item): item is GeneratedCaption => item !== null && !!(item.text || item.content)
  );
}
