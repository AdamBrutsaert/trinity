import z from "zod";

export const createProductBody = z.object({
	barcode: z.string().min(1).max(50),
	name: z.string().min(1).max(255),
	description: z.string().nullish(),
	imageUrl: z.url().nullish(),
	brandId: z.uuidv4(),
	categoryId: z.uuidv4(),
	energyKcal: z.number().nullish(),
	fat: z.number().nullish(),
	carbs: z.number().nullish(),
	protein: z.number().nullish(),
	salt: z.number().nullish(),
});
export type createProductBody = z.infer<typeof createProductBody>;

export const productResponse = z.object({
	id: z.uuidv4(),
	barcode: z.string(),
	name: z.string(),
	description: z.string().nullish(),
	imageUrl: z.url().nullish(),
	brandId: z.uuidv4(),
	categoryId: z.uuidv4(),
	energyKcal: z.number().nullish(),
	fat: z.number().nullish(),
	carbs: z.number().nullish(),
	protein: z.number().nullish(),
	salt: z.number().nullish(),
	createdAt: z.iso.datetime(),
	updatedAt: z.iso.datetime(),
});
export type productResponse = z.infer<typeof productResponse>;

export const productAlreadyExists = z.literal("Product already exists");
export type productAlreadyExists = z.infer<typeof productAlreadyExists>;

export const brandNotFound = z.literal("Brand not found");
export type brandNotFound = z.infer<typeof brandNotFound>;

export const categoryNotFound = z.literal("Category not found");
export type categoryNotFound = z.infer<typeof categoryNotFound>;

export const failedToCreateProduct = z.literal("Failed to create product");
export type failedToCreateProduct = z.infer<typeof failedToCreateProduct>;

export const productNotFound = z.literal("Product not found");
export type productNotFound = z.infer<typeof productNotFound>;

export const failedToFetchProduct = z.literal("Failed to fetch product");
export type failedToFetchProduct = z.infer<typeof failedToFetchProduct>;

export const productListResponse = z.array(productResponse);
export type productListResponse = z.infer<typeof productListResponse>;

export const failedToFetchProducts = z.literal("Failed to fetch products");
export type failedToFetchProducts = z.infer<typeof failedToFetchProducts>;

export const updateProductBody = z.object({
	barcode: z.string().min(1).max(50),
	name: z.string().min(1).max(255),
	description: z.string().nullish(),
	imageUrl: z.url().nullish(),
	brandId: z.uuidv4(),
	categoryId: z.uuidv4(),
	energyKcal: z.number().nullish(),
	fat: z.number().nullish(),
	carbs: z.number().nullish(),
	protein: z.number().nullish(),
	salt: z.number().nullish(),
});
export type updateProductBody = z.infer<typeof updateProductBody>;

export const failedToUpdateProduct = z.literal("Failed to update product");
export type failedToUpdateProduct = z.infer<typeof failedToUpdateProduct>;

export const failedToDeleteProduct = z.literal("Failed to delete product");
export type failedToDeleteProduct = z.infer<typeof failedToDeleteProduct>;
