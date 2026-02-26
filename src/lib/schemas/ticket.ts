import { z } from "zod";

export const createTicketSchema = z.object({
  boardId: z.string().cuid(),
  title: z.string().min(1, "Title is required").max(200),
  typeId: z.string().cuid(),
  assigneeId: z.string().cuid().optional(),
  teamId: z.string().cuid().optional(),
  description: z.string().max(5000).optional(),
});

export const updateTicketFieldsSchema = z.object({
  id: z.string().cuid(),
  title: z.string().min(1, "Title is required").max(200).optional(),
  description: z.string().max(5000).nullable().optional(),
  typeId: z.string().cuid().optional(),
  assigneeId: z.string().cuid().nullable().optional(),
  teamId: z.string().cuid().nullable().optional(),
});

export type CreateTicketInput = z.infer<typeof createTicketSchema>;
export type UpdateTicketFieldsInput = z.infer<typeof updateTicketFieldsSchema>;
