"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  updateBoardSettingsSchema,
  createTicketTypeSchema,
  updateTicketTypeSchema,
  deleteTicketTypeSchema,
  createSwimlaneSchema,
  updateSwimlaneSchema,
  deleteSwimlaneSchema,
  createColorRuleSchema,
  updateColorRuleSchema,
  deleteColorRuleSchema,
  createPersonSchema,
  updatePersonSchema,
  deletePersonSchema,
  createTeamSchema,
  updateTeamSchema,
  deleteTeamSchema,
} from "@/lib/schemas/settings";

export type ActionState = {
  success: boolean;
  error?: string;
};

// ── Board Settings ──────────────────────────────────────────────────────────

export async function updateBoardSettings(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const raw: Record<string, unknown> = { id: formData.get("id") };
  const name = formData.get("name");
  if (name !== null && name !== "") raw.name = name;
  const maxSteps = formData.get("maxSteps");
  if (maxSteps !== null && maxSteps !== "") raw.maxSteps = maxSteps;
  const refreshIntervalSeconds = formData.get("refreshIntervalSeconds");
  if (refreshIntervalSeconds !== null && refreshIntervalSeconds !== "")
    raw.refreshIntervalSeconds = refreshIntervalSeconds;

  const parsed = updateBoardSettingsSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const { id, ...fields } = parsed.data;
  if (Object.keys(fields).length === 0) {
    return { success: true };
  }

  await prisma.board.update({ where: { id }, data: fields });
  revalidatePath(`/settings/${id}`);
  revalidatePath(`/board/${id}`);
  return { success: true };
}

// ── Ticket Types ────────────────────────────────────────────────────────────

export async function createTicketType(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = createTicketTypeSchema.safeParse({
    projectId: formData.get("projectId"),
    name: formData.get("name"),
    key: formData.get("key"),
    defaultColorHex: formData.get("defaultColorHex") || "#6366f1",
    stepIntervalSeconds: formData.get("stepIntervalSeconds") || "3600",
  });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  try {
    await prisma.ticketType.create({ data: parsed.data });
  } catch (e: unknown) {
    if (e instanceof Error && e.message.includes("Unique constraint")) {
      return { success: false, error: `Key "${parsed.data.key}" already exists in this project` };
    }
    throw e;
  }

  revalidatePath(`/project/${parsed.data.projectId}/settings`);
  revalidatePath("/boards");
  return { success: true };
}

export async function updateTicketType(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const raw: Record<string, unknown> = { id: formData.get("id") };
  const name = formData.get("name");
  if (name !== null && name !== "") raw.name = name;
  const key = formData.get("key");
  if (key !== null && key !== "") raw.key = key;
  const defaultColorHex = formData.get("defaultColorHex");
  if (defaultColorHex !== null && defaultColorHex !== "")
    raw.defaultColorHex = defaultColorHex;
  const stepIntervalSeconds = formData.get("stepIntervalSeconds");
  if (stepIntervalSeconds !== null && stepIntervalSeconds !== "")
    raw.stepIntervalSeconds = stepIntervalSeconds;

  const parsed = updateTicketTypeSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const { id, ...fields } = parsed.data;
  if (Object.keys(fields).length === 0) return { success: true };

  const tt = await prisma.ticketType.findUnique({
    where: { id },
    select: { projectId: true },
  });
  if (!tt) return { success: false, error: "Ticket type not found" };

  await prisma.ticketType.update({ where: { id }, data: fields });
  revalidatePath(`/project/${tt.projectId}/settings`);
  return { success: true };
}

export async function deleteTicketType(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = deleteTicketTypeSchema.safeParse({
    id: formData.get("id"),
  });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const tt = await prisma.ticketType.findUnique({
    where: { id: parsed.data.id },
    select: { projectId: true, _count: { select: { tickets: true } } },
  });
  if (!tt) return { success: false, error: "Ticket type not found" };
  if (tt._count.tickets > 0) {
    return {
      success: false,
      error: "Cannot delete a ticket type that has tickets. Reassign them first.",
    };
  }

  await prisma.ticketType.delete({ where: { id: parsed.data.id } });
  revalidatePath(`/project/${tt.projectId}/settings`);
  return { success: true };
}

// ── Swimlanes ───────────────────────────────────────────────────────────────

export async function createSwimlane(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const boardId = formData.get("boardId") as string;

  // Auto-assign order: next available
  const lastLane = await prisma.swimlane.findFirst({
    where: { boardId },
    orderBy: { order: "desc" },
    select: { order: true },
  });
  const order = (lastLane?.order ?? -1) + 1;

  let filterExprJson: unknown = {};
  const filterJson = formData.get("filterExprJson");
  if (filterJson && typeof filterJson === "string" && filterJson.trim()) {
    try {
      filterExprJson = JSON.parse(filterJson);
    } catch {
      return { success: false, error: "Invalid filter JSON" };
    }
  }

  let onDropPatchJson: unknown = {};
  const patchJson = formData.get("onDropPatchJson");
  if (patchJson && typeof patchJson === "string" && patchJson.trim()) {
    try {
      onDropPatchJson = JSON.parse(patchJson);
    } catch {
      return { success: false, error: "Invalid onDropPatch JSON" };
    }
  }

  const parsed = createSwimlaneSchema.safeParse({
    boardId,
    name: formData.get("name"),
    order,
    isCatchAll: formData.get("isCatchAll") === "true",
    filterExprJson,
    onDropPatchJson,
  });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  await prisma.swimlane.create({ data: parsed.data });
  revalidatePath(`/settings/${boardId}`);
  revalidatePath(`/board/${boardId}`);
  return { success: true };
}

export async function updateSwimlane(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const raw: Record<string, unknown> = { id: formData.get("id") };
  const name = formData.get("name");
  if (name !== null && name !== "") raw.name = name;
  const order = formData.get("order");
  if (order !== null && order !== "") raw.order = order;
  const isCatchAll = formData.get("isCatchAll");
  if (isCatchAll !== null) raw.isCatchAll = isCatchAll === "true";

  const filterJson = formData.get("filterExprJson");
  if (filterJson !== null && typeof filterJson === "string") {
    try {
      raw.filterExprJson = filterJson.trim() ? JSON.parse(filterJson) : {};
    } catch {
      return { success: false, error: "Invalid filter JSON" };
    }
  }

  const patchJson = formData.get("onDropPatchJson");
  if (patchJson !== null && typeof patchJson === "string") {
    try {
      raw.onDropPatchJson = patchJson.trim() ? JSON.parse(patchJson) : {};
    } catch {
      return { success: false, error: "Invalid onDropPatch JSON" };
    }
  }

  const parsed = updateSwimlaneSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const { id, ...fields } = parsed.data;
  if (Object.keys(fields).length === 0) return { success: true };

  const lane = await prisma.swimlane.findUnique({
    where: { id },
    select: { boardId: true },
  });
  if (!lane) return { success: false, error: "Swimlane not found" };

  await prisma.swimlane.update({ where: { id }, data: fields });
  revalidatePath(`/settings/${lane.boardId}`);
  revalidatePath(`/board/${lane.boardId}`);
  return { success: true };
}

export async function deleteSwimlane(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = deleteSwimlaneSchema.safeParse({
    id: formData.get("id"),
  });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const lane = await prisma.swimlane.findUnique({
    where: { id: parsed.data.id },
    select: { boardId: true },
  });
  if (!lane) return { success: false, error: "Swimlane not found" };

  await prisma.swimlane.delete({ where: { id: parsed.data.id } });
  revalidatePath(`/settings/${lane.boardId}`);
  revalidatePath(`/board/${lane.boardId}`);
  return { success: true };
}

/**
 * Reorder swimlanes by updating each swimlane's `order` field.
 * Accepts an ordered array of swimlane IDs.
 */
export async function reorderSwimlanes(
  boardId: string,
  orderedIds: string[],
): Promise<ActionState> {
  if (orderedIds.length === 0) return { success: true };

  await prisma.$transaction(
    orderedIds.map((id, index) =>
      prisma.swimlane.update({
        where: { id },
        data: { order: index },
      }),
    ),
  );

  revalidatePath(`/settings/${boardId}`);
  revalidatePath(`/board/${boardId}`);
  return { success: true };
}

// ── Color Rules ─────────────────────────────────────────────────────────────

export async function createColorRule(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const boardId = formData.get("boardId") as string;

  const lastRule = await prisma.colorRule.findFirst({
    where: { boardId },
    orderBy: { order: "desc" },
    select: { order: true },
  });
  const order = (lastRule?.order ?? -1) + 1;

  let whenExprJson: unknown = {};
  const whenJson = formData.get("whenExprJson");
  if (whenJson && typeof whenJson === "string" && whenJson.trim()) {
    try {
      whenExprJson = JSON.parse(whenJson);
    } catch {
      return { success: false, error: "Invalid expression JSON" };
    }
  }

  const parsed = createColorRuleSchema.safeParse({
    boardId,
    order,
    whenExprJson,
    colorHex: formData.get("colorHex"),
  });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  await prisma.colorRule.create({ data: parsed.data });
  revalidatePath(`/settings/${boardId}`);
  revalidatePath(`/board/${boardId}`);
  return { success: true };
}

export async function updateColorRule(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const raw: Record<string, unknown> = { id: formData.get("id") };
  const order = formData.get("order");
  if (order !== null && order !== "") raw.order = order;
  const colorHex = formData.get("colorHex");
  if (colorHex !== null && colorHex !== "") raw.colorHex = colorHex;

  const whenJson = formData.get("whenExprJson");
  if (whenJson !== null && typeof whenJson === "string") {
    try {
      raw.whenExprJson = whenJson.trim() ? JSON.parse(whenJson) : {};
    } catch {
      return { success: false, error: "Invalid expression JSON" };
    }
  }

  const parsed = updateColorRuleSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const { id, ...fields } = parsed.data;
  if (Object.keys(fields).length === 0) return { success: true };

  const rule = await prisma.colorRule.findUnique({
    where: { id },
    select: { boardId: true },
  });
  if (!rule) return { success: false, error: "Color rule not found" };

  await prisma.colorRule.update({ where: { id }, data: fields });
  revalidatePath(`/settings/${rule.boardId}`);
  revalidatePath(`/board/${rule.boardId}`);
  return { success: true };
}

export async function deleteColorRule(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = deleteColorRuleSchema.safeParse({
    id: formData.get("id"),
  });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const rule = await prisma.colorRule.findUnique({
    where: { id: parsed.data.id },
    select: { boardId: true },
  });
  if (!rule) return { success: false, error: "Color rule not found" };

  await prisma.colorRule.delete({ where: { id: parsed.data.id } });
  revalidatePath(`/settings/${rule.boardId}`);
  revalidatePath(`/board/${rule.boardId}`);
  return { success: true };
}

// ── People ──────────────────────────────────────────────────────────────────

export async function createPerson(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = createPersonSchema.safeParse({
    boardId: formData.get("boardId"),
    name: formData.get("name"),
  });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  await prisma.person.create({ data: parsed.data });
  revalidatePath(`/settings/${parsed.data.boardId}`);
  return { success: true };
}

export async function updatePerson(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const raw: Record<string, unknown> = { id: formData.get("id") };
  const name = formData.get("name");
  if (name !== null && name !== "") raw.name = name;

  const parsed = updatePersonSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const { id, ...fields } = parsed.data;
  if (Object.keys(fields).length === 0) return { success: true };

  const person = await prisma.person.findUnique({
    where: { id },
    select: { boardId: true },
  });
  if (!person) return { success: false, error: "Person not found" };

  await prisma.person.update({ where: { id }, data: fields });
  revalidatePath(`/settings/${person.boardId}`);
  return { success: true };
}

export async function deletePerson(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = deletePersonSchema.safeParse({
    id: formData.get("id"),
  });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const person = await prisma.person.findUnique({
    where: { id: parsed.data.id },
    select: { boardId: true },
  });
  if (!person) return { success: false, error: "Person not found" };

  await prisma.person.delete({ where: { id: parsed.data.id } });
  revalidatePath(`/settings/${person.boardId}`);
  return { success: true };
}

// ── Teams ───────────────────────────────────────────────────────────────────

export async function createTeam(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = createTeamSchema.safeParse({
    boardId: formData.get("boardId"),
    name: formData.get("name"),
  });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  await prisma.team.create({ data: parsed.data });
  revalidatePath(`/settings/${parsed.data.boardId}`);
  return { success: true };
}

export async function updateTeam(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const raw: Record<string, unknown> = { id: formData.get("id") };
  const name = formData.get("name");
  if (name !== null && name !== "") raw.name = name;

  const parsed = updateTeamSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const { id, ...fields } = parsed.data;
  if (Object.keys(fields).length === 0) return { success: true };

  const team = await prisma.team.findUnique({
    where: { id },
    select: { boardId: true },
  });
  if (!team) return { success: false, error: "Team not found" };

  await prisma.team.update({ where: { id }, data: fields });
  revalidatePath(`/settings/${team.boardId}`);
  return { success: true };
}

export async function deleteTeam(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = deleteTeamSchema.safeParse({
    id: formData.get("id"),
  });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const team = await prisma.team.findUnique({
    where: { id: parsed.data.id },
    select: { boardId: true },
  });
  if (!team) return { success: false, error: "Team not found" };

  await prisma.team.delete({ where: { id: parsed.data.id } });
  revalidatePath(`/settings/${team.boardId}`);
  return { success: true };
}
