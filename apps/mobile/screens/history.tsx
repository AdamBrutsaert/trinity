import { router } from "expo-router";
import { useCallback, useState } from "react";
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
import { HistoryActionsBar } from "@/components/history-actions-bar";
import {
type PurchaseHistoryItem,
PurchaseHistoryRow,
} from "@/components/purchase-history-row";
import { useMyInvoices } from "@/features/invoices/hooks";
import { styles } from "@/styles/screens/history.styles";

export default function HistoryScreen() {
const insets = useSafeAreaInsets();

const [actionsHeight, setActionsHeight] = useState(110);
const [toastVisible, setToastVisible] = useState(false);
const [toastMessage, setToastMessage] = useState("");

const { data: invoices, isLoading, isError } = useMyInvoices();

const onRowPress = useCallback((item: PurchaseHistoryItem) => {
router.push({ pathname: "/history-order", params: { id: item.id } });
}, []);

const onActionsLayout = useCallback((e: LayoutChangeEvent) => {
const next = Math.ceil(e.nativeEvent.layout.height);
if (!Number.isFinite(next) || next <= 0) return;
setActionsHeight(next);
}, []);

if (isError && !toastVisible) {
setToastMessage("Failed to load purchase history");
setToastVisible(true);
}

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

<Text style={styles.title}>History</Text>

<View style={styles.spacer} />
</View>

{isLoading ? (
<View style={styles.centerBlock}>
<ActivityIndicator size="large" color="#111" />
</View>
) : (
<FlatList
style={styles.list}
contentContainerStyle={[
styles.listContent,
{
paddingBottom:
actionsHeight + Math.max(24, insets.bottom + 18),
},
]}
data={invoices ?? []}
keyExtractor={(item) => item.id}
showsVerticalScrollIndicator={false}
ListHeaderComponent={
<View style={styles.summaryCard}>
<Text style={styles.summaryLabel}>PURCHASE HISTORY</Text>
<Text style={styles.summaryTitle}>
{(invoices ?? []).length} recent purchases
</Text>
</View>
}
renderItem={({ item }) => (
<PurchaseHistoryRow item={item} onPress={onRowPress} />
)}
ListEmptyComponent={
<View style={styles.emptyCard}>
<Text style={styles.emptyTitle}>No purchases yet</Text>
<Text style={styles.emptyBody}>
Scan products and complete a purchase to see your history
here.
</Text>
</View>
}
/>
)}
</View>

<HistoryActionsBar
onScan={() => router.push("/scan")}
onCart={() => router.push("/cart")}
onLayout={onActionsLayout}
/>

<AppleToast
visible={toastVisible}
title="HISTORY"
message={toastMessage}
topInset={insets.top}
onDismiss={() => setToastVisible(false)}
/>
</SafeAreaView>
);
}
