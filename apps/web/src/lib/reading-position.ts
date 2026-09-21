import { type ReadingPosition, ReadingPositionSchema } from "@quran-feham/contracts";
import { z } from "zod";

export const ReadingPositionResponseSchema = z.object({
  position: ReadingPositionSchema.nullable(),
});

export function parseReadingPositionResponse(value: unknown): ReadingPosition | null {
  const parsed = ReadingPositionResponseSchema.safeParse(value);
  return parsed.success ? parsed.data.position : null;
}
