import { errAsync, okAsync, ResultAsync } from "neverthrow";

import { env } from "../../env";
import { createPaypalOrderSchema, getPaypalAccessTokenSchema } from "./models";

type GetAccessTokenError =
	| {
			type: "fetch_error";
	  }
	| {
			type: "invalid_json";
	  }
	| {
			type: "invalid_response";
	  };

function getPaypalAccessToken() {
	const credentials = Buffer.from(
		`${env.PAYPAL_CLIENT_ID}:${env.PAYPAL_CLIENT_SECRET}`,
	).toString("base64");

	return ResultAsync.fromPromise(
		fetch(`${env.PAYPAL_BASE_URL}/v1/oauth2/token`, {
			method: "POST",
			headers: {
				Authorization: `Basic ${credentials}`,
				"Content-Type": "application/x-www-form-urlencoded",
			},
			body: "grant_type=client_credentials",
		}),
		(_error) =>
			({
				type: "fetch_error",
			}) satisfies GetAccessTokenError as GetAccessTokenError,
	)
		.andThen((response) =>
			ResultAsync.fromPromise(
				response.json(),
				(_error) =>
					({
						type: "invalid_json",
					}) satisfies GetAccessTokenError as GetAccessTokenError,
			),
		)
		.andThen((json) => {
			const parsed = getPaypalAccessTokenSchema.safeParse(json);
			if (!parsed.success) {
				return errAsync({
					type: "invalid_response",
				} satisfies GetAccessTokenError as GetAccessTokenError);
			}
			return okAsync(parsed.data.access_token);
		});
}

export type CreatePaypalOrderError = GetAccessTokenError;

export function createPaypalOrder(amount: string, currency: string) {
	return getPaypalAccessToken().andThen((accessToken) => {
		return ResultAsync.fromPromise(
			fetch(`${env.PAYPAL_BASE_URL}/v2/checkout/orders`, {
				method: "POST",
				headers: {
					Authorization: `Bearer ${accessToken}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					intent: "CAPTURE",
					purchase_units: [
						{
							amount: {
								currency_code: currency,
								value: amount,
							},
						},
					],
				}),
			}),
			(_error) =>
				({
					type: "fetch_error",
				}) satisfies CreatePaypalOrderError as CreatePaypalOrderError,
		)
			.andThen((response) =>
				ResultAsync.fromPromise(
					response.json(),
					(_error) =>
						({
							type: "invalid_json",
						}) satisfies CreatePaypalOrderError as CreatePaypalOrderError,
				),
			)
			.andThen((json) => {
				const parsed = createPaypalOrderSchema.safeParse(json);
				if (!parsed.success) {
					return errAsync({
						type: "invalid_response",
					} satisfies CreatePaypalOrderError as CreatePaypalOrderError);
				}
				return okAsync(parsed.data);
			});
	});
}
