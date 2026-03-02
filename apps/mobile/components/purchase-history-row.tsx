import { useMemo } from "react";
import { Text, TouchableOpacity, View } from "react-native";

import type { Invoice } from "@/features/invoices/hooks";
import { styles } from "@/styles/components/purchase-history-row.styles";

export type PurchaseHistoryItem = Invoice;

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

export function PurchaseHistoryRow({
item,
onPress,
}: {
item: PurchaseHistoryItem;
onPress: (item: PurchaseHistoryItem) => void;
}) {
const dateLabel = useMemo(() => formatDate(item.createdAt), [item.createdAt]);
const totalLabel = useMemo(
() => formatAmount(item.totalAmount),
[item.totalAmount],
);

const badgeText = item.status === "completed" ? "PAID" : "PENDING";

return (
<TouchableOpacity
accessibilityRole="button"
activeOpacity={0.85}
style={styles.card}
onPress={() => onPress(item)}
>
<View style={styles.topRow}>
<Text style={styles.date}>{dateLabel}</Text>
<View
style={[
styles.badge,
item.status === "completed" ? styles.badgePaid : styles.badgePending,
]}
>
<Text style={styles.badgeText}>{badgeText}</Text>
</View>
</View>
<Text style={styles.total}>{totalLabel}</Text>
<Text style={styles.orderId} numberOfLines={1}>
Ref: {item.paypalOrderId}
</Text>
</TouchableOpacity>
);
}
