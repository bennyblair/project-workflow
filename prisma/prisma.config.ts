import path from "node:path";
import { defineConfig } from "prisma/config";

const url = process.env.DATABASE_URL!;

export default defineConfig({
  schema: path.join(import.meta.dirname, "schema.prisma"),
  datasource: {
    url,
  },
  migrations: {
    seed: "npx tsx prisma/seed.ts",
  },
});
