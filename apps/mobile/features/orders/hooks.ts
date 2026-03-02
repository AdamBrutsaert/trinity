import { useMutation } from "@tanstack/react-query";

import { useAuthStore } from "@/features/auth/store";
import { client } from "@/lib/api";
import { queryClient } from "@/screens/_layout";

type CreateOrderParams = {
	returnUrl: string;
	cancelUrl: string;
	shippingAddress: string;
	shippingZipCode: string;
	shippingCity: string;
	shippingCountry: string;
};

type CreateOrderResponse = {
	orderId: string;
	approvalUrl: string;
};

type CaptureOrderResponse = {
	orderId: string;
};

function extractErrorMessage(error: unknown, fallback: string): string {
	if (
		error &&
		typeof error === "object" &&
		"message" in error &&
		typeof (error as { message: unknown }).message === "string"
	) {
		return (error as { message: string }).message;
	}
	return fallback;
}

export function useCreateOrder() {
	const { token } = useAuthStore();

	return useMutation<CreateOrderResponse, Error, CreateOrderParams>({
		mutationFn: async ({
			returnUrl,
			cancelUrl,
			shippingAddress,
			shippingZipCode,
			shippingCity,
			shippingCountry,
		}) => {
			const response = await client.orders.post(
				{
					returnUrl,
					cancelUrl,
					shippingAddress,
					shippingZipCode,
					shippingCity,
					shippingCountry,
				},
				{ headers: { Authorization: `Bearer ${token}` } },
			);

			if (response.status !== 200) {
				throw new Error("Failed to create order");
			}

			return response.data as CreateOrderResponse;
		},
	});
}

export function useCaptureOrder() {
	const { token } = useAuthStore();

	return useMutation<CaptureOrderResponse, Error, string>({
		mutationFn: async (orderId: string) => {
			const response = await client
				.orders({ orderId })
				.capture.post({}, { headers: { Authorization: `Bearer ${token}` } });

			if (response.status !== 200) {
				throw new Error("Failed to capture order");
			}

			return response.data as CaptureOrderResponse;
		},
		onSuccess: () => {
			// Invalidate cart so it reflects as empty after purchase
			queryClient.invalidateQueries({ queryKey: ["cart"] });
		},
	});
}

export { extractErrorMessage };
