import { router } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Alert, type LayoutChangeEvent, ScrollView, View } from "react-native";
import {
	SafeAreaView,
	useSafeAreaInsets,
} from "react-native-safe-area-context";

import AccountManagementIcon from "@/assets/svg/account-management.svg";
import CartIcon from "@/assets/svg/cart.svg";
import HistoryIcon from "@/assets/svg/history.svg";
import ScanBarcodeIcon from "@/assets/svg/scan-barcode.svg";
import { BottomDock } from "@/components/bottom-dock";
import { HomeDealsRecommendationsSection } from "@/components/home-deals-recommendations-section";
import { HomeHeader } from "@/components/home-header";
import { HomeNotificationsSection } from "@/components/home-notifications-section";
import { useAuthStore, useLogout } from "@/features/auth/store";
import { useRecommendations } from "@/features/deals/hooks";
import { useAddProductToCart } from "@/features/products/hooks";
import { styles } from "@/styles/screens/home.styles";

export default function HomeScreen() {
	const { user } = useAuthStore();
	const logout = useLogout();
	const insets = useSafeAreaInsets();

	const [dockHeight, setDockHeight] = useState(0);
	const [dockCollapsed, setDockCollapsed] = useState(false);

	const firstName = useMemo(() => {
		if (!user) return null;
		if (typeof user.firstName === "string" && user.firstName.trim())
			return user.firstName.trim();
		if (typeof user.email === "string" && user.email.includes("@"))
			return user.email.split("@")[0];
		return null;
	}, [user]);

	const notifications = useMemo(
		() => [
			{
				id: "promo-1",
				title: "Deal of the week",
				body: "Save 10% on baskets over €30 until Sunday.",
			},
			{
				id: "info-1",
				title: "Update",
				body: "Product scanning is coming soon.",
			},
		],
		[],
	);

	const recommendationsQuery = useRecommendations();
	const addToCart = useAddProductToCart();

	const recommendations = useMemo(() => {
		const items = recommendationsQuery.data?.data ?? [];
		return items.slice(0, 3).map((r) => ({
			id: r.id,
			title: r.name,
			reason: r.reason,
		}));
	}, [recommendationsQuery.data]);

	const handleLogout = () => {
		logout.mutate();
	};

	const comingSoon = useCallback((featureName: string) => {
		Alert.alert("Coming soon", `${featureName} will be available soon.`);
	}, []);

	const toggleDockCollapsed = () => {
		setDockCollapsed((v) => !v);
	};

	const dockActions = useMemo(
		() => [
			{
				key: "scan",
				title: "Scan",
				subtitle: "Product",
				onPress: () => router.push("/scan"),
				Icon: ScanBarcodeIcon,
				iconColor: "#fff",
			},
			{
				key: "cart",
				title: "Cart",
				subtitle: "View",
				onPress: () => router.push("/cart"),
				Icon: CartIcon,
				iconColor: "#fff",
			},
			{
				key: "history",
				title: "History",
				subtitle: "Purchases",
				onPress: () => router.push("/history"),
				Icon: HistoryIcon,
				iconColor: "#fff",
			},
			{
				key: "account",
				title: "Account",
				subtitle: "Manage",
				onPress: () => router.push("/account-management"),
				Icon: AccountManagementIcon,
				iconColor: "#fff",
			},
		],
		[],
	);

	const dockBottomOffset = Math.max(0, (insets.bottom || 0) - 26);
	const dockPaddingBottom = 12;
	const visibleDockHeight = dockHeight
		? dockHeight + dockBottomOffset
		: (dockCollapsed ? 72 : 220) + dockBottomOffset;
	const scrollPaddingBottom = visibleDockHeight;

	const onDockLayout = (e: LayoutChangeEvent) => {
		const height = e?.nativeEvent?.layout?.height;
		if (!height || typeof height !== "number") return;
		setDockHeight(height);
	};

	return (
		<SafeAreaView style={styles.container}>
			<View style={styles.screen}>
				<ScrollView
					style={styles.scroll}
					contentContainerStyle={[
						styles.scrollContent,
						{ paddingBottom: scrollPaddingBottom },
					]}
					showsVerticalScrollIndicator={false}
				>
					<HomeHeader firstName={firstName} onLogout={handleLogout} />

					<HomeNotificationsSection
						title="Notifications"
						notifications={notifications}
						onPressNotification={() => comingSoon("Notification details")}
					/>

					<HomeDealsRecommendationsSection
						title="Deals & recommendations"
						recommendations={recommendations}
						onPressDeals={() =>
							router.push({ pathname: "/deals", params: { open: "promos" } })
						}
						onPressQuickPicks={() =>
							router.push({ pathname: "/deals", params: { open: "forYou" } })
						}
						onPressRecommendation={(recommendation) => {
							addToCart.mutate(
								{ productId: recommendation.id, quantity: 1 },
								{
									onSuccess: () =>
										Alert.alert(
											"Added to cart",
											recommendation.title,
										),
									onError: () =>
										Alert.alert(
											"Error",
											"Failed to add item to cart",
										),
								},
							);
						}}
					/>
				</ScrollView>

				<BottomDock
					collapsed={dockCollapsed}
					onToggleCollapsed={toggleDockCollapsed}
					onLayout={onDockLayout}
					bottomOffset={dockBottomOffset}
					paddingBottom={dockPaddingBottom}
					actions={dockActions}
				/>
			</View>
		</SafeAreaView>
	);
}
