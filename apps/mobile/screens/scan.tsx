import { router } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
	ActivityIndicator,
	Image,
	ScrollView,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import {
	SafeAreaView,
	useSafeAreaInsets,
} from "react-native-safe-area-context";

import { AppleToast } from "@/components/apple-toast";
import { ProductScanner } from "@/components/product-scanner";
import { QuantityStepper } from "@/components/quantity-stepper";
import {
	useAddProductToCart,
	useProductByBarcode,
} from "@/features/products/hooks";
import { styles } from "@/styles/screens/scan.styles";

export default function ScanScreen() {
	const insets = useSafeAreaInsets();

	const [scannedBarcode, setScannedBarcode] = useState<string | null>(null);
	const [quantity, setQuantity] = useState(1);
	const [toastVisible, setToastVisible] = useState(false);
	const [toastMessage, setToastMessage] = useState("");

	// Fetch product by barcode
	const {
		data: productResponse,
		isLoading,
		error,
	} = useProductByBarcode(scannedBarcode);

	// Add to cart mutation
	const addToCartMutation = useAddProductToCart();

	const product = productResponse?.data;
	const productNotFound =
		productResponse &&
		!productResponse.data &&
		productResponse.error?.value === "Product not found";

	const onDismissToast = useCallback(() => {
		setToastVisible(false);
	}, []);

	const handleScanned = useCallback(
		(result: { data: string; type: string }) => {
			const barcode = result.data?.trim();
			if (!barcode) {
				setToastMessage("Invalid barcode");
				setToastVisible(true);
				return;
			}
			setScannedBarcode(barcode);
			setQuantity(1);
		},
		[],
	);

	const handleBack = useCallback(() => {
		if (scannedBarcode) {
			setScannedBarcode(null);
			setQuantity(1);
		} else {
			router.back();
		}
	}, [scannedBarcode]);

	const handleAddToCart = useCallback(() => {
		if (!product) return;

		addToCartMutation.mutate(
			{ productId: product.id, quantity },
			{
				onSuccess: () => {
					setToastMessage(`Added ${quantity} to cart`);
					setToastVisible(true);
					setScannedBarcode(null);
					setQuantity(1);
				},
				onError: (error: unknown) => {
					let errorMessage = "Failed to add to cart";
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
	}, [product, quantity, addToCartMutation]);

	const formattedPrice = useMemo(() => {
		if (!product) return "";
		return new Intl.NumberFormat("fr-FR", {
			style: "currency",
			currency: "EUR",
		}).format(product.price);
	}, [product]);

	return (
		<SafeAreaView style={styles.container}>
			<AppleToast
				visible={toastVisible}
				title="SCAN"
				message={toastMessage}
				topInset={insets.top}
				onDismiss={onDismissToast}
			/>

			<View style={styles.screen}>
				<View style={styles.header}>
					<TouchableOpacity
						onPress={handleBack}
						accessibilityRole="button"
						style={styles.backPill}
						activeOpacity={0.85}
					>
						<Text style={styles.backPillText}>Back</Text>
					</TouchableOpacity>

					<Text style={styles.title}>
						{scannedBarcode ? "Product Details" : "Scan product"}
					</Text>

					<View style={styles.spacer} />
				</View>

				{!scannedBarcode ? (
					<View style={styles.scannerBlock}>
						<ProductScanner
							onScanned={handleScanned}
							scanningEnabled={!toastVisible}
						/>
					</View>
				) : isLoading ? (
					<View
						style={{
							flex: 1,
							justifyContent: "center",
							alignItems: "center",
						}}
					>
						<ActivityIndicator size="large" color="#000" />
						<Text style={{ marginTop: 16, fontSize: 16, color: "#666" }}>
							Loading product...
						</Text>
					</View>
				) : productNotFound ? (
					<View
						style={{
							flex: 1,
							justifyContent: "center",
							alignItems: "center",
							paddingHorizontal: 32,
						}}
					>
						<Text style={{ fontSize: 24, fontWeight: "600", marginBottom: 12 }}>
							Product Not Found
						</Text>
						<Text
							style={{
								fontSize: 16,
								color: "#666",
								textAlign: "center",
								marginBottom: 32,
							}}
						>
							This product is not in our database yet.
						</Text>
						<TouchableOpacity
							onPress={handleBack}
							style={{
								backgroundColor: "#000",
								paddingHorizontal: 32,
								paddingVertical: 16,
								borderRadius: 12,
							}}
							activeOpacity={0.85}
						>
							<Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>
								Scan Another Product
							</Text>
						</TouchableOpacity>
					</View>
				) : error ? (
					<View
						style={{
							flex: 1,
							justifyContent: "center",
							alignItems: "center",
							paddingHorizontal: 32,
						}}
					>
						<Text style={{ fontSize: 24, fontWeight: "600", marginBottom: 12 }}>
							Error
						</Text>
						<Text
							style={{
								fontSize: 16,
								color: "#666",
								textAlign: "center",
								marginBottom: 32,
							}}
						>
							Failed to load product. Please try again.
						</Text>
						<TouchableOpacity
							onPress={handleBack}
							style={{
								backgroundColor: "#000",
								paddingHorizontal: 32,
								paddingVertical: 16,
								borderRadius: 12,
							}}
							activeOpacity={0.85}
						>
							<Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>
								Go Back
							</Text>
						</TouchableOpacity>
					</View>
				) : product ? (
					<ScrollView
						style={{ flex: 1 }}
						contentContainerStyle={{ padding: 24 }}
						showsVerticalScrollIndicator={false}
					>
						{product.imageUrl && (
							<Image
								source={{ uri: product.imageUrl }}
								style={{
									width: "100%",
									height: 300,
									borderRadius: 16,
									backgroundColor: "#f5f5f5",
									marginBottom: 24,
								}}
								resizeMode="contain"
							/>
						)}

						<Text style={{ fontSize: 28, fontWeight: "700", marginBottom: 8 }}>
							{product.name}
						</Text>

						<Text style={{ fontSize: 32, fontWeight: "800", marginBottom: 16 }}>
							{formattedPrice}
						</Text>

						{product.description && (
							<Text
								style={{
									fontSize: 16,
									color: "#666",
									lineHeight: 24,
									marginBottom: 24,
								}}
							>
								{product.description}
							</Text>
						)}

						{(product.energyKcal !== null ||
							product.protein !== null ||
							product.carbs !== null ||
							product.fat !== null ||
							product.salt !== null) && (
							<View
								style={{
									backgroundColor: "#f5f5f5",
									borderRadius: 12,
									padding: 16,
									marginBottom: 24,
								}}
							>
								<Text
									style={{
										fontSize: 18,
										fontWeight: "600",
										marginBottom: 12,
									}}
								>
									Nutrition Information (per 100g)
								</Text>
								{product.energyKcal !== null && (
									<View
										style={{
											flexDirection: "row",
											justifyContent: "space-between",
											marginBottom: 8,
										}}
									>
										<Text style={{ fontSize: 16, color: "#666" }}>Energy</Text>
										<Text style={{ fontSize: 16, fontWeight: "500" }}>
											{product.energyKcal} kcal
										</Text>
									</View>
								)}
								{product.protein !== null && (
									<View
										style={{
											flexDirection: "row",
											justifyContent: "space-between",
											marginBottom: 8,
										}}
									>
										<Text style={{ fontSize: 16, color: "#666" }}>Protein</Text>
										<Text style={{ fontSize: 16, fontWeight: "500" }}>
											{product.protein}g
										</Text>
									</View>
								)}
								{product.carbs !== null && (
									<View
										style={{
											flexDirection: "row",
											justifyContent: "space-between",
											marginBottom: 8,
										}}
									>
										<Text style={{ fontSize: 16, color: "#666" }}>
											Carbohydrates
										</Text>
										<Text style={{ fontSize: 16, fontWeight: "500" }}>
											{product.carbs}g
										</Text>
									</View>
								)}
								{product.fat !== null && (
									<View
										style={{
											flexDirection: "row",
											justifyContent: "space-between",
											marginBottom: 8,
										}}
									>
										<Text style={{ fontSize: 16, color: "#666" }}>Fat</Text>
										<Text style={{ fontSize: 16, fontWeight: "500" }}>
											{product.fat}g
										</Text>
									</View>
								)}
								{product.salt !== null && (
									<View
										style={{
											flexDirection: "row",
											justifyContent: "space-between",
										}}
									>
										<Text style={{ fontSize: 16, color: "#666" }}>Salt</Text>
										<Text style={{ fontSize: 16, fontWeight: "500" }}>
											{product.salt}g
										</Text>
									</View>
								)}
							</View>
						)}

						<View
							style={{
								flexDirection: "row",
								alignItems: "center",
								justifyContent: "space-between",
								marginBottom: 16,
							}}
						>
							<Text style={{ fontSize: 18, fontWeight: "600" }}>Quantity</Text>
							<QuantityStepper value={quantity} onChange={setQuantity} />
						</View>

						<TouchableOpacity
							onPress={handleAddToCart}
							disabled={addToCartMutation.isPending}
							style={{
								backgroundColor: "#000",
								paddingVertical: 18,
								borderRadius: 12,
								alignItems: "center",
								marginBottom: insets.bottom + 16,
								opacity: addToCartMutation.isPending ? 0.6 : 1,
							}}
							activeOpacity={0.85}
						>
							{addToCartMutation.isPending ? (
								<ActivityIndicator color="#fff" />
							) : (
								<Text
									style={{ color: "#fff", fontSize: 18, fontWeight: "600" }}
								>
									Add to Cart
								</Text>
							)}
						</TouchableOpacity>
					</ScrollView>
				) : null}
			</View>
		</SafeAreaView>
	);
}
