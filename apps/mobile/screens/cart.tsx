import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, SafeAreaView, Text, TouchableOpacity, View, type LayoutChangeEvent } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CartItemRow, type CartItem } from '@/components/cart-item-row';
import { CartOverviewCard } from '@/components/cart-overview-card';
import { CartPurchaseBar } from '@/components/cart-purchase-bar';
import { styles } from '@/styles/screens/cart.styles';

export default function CartScreen() {
  const insets = useSafeAreaInsets();

  const [purchaseBarHeight, setPurchaseBarHeight] = useState(84);

  const [items, setItems] = useState<CartItem[]>(() => [
    { id: 'coffee', name: 'Coffee beans', unitPriceCents: 699, quantity: 1 },
    { id: 'pasta', name: 'Whole wheat pasta', unitPriceCents: 239, quantity: 2 },
    { id: 'milk', name: 'Almond milk', unitPriceCents: 319, quantity: 1 },
  ]);

  const itemsCount = useMemo(() => items.reduce((acc, item) => acc + item.quantity, 0), [items]);
  const totalCents = useMemo(
    () => items.reduce((acc, item) => acc + item.unitPriceCents * item.quantity, 0),
    [items],
  );

  const onChangeQuantity = useCallback((id: string, quantity: number) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, quantity } : item)));
  }, []);

  const onRemove = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const onPurchase = useCallback(() => {
    router.push('/purchase');
  }, []);

  const onScanMore = useCallback(() => {
    router.push('/scan');
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

        <CartOverviewCard totalCents={totalCents} itemsCount={itemsCount} onScanMore={onScanMore} />

        <FlatList
          style={styles.list}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: purchaseBarHeight + Math.max(24, insets.bottom + 18) },
            items.length === 0 ? styles.listContentEmpty : null,
          ]}
          data={items}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <CartItemRow item={item} onChangeQuantity={onChangeQuantity} onRemove={onRemove} />
          )}
          ListEmptyComponent={
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>Your cart is empty</Text>
              <Text style={styles.emptyBody}>Scan products and add them here.</Text>
            </View>
          }
        />
      </View>

      <CartPurchaseBar
        totalCents={totalCents}
        itemsCount={itemsCount}
        bottomInset={insets.bottom}
        onPurchase={onPurchase}
        onLayout={onPurchaseBarLayout}
      />
    </SafeAreaView>
  );
}
