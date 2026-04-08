import { z } from "zod";

export const StartPictureRevealSessionSchema = z.object({});

export type StartPictureRevealSessionInput = z.infer<
  typeof StartPictureRevealSessionSchema
>;

export const OpenPictureRevealTileSchema = z.object({
  tileNumber: z.coerce.number().int().min(1),
});

export type OpenPictureRevealTileInput = z.infer<
  typeof OpenPictureRevealTileSchema
>;

export const GuessPictureRevealChoiceSchema = z.object({
  choiceId: z.string().min(1, "choiceId is required"),
});

export type GuessPictureRevealChoiceInput = z.infer<
  typeof GuessPictureRevealChoiceSchema
>;

export const PictureRevealSessionRouteParamsSchema = z.object({
  id: z.string().min(1, "Picture reveal game id is required"),
  sessionId: z.string().min(1, "Session id is required"),
});

export type PictureRevealSessionRouteParamsInput = z.infer<
  typeof PictureRevealSessionRouteParamsSchema
>;

export const PictureRevealSessionListQuerySchema = z.object({
  limit: z.preprocess(
    (value) => (value === null ? undefined : value),
    z.coerce.number().int().min(1).max(100).default(20),
  ),
  status: z.preprocess(
    (value) => (value === null ? undefined : value),
    z.enum(["active", "completed"]).optional(),
  ),
});

export type PictureRevealSessionListQueryInput = z.infer<
  typeof PictureRevealSessionListQuerySchema
>;
