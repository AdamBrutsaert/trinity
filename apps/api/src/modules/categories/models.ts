import z from "zod";

export const createCategoryBody = z.object({
	name: z.string().min(1).max(255),
});
export type createCategoryBody = z.infer<typeof createCategoryBody>;

export const categoryResponse = z.object({
	id: z.uuidv4(),
	name: z.string(),
	createdAt: z.iso.datetime(),
	updatedAt: z.iso.datetime(),
});
export type categoryResponse = z.infer<typeof categoryResponse>;

export const categoryAlreadyExists = z.literal("Category already exists");
export type categoryAlreadyExists = z.infer<typeof categoryAlreadyExists>;

export const failedToCreateCategory = z.literal("Failed to create category");
export type failedToCreateCategory = z.infer<typeof failedToCreateCategory>;

export const categoryNotFound = z.literal("Category not found");
export type categoryNotFound = z.infer<typeof categoryNotFound>;

export const failedToFetchCategory = z.literal("Failed to fetch category");
export type failedToFetchCategory = z.infer<typeof failedToFetchCategory>;

export const categoryListResponse = z.array(categoryResponse);
export type categoryListResponse = z.infer<typeof categoryListResponse>;

export const failedToFetchCategories = z.literal("Failed to fetch categories");
export type failedToFetchCategories = z.infer<typeof failedToFetchCategories>;

export const updateCategoryBody = z.object({
	name: z.string().min(1).max(255),
});
export type updateCategoryBody = z.infer<typeof updateCategoryBody>;

export const failedToUpdateCategory = z.literal("Failed to update category");
export type failedToUpdateCategory = z.infer<typeof failedToUpdateCategory>;

export const failedToDeleteCategory = z.literal("Failed to delete category");
export type failedToDeleteCategory = z.infer<typeof failedToDeleteCategory>;
