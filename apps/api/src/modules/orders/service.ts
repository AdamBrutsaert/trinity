import { eq } from "drizzle-orm";
import { errAsync, okAsync, ResultAsync } from "neverthrow";

import { env } from "../../env";
import { errorMapper } from "../../errors";
import { clearCart, getCartTotalPrice } from "../cart/service";
import type { Database } from "../database";
import {
	cartItemsTable,
	invoiceItemsTable,
	invoicesTable,
	productsTable,
} from "../database/schema";
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

function createPaypalOrder(amount: string, currency: string) {
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

export type CreateInvoiceError =
	| {
			type: "failed_to_fetch_cart_items";
	  }
	| {
			type: "empty_cart";
	  }
	| {
			type: "failed_to_create_invoice";
	  }
	| {
			type: "failed_to_create_invoice_items";
	  }
	| {
			type: "failed_to_clear_cart";
	  };

function createInvoice(
	tx: Database,
	userId: string,
	paypalOrderId: string,
	totalAmount: number,
	status: "pending" | "completed" = "pending",
) {
	// First, fetch cart items with product details
	return ResultAsync.fromPromise(
		tx
			.select({
				productId: cartItemsTable.productId,
				productName: productsTable.name,
				unitPrice: productsTable.price,
				quantity: cartItemsTable.quantity,
			})
			.from(cartItemsTable)
			.innerJoin(productsTable, eq(cartItemsTable.productId, productsTable.id))
			.where(eq(cartItemsTable.userId, userId)),
		(err) =>
			errorMapper<CreateInvoiceError>(err, {
				default: () => ({
					type: "failed_to_fetch_cart_items",
				}),
			}),
	)
		.andThen((cartItems) => {
			if (cartItems.length === 0) {
				return errAsync({
					type: "empty_cart",
				} satisfies CreateInvoiceError as CreateInvoiceError);
			}

			// Create the invoice
			return ResultAsync.fromPromise(
				tx
					.insert(invoicesTable)
					.values({
						userId,
						paypalOrderId,
						status,
						totalAmount: totalAmount.toFixed(2),
					})
					.returning({
						id: invoicesTable.id,
						userId: invoicesTable.userId,
						paypalOrderId: invoicesTable.paypalOrderId,
						status: invoicesTable.status,
						totalAmount: invoicesTable.totalAmount,
						createdAt: invoicesTable.createdAt,
						updatedAt: invoicesTable.updatedAt,
					}),
				(err) =>
					errorMapper<CreateInvoiceError>(err, {
						default: () => ({
							type: "failed_to_create_invoice",
						}),
					}),
			).andThen((invoiceResult) => {
				const invoice = invoiceResult[0];
				if (!invoice) {
					return errAsync({
						type: "failed_to_create_invoice",
					} satisfies CreateInvoiceError as CreateInvoiceError);
				}

				// Create invoice items
				const invoiceItemsValues = cartItems.map((item) => ({
					invoiceId: invoice.id,
					productId: item.productId,
					productName: item.productName,
					unitPrice: item.unitPrice,
					quantity: item.quantity,
				}));

				return ResultAsync.fromPromise(
					tx.insert(invoiceItemsTable).values(invoiceItemsValues).returning({
						id: invoiceItemsTable.id,
						invoiceId: invoiceItemsTable.invoiceId,
						productId: invoiceItemsTable.productId,
						productName: invoiceItemsTable.productName,
						unitPrice: invoiceItemsTable.unitPrice,
						quantity: invoiceItemsTable.quantity,
						createdAt: invoiceItemsTable.createdAt,
					}),
					(err) =>
						errorMapper<CreateInvoiceError>(err, {
							default: () => ({
								type: "failed_to_create_invoice_items",
							}),
						}),
				).andThen((_invoiceItems) => {
					// Clear the cart
					return clearCart(tx, userId).mapErr((_err) => {
						return {
							type: "failed_to_clear_cart",
						} satisfies CreateInvoiceError as CreateInvoiceError;
					});
				});
			});
		})
		.map(() => undefined);
}

export type CreateCartPaypalOrderError =
	| CreatePaypalOrderError
	| CreateInvoiceError;

export function createCartPaypalOrder(tx: Database, userId: string) {
	return getCartTotalPrice(tx, userId).andThen((total) => {
		const totalString = total.toFixed(2);
		return createPaypalOrder(totalString, "EUR").andThen((paypalOrder) => {
			return createInvoice(tx, userId, paypalOrder.id, total).map(() => ({
				orderId: paypalOrder.id,
			}));
		});
	});
}
