import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, SafeAreaView, Text, TouchableOpacity, View, type LayoutChangeEvent } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HistoryActionsBar } from '@/components/history-actions-bar';
import { PurchaseHistoryRow, type PurchaseHistoryItem } from '@/components/purchase-history-row';
import { getFakePurchases } from '@/lib/fake-purchase-history';
import { styles } from '@/styles/screens/history.styles';

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();

  const [actionsHeight, setActionsHeight] = useState(110);

  const purchases = useMemo(() => getFakePurchases(), []);

  const onRowPress = useCallback((item: PurchaseHistoryItem) => {
    router.push({ pathname: '/history-order', params: { id: item.id } });
  }, []);

  const onActionsLayout = useCallback((e: LayoutChangeEvent) => {
    const next = Math.ceil(e.nativeEvent.layout.height);
    if (!Number.isFinite(next) || next <= 0) return;
    setActionsHeight(next);
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

          <Text style={styles.title}>History</Text>

          <View style={styles.spacer} />
        </View>

        <FlatList
          style={styles.list}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: actionsHeight + Math.max(24, insets.bottom + 18) },
          ]}
          data={purchases}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>PURCHASE HISTORY</Text>
              <Text style={styles.summaryTitle}>{purchases.length} recent purchases</Text>
              <Text style={styles.summaryBody}>
                This is UI-only for now. Soon you’ll be able to view receipts and reorder in{' '}
                <Text style={styles.summaryEmphasis}>one tap</Text>.
              </Text>
            </View>
          }
          renderItem={({ item }) => <PurchaseHistoryRow item={item} onPress={onRowPress} />}
          ListEmptyComponent={
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No purchases yet</Text>
              <Text style={styles.emptyBody}>Scan products and complete a purchase to see your history here.</Text>
            </View>
          }
        />
      </View>

      <HistoryActionsBar onScan={() => router.push('/scan')} onCart={() => router.push('/cart')} onLayout={onActionsLayout} />
    </SafeAreaView>
  );
}
