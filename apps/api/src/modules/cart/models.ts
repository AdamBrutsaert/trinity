import z from "zod";

export const addItemToCartBody = z.object({
	productId: z.uuidv4(),
	quantity: z.number().int().positive(),
});
export type addItemToCartBody = z.infer<typeof addItemToCartBody>;

export const updateCartItemBody = z.object({
	quantity: z.number().int().positive(),
});
export type updateCartItemBody = z.infer<typeof updateCartItemBody>;

export const cartItemResponse = z.object({
	id: z.uuidv4(),
	userId: z.uuidv4(),
	productId: z.uuidv4(),
	quantity: z.number(),
	createdAt: z.iso.datetime(),
	updatedAt: z.iso.datetime(),
});
export type cartItemResponse = z.infer<typeof cartItemResponse>;

export const cartItemWithProductResponse = z.object({
	id: z.uuidv4(),
	userId: z.uuidv4(),
	productId: z.uuidv4(),
	quantity: z.number(),
	createdAt: z.iso.datetime(),
	updatedAt: z.iso.datetime(),
	product: z.object({
		id: z.uuidv4(),
		barcode: z.string(),
		name: z.string(),
		description: z.string().nullable(),
		imageUrl: z.string().nullable(),
		brandId: z.uuidv4(),
		categoryId: z.uuidv4(),
		price: z.number(),
		energyKcal: z.number().nullable(),
		fat: z.number().nullable(),
		carbs: z.number().nullable(),
		protein: z.number().nullable(),
		salt: z.number().nullable(),
		createdAt: z.iso.datetime(),
		updatedAt: z.iso.datetime(),
	}),
});
export type cartItemWithProductResponse = z.infer<
	typeof cartItemWithProductResponse
>;

export const cartItemListResponse = z.array(cartItemWithProductResponse);
export type cartItemListResponse = z.infer<typeof cartItemListResponse>;

export const productNotFound = z.literal("Product not found");
export type productNotFound = z.infer<typeof productNotFound>;

export const failedToAddItemToCart = z.literal("Failed to add item to cart");
export type failedToAddItemToCart = z.infer<typeof failedToAddItemToCart>;

export const cartItemNotFound = z.literal("Cart item not found");
export type cartItemNotFound = z.infer<typeof cartItemNotFound>;

export const failedToUpdateCartItem = z.literal("Failed to update cart item");
export type failedToUpdateCartItem = z.infer<typeof failedToUpdateCartItem>;

export const failedToRemoveCartItem = z.literal("Failed to remove cart item");
export type failedToRemoveCartItem = z.infer<typeof failedToRemoveCartItem>;

export const failedToFetchCart = z.literal("Failed to fetch cart");
export type failedToFetchCart = z.infer<typeof failedToFetchCart>;

export const failedToClearCart = z.literal("Failed to clear cart");
export type failedToClearCart = z.infer<typeof failedToClearCart>;

export const cartTotalPriceResponse = z.object({
	total: z.number(),
});
export type cartTotalPriceResponse = z.infer<typeof cartTotalPriceResponse>;

export const failedToCalculateCartTotal = z.literal(
	"Failed to calculate cart total",
);
export type failedToCalculateCartTotal = z.infer<
	typeof failedToCalculateCartTotal
>;
