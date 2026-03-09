"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

/**
 * Update the sort order of projects on the home page.
 * Accepts an array of { id, sortOrder } pairs.
 */
export async function reorderProjects(
  projectOrders: { id: string; sortOrder: number }[],
) {
  await prisma.$transaction(
    projectOrders.map(({ id, sortOrder }) =>
      prisma.project.update({ where: { id }, data: { sortOrder } }),
    ),
  );

  revalidatePath("/boards");
}
