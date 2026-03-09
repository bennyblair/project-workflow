"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export type DescriptionTemplateItem = {
  id: string;
  name: string;
  body: string;
  sortOrder: number;
};

/** Fetch all description templates for a project */
export async function getDescriptionTemplates(
  projectId: string,
): Promise<DescriptionTemplateItem[]> {
  const templates = await prisma.descriptionTemplate.findMany({
    where: { projectId },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
  return templates.map((t) => ({
    id: t.id,
    name: t.name,
    body: t.body,
    sortOrder: t.sortOrder,
  }));
}

/** Create a new description template */
export async function createDescriptionTemplate(
  projectId: string,
  name: string,
  body: string,
) {
  if (!name.trim()) throw new Error("Template name is required");
  if (!body.trim()) throw new Error("Template body is required");

  const maxOrder = await prisma.descriptionTemplate.aggregate({
    where: { projectId },
    _max: { sortOrder: true },
  });

  await prisma.descriptionTemplate.create({
    data: {
      projectId,
      name: name.trim(),
      body: body.trim(),
      sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
    },
  });

  revalidatePath(`/project/${projectId}/settings`);
}

/** Update a description template */
export async function updateDescriptionTemplate(
  id: string,
  name: string,
  body: string,
) {
  if (!name.trim()) throw new Error("Template name is required");
  if (!body.trim()) throw new Error("Template body is required");

  const template = await prisma.descriptionTemplate.update({
    where: { id },
    data: { name: name.trim(), body: body.trim() },
  });

  revalidatePath(`/project/${template.projectId}/settings`);
}

/** Delete a description template */
export async function deleteDescriptionTemplate(id: string) {
  const template = await prisma.descriptionTemplate.delete({
    where: { id },
  });

  revalidatePath(`/project/${template.projectId}/settings`);
}
