import Elysia from "elysia";

import type * as models from "./model";
import * as service from "./service";

function extractBearer(headers: Record<string, string | undefined>) {
	const authHeader = headers.authorization;
	if (!authHeader) return null;

	const [scheme, token] = authHeader.split(" ");
	if (scheme !== "Bearer" || !token) return null;

	return token;
}

export const authGuard = (role: "admin" | "customer") =>
	new Elysia().resolve({ as: "scoped" }, async ({ headers, status }) => {
		const token = extractBearer(headers);
		if (!token) {
			return status(401, "Unauthorized" satisfies models.userUnauthorized);
		}

		const result = await service.verifyToken(token);
		if (result.isErr()) {
			return status(401, "Unauthorized" satisfies models.userUnauthorized);
		}

		const user = result.value.payload;
		if (role === "admin" && user.role !== "admin") {
			return status(403, "Forbidden" satisfies models.userForbidden);
		}

		return {
			userId: user.userId,
			role: user.role,
		};
	});
