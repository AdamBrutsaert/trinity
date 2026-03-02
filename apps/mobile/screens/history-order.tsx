import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
ActivityIndicator,
type LayoutChangeEvent,
ScrollView,
Text,
View,
} from "react-native";
import {
SafeAreaView,
useSafeAreaInsets,
} from "react-native-safe-area-context";

import { AppleToast } from "@/components/apple-toast";
import { HistoryOrderActionsBar } from "@/components/history-order-actions-bar";
import { PurchaseLineItemRow } from "@/components/purchase-line-item-row";
import { useInvoice } from "@/features/invoices/hooks";
import { styles } from "@/styles/screens/history-order.styles";

function formatAmount(amount: string): string {
const value = parseFloat(amount);
if (Number.isNaN(value)) return amount;
return new Intl.NumberFormat("fr-FR", {
style: "currency",
currency: "USD",
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

const { data: invoice, isLoading, isError } = useInvoice(id);

const statusBadge = useMemo(() => {
if (!invoice) return null;
const text = invoice.status.toUpperCase();
return (
<View
style={[
styles.badge,
invoice.status === "completed" ? styles.badgeCompleted : null,
invoice.status === "pending" ? styles.badgePending : null,
]}
>
<Text style={styles.badgeText}>{text}</Text>
</View>
);
}, [invoice]);

const onActionsLayout = useCallback((e: LayoutChangeEvent) => {
const next = Math.ceil(e.nativeEvent.layout.height);
if (!Number.isFinite(next) || next <= 0) return;
setActionsHeight(next);
}, []);

if (isError && !toastVisible) {
setToastMessage("Failed to load order details");
setToastVisible(true);
}

if (isLoading) {
return (
<SafeAreaView style={styles.container}>
<View style={styles.screen}>
<View style={styles.centerBlock}>
<ActivityIndicator size="large" color="#111" />
</View>
</View>

<HistoryOrderActionsBar
onClose={() => router.back()}
onLayout={onActionsLayout}
/>
</SafeAreaView>
);
}

if (!invoice) {
return (
<SafeAreaView style={styles.container}>
<View style={styles.screen}>
<View style={styles.card}>
<Text style={styles.title}>Order not found</Text>
<Text style={styles.subtitle}>
This order could not be loaded.
</Text>
</View>
</View>

<HistoryOrderActionsBar
onClose={() => router.back()}
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

const hasShipping =
invoice.shippingAddress ||
invoice.shippingCity ||
invoice.shippingZipCode ||
invoice.shippingCountry;

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
<Text style={styles.title}>Order #{invoice.id.slice(0, 8)}</Text>
<Text style={styles.subtitle}>
{formatDate(invoice.createdAt)}
</Text>
</View>
{statusBadge}
</View>

<View style={styles.totalRow}>
<Text style={styles.totalLabel}>TOTAL</Text>
<Text style={styles.totalValue}>
{formatAmount(invoice.totalAmount)}
</Text>
</View>
</View>

{hasShipping && (
<View style={styles.shippingCard}>
<Text style={styles.sectionTitle}>SHIPPING ADDRESS</Text>
{invoice.shippingAddress && (
<Text style={styles.shippingLine}>{invoice.shippingAddress}</Text>
)}
{(invoice.shippingZipCode || invoice.shippingCity) && (
<Text style={styles.shippingLine}>
{[invoice.shippingZipCode, invoice.shippingCity]
.filter(Boolean)
.join(" ")}
</Text>
)}
{invoice.shippingCountry && (
<Text style={styles.shippingLine}>{invoice.shippingCountry}</Text>
)}
</View>
)}

<View style={styles.lineItemsCard}>
<Text style={styles.sectionTitle}>ITEMS</Text>
{invoice.items.map((item) => (
<PurchaseLineItemRow key={item.id} item={item} />
))}

<View style={styles.lineItemsFooter}>
<View style={styles.totalRow}>
<Text style={styles.totalLabel}>TOTAL</Text>
<Text style={styles.totalValue}>
{formatAmount(invoice.totalAmount)}
</Text>
</View>
</View>
</View>
</ScrollView>
</View>

<HistoryOrderActionsBar
onClose={() => router.back()}
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
