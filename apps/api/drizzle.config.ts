import { createEnv } from "@t3-oss/env-core";
import { defineConfig } from "drizzle-kit";
import { z } from "zod";

const env = createEnv({
	server: {
		DATABASE_URL: z.url(),
	},
	runtimeEnv: {
		DATABASE_URL: process.env.DATABASE_URL,
	},
	emptyStringAsUndefined: true,
});

export default defineConfig({
	out: "./drizzle",
	schema: "./src/modules/database/schema.ts",
	dialect: "postgresql",
	dbCredentials: {
		url: env.DATABASE_URL,
	},
});
