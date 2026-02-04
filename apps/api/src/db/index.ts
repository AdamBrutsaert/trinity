import { env } from "@/env";
import { drizzle } from "drizzle-orm/bun-sql";
import * as schema from "./schema";

export const db = drizzle(env.DATABASE_URL, { schema });

export type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

export type Database = Transaction | typeof db;
