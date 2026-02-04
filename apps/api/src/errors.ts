import { SQL } from "bun";
import { DrizzleQueryError } from "drizzle-orm";
import { status } from "elysia";

export interface ErrorMapper {
	onConflict?: () => unknown;
}

export function errorMapper(err: unknown, errorMapper?: ErrorMapper): never {
	if (err instanceof DrizzleQueryError) {
		if (err.cause instanceof SQL.PostgresError) {
			if (err.cause.code === "23505") {
				throw errorMapper?.onConflict?.() ?? status(409);
			}
		}
	}

	console.error("Unhandled error:", err);
	throw status(500);
}
