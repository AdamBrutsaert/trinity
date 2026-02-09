import React, { useMemo } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import { styles } from '@/styles/components/purchase-history-row.styles';

export type PurchaseHistoryItem = {
  id: string;
  createdAtIso: string;
  totalCents: number;
  itemsCount: number;
  storeName: string;
  status: 'paid' | 'refunded' | 'pending';
  previewItems: string[];
};

function formatEur(cents: number): string {
  const value = cents / 100;
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Unknown date';
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function PurchaseHistoryRow({
  item,
  onPress,
}: {
  item: PurchaseHistoryItem;
  onPress: (item: PurchaseHistoryItem) => void;
}) {
  const dateLabel = useMemo(() => formatDate(item.createdAtIso), [item.createdAtIso]);
  const totalLabel = useMemo(() => formatEur(item.totalCents), [item.totalCents]);
  const itemsLabel = useMemo(
    () => (item.itemsCount === 1 ? '1 item' : `${item.itemsCount} items`),
    [item.itemsCount],
  );

  const badgeText = useMemo(() => {
    switch (item.status) {
      case 'paid':
        return 'PAID';
      case 'pending':
        return 'PENDING';
      case 'refunded':
        return 'REFUNDED';
      default:
        return 'UNKNOWN';
    }
  }, [item.status]);

  const preview = useMemo(() => item.previewItems.slice(0, 3), [item.previewItems]);

  return (
    <TouchableOpacity
      accessibilityRole="button"
      activeOpacity={0.85}
      style={styles.card}
      onPress={() => onPress(item)}
    >
      <View style={styles.topRow}>
        <View style={styles.topLeft}>
          <Text style={styles.store}>{item.storeName}</Text>
          <Text style={styles.date}>{dateLabel}</Text>
        </View>

        <View style={[styles.badge, item.status === 'paid' ? styles.badgePaid : null, item.status === 'pending' ? styles.badgePending : null, item.status === 'refunded' ? styles.badgeRefunded : null]}>
          <Text style={styles.badgeText}>{badgeText}</Text>
        </View>
      </View>

      <View style={styles.midRow}>
        <Text style={styles.total}>{totalLabel}</Text>
        <Text style={styles.itemsCount}>{itemsLabel}</Text>
      </View>

      {preview.length ? (
        <Text style={styles.preview} numberOfLines={1}>
          {preview.join(' • ')}
        </Text>
      ) : null}

      <Text style={styles.cta}>
        View details <Text style={styles.ctaEmphasis}>→</Text>
      </Text>
    </TouchableOpacity>
  );
}
