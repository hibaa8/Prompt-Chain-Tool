/**
 * Reads the body of an upstream caption API response.
 * Handles plain-text 2xx responses gracefully (treats them as a single-item array).
 * Non-JSON error bodies are wrapped with a preview field.
 */
export async function readCaptionApiBody(response: Response): Promise<unknown> {
  const raw = await response.text();
  if (!raw.trim()) return {};
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    if (response.ok) {
      return { data: [raw.trim()] };
    }
    return {
      error: "Caption API returned a non-JSON body.",
      rawBodyPreview: raw.slice(0, 240),
    };
  }
}

/** Extracts the `message` string from an upstream API payload, or returns "". */
export function upstreamMessage(payload: unknown): string {
  if (
    payload &&
    typeof payload === "object" &&
    typeof (payload as { message?: unknown }).message === "string"
  ) {
    return (payload as { message: string }).message;
  }
  return "";
}

/**
 * Returns true when the upstream error is the known "captionsAsArray.map" bug —
 * meaning Almost Crackd expected a caption list but got something else.
 */
export function isCaptionsArrayMapUpstreamBug(message: string): boolean {
  return message.includes("captionsAsArray.map");
}

/**
 * Attaches a human-readable `hint` to known upstream error payloads so the UI
 * can surface actionable guidance without exposing raw stack traces.
 */
export function withCaptionErrorHint(payload: unknown, status: number): unknown {
  if (status < 400) return payload;
  const msg = upstreamMessage(payload);
  const base =
    payload && typeof payload === "object" && payload !== null
      ? (payload as Record<string, unknown>)
      : { error: true, message: msg };

  if (msg.includes("is not valid JSON") || msg.includes("Unexpected token")) {
    return {
      ...base,
      hint:
        "Almost Crackd\u2019s pipeline parsed model output as JSON but received plain text (often a sentence starting with \u201cI\u2026\u201d from the model). Check this flavor\u2019s steps: use a non-JSON output type where appropriate, or constrain the prompt so the model returns only JSON. If steps look correct, report the failure to Almost Crackd with this error message.",
    };
  }

  if (isCaptionsArrayMapUpstreamBug(msg)) {
    return {
      ...base,
      hint:
        "Almost Crackd\u2019s server expected an array of captions but received a different shape (captionsAsArray.map). That is a bug or contract mismatch on their pipeline\u2014often after an LLM step returns an object or string instead of a caption list. Report it to Almost Crackd with this message. This app may retry with alternate request fields when a humor flavor id is sent.",
    };
  }

  return payload;
}
