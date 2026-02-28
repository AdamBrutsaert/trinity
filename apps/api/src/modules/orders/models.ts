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
});
export type createPaypalOrderSchema = z.infer<typeof createPaypalOrderSchema>;

export const createOrderResponse = z.object({
	orderId: z.string(),
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
