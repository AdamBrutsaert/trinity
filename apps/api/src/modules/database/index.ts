import { drizzle } from "drizzle-orm/bun-sql";
import { Elysia } from "elysia";

import * as schema from "./schema";

export function createDatabaseConnection(url: string) {
	return drizzle(url, { schema });
}

export type Transaction = Parameters<
	Parameters<ReturnType<typeof createDatabaseConnection>["transaction"]>[0]
>[0];

export type Database =
	| Transaction
	| ReturnType<typeof createDatabaseConnection>;

export function createDatabasePlugin(database: Database) {
	return new Elysia({ name: "database" }).decorate("database", database);
}

export type DatabasePlugin = ReturnType<typeof createDatabasePlugin>;
