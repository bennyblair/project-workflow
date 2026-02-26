import { z } from "zod";

export const createBoardSchema = z.object({
  name: z.string().min(1, "Board name is required").max(100),
});

export const renameBoardSchema = z.object({
  id: z.string().cuid(),
  name: z.string().min(1, "Board name is required").max(100),
});

export const deleteBoardSchema = z.object({
  id: z.string().cuid(),
});

export type CreateBoardInput = z.infer<typeof createBoardSchema>;
export type RenameBoardInput = z.infer<typeof renameBoardSchema>;
export type DeleteBoardInput = z.infer<typeof deleteBoardSchema>;
