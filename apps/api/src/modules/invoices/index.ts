import Elysia, { status } from "elysia";
import * as z from "zod";

import { assertNever } from "../../errors";
import { authGuard } from "../auth/middleware";
import type { DatabasePlugin } from "../database";
import * as models from "./model";
import * as service from "./service";

function getInvoicesRoute(database: DatabasePlugin) {
	return new Elysia()
		.use(database)
		.use(authGuard("admin"))
		.get(
			"/",
			async ({ database }) => {
				const result = await database.transaction(
					async (tx) => await service.getInvoices(tx),
				);
				return result.match(
					(res) =>
						status(
							200,
							res.map((invoice) => ({
								...invoice,
								createdAt: invoice.createdAt.toISOString(),
								updatedAt: invoice.updatedAt.toISOString(),
							})),
						),
					(_err) =>
						status(
							500,
							"Failed to fetch invoices" satisfies models.failedToFetchInvoices,
						),
				);
			},
			{
				response: {
					200: models.invoiceListResponse,
					500: models.failedToFetchInvoices,
				},
			},
		);
}

function getInvoicesByUserIdRoute(database: DatabasePlugin) {
	return new Elysia()
		.use(database)
		.use(authGuard("customer"))
		.get(
			"/users/:id",
			async ({ params, userId, role, database }) => {
				// Check if customer is trying to access their own invoices or if admin
				if (role === "customer" && params.id !== userId) {
					return status(403, "Forbidden" satisfies models.forbidden);
				}

				const result = await database.transaction(
					async (tx) => await service.getInvoicesByUserId(tx, params.id),
				);
				return result.match(
					(res) =>
						status(
							200,
							res.map((invoice) => ({
								...invoice,
								createdAt: invoice.createdAt.toISOString(),
								updatedAt: invoice.updatedAt.toISOString(),
							})),
						),
					(err) => {
						switch (err.type) {
							case "user_not_found":
								return status(
									404,
									"User not found" satisfies models.userNotFound,
								);
							case "failed_to_fetch_invoices":
								return status(
									500,
									"Failed to fetch invoices" satisfies models.failedToFetchInvoices,
								);
							default:
								assertNever(err);
						}
					},
				);
			},
			{
				params: z.object({
					id: z.uuidv4(),
				}),
				response: {
					200: models.invoiceListResponse,
					403: models.forbidden,
					404: models.userNotFound,
					500: models.failedToFetchInvoices,
				},
			},
		);
}

function createInvoiceRoute(database: DatabasePlugin) {
	return new Elysia()
		.use(database)
		.use(authGuard("admin"))
		.post(
			"/",
			async ({ body, database }) => {
				const result = await database.transaction(async (tx) => {
					return await service.createInvoice(tx, body);
				});
				return result.match(
					(res) =>
						status(201, {
							...res,
							createdAt: res.createdAt.toISOString(),
							updatedAt: res.updatedAt.toISOString(),
							items: res.items.map((item) => ({
								...item,
								createdAt: item.createdAt.toISOString(),
							})),
						}),
					(err) => {
						switch (err.type) {
							case "user_not_found":
								return status(
									404,
									"User not found" satisfies models.userNotFound,
								);
							case "product_not_found":
								return status(
									404,
									"Product not found" satisfies models.productNotFound,
								);
							case "failed_to_create_invoice":
								return status(
									500,
									"Failed to create invoice" satisfies models.failedToCreateInvoice,
								);
							case "failed_to_create_invoice_items":
								return status(
									500,
									"Failed to create invoice items" satisfies models.failedToCreateInvoiceItems,
								);
							default:
								assertNever(err);
						}
					},
				);
			},
			{
				body: models.createInvoiceBody,
				response: {
					201: models.invoiceWithItemsResponse,
					404: z.union([models.userNotFound, models.productNotFound]),
					500: z.union([
						models.failedToCreateInvoice,
						models.failedToCreateInvoiceItems,
					]),
				},
			},
		);
}

function updateInvoiceRoute(database: DatabasePlugin) {
	return new Elysia()
		.use(database)
		.use(authGuard("admin"))
		.put(
			"/:id",
			async ({ params, body, database }) => {
				const result = await database.transaction(async (tx) => {
					return await service.updateInvoice(tx, params.id, body);
				});
				return result.match(
					(res) =>
						status(200, {
							...res,
							createdAt: res.createdAt.toISOString(),
							updatedAt: res.updatedAt.toISOString(),
						}),
					(err) => {
						switch (err.type) {
							case "invoice_not_found":
								return status(
									404,
									"Invoice not found" satisfies models.invoiceNotFound,
								);
							case "failed_to_update_invoice":
								return status(
									500,
									"Failed to update invoice" satisfies models.failedToUpdateInvoice,
								);
							default:
								assertNever(err);
						}
					},
				);
			},
			{
				params: z.object({
					id: z.uuidv4(),
				}),
				body: models.updateInvoiceBody,
				response: {
					200: models.invoiceResponse,
					404: models.invoiceNotFound,
					500: models.failedToUpdateInvoice,
				},
			},
		);
}

function deleteInvoiceRoute(database: DatabasePlugin) {
	return new Elysia()
		.use(database)
		.use(authGuard("admin"))
		.delete(
			"/:id",
			async ({ params, database }) => {
				const result = await database.transaction(async (tx) => {
					return await service.deleteInvoice(tx, params.id);
				});
				return result.match(
					() => status(204),
					(err) => {
						switch (err.type) {
							case "invoice_not_found":
								return status(
									404,
									"Invoice not found" satisfies models.invoiceNotFound,
								);
							case "failed_to_delete_invoice":
								return status(
									500,
									"Failed to delete invoice" satisfies models.failedToDeleteInvoice,
								);
							default:
								assertNever(err);
						}
					},
				);
			},
			{
				params: z.object({
					id: z.uuidv4(),
				}),
				response: {
					204: z.void(),
					404: models.invoiceNotFound,
					500: models.failedToDeleteInvoice,
				},
			},
		);
}

export function createInvoicesModule(database: DatabasePlugin) {
	return new Elysia({
		name: "invoices",
		prefix: "/invoices",
		tags: ["invoices"],
	})
		.use(getInvoicesRoute(database))
		.use(getInvoicesByUserIdRoute(database))
		.use(createInvoiceRoute(database))
		.use(updateInvoiceRoute(database))
		.use(deleteInvoiceRoute(database));
}
