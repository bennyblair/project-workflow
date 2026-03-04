import { z } from "zod";

export const createProjectSchema = z.object({
  name: z.string().min(1, "Project name is required").max(100),
});

export const updateProjectSchema = z.object({
  id: z.string().cuid(),
  name: z.string().min(1, "Project name is required").max(100).optional(),
});

export const deleteProjectSchema = z.object({
  id: z.string().cuid(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type DeleteProjectInput = z.infer<typeof deleteProjectSchema>;
