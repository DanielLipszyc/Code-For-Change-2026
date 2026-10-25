import "server-only";
import { NextResponse } from "next/server";
import type { z } from "zod";

/** Largest request body each kind of endpoint accepts, in bytes */
export const MAX_BODY_BYTES = {
  /** Includes an inline photo (lib/limits.ts MAX_IMAGE_DATA_LENGTH) plus the other fields */
  withPhoto: 2_200_000,
  small: 16_384,
};

/** Every API error uses this shape: { error: "message" } */
export function jsonError(status: number, message: string, headers?: HeadersInit) {
  return NextResponse.json({ error: message }, { status, headers });
}

type ParseResult<T> = { ok: true; data: T } | { ok: false; response: NextResponse };

/**
 * Read a JSON request body and validate it against a schema. Bodies larger
 * than maxBytes are refused without being read in full. On failure, `response`
 * is the error to return: 413 for too large, 400 for invalid JSON or input
 * (with the first validation message).
 */
export async function parseJsonBody<S extends z.ZodType>(
  request: Request,
  schema: S,
  maxBytes: number,
): Promise<ParseResult<z.output<S>>> {
  const tooLarge = { ok: false as const, response: jsonError(413, "Request is too large") };

  const declaredLength = Number(request.headers.get("content-length"));
  if (declaredLength > maxBytes) return tooLarge;

  // The header can be missing or wrong, so count the bytes as they arrive too
  const chunks: Uint8Array[] = [];
  let received = 0;
  if (request.body) {
    const reader = request.body.getReader();
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      received += value.byteLength;
      if (received > maxBytes) {
        await reader.cancel();
        return tooLarge;
      }
      chunks.push(value);
    }
  }

  let json: unknown;
  try {
    json = JSON.parse(new TextDecoder().decode(Buffer.concat(chunks)));
  } catch {
    return { ok: false, response: jsonError(400, "Request body must be valid JSON") };
  }

  const result = schema.safeParse(json);
  if (!result.success) {
    return { ok: false, response: jsonError(400, result.error.issues[0].message) };
  }
  return { ok: true, data: result.data };
}
