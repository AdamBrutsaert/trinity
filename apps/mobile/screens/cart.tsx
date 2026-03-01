import { router } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
	ActivityIndicator,
	FlatList,
	type LayoutChangeEvent,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import {
	SafeAreaView,
	useSafeAreaInsets,
} from "react-native-safe-area-context";

import { AppleToast } from "@/components/apple-toast";
import { type CartItem, CartItemRow } from "@/components/cart-item-row";
import { CartOverviewCard } from "@/components/cart-overview-card";
import { CartPurchaseBar } from "@/components/cart-purchase-bar";
import {
	useCartItems,
	useCartRemoveItem,
	useCartUpdateItem,
} from "@/features/cart/hooks";
import { styles } from "@/styles/screens/cart.styles";

export default function CartScreen() {
	const insets = useSafeAreaInsets();

	const [purchaseBarHeight, setPurchaseBarHeight] = useState(84);
	const [toastVisible, setToastVisible] = useState(false);
	const [toastMessage, setToastMessage] = useState("");

	// Fetch cart items
	const { data: cartResponse, isLoading, error } = useCartItems();

	// Mutations
	const updateItemMutation = useCartUpdateItem();
	const removeItemMutation = useCartRemoveItem();

	// Transform API response to CartItem format
	const items = useMemo<CartItem[]>(() => {
		if (!cartResponse?.data) return [];
		return cartResponse.data.map((item) => ({
			id: item.productId,
			name: item.product.name,
			unitPriceCents: Math.round(item.product.price * 100),
			quantity: item.quantity,
		}));
	}, [cartResponse]);

	const itemsCount = useMemo(
		() => items.reduce((acc, item) => acc + item.quantity, 0),
		[items],
	);
	const totalCents = useMemo(
		() =>
			items.reduce((acc, item) => acc + item.unitPriceCents * item.quantity, 0),
		[items],
	);

	const onChangeQuantity = useCallback(
		(productId: string, quantity: number) => {
			updateItemMutation.mutate(
				{ productId, quantity },
				{
					onError: (error: unknown) => {
						let errorMessage = "Failed to update quantity";
						if (
							error &&
							typeof error === "object" &&
							"message" in error &&
							typeof (error as { message: unknown }).message === "string"
						) {
							errorMessage = (error as { message: string }).message;
						}
						setToastMessage(errorMessage);
						setToastVisible(true);
					},
				},
			);
		},
		[updateItemMutation],
	);

	const onRemove = useCallback(
		(productId: string) => {
			removeItemMutation.mutate(productId, {
				onError: (error: unknown) => {
					let errorMessage = "Failed to remove item";
					if (
						error &&
						typeof error === "object" &&
						"message" in error &&
						typeof (error as { message: unknown }).message === "string"
					) {
						errorMessage = (error as { message: string }).message;
					}
					setToastMessage(errorMessage);
					setToastVisible(true);
				},
			});
		},
		[removeItemMutation],
	);

	const onPurchase = useCallback(() => {
		router.push("/purchase");
	}, []);

	const onScanMore = useCallback(() => {
		router.push("/scan");
	}, []);

	const onPurchaseBarLayout = useCallback((e: LayoutChangeEvent) => {
		const next = Math.ceil(e.nativeEvent.layout.height);
		if (!Number.isFinite(next) || next <= 0) return;
		setPurchaseBarHeight(next);
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

					<Text style={styles.title}>Cart</Text>

					<View style={styles.spacer} />
				</View>

				{isLoading ? (
					<View
						style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
					>
						<ActivityIndicator size="large" color="#000" />
					</View>
				) : error ? (
					<View
						style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
					>
						<Text style={{ fontSize: 16, color: "#666" }}>
							Failed to load cart
						</Text>
					</View>
				) : (
					<>
						<CartOverviewCard
							totalCents={totalCents}
							itemsCount={itemsCount}
							onScanMore={onScanMore}
						/>

						<FlatList
							style={styles.list}
							contentContainerStyle={[
								styles.listContent,
								{
									paddingBottom:
										purchaseBarHeight + Math.max(24, insets.bottom + 18),
								},
								items.length === 0 ? styles.listContentEmpty : null,
							]}
							data={items}
							keyExtractor={(item) => item.id}
							showsVerticalScrollIndicator={false}
							renderItem={({ item }) => (
								<CartItemRow
									item={item}
									onChangeQuantity={onChangeQuantity}
									onRemove={onRemove}
								/>
							)}
							ListEmptyComponent={
								<View style={styles.emptyCard}>
									<Text style={styles.emptyTitle}>Your cart is empty</Text>
									<Text style={styles.emptyBody}>
										Scan products and add them here.
									</Text>
								</View>
							}
						/>
					</>
				)}
			</View>

			{!isLoading && !error && (
				<CartPurchaseBar
					totalCents={totalCents}
					itemsCount={itemsCount}
					bottomInset={insets.bottom}
					onPurchase={onPurchase}
					onLayout={onPurchaseBarLayout}
				/>
			)}

			<AppleToast
				visible={toastVisible}
				title="CART"
				message={toastMessage}
				topInset={insets.top}
				onDismiss={() => setToastVisible(false)}
			/>
		</SafeAreaView>
	);
}
