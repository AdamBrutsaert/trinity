import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomDock } from '@/components/bottom-dock';
import { HomeDealsRecommendationsSection } from '@/components/home-deals-recommendations-section';
import { HomeHeader } from '@/components/home-header';
import { HomeNotificationsSection } from '@/components/home-notifications-section';
import { useAuth } from '@/features/auth/AuthContext';
import { styles } from '@/styles/screens/home.styles';

export default function HomeScreen() {
  const { user, logout } = useAuth();
  const insets = useSafeAreaInsets();

  const [dockHeight, setDockHeight] = useState(0);
  const [dockCollapsed, setDockCollapsed] = useState(false);

  const firstName = useMemo(() => {
    if (!user) return null;
    if (typeof user.firstName === 'string' && user.firstName.trim()) return user.firstName.trim();
    if (typeof user.email === 'string' && user.email.includes('@')) return user.email.split('@')[0];
    return null;
  }, [user]);

  const notifications = useMemo(
    () => [
      {
        id: 'promo-1',
        title: 'Deal of the week',
        body: 'Save 10% on baskets over €30 until Sunday.',
      },
      {
        id: 'info-1',
        title: 'Update',
        body: 'Product scanning is coming soon.',
      },
    ],
    [],
  );

  const recommendations = useMemo(
    () => [
      { id: 'rec-1', title: 'Coffee beans', reason: 'Often bought with your recent baskets' },
      { id: 'rec-2', title: 'Whole wheat pasta', reason: 'Recommended based on your history' },
      { id: 'rec-3', title: 'Almond milk', reason: 'Trending this week' },
    ],
    [],
  );

  const handleLogout = async () => {
    await logout();
  };

  const comingSoon = useCallback((featureName: string) => {
    Alert.alert('Coming soon', `${featureName} will be available soon.`);
  }, []);

  const toggleDockCollapsed = () => {
    setDockCollapsed((v) => !v);
  };

  const dockActions = useMemo(
    () => [
      {
        key: 'scan',
        title: 'Scan',
        subtitle: 'Product',
        onPress: () => router.push('/scan'),
      },
      {
        key: 'cart',
        title: 'Cart',
        subtitle: 'View',
        onPress: () => comingSoon('View cart'),
      },
      {
        key: 'history',
        title: 'History',
        subtitle: 'Purchases',
        onPress: () => comingSoon('Purchase history'),
      },
      {
        key: 'account',
        title: 'Account',
        subtitle: 'Manage',
        onPress: () => comingSoon('Manage account'),
      },
    ],
    [comingSoon],
  );

  const dockBottomOffset = Math.max(0, (insets.bottom || 0) - 26);
  const dockPaddingBottom = 12;
  const visibleDockHeight = dockHeight
    ? dockHeight + dockBottomOffset
    : (dockCollapsed ? 72 : 220) + dockBottomOffset;
  const scrollPaddingBottom = visibleDockHeight;

  const onDockLayout = (e: LayoutChangeEvent) => {
    const height = e?.nativeEvent?.layout?.height;
    if (!height || typeof height !== 'number') return;
    setDockHeight(height);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.screen}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: scrollPaddingBottom }]}
          showsVerticalScrollIndicator={false}
        >
          <HomeHeader firstName={firstName} onLogout={handleLogout} />

          <HomeNotificationsSection
            title="Notifications"
            notifications={notifications}
            onPressNotification={() => comingSoon('Notification details')}
          />

          <HomeDealsRecommendationsSection
            title="Deals & recommendations"
            recommendations={recommendations}
            onPressDeals={() => comingSoon('Deals')}
            onPressQuickPicks={() => comingSoon('Recommendations')}
            onPressRecommendation={(recommendation) => comingSoon(recommendation.title)}
          />
        </ScrollView>

        <BottomDock
          collapsed={dockCollapsed}
          onToggleCollapsed={toggleDockCollapsed}
          onLayout={onDockLayout}
          bottomOffset={dockBottomOffset}
          paddingBottom={dockPaddingBottom}
          actions={dockActions}
        />
      </View>
    </SafeAreaView>
  );
}
