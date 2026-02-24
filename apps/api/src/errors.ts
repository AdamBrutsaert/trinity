import { SQL } from "bun";
import { DrizzleQueryError } from "drizzle-orm";

export interface ErrorMapper<T> {
	onConflict?: () => T;
	onForeignKeyViolation?: (constraint: string | undefined) => T;
	default: () => T;
}

export function errorMapper<T>(err: unknown, mappers: ErrorMapper<T>) {
	if (err instanceof DrizzleQueryError) {
		if (err.cause instanceof SQL.PostgresError) {
			switch (err.cause.errno) {
				case "23505": // unique_violation
					if (mappers.onConflict) {
						return mappers.onConflict();
					}
					break;
				case "23503": // foreign_key_violation
					if (mappers.onForeignKeyViolation) {
						return mappers.onForeignKeyViolation(err.cause.constraint);
					}
					break;
			}
		}
	}

	console.error("Unhandled error:", err);
	return mappers.default();
}

export function assertNever(_x: never): never {
	throw new Error("Unexpected path");
}
