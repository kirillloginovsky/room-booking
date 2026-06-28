import "dotenv/config";
import { defineConfig, env } from "prisma/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

export default defineConfig({
  datasource: {
    url: env("DATABASE_URL"),
    adapter: () => {
      const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
      });
      return new PrismaPg(pool);
    },
  },
  migrations: {
    seed: "node ./prisma/seed.cjs",
  },
});
