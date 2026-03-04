"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  createProjectSchema,
  updateProjectSchema,
  deleteProjectSchema,
} from "@/lib/schemas/project";

export type ActionState = {
  success: boolean;
  error?: string;
};

export async function createProject(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = createProjectSchema.safeParse({
    name: formData.get("name"),
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  await prisma.project.create({
    data: { name: parsed.data.name },
  });

  revalidatePath("/boards");
  return { success: true };
}

export async function updateProject(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const raw: Record<string, unknown> = { id: formData.get("id") };
  const name = formData.get("name");
  if (name !== null && name !== "") raw.name = name;

  const parsed = updateProjectSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const { id, ...fields } = parsed.data;
  if (Object.keys(fields).length === 0) return { success: true };

  await prisma.project.update({ where: { id }, data: fields });
  revalidatePath("/boards");
  revalidatePath(`/project/${id}/settings`);
  return { success: true };
}

export async function deleteProject(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = deleteProjectSchema.safeParse({
    id: formData.get("id"),
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  await prisma.project.delete({
    where: { id: parsed.data.id },
  });

  revalidatePath("/boards");
  return { success: true };
}
