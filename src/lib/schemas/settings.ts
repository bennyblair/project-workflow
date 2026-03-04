import { z } from "zod";

// ── Board Settings ──────────────────────────────────────────────────────────
export const updateBoardSettingsSchema = z.object({
  id: z.string().cuid(),
  name: z.string().min(1, "Name is required").max(100).optional(),
  maxSteps: z.coerce.number().int().min(1).max(100).optional(),
  refreshIntervalSeconds: z.coerce.number().int().min(1).max(3600).optional(),
});

// ── Ticket Types ────────────────────────────────────────────────────────────
export const createTicketTypeSchema = z.object({
  projectId: z.string().cuid(),
  name: z.string().min(1, "Name is required").max(100),
  key: z
    .string()
    .min(1, "Key is required")
    .max(10)
    .transform((v) => v.toUpperCase()),
  defaultColorHex: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Must be a hex color")
    .default("#6366f1"),
  stepIntervalHours: z.coerce.number().int().min(1, "Minimum step interval is 1 hour").max(24).default(1),
});

export const updateTicketTypeSchema = z.object({
  id: z.string().cuid(),
  name: z.string().min(1).max(100).optional(),
  key: z
    .string()
    .min(1)
    .max(10)
    .transform((v) => v.toUpperCase())
    .optional(),
  defaultColorHex: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional(),
  stepIntervalHours: z.coerce.number().int().min(1, "Minimum step interval is 1 hour").max(24).optional(),
});

export const deleteTicketTypeSchema = z.object({
  id: z.string().cuid(),
});

// ── Swimlanes ───────────────────────────────────────────────────────────────
export const createSwimlaneSchema = z.object({
  boardId: z.string().cuid(),
  name: z.string().min(1, "Name is required").max(100),
  order: z.coerce.number().int().min(0),
  isCatchAll: z.coerce.boolean().default(false),
  filterExprJson: z.any().default({}),
  onDropPatchJson: z.any().default({}),
});

export const updateSwimlaneSchema = z.object({
  id: z.string().cuid(),
  name: z.string().min(1).max(100).optional(),
  order: z.coerce.number().int().min(0).optional(),
  isCatchAll: z.coerce.boolean().optional(),
  filterExprJson: z.any().optional(),
  onDropPatchJson: z.any().optional(),
});

export const deleteSwimlaneSchema = z.object({
  id: z.string().cuid(),
});

// ── Color Rules ─────────────────────────────────────────────────────────────
export const createColorRuleSchema = z.object({
  boardId: z.string().cuid(),
  order: z.coerce.number().int().min(0),
  whenExprJson: z.any().default({}),
  colorHex: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Must be a hex color"),
});

export const updateColorRuleSchema = z.object({
  id: z.string().cuid(),
  order: z.coerce.number().int().min(0).optional(),
  whenExprJson: z.any().optional(),
  colorHex: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional(),
});

export const deleteColorRuleSchema = z.object({
  id: z.string().cuid(),
});

// ── People ──────────────────────────────────────────────────────────────────
export const createPersonSchema = z.object({
  boardId: z.string().cuid(),
  name: z.string().min(1, "Name is required").max(100),
});

export const updatePersonSchema = z.object({
  id: z.string().cuid(),
  name: z.string().min(1).max(100).optional(),
});

export const deletePersonSchema = z.object({
  id: z.string().cuid(),
});

// ── Teams ───────────────────────────────────────────────────────────────────
export const createTeamSchema = z.object({
  boardId: z.string().cuid(),
  name: z.string().min(1, "Name is required").max(100),
});

export const updateTeamSchema = z.object({
  id: z.string().cuid(),
  name: z.string().min(1).max(100).optional(),
});

export const deleteTeamSchema = z.object({
  id: z.string().cuid(),
});
