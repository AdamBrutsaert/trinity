import z from "zod";

export const createBrandBody = z.object({
	name: z.string().min(1).max(255),
});
export type createBrandBody = z.infer<typeof createBrandBody>;

export const brandResponse = z.object({
	id: z.uuidv4(),
	name: z.string(),
	createdAt: z.iso.datetime(),
	updatedAt: z.iso.datetime(),
});
export type brandResponse = z.infer<typeof brandResponse>;

export const brandAlreadyExists = z.literal("Brand already exists");
export type brandAlreadyExists = z.infer<typeof brandAlreadyExists>;

export const failedToCreateBrand = z.literal("Failed to create brand");
export type failedToCreateBrand = z.infer<typeof failedToCreateBrand>;

export const brandNotFound = z.literal("Brand not found");
export type brandNotFound = z.infer<typeof brandNotFound>;

export const failedToFetchBrand = z.literal("Failed to fetch brand");
export type failedToFetchBrand = z.infer<typeof failedToFetchBrand>;

export const brandListResponse = z.array(brandResponse);
export type brandListResponse = z.infer<typeof brandListResponse>;

export const failedToFetchBrands = z.literal("Failed to fetch brands");
export type failedToFetchBrands = z.infer<typeof failedToFetchBrands>;

export const updateBrandBody = z.object({
	name: z.string().min(1).max(255),
});
export type updateBrandBody = z.infer<typeof updateBrandBody>;

export const failedToUpdateBrand = z.literal("Failed to update brand");
export type failedToUpdateBrand = z.infer<typeof failedToUpdateBrand>;

export const failedToDeleteBrand = z.literal("Failed to delete brand");
export type failedToDeleteBrand = z.infer<typeof failedToDeleteBrand>;
