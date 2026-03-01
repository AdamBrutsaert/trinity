import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import {
	SafeAreaView,
	useSafeAreaInsets,
} from "react-native-safe-area-context";

import { AppleToast } from "@/components/apple-toast";
import {
	DealProductRow,
	type DealProductRowModel,
} from "@/components/deal-product-row";
import { DealsSectionCard } from "@/components/deals-section-card";
import { getFakePromos, getFakeQuickPicks } from "@/lib/fake-deals";
import { styles } from "@/styles/screens/deals.styles";

type DealsOpenSection = "promos" | "forYou" | null;

function getInitialOpenSection(param: unknown): DealsOpenSection {
	if (param === "forYou") return "forYou";
	if (param === "promos") return "promos";
	return "promos";
}

export default function DealsScreen() {
	const insets = useSafeAreaInsets();
	const params = useLocalSearchParams();

	const [openSection, setOpenSection] = useState<DealsOpenSection>(() =>
		getInitialOpenSection(typeof params.open === "string" ? params.open : null),
	);

	const [toastVisible, setToastVisible] = useState(false);
	const [toastMessage, setToastMessage] = useState("");

	const promos = useMemo(() => getFakePromos(), []);
	const quickPicks = useMemo(() => getFakeQuickPicks(), []);

	const openPromos = openSection === "promos";
	const openForYou = openSection === "forYou";

	const onTogglePromos = useCallback(() => {
		setOpenSection((current) => (current === "promos" ? null : "promos"));
	}, []);

	const onToggleForYou = useCallback(() => {
		setOpenSection((current) => (current === "forYou" ? null : "forYou"));
	}, []);

	const onAdd = useCallback((item: DealProductRowModel) => {
		setToastMessage(`${item.name} (UI-only for now)`);
		setToastVisible(true);
	}, []);

	return (
		<SafeAreaView style={styles.container}>
			<View style={styles.screen}>
				<View style={styles.header}>
					<TouchableOpacity
						onPress={() => router.back()}
						accessibilityRole="button"
						style={styles.backPill}
						activeOpacity={0.85}
					>
						<Text style={styles.backPillText}>Back</Text>
					</TouchableOpacity>

					<Text style={styles.title}>Deals</Text>

					<View style={styles.spacer} />
				</View>

				<ScrollView
					showsVerticalScrollIndicator={false}
					contentContainerStyle={[
						styles.content,
						{ paddingBottom: 24 + Math.max(0, insets.bottom) },
					]}
				>
					<View style={styles.hintCard}>
						<Text style={styles.hintLabel}>DEALS & RECOMMENDATIONS</Text>
						<Text style={styles.hintTitle}>Personalized, but UI-only</Text>
						<Text style={styles.hintBody}>
							The API isn’t connected yet. For now you can browse fake data for{" "}
							<Text style={styles.hintEmphasis}>Promos</Text> and{" "}
							<Text style={styles.hintEmphasis}>For you</Text>.
						</Text>
					</View>

					<DealsSectionCard
						variant="promo"
						pillLabel="PROMOS"
						title="Promo — save on essentials"
						subtitle="All current discounts across products"
						open={openPromos}
						onPress={onTogglePromos}
					>
						{promos.map((p) => (
							<DealProductRow
								key={p.id}
								item={{
									id: p.id,
									name: p.name,
									subtitle: p.categoryLabel,
									unitPriceCents: p.unitPriceCents,
									originalUnitPriceCents: p.originalUnitPriceCents,
								}}
								actionLabel="Add"
								onPressAction={onAdd}
							/>
						))}
					</DealsSectionCard>

					<DealsSectionCard
						variant="forYou"
						pillLabel="FOR YOU"
						title="Quick picks"
						subtitle="Based on your recent baskets"
						open={openForYou}
						onPress={onToggleForYou}
					>
						{quickPicks.map((q) => (
							<DealProductRow
								key={q.id}
								item={{
									id: q.id,
									name: q.name,
									subtitle: q.reason,
									unitPriceCents: q.unitPriceCents,
								}}
								actionLabel="Add"
								onPressAction={onAdd}
							/>
						))}
					</DealsSectionCard>
				</ScrollView>
			</View>

			<AppleToast
				visible={toastVisible}
				title="DEALS"
				message={toastMessage}
				topInset={insets.top}
				onDismiss={() => setToastVisible(false)}
			/>
		</SafeAreaView>
	);
}
