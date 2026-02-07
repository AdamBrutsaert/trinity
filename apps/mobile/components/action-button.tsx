import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import type { SvgProps } from 'react-native-svg';

import { styles } from '@/styles/components/action-button.styles';

export function ActionButton({
  title,
  subtitle,
  onPress,
  Icon,
  iconColor = '#fff',
}: {
  title: string;
  subtitle: string;
  onPress: () => void;
  Icon?: React.ComponentType<SvgProps>;
  iconColor?: string;
}) {
  return (
    <TouchableOpacity
      style={styles.actionButton}
      onPress={onPress}
      accessibilityRole="button"
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      activeOpacity={0.85}
    >
      <View style={styles.actionIcon}>
        {Icon ? <Icon width={18} height={18} color={iconColor} /> : null}
      </View>
      <Text style={styles.actionTitle}>{title}</Text>
      <Text style={styles.actionSubtitle}>{subtitle}</Text>
    </TouchableOpacity>
  );
}
