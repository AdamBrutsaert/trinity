import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { type LayoutChangeEvent, ScrollView, Text, View } from "react-native";
import {
	SafeAreaView,
	useSafeAreaInsets,
} from "react-native-safe-area-context";

import { AppleToast } from "@/components/apple-toast";
import { HistoryOrderActionsBar } from "@/components/history-order-actions-bar";
import { PurchaseLineItemRow } from "@/components/purchase-line-item-row";
import { getFakePurchaseDetailsById } from "@/lib/fake-purchase-history";
import { styles } from "@/styles/screens/history-order.styles";

function formatEur(cents: number): string {
	const value = cents / 100;
	return new Intl.NumberFormat("fr-FR", {
		style: "currency",
		currency: "EUR",
	}).format(value);
}

function formatDate(iso: string): string {
	const date = new Date(iso);
	if (Number.isNaN(date.getTime())) return "Unknown date";
	return new Intl.DateTimeFormat("en-GB", {
		day: "2-digit",
		month: "short",
		year: "numeric",
	}).format(date);
}

export default function HistoryOrderScreen() {
	const insets = useSafeAreaInsets();
	const params = useLocalSearchParams();
	const id = typeof params.id === "string" ? params.id : "";

	const [actionsHeight, setActionsHeight] = useState(110);
	const [toastVisible, setToastVisible] = useState(false);
	const [toastMessage, setToastMessage] = useState("");

	const details = useMemo(
		() => (id ? getFakePurchaseDetailsById(id) : null),
		[id],
	);

	const statusBadge = useMemo(() => {
		if (!details) return null;
		const text = details.status.toUpperCase();
		return (
			<View
				style={[
					styles.badge,
					details.status === "paid" ? styles.badgePaid : null,
					details.status === "pending" ? styles.badgePending : null,
					details.status === "refunded" ? styles.badgeRefunded : null,
				]}
			>
				<Text style={styles.badgeText}>{text}</Text>
			</View>
		);
	}, [details]);

	const onActionsLayout = useCallback((e: LayoutChangeEvent) => {
		const next = Math.ceil(e.nativeEvent.layout.height);
		if (!Number.isFinite(next) || next <= 0) return;
		setActionsHeight(next);
	}, []);

	const onReorder = useCallback(() => {
		setToastMessage("Reorder is UI-only for now");
		setToastVisible(true);
	}, []);

	const canReorder = Boolean(details && details.status === "paid");

	if (!details) {
		return (
			<SafeAreaView style={styles.container}>
				<View style={styles.screen}>
					<View style={styles.card}>
						<Text style={styles.title}>Order not found</Text>
						<Text style={styles.subtitle}>
							This is UI-only for now. Please go back.
						</Text>
					</View>
				</View>

				<HistoryOrderActionsBar
					onClose={() => router.back()}
					onReorder={onReorder}
					canReorder={false}
					onLayout={onActionsLayout}
				/>

				<AppleToast
					visible={toastVisible}
					title="ORDER"
					message={toastMessage}
					topInset={insets.top}
					onDismiss={() => setToastVisible(false)}
				/>
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView style={styles.container}>
			<View style={styles.screen}>
				<ScrollView
					showsVerticalScrollIndicator={false}
					contentContainerStyle={[
						styles.content,
						{ paddingBottom: actionsHeight + Math.max(24, insets.bottom + 18) },
					]}
				>
					<View style={styles.card}>
						<Text style={styles.sectionTitle}>ORDER DETAILS</Text>
						<View style={styles.headerTop}>
							<View style={styles.headerLeft}>
								<Text style={styles.title}>{details.storeName}</Text>
								<Text style={styles.subtitle}>
									{details.id} • {formatDate(details.createdAtIso)}
								</Text>
							</View>
							{statusBadge}
						</View>

						<View style={styles.totalRow}>
							<Text style={styles.totalLabel}>TOTAL</Text>
							<Text style={styles.totalValue}>
								{formatEur(details.totalCents)}
							</Text>
						</View>

						<View style={styles.metaRow}>
							<Text style={styles.metaLabel}>
								Payment:{" "}
								<Text style={styles.metaValue}>
									{details.paymentMethodLabel}
								</Text>
							</Text>
							<Text style={styles.metaLabel}>
								Receipt:{" "}
								<Text style={styles.metaValue}>{details.receiptNumber}</Text>
							</Text>
						</View>

						<Text style={styles.tip}>
							Tip: receipts will be downloadable soon. For now this page is{" "}
							<Text style={styles.tipEmphasis}>UI-only</Text>.
						</Text>
					</View>

					<View style={styles.lineItemsCard}>
						<Text style={styles.sectionTitle}>ITEMS</Text>
						{details.lineItems.map((li) => (
							<PurchaseLineItemRow key={li.id} item={li} />
						))}

						<View style={styles.lineItemsFooter}>
							<View style={styles.totalRow}>
								<Text style={styles.totalLabel}>TOTAL</Text>
								<Text style={styles.totalValue}>
									{formatEur(details.totalCents)}
								</Text>
							</View>
						</View>
					</View>
				</ScrollView>
			</View>

			<HistoryOrderActionsBar
				onClose={() => router.back()}
				onReorder={onReorder}
				canReorder={canReorder}
				onLayout={onActionsLayout}
			/>

			<AppleToast
				visible={toastVisible}
				title="ORDER"
				message={toastMessage}
				topInset={insets.top}
				onDismiss={() => setToastVisible(false)}
			/>
		</SafeAreaView>
	);
}
