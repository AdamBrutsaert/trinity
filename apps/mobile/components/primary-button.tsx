import React from 'react';
import { Text, TouchableOpacity } from 'react-native';

import { styles } from '@/styles/components/primary-button.styles';

export function PrimaryButton({
  title,
  onPress,
  disabled = false,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      style={[styles.button, styles.primary, disabled ? styles.primaryDisabled : null]}
      onPress={onPress}
      activeOpacity={0.85}
      disabled={disabled}
    >
      <Text style={styles.text}>{title}</Text>
    </TouchableOpacity>
  );
}
