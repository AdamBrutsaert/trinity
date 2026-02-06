import type { Database } from "@/db";
import { usersTable } from "@/db/schema";
import { env } from "@/env";
import { errorMapper } from "@/errors";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import { errAsync, okAsync, ResultAsync } from "neverthrow";
import type * as models from "./model";

function generateToken(userId: string, role: string) {
	return new SignJWT({ userId, role })
		.setProtectedHeader({ alg: "HS256" })
		.setIssuedAt()
		.setExpirationTime("2h")
		.setIssuer("trinity")
		.sign(new TextEncoder().encode(env.JWT_SECRET));
}

export type RegisterError =
	| {
			type: "email_already_exists";
			email: string;
	  }
	| {
			type: "failed_to_create_user";
	  };

export async function register(tx: Database, params: models.registerBody) {
	const hashedPassword = await bcrypt.hash(params.password, 10);

	return ResultAsync.fromPromise(
		tx
			.insert(usersTable)
			.values({
				email: params.email,
				passwordHash: hashedPassword,
				firstName: params.firstName,
				lastName: params.lastName,
				phoneNumber: params.phoneNumber,
				address: params.address,
				zipCode: params.zipCode,
				city: params.city,
				country: params.country,
			})
			.returning({ id: usersTable.id, role: usersTable.role }),
		(err) =>
			errorMapper<RegisterError>(err, {
				onConflict: () => ({
					type: "email_already_exists",
					email: params.email,
				}),
				default: () => ({
					type: "failed_to_create_user",
				}),
			}),
	)
		.andThen((res) => {
			const user = res[0];
			if (!user) {
				return errAsync({
					type: "failed_to_create_user",
				} satisfies RegisterError as RegisterError);
			}
			return okAsync(user);
		})
		.map(async (user) => ({ token: await generateToken(user.id, user.role) }));
}

export type LoginError =
	| {
			type: "invalid_email_or_password";
	  }
	| {
			type: "failed_to_fetch_user";
	  };

export async function login(tx: Database, params: models.loginBody) {
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
