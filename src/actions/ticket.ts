"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  createTicketSchema,
  updateTicketFieldsSchema,
} from "@/lib/schemas/ticket";

export type ActionState = {
  success: boolean;
  error?: string;
};

export async function createTicket(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const raw: Record<string, unknown> = {
    boardId: formData.get("boardId"),
    title: formData.get("title"),
    typeId: formData.get("typeId"),
  };
  const assigneeId = formData.get("assigneeId");
  if (assigneeId && assigneeId !== "") raw.assigneeId = assigneeId;
  const teamId = formData.get("teamId");
  if (teamId && teamId !== "") raw.teamId = teamId;
  const description = formData.get("description");
  if (description && description !== "") raw.description = description;

  const parsed = createTicketSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  // Compute orderKey: place at the end of the TODO list
  const lastTodo = await prisma.ticket.findFirst({
    where: { boardId: parsed.data.boardId, status: "TODO" },
    orderBy: { orderKey: "desc" },
    select: { orderKey: true },
  });
  const orderKey = (lastTodo?.orderKey ?? 0) + 1000;

  const ticket = await prisma.ticket.create({
    data: {
      boardId: parsed.data.boardId,
      title: parsed.data.title,
      typeId: parsed.data.typeId,
      assigneeId: parsed.data.assigneeId ?? null,
      teamId: parsed.data.teamId ?? null,
      description: parsed.data.description ?? null,
      status: "TODO",
      orderKey,
    },
  });

  // Audit: TICKET_CREATED
  await prisma.auditEvent.create({
    data: {
      ticketId: ticket.id,
      type: "TICKET_CREATED",
      dataJson: { title: ticket.title },
    },
  });

  revalidatePath(`/board/${parsed.data.boardId}`);
  return { success: true };
}

export async function updateTicketFields(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const raw: Record<string, unknown> = {
    id: formData.get("id"),
  };
  // Only include fields that are present in the form
  const title = formData.get("title");
  if (title !== null) raw.title = title;
  const description = formData.get("description");
  if (description !== null) raw.description = description === "" ? null : description;
  const typeId = formData.get("typeId");
  if (typeId !== null && typeId !== "") raw.typeId = typeId;
  const assigneeId = formData.get("assigneeId");
  if (assigneeId !== null) raw.assigneeId = assigneeId === "" ? null : assigneeId;
  const teamId = formData.get("teamId");
  if (teamId !== null) raw.teamId = teamId === "" ? null : teamId;
  const parentId = formData.get("parentId");
  if (parentId !== null) raw.parentId = parentId === "" ? null : parentId;

  const parsed = updateTicketFieldsSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const { id, ...fields } = parsed.data;

  // Fetch current ticket for audit comparison
  const current = await prisma.ticket.findUnique({
    where: { id },
    select: {
      boardId: true,
      title: true,
      description: true,
      typeId: true,
      assigneeId: true,
      teamId: true,
      parentId: true,
    },
  });
  if (!current) {
    return { success: false, error: "Ticket not found" };
  }

  // Build audit events for changed fields
  const auditEvents: { type: "TITLE_UPDATED" | "DESCRIPTION_UPDATED" | "TYPE_CHANGED" | "ASSIGNEE_CHANGED" | "TEAM_CHANGED" | "PARENT_CHANGED"; dataJson: { from: string | null; to: string | null } }[] = [];

  if (fields.title !== undefined && fields.title !== current.title) {
    auditEvents.push({
      type: "TITLE_UPDATED",
      dataJson: { from: current.title, to: fields.title },
    });
  }
  if (fields.description !== undefined && fields.description !== current.description) {
    auditEvents.push({
      type: "DESCRIPTION_UPDATED",
      dataJson: { from: current.description, to: fields.description },
    });
  }
  if (fields.typeId !== undefined && fields.typeId !== current.typeId) {
    auditEvents.push({
      type: "TYPE_CHANGED",
      dataJson: { from: current.typeId, to: fields.typeId },
    });
  }
  if (fields.assigneeId !== undefined && fields.assigneeId !== current.assigneeId) {
    auditEvents.push({
      type: "ASSIGNEE_CHANGED",
      dataJson: { from: current.assigneeId, to: fields.assigneeId },
    });
  }
  if (fields.teamId !== undefined && fields.teamId !== current.teamId) {
    auditEvents.push({
      type: "TEAM_CHANGED",
      dataJson: { from: current.teamId, to: fields.teamId },
    });
  }
  if (fields.parentId !== undefined && fields.parentId !== current.parentId) {
    auditEvents.push({
      type: "PARENT_CHANGED",
      dataJson: { from: current.parentId, to: fields.parentId },
    });
  }

  // Only update if there are actual changes
  const updateData: Record<string, unknown> = {};
  if (fields.title !== undefined) updateData.title = fields.title;
  if (fields.description !== undefined) updateData.description = fields.description;
  if (fields.typeId !== undefined) updateData.typeId = fields.typeId;
  if (fields.assigneeId !== undefined) updateData.assigneeId = fields.assigneeId;
  if (fields.teamId !== undefined) updateData.teamId = fields.teamId;
  if (fields.parentId !== undefined) updateData.parentId = fields.parentId;

  if (Object.keys(updateData).length > 0) {
    await prisma.$transaction([
      prisma.ticket.update({ where: { id }, data: updateData }),
      ...auditEvents.map((evt) =>
        prisma.auditEvent.create({
          data: { ticketId: id, type: evt.type, dataJson: evt.dataJson },
        }),
      ),
    ]);
  }

  revalidatePath(`/board/${current.boardId}`);
  return { success: true };
}
