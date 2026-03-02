import z from "zod";

export const getPaypalAccessTokenSchema = z.object({
	access_token: z.string(),
});
export type getPaypalAccessTokenSchema = z.infer<
	typeof getPaypalAccessTokenSchema
>;

export const createPaypalOrderSchema = z.object({
	id: z.string(),
	status: z.literal("CREATED"),
	links: z.array(
		z.object({
			href: z.string(),
			rel: z.string(),
			method: z.string().optional(),
		}),
	),
});
export type createPaypalOrderSchema = z.infer<typeof createPaypalOrderSchema>;

export const createOrderRequest = z.object({
	returnUrl: z.string().optional(),
	cancelUrl: z.string().optional(),
});
export type createOrderRequest = z.infer<typeof createOrderRequest>;

export const createOrderResponse = z.object({
	orderId: z.string(),
	approvalUrl: z.string(),
});
export type createOrderResponse = z.infer<typeof createOrderResponse>;

export const failedToFetchAccessTokenResponse = z.literal(
	"Failed to fetch access token",
);
export type failedToFetchAccessTokenResponse = z.infer<
	typeof failedToFetchAccessTokenResponse
>;

export const invalidJsonResponse = z.literal(
	"Invalid JSON response from PayPal",
);
export type invalidJsonResponse = z.infer<typeof invalidJsonResponse>;

export const invalidResponseStructure = z.literal(
	"Invalid response structure from PayPal",
);
export type invalidResponseStructure = z.infer<typeof invalidResponseStructure>;

export const failedToCalculateCartTotal = z.literal(
	"Failed to calculate cart total",
);
export type failedToCalculateCartTotal = z.infer<
	typeof failedToCalculateCartTotal
>;

export const emptyCart = z.literal("Cart is empty");
export type emptyCart = z.infer<typeof emptyCart>;

export const failedToFetchCartItems = z.literal("Failed to fetch cart items");
export type failedToFetchCartItems = z.infer<typeof failedToFetchCartItems>;

export const failedToCreateInvoice = z.literal("Failed to create invoice");
export type failedToCreateInvoice = z.infer<typeof failedToCreateInvoice>;

export const failedToCreateInvoiceItems = z.literal(
	"Failed to create invoice items",
);
export type failedToCreateInvoiceItems = z.infer<
	typeof failedToCreateInvoiceItems
>;

export const failedToClearCart = z.literal("Failed to clear cart");
export type failedToClearCart = z.infer<typeof failedToClearCart>;

export const capturePaypalOrderSchema = z.object({
	id: z.string(),
	status: z.literal("COMPLETED"),
});
export type capturePaypalOrderSchema = z.infer<typeof capturePaypalOrderSchema>;

export const captureOrderResponse = z.object({
	orderId: z.string(),
});
export type captureOrderResponse = z.infer<typeof captureOrderResponse>;

export const invoiceNotFound = z.literal("Invoice not found");
export type invoiceNotFound = z.infer<typeof invoiceNotFound>;

export const failedToUpdateInvoice = z.literal("Failed to update invoice");
export type failedToUpdateInvoice = z.infer<typeof failedToUpdateInvoice>;

export const captureFailed = z.literal("PayPal capture failed");
export type captureFailed = z.infer<typeof captureFailed>;
