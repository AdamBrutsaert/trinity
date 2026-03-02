import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useCallback, useState } from "react";
import {
	ActivityIndicator,
	ScrollView,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";
import {
	SafeAreaView,
	useSafeAreaInsets,
} from "react-native-safe-area-context";

import { AppleToast } from "@/components/apple-toast";
import { useAuthStore } from "@/features/auth/store";
import {
	extractErrorMessage,
	useCaptureOrder,
	useCreateOrder,
} from "@/features/orders/hooks";
import { styles } from "@/styles/screens/purchase.styles";

const RETURN_URL = "mobile://payment/success";
const CANCEL_URL = "mobile://payment/cancel";

type ShippingInfo = {
	address: string;
	zipCode: string;
	city: string;
	country: string;
};

type PageState =
	| { status: "confirming_shipping" }
	| { status: "initializing" }
	| { status: "awaiting_browser"; orderId: string }
	| { status: "capturing" }
	| { status: "success" }
	| { status: "cancelled" }
	| { status: "error"; message: string };

export default function PurchaseScreen() {
	const insets = useSafeAreaInsets();
	const { user } = useAuthStore();
	const [pageState, setPageState] = useState<PageState>({
		status: "confirming_shipping",
	});
	const [toastVisible, setToastVisible] = useState(false);
	const [toastMessage, setToastMessage] = useState("");

	// Shipping form state, pre-filled from auth store
	const [address, setAddress] = useState(user?.address ?? "");
	const [zipCode, setZipCode] = useState(user?.zipCode ?? "");
	const [city, setCity] = useState(user?.city ?? "");
	const [country, setCountry] = useState(user?.country ?? "");
	const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

	const createOrderMutation = useCreateOrder();
	const captureOrderMutation = useCaptureOrder();

	// Prevent double-fire in React strict mode / re-renders
	const showToast = useCallback((message: string) => {
		setToastMessage(message);
		setToastVisible(true);
	}, []);

	const startPaymentFlow = useCallback(async (shipping: ShippingInfo) => {
		setPageState({ status: "initializing" });

		let orderId: string;
		let approvalUrl: string;

		try {
			const order = await createOrderMutation.mutateAsync({
				returnUrl: RETURN_URL,
				cancelUrl: CANCEL_URL,
				shippingAddress: shipping.address,
				shippingZipCode: shipping.zipCode,
				shippingCity: shipping.city,
				shippingCountry: shipping.country,
			});
			orderId = order.orderId;
			approvalUrl = order.approvalUrl;
		} catch (err) {
			const message = extractErrorMessage(err, "Failed to create order");
			setPageState({ status: "error", message });
			showToast(message);
			return;
		}

		setPageState({ status: "awaiting_browser", orderId });

		let browserResult: WebBrowser.WebBrowserAuthSessionResult;
		try {
			browserResult = await WebBrowser.openAuthSessionAsync(
				approvalUrl,
				// Matches both mobile://payment/success and mobile://payment/cancel
				"mobile://payment",
			);
		} catch {
			setPageState({ status: "error", message: "Unable to open browser" });
			showToast("Unable to open browser");
			return;
		}

		// User dismissed the browser without completing the flow
		if (browserResult.type === "cancel" || browserResult.type === "dismiss") {
			setPageState({ status: "cancelled" });
			return;
		}

		const redirectUrl =
			browserResult.type === "success" ? browserResult.url : "";

		if (redirectUrl.startsWith(CANCEL_URL)) {
			setPageState({ status: "cancelled" });
			return;
		}

		// Proceed to capture
		setPageState({ status: "capturing" });

		try {
			await captureOrderMutation.mutateAsync(orderId);
			setPageState({ status: "success" });
		} catch (err) {
			const message = extractErrorMessage(err, "Failed to confirm payment");
			setPageState({ status: "error", message });
			showToast(message);
		}
	}, [createOrderMutation, captureOrderMutation, showToast]);

	const handleConfirmShipping = useCallback(() => {
		const errors: Record<string, string> = {};
		if (!address.trim()) errors.address = "Required";
		if (!zipCode.trim()) errors.zipCode = "Required";
		if (!city.trim()) errors.city = "Required";
		if (!country.trim()) errors.country = "Required";

		if (Object.keys(errors).length > 0) {
			setFieldErrors(errors);
			return;
		}

		setFieldErrors({});
		startPaymentFlow({
			address: address.trim(),
			zipCode: zipCode.trim(),
			city: city.trim(),
			country: country.trim(),
		});
	}, [address, zipCode, city, country, startPaymentFlow]);

	const handleRetry = useCallback(() => {
		setPageState({ status: "confirming_shipping" });
	}, []);

	const handleBackToCart = useCallback(() => {
		router.back();
	}, []);

	const handleGoHome = useCallback(() => {
		router.dismissAll();
	}, []);

	return (
		<SafeAreaView style={styles.container}>
			<View style={styles.screen}>
				{pageState.status === "confirming_shipping" && (
					<ScrollView
						contentContainerStyle={styles.formContainer}
						showsVerticalScrollIndicator={false}
					>
						<Text style={styles.formTitle}>Confirm shipping</Text>
						<Text style={styles.formSubtitle}>
							Verify your shipping details before proceeding to payment.
						</Text>
						<View style={styles.formFields}>
							<View>
								<Text style={styles.fieldLabel}>Address</Text>
								<TextInput
									style={[
										styles.fieldInput,
										fieldErrors.address ? styles.fieldInputError : undefined,
									]}
									value={address}
									onChangeText={setAddress}
									placeholder="123 Main Street"
									placeholderTextColor="#AAA"
								/>
							</View>
							<View>
								<Text style={styles.fieldLabel}>ZIP / Postal code</Text>
								<TextInput
									style={[
										styles.fieldInput,
										fieldErrors.zipCode ? styles.fieldInputError : undefined,
									]}
									value={zipCode}
									onChangeText={setZipCode}
									placeholder="75001"
									placeholderTextColor="#AAA"
								/>
							</View>
							<View>
								<Text style={styles.fieldLabel}>City</Text>
								<TextInput
									style={[
										styles.fieldInput,
										fieldErrors.city ? styles.fieldInputError : undefined,
									]}
									value={city}
									onChangeText={setCity}
									placeholder="Paris"
									placeholderTextColor="#AAA"
								/>
							</View>
							<View>
								<Text style={styles.fieldLabel}>Country</Text>
								<TextInput
									style={[
										styles.fieldInput,
										fieldErrors.country ? styles.fieldInputError : undefined,
									]}
									value={country}
									onChangeText={setCountry}
									placeholder="France"
									placeholderTextColor="#AAA"
								/>
							</View>
						</View>
						<TouchableOpacity
							style={styles.primaryButton}
							onPress={handleConfirmShipping}
							activeOpacity={0.85}
						>
							<Text style={styles.primaryButtonText}>Confirm & Pay</Text>
						</TouchableOpacity>
						<TouchableOpacity
							style={styles.secondaryButton}
							onPress={handleBackToCart}
							activeOpacity={0.85}
						>
							<Text style={styles.secondaryButtonText}>Back to cart</Text>
						</TouchableOpacity>
					</ScrollView>
				)}

				{(pageState.status === "initializing" ||
					pageState.status === "awaiting_browser" ||
					pageState.status === "capturing") && (
					<View style={styles.centerBlock}>
						<ActivityIndicator size="large" color="#111" />
						<Text style={styles.loadingTitle}>
							{pageState.status === "capturing"
								? "Confirming your payment…"
								: "Setting up your payment…"}
						</Text>
						<Text style={styles.loadingSubtitle}>Please wait a moment.</Text>
					</View>
				)}

				{pageState.status === "success" && (
					<View style={styles.centerBlock}>
						<View style={styles.successIcon}>
							<Text style={styles.successIconText}>✓</Text>
						</View>
						<Text style={styles.title}>Payment confirmed!</Text>
						<Text style={styles.subtitle}>
							Your order has been placed successfully.
						</Text>
						<TouchableOpacity
							style={styles.primaryButton}
							onPress={handleGoHome}
							activeOpacity={0.85}
						>
							<Text style={styles.primaryButtonText}>Back to home</Text>
						</TouchableOpacity>
					</View>
				)}

				{pageState.status === "cancelled" && (
					<View style={styles.centerBlock}>
						<View style={styles.cancelIcon}>
							<Text style={styles.cancelIconText}>✕</Text>
						</View>
						<Text style={styles.title}>Payment cancelled</Text>
						<Text style={styles.subtitle}>
							You cancelled the PayPal checkout. Your cart is still saved.
						</Text>
						<TouchableOpacity
							style={styles.primaryButton}
							onPress={handleRetry}
							activeOpacity={0.85}
						>
							<Text style={styles.primaryButtonText}>Try again</Text>
						</TouchableOpacity>
						<TouchableOpacity
							style={styles.secondaryButton}
							onPress={handleBackToCart}
							activeOpacity={0.85}
						>
							<Text style={styles.secondaryButtonText}>Back to cart</Text>
						</TouchableOpacity>
					</View>
				)}

				{pageState.status === "error" && (
					<View style={styles.centerBlock}>
						<View style={styles.errorIcon}>
							<Text style={styles.errorIconText}>!</Text>
						</View>
						<Text style={styles.title}>Something went wrong</Text>
						<Text style={styles.subtitle}>{pageState.message}</Text>
						<TouchableOpacity
							style={styles.primaryButton}
							onPress={handleRetry}
							activeOpacity={0.85}
						>
							<Text style={styles.primaryButtonText}>Try again</Text>
						</TouchableOpacity>
						<TouchableOpacity
							style={styles.secondaryButton}
							onPress={handleBackToCart}
							activeOpacity={0.85}
						>
							<Text style={styles.secondaryButtonText}>Back to cart</Text>
						</TouchableOpacity>
					</View>
				)}
			</View>

			<AppleToast
				visible={toastVisible}
				title="PAYMENT"
				message={toastMessage}
				topInset={insets.top}
				onDismiss={() => setToastVisible(false)}
			/>
		</SafeAreaView>
	);
}
