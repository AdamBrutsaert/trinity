import * as z from "zod";

export const invoiceItemResponse = z.object({
	id: z.string(),
	invoiceId: z.string(),
	productId: z.string(),
	productName: z.string(),
	unitPrice: z.string(),
	quantity: z.number(),
	createdAt: z.iso.datetime(),
});
export type invoiceItemResponse = z.infer<typeof invoiceItemResponse>;

export const invoiceResponse = z.object({
	id: z.string(),
	userId: z.string(),
	paypalOrderId: z.string(),
	status: z.enum(["pending", "completed"]),
	totalAmount: z.string(),
	createdAt: z.iso.datetime(),
	updatedAt: z.iso.datetime(),
});
export type invoiceResponse = z.infer<typeof invoiceResponse>;

export const invoiceWithItemsResponse = z.object({
	id: z.string(),
	userId: z.string(),
	paypalOrderId: z.string(),
	status: z.enum(["pending", "completed"]),
	totalAmount: z.string(),
	createdAt: z.iso.datetime(),
	updatedAt: z.iso.datetime(),
	items: z.array(invoiceItemResponse),
});
export type invoiceWithItemsResponse = z.infer<typeof invoiceWithItemsResponse>;

export const invoiceListResponse = z.array(invoiceResponse);
export type invoiceListResponse = z.infer<typeof invoiceListResponse>;

export const createInvoiceBody = z.object({
	userId: z.string().uuid(),
	paypalOrderId: z.string().max(255),
	status: z.enum(["pending", "completed"]).optional(),
	totalAmount: z.string().regex(/^\d+(\.\d{1,2})?$/),
	items: z
		.array(
			z.object({
				productId: z.string().uuid(),
				productName: z.string().max(255),
				unitPrice: z.string().regex(/^\d+(\.\d{1,2})?$/),
				quantity: z.number().int().positive(),
			}),
		)
		.min(1),
});
export type createInvoiceBody = z.infer<typeof createInvoiceBody>;

export const updateInvoiceBody = z.object({
	status: z.enum(["pending", "completed"]),
});
export type updateInvoiceBody = z.infer<typeof updateInvoiceBody>;

export const invoiceNotFound = z.literal("Invoice not found");
export type invoiceNotFound = z.infer<typeof invoiceNotFound>;

export const userNotFound = z.literal("User not found");
export type userNotFound = z.infer<typeof userNotFound>;

export const failedToFetchInvoice = z.literal("Failed to fetch invoice");
export type failedToFetchInvoice = z.infer<typeof failedToFetchInvoice>;

export const failedToFetchInvoices = z.literal("Failed to fetch invoices");
export type failedToFetchInvoices = z.infer<typeof failedToFetchInvoices>;

export const failedToCreateInvoice = z.literal("Failed to create invoice");
export type failedToCreateInvoice = z.infer<typeof failedToCreateInvoice>;

export const failedToCreateInvoiceItems = z.literal(
	"Failed to create invoice items",
);
export type failedToCreateInvoiceItems = z.infer<
	typeof failedToCreateInvoiceItems
>;

export const failedToUpdateInvoice = z.literal("Failed to update invoice");
export type failedToUpdateInvoice = z.infer<typeof failedToUpdateInvoice>;

export const failedToDeleteInvoice = z.literal("Failed to delete invoice");
export type failedToDeleteInvoice = z.infer<typeof failedToDeleteInvoice>;

export const productNotFound = z.literal("Product not found");
export type productNotFound = z.infer<typeof productNotFound>;

export const forbidden = z.literal("Forbidden");
export type forbidden = z.infer<typeof forbidden>;
