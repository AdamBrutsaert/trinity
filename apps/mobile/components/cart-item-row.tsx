import React, { useMemo } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import { QuantityStepper } from '@/components/quantity-stepper';
import { styles } from '@/styles/components/cart-item-row.styles';

export type CartItem = {
  id: string;
  name: string;
  unitPriceCents: number;
  quantity: number;
};

function formatEur(cents: number): string {
  const value = cents / 100;
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);
}

export function CartItemRow({
  item,
  onChangeQuantity,
  onRemove,
}: {
  item: CartItem;
  onChangeQuantity: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
}) {
  const lineTotalCents = useMemo(() => item.unitPriceCents * item.quantity, [item.quantity, item.unitPriceCents]);

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{item.name}</Text>
          <Text style={styles.subtitle}>{formatEur(item.unitPriceCents)} each</Text>
        </View>
        <Text style={styles.price}>{formatEur(lineTotalCents)}</Text>
      </View>

      <View style={styles.bottomRow}>
        <QuantityStepper
          value={item.quantity}
          minValue={1}
          onChange={(next) => onChangeQuantity(item.id, next)}
        />

        <TouchableOpacity
          accessibilityRole="button"
          style={styles.removePill}
          onPress={() => onRemove(item.id)}
          activeOpacity={0.85}
        >
          <Text style={styles.removeText}>Remove</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
