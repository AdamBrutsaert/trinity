import { useQuery } from "@tanstack/react-query";

import { useAuthStore } from "@/features/auth/store";
import { apiBaseUrl, client } from "@/lib/api";

export type DealPromoItem = {
	id: string;
	name: string;
	categoryLabel: string;
	unitPriceCents: number;
	originalUnitPriceCents: number;
};

export type DealQuickPickItem = {
	id: string;
	name: string;
	reason: string;
	unitPriceCents: number;
};

export function useDeals() {
	return useQuery({
		queryKey: ["deals"],
		queryFn: async () => {
			const res = await client.deals.get();
			if (res.data) return res;

			const status = (res.error as { status?: number } | null | undefined)
				?.status;
			if (status === 404) {
				// Some deployments (or proxies) might only match the trailing-slash route.
				const alt = await fetch(`${apiBaseUrl}/deals/`);
				if (alt.ok) {
					const data = (await alt.json()) as DealPromoItem[];
					return { data } as unknown as typeof res;
				}
			}

			if (res.error) throw res.error;
			throw new Error("Failed to load deals");
		},
		retry: 1,
	});
}

export function useRecommendations() {
	const { token } = useAuthStore();

	return useQuery({
		queryKey: ["recommendations"],
		queryFn: async () => {
			const headers = { Authorization: `Bearer ${token}` };
			const res = await client.recommendations.get({ headers });
			if (res.data) return res;

			const status = (res.error as { status?: number } | null | undefined)
				?.status;
			if (status === 404) {
				const alt = await fetch(`${apiBaseUrl}/recommendations/`, { headers });
				if (alt.ok) {
					const data = (await alt.json()) as DealQuickPickItem[];
					return { data } as unknown as typeof res;
				}
			}

			if (res.error) throw res.error;
			throw new Error("Failed to load recommendations");
		},
		enabled: typeof token === "string" && token.length > 0,
		retry: 1,
	});
}
