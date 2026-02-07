import React from 'react';
import { Text, TouchableOpacity, View, type LayoutChangeEvent } from 'react-native';

import { ActionButton } from '@/components/action-button';
import { styles } from '@/styles/components/bottom-dock.styles';

export type BottomDockAction = {
  key: string;
  title: string;
  subtitle: string;
  onPress: () => void;
};

export function BottomDock({
  collapsed,
  onToggleCollapsed,
  onLayout,
  bottomOffset,
  paddingBottom,
  actions,
}: {
  collapsed: boolean;
  onToggleCollapsed: () => void;
  onLayout: (e: LayoutChangeEvent) => void;
  bottomOffset: number;
  paddingBottom: number;
  actions: BottomDockAction[];
}) {
  return (
    <View
      onLayout={onLayout}
      style={[styles.bottomDock, { paddingBottom, bottom: bottomOffset }]}
    >
      <TouchableOpacity
        onPress={onToggleCollapsed}
        accessibilityRole="button"
        style={[styles.dockToggle, collapsed ? styles.dockToggleCollapsed : styles.dockToggleExpanded]}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        activeOpacity={0.85}
      >
        <Text style={[styles.dockToggleText, collapsed ? styles.dockToggleTextCollapsed : null]}>
          {collapsed ? 'Show actions' : 'Collapse'}
        </Text>
      </TouchableOpacity>

      {!collapsed ? (
        <View style={styles.actionsGrid}>
          {actions.map((action) => (
            <ActionButton
              key={action.key}
              title={action.title}
              subtitle={action.subtitle}
              onPress={action.onPress}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}
