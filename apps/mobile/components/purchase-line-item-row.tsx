import { Text, View } from "react-native";

import type { InvoiceItem } from "@/features/invoices/hooks";
import { styles } from "@/styles/components/purchase-line-item-row.styles";

export type InvoiceLineItem = InvoiceItem;

function formatAmount(amount: string): string {
const value = parseFloat(amount);
if (Number.isNaN(value)) return amount;
return new Intl.NumberFormat("fr-FR", {
style: "currency",
currency: "USD",
}).format(value);
}

export function PurchaseLineItemRow({ item }: { item: InvoiceLineItem }) {
const unitLabel = formatAmount(item.unitPrice);
const lineTotal = formatAmount(
String(parseFloat(item.unitPrice) * item.quantity),
);

return (
<View style={styles.row}>
<View style={styles.left}>
<Text style={styles.name}>{item.productName}</Text>
<Text style={styles.qty}>
{item.quantity} × {unitLabel}
</Text>
</View>
<Text style={styles.total}>{lineTotal}</Text>
</View>
);
}
