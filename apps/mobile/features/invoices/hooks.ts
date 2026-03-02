import { useQuery } from "@tanstack/react-query";

import { useAuthStore } from "@/features/auth/store";
import { client } from "@/lib/api";

export type InvoiceItem = {
	id: string;
	invoiceId: string;
	productId: string;
	productName: string;
	unitPrice: string;
	quantity: number;
	createdAt: string;
};

export type Invoice = {
	id: string;
	userId: string;
	paypalOrderId: string;
	status: "pending" | "completed";
	totalAmount: string;
	shippingAddress: string | null;
	shippingZipCode: string | null;
	shippingCity: string | null;
	shippingCountry: string | null;
	createdAt: string;
	updatedAt: string;
};

export type InvoiceWithItems = Invoice & {
	items: InvoiceItem[];
};

export function useMyInvoices() {
	const { token, user } = useAuthStore();

	return useQuery<Invoice[]>({
		queryKey: ["invoices", "mine", user?.id],
		enabled: Boolean(token) && Boolean(user?.id),
		queryFn: async () => {
			if (!user?.id) throw new Error("Not authenticated");

			const response = await client.invoices
				.users({ id: user.id })
				.get({ headers: { Authorization: `Bearer ${token}` } });

			if (response.status !== 200) {
				throw new Error("Failed to load purchase history");
			}

			return response.data as Invoice[];
		},
	});
}

export function useInvoice(id: string) {
	const { token } = useAuthStore();

	return useQuery<InvoiceWithItems>({
		queryKey: ["invoices", id],
		enabled: Boolean(token) && Boolean(id),
		queryFn: async () => {
			const response = await client
				.invoices({ id })
				.get({ headers: { Authorization: `Bearer ${token}` } });

			if (response.status === 404) throw new Error("Invoice not found");
			if (response.status !== 200) throw new Error("Failed to load order");

			return response.data as InvoiceWithItems;
		},
	});
}
