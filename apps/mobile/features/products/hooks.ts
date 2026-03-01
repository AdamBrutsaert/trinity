import { useMutation, useQuery } from "@tanstack/react-query";

import { useAuthStore } from "@/features/auth/store";
import { client } from "@/lib/api";
import { queryClient } from "@/screens/_layout";

type ProductResponse = {
	id: string;
	barcode: string;
	name: string;
	description: string | null;
	imageUrl: string | null;
	brandId: string;
	categoryId: string;
	price: number;
	energyKcal: number | null;
	fat: number | null;
	carbs: number | null;
	protein: number | null;
	salt: number | null;
	createdAt: string;
	updatedAt: string;
};

type CartItemResponse = {
	id: string;
	userId: string;
	productId: string;
	quantity: number;
	createdAt: string;
	updatedAt: string;
	product: ProductResponse;
};

type CartResponse = {
	data: CartItemResponse[];
};

export function useProductByBarcode(barcode: string | null) {
	const { token } = useAuthStore();

	return useQuery({
		queryKey: ["product", "barcode", barcode],
		queryFn: () => {
			if (!barcode) throw new Error("Barcode is required");
			return client.products
				.barcode({ barcode })
				.get({ headers: { Authorization: `Bearer ${token}` } });
		},
		enabled: !!barcode,
		retry: false,
	});
}

export function useAddProductToCart() {
	const { token } = useAuthStore();

	return useMutation({
		mutationFn: (data: { productId: string; quantity: number }) => {
			return client.cart.items.post(
				{
					productId: data.productId,
					quantity: data.quantity,
				},
				{ headers: { Authorization: `Bearer ${token}` } },
			);
		},
		onMutate: async (data) => {
			// Cancel outgoing refetches
			await queryClient.cancelQueries({ queryKey: ["cart"] });

			// Snapshot previous value
			const previousCart = queryClient.getQueryData<CartResponse>(["cart"]);

			// Optimistically check if item already exists in cart
			queryClient.setQueryData<CartResponse>(["cart"], (old) => {
				if (!old?.data) return old;

				const existingItemIndex = old.data.findIndex(
					(item) => item.productId === data.productId,
				);

				if (existingItemIndex >= 0) {
					// Update existing item quantity
					const newData = [...old.data];
					newData[existingItemIndex] = {
						...newData[existingItemIndex],
						quantity: newData[existingItemIndex].quantity + data.quantity,
					};
					return {
						...old,
						data: newData,
					};
				}

				// Item doesn't exist yet, we can't optimistically add it without full product data
				// So just return old data and let the server response update it
				return old;
			});

			return { previousCart };
		},
		onError: (_err, _variables, context) => {
			// Rollback on error
			if (context?.previousCart) {
				queryClient.setQueryData(["cart"], context.previousCart);
			}
		},
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: ["cart"] });
		},
	});
}
