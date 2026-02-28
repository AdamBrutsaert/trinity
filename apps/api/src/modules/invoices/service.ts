import { eq } from "drizzle-orm";
import { errAsync, okAsync, ResultAsync } from "neverthrow";

import { errorMapper } from "../../errors";
import type { Database } from "../database";
import { invoiceItemsTable, invoicesTable } from "../database/schema";
import type * as models from "./model";

export type GetInvoicesError = {
	type: "failed_to_fetch_invoices";
};

export function getInvoices(tx: Database) {
	return ResultAsync.fromPromise(
		tx.query.invoicesTable.findMany({
			columns: {
				id: true,
				userId: true,
				paypalOrderId: true,
				status: true,
				totalAmount: true,
				createdAt: true,
				updatedAt: true,
			},
			orderBy: (invoicesTable, { desc }) => [desc(invoicesTable.createdAt)],
		}),
		(err) =>
			errorMapper<GetInvoicesError>(err, {
				default: () => ({
					type: "failed_to_fetch_invoices",
				}),
			}),
	);
}

export type GetInvoicesByUserIdError =
	| {
			type: "failed_to_fetch_invoices";
	  }
	| {
			type: "user_not_found";
			userId: string;
	  };

export function getInvoicesByUserId(tx: Database, userId: string) {
	return ResultAsync.fromPromise(
		tx.query.usersTable.findFirst({
			where: (usersTable, { eq }) => eq(usersTable.id, userId),
			columns: { id: true },
		}),
		(err) =>
			errorMapper<GetInvoicesByUserIdError>(err, {
				default: () => ({
					type: "failed_to_fetch_invoices",
				}),
			}),
	).andThen((user) => {
		if (!user) {
			return errAsync({
				type: "user_not_found",
				userId,
			} satisfies GetInvoicesByUserIdError as GetInvoicesByUserIdError);
		}

		return ResultAsync.fromPromise(
			tx.query.invoicesTable.findMany({
				where: (invoicesTable, { eq }) => eq(invoicesTable.userId, userId),
				columns: {
					id: true,
					userId: true,
					paypalOrderId: true,
					status: true,
					totalAmount: true,
					createdAt: true,
					updatedAt: true,
				},
				orderBy: (invoicesTable, { desc }) => [desc(invoicesTable.createdAt)],
			}),
			(err) =>
				errorMapper<GetInvoicesByUserIdError>(err, {
					default: () => ({
						type: "failed_to_fetch_invoices",
					}),
				}),
		);
	});
}

export type GetInvoiceByIdError =
	| {
			type: "invoice_not_found";
			id: string;
	  }
	| {
			type: "failed_to_fetch_invoice";
	  };

export function getInvoiceById(tx: Database, id: string) {
	return ResultAsync.fromPromise(
		tx.query.invoicesTable.findFirst({
			where: (invoicesTable, { eq }) => eq(invoicesTable.id, id),
			columns: {
				id: true,
				userId: true,
				paypalOrderId: true,
				status: true,
				totalAmount: true,
				createdAt: true,
				updatedAt: true,
			},
		}),
		(err) =>
			errorMapper<GetInvoiceByIdError>(err, {
				default: () => ({
					type: "failed_to_fetch_invoice",
				}),
			}),
	).andThen((invoice) => {
		if (!invoice) {
			return errAsync({
				type: "invoice_not_found",
				id,
			} satisfies GetInvoiceByIdError as GetInvoiceByIdError);
		}

		// Fetch invoice items separately
		return ResultAsync.fromPromise(
			tx.query.invoiceItemsTable.findMany({
				where: (invoiceItemsTable, { eq }) =>
					eq(invoiceItemsTable.invoiceId, invoice.id),
				columns: {
					id: true,
					invoiceId: true,
					productId: true,
					productName: true,
					unitPrice: true,
					quantity: true,
					createdAt: true,
				},
				orderBy: (invoiceItemsTable, { asc }) => [
					asc(invoiceItemsTable.createdAt),
				],
			}),
			(err) =>
				errorMapper<GetInvoiceByIdError>(err, {
					default: () => ({
						type: "failed_to_fetch_invoice",
					}),
				}),
		).andThen((items) => {
			return okAsync({
				...invoice,
				items,
			});
		});
	});
}

export type CreateInvoiceError =
	| {
			type: "user_not_found";
			userId: string;
	  }
	| {
			type: "product_not_found";
			productId: string;
	  }
	| {
			type: "failed_to_create_invoice";
	  }
	| {
			type: "failed_to_create_invoice_items";
	  };

export function createInvoice(tx: Database, params: models.createInvoiceBody) {
	// First verify user exists
	return ResultAsync.fromPromise(
		tx.query.usersTable.findFirst({
			where: (usersTable, { eq }) => eq(usersTable.id, params.userId),
			columns: { id: true },
		}),
		(err) =>
			errorMapper<CreateInvoiceError>(err, {
				default: () => ({
					type: "failed_to_create_invoice",
				}),
			}),
	)
		.andThen((user) => {
			if (!user) {
				return errAsync({
					type: "user_not_found",
					userId: params.userId,
				} satisfies CreateInvoiceError as CreateInvoiceError);
			}

			// Verify all products exist
			return ResultAsync.fromPromise(
				tx.query.productsTable.findMany({
					where: (productsTable, { inArray }) =>
						inArray(
							productsTable.id,
							params.items.map((item) => item.productId),
						),
					columns: { id: true },
				}),
				(err) =>
					errorMapper<CreateInvoiceError>(err, {
						default: () => ({
							type: "failed_to_create_invoice",
						}),
					}),
			).andThen((products) => {
				const productIds = new Set(products.map((p) => p.id));
				const missingProduct = params.items.find(
					(item) => !productIds.has(item.productId),
				);

				if (missingProduct) {
					return errAsync({
						type: "product_not_found",
						productId: missingProduct.productId,
					} satisfies CreateInvoiceError as CreateInvoiceError);
				}

				return okAsync(undefined);
			});
		})
		.andThen(() => {
			// Create invoice
			return ResultAsync.fromPromise(
				tx
					.insert(invoicesTable)
					.values({
						userId: params.userId,
						paypalOrderId: params.paypalOrderId,
						status: params.status || "pending",
						totalAmount: params.totalAmount,
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
				return ResultAsync.fromPromise(
					tx
						.insert(invoiceItemsTable)
						.values(
							params.items.map((item) => ({
								invoiceId: invoice.id,
								productId: item.productId,
								productName: item.productName,
								unitPrice: item.unitPrice,
								quantity: item.quantity,
							})),
						)
						.returning({
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
				).andThen((items) => {
					return okAsync({
						...invoice,
						items,
					});
				});
			});
		});
}

export type UpdateInvoiceError =
	| {
			type: "invoice_not_found";
			id: string;
	  }
	| {
			type: "failed_to_update_invoice";
	  };

export function updateInvoice(
	tx: Database,
	id: string,
	params: models.updateInvoiceBody,
) {
	return ResultAsync.fromPromise(
		tx
			.update(invoicesTable)
			.set({
				status: params.status,
				updatedAt: new Date(),
			})
			.where(eq(invoicesTable.id, id))
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
			errorMapper<UpdateInvoiceError>(err, {
				default: () => ({
					type: "failed_to_update_invoice",
				}),
			}),
	).andThen((result) => {
		const invoice = result[0];
		if (!invoice) {
			return errAsync({
				type: "invoice_not_found",
				id,
			} satisfies UpdateInvoiceError as UpdateInvoiceError);
		}
		return okAsync(invoice);
	});
}

export type DeleteInvoiceError =
	| {
			type: "invoice_not_found";
			id: string;
	  }
	| {
			type: "failed_to_delete_invoice";
	  };

export function deleteInvoice(tx: Database, id: string) {
	return ResultAsync.fromPromise(
		tx
			.delete(invoicesTable)
			.where(eq(invoicesTable.id, id))
			.returning({ id: invoicesTable.id }),
		(_err) => {
			return {
				type: "failed_to_delete_invoice",
			} satisfies DeleteInvoiceError as DeleteInvoiceError;
		},
	).andThen((result) => {
		if (result.length === 0) {
			return errAsync({
				type: "invoice_not_found",
				id,
			} satisfies DeleteInvoiceError as DeleteInvoiceError);
		}
		return okAsync();
	});
}
