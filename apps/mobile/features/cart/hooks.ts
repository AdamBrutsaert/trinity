import { useMutation, useQuery } from "@tanstack/react-query";

import { useAuthStore } from "@/features/auth/store";
import { client } from "@/lib/api";
import { queryClient } from "@/screens/_layout";

type CartItemResponse = {
	id: string;
	userId: string;
	productId: string;
	quantity: number;
	createdAt: string;
	updatedAt: string;
	product: {
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
};

type CartResponse = {
	data: CartItemResponse[];
};

export function useCartItems() {
	const { token } = useAuthStore();

	return useQuery({
		queryKey: ["cart"],
		queryFn: () =>
			client.cart.get({ headers: { Authorization: `Bearer ${token}` } }),
	});
}

export function useCartAddItem() {
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
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["cart"] });
		},
	});
}

export function useCartUpdateItem() {
	const { token } = useAuthStore();

	return useMutation({
		mutationFn: (data: { productId: string; quantity: number }) => {
			return client.cart.items({ productId: data.productId }).put(
				{
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

			// Optimistically update
			queryClient.setQueryData<CartResponse>(["cart"], (old) => {
				if (!old?.data) return old;
				return {
					...old,
					data: old.data.map((item) =>
						item.productId === data.productId
							? { ...item, quantity: data.quantity }
							: item,
					),
				};
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

export function useCartRemoveItem() {
	const { token } = useAuthStore();

	return useMutation({
		mutationFn: (productId: string) => {
			return client.cart
				.items({ productId })
				.delete({}, { headers: { Authorization: `Bearer ${token}` } });
		},
		onMutate: async (productId) => {
			// Cancel outgoing refetches
			await queryClient.cancelQueries({ queryKey: ["cart"] });

			// Snapshot previous value
			const previousCart = queryClient.getQueryData<CartResponse>(["cart"]);

			// Optimistically update
			queryClient.setQueryData<CartResponse>(["cart"], (old) => {
				if (!old?.data) return old;
				return {
					...old,
					data: old.data.filter((item) => item.productId !== productId),
				};
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

export function useCartClear() {
	const { token } = useAuthStore();

	return useMutation({
		mutationFn: () => {
			return client.cart.delete(
				{},
				{ headers: { Authorization: `Bearer ${token}` } },
			);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["cart"] });
		},
	});
}
