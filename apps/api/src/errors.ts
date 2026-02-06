import { SQL } from "bun";
import { DrizzleQueryError } from "drizzle-orm";

export interface ErrorMapper<T> {
	onConflict?: () => T;
	default: () => T;
}

export function errorMapper<T>(err: unknown, errorMapper: ErrorMapper<T>) {
	if (err instanceof DrizzleQueryError) {
		if (err.cause instanceof SQL.PostgresError) {
			if (err.cause.errno === "23505") {
				if (errorMapper.onConflict) {
					return errorMapper.onConflict();
				}
			}
		}
	}

	console.error("Unhandled error:", err);
	return errorMapper.default();
}

export function assertNever(_x: never): never {
	throw new Error("Unexpected path");
}
