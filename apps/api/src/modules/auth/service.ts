import { env } from "@/env";
import { errorMapper } from "@/errors";
import type { Database } from "@/modules/database";
import bcrypt from "bcryptjs";
import { jwtVerify, SignJWT } from "jose";
import { errAsync, okAsync, ResultAsync } from "neverthrow";
import { createUser } from "../users/service";
import type * as models from "./model";

function generateToken(userId: string, role: "customer" | "admin") {
	return new SignJWT({ userId, role })
		.setProtectedHeader({ alg: "HS256" })
		.setIssuedAt()
		.setExpirationTime("2h")
		.setIssuer("trinity")
		.sign(new TextEncoder().encode(env.JWT_SECRET));
}

export function register(tx: Database, params: models.registerBody) {
	return createUser(tx, { ...params, role: "customer" }).map(async (user) => ({
		token: await generateToken(user.id, user.role),
	}));
}

export type LoginError =
	| {
			type: "invalid_email_or_password";
	  }
	| {
			type: "failed_to_fetch_user";
	  };

export function login(tx: Database, params: models.loginBody) {
	return ResultAsync.fromPromise(
		tx.query.usersTable.findFirst({
			where: (usersTable, { eq }) => eq(usersTable.email, params.email),
		}),
		(err) =>
			errorMapper<LoginError>(err, {
				default: () => ({
					type: "failed_to_fetch_user",
				}),
			}),
	)
		.andThen((user) => {
			if (!user) {
				return errAsync({
					type: "invalid_email_or_password",
				} satisfies LoginError as LoginError);
			}

			return ResultAsync.fromSafePromise(
				bcrypt.compare(params.password, user.passwordHash),
			).andThen((match) => {
				if (!match) {
					return errAsync({
						type: "invalid_email_or_password",
					} satisfies LoginError as LoginError);
				}
				return okAsync(user);
			});
		})
		.map(async (user) => ({ token: await generateToken(user.id, user.role) }));
}

export function verifyToken(token: string) {
	return ResultAsync.fromPromise(
		jwtVerify<{ userId: string; role: "customer" | "admin" }>(
			token,
			new TextEncoder().encode(env.JWT_SECRET),
			{
				issuer: "trinity",
			},
		),
		() => "invalid" as const,
	);
}
