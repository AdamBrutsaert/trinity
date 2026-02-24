import z from "zod";

export const createStockBody = z.object({
	productId: z.uuidv4(),
	price: z.number().positive(),
	quantity: z.number().int().nonnegative(),
});
export type createStockBody = z.infer<typeof createStockBody>;

export const stockResponse = z.object({
	id: z.uuidv4(),
	productId: z.uuidv4(),
	price: z.number(),
	quantity: z.number(),
	createdAt: z.iso.datetime(),
	updatedAt: z.iso.datetime(),
});
export type stockResponse = z.infer<typeof stockResponse>;

export const productNotFound = z.literal("Product not found");
export type productNotFound = z.infer<typeof productNotFound>;

export const failedToCreateStock = z.literal("Failed to create stock");
export type failedToCreateStock = z.infer<typeof failedToCreateStock>;

export const stockNotFound = z.literal("Stock not found");
export type stockNotFound = z.infer<typeof stockNotFound>;

export const failedToFetchStock = z.literal("Failed to fetch stock");
export type failedToFetchStock = z.infer<typeof failedToFetchStock>;

export const stockListResponse = z.array(stockResponse);
export type stockListResponse = z.infer<typeof stockListResponse>;

export const failedToFetchStocks = z.literal("Failed to fetch stocks");
export type failedToFetchStocks = z.infer<typeof failedToFetchStocks>;

export const updateStockBody = z.object({
	productId: z.uuidv4(),
	price: z.number().positive(),
	quantity: z.number().int().nonnegative(),
});
export type updateStockBody = z.infer<typeof updateStockBody>;

export const failedToUpdateStock = z.literal("Failed to update stock");
export type failedToUpdateStock = z.infer<typeof failedToUpdateStock>;

export const failedToDeleteStock = z.literal("Failed to delete stock");
export type failedToDeleteStock = z.infer<typeof failedToDeleteStock>;
