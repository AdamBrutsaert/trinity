import React, { useMemo } from 'react';
import { Text, View } from 'react-native';

import { styles } from '@/styles/components/purchase-line-item-row.styles';
import type { PurchaseLineItem } from '@/lib/fake-purchase-history';

function formatEur(cents: number): string {
  const value = cents / 100;
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);
}

export function PurchaseLineItemRow({ item }: { item: PurchaseLineItem }) {
  const totalLabel = useMemo(() => formatEur(item.unitPriceCents * item.quantity), [item.quantity, item.unitPriceCents]);

  return (
    <View style={styles.row}>
      <View style={styles.left}>
        <Text style={styles.name} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.meta}>
          {item.quantity} × {formatEur(item.unitPriceCents)}
        </Text>
      </View>

      <Text style={styles.total}>{totalLabel}</Text>
    </View>
  );
}
