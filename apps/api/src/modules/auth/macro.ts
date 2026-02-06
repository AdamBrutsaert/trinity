import Elysia, { status } from "elysia";
import type * as models from "./model";
import * as service from "./service";

export const auth = new Elysia().macro({
	admin: {
		beforeHandle: async ({ headers }) => {
			const authHeader = headers.authorization;
			if (!authHeader)
				return status(401, "Unauthorized" satisfies models.unauthorized);

			const [scheme, token] = authHeader.split(" ");
			if (scheme !== "Bearer" || !token)
				return status(401, "Unauthorized" satisfies models.unauthorized);

			return await service.verifyToken(token).match(
				({ payload }) => {
					if (payload.role !== "admin")
						return status(403, "Forbidden" satisfies models.forbidden);
				},
				() => status(401, "Unauthorized" satisfies models.unauthorized),
			);
		},
	},
	customer: {
		beforeHandle: async ({ headers }) => {
			const authHeader = headers.authorization;
			if (!authHeader)
				return status(401, "Unauthorized" satisfies models.unauthorized);

			const [scheme, token] = authHeader.split(" ");
			if (scheme !== "Bearer" || !token)
				return status(401, "Unauthorized" satisfies models.unauthorized);

			const result = await service.verifyToken(token);
			if (result.isErr()) {
				return status(401, "Unauthorized" satisfies models.unauthorized);
			}
		},
	},
});
