"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  createBoardSchema,
  renameBoardSchema,
  deleteBoardSchema,
} from "@/lib/schemas/board";

export type ActionState = {
  success: boolean;
  error?: string;
};

export async function createBoard(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = createBoardSchema.safeParse({
    name: formData.get("name"),
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const board = await prisma.board.create({
    data: { name: parsed.data.name },
  });

  revalidatePath("/boards");
  redirect(`/board/${board.id}`);
}

export async function renameBoard(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = renameBoardSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  await prisma.board.update({
    where: { id: parsed.data.id },
    data: { name: parsed.data.name },
  });

  revalidatePath("/boards");
  return { success: true };
}

export async function deleteBoard(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = deleteBoardSchema.safeParse({
    id: formData.get("id"),
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  await prisma.board.delete({
    where: { id: parsed.data.id },
  });

  revalidatePath("/boards");
  return { success: true };
}
