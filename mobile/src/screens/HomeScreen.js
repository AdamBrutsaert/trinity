import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';

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

  const comingSoon = (featureName) => {
    Alert.alert('Coming soon', `${featureName} will be available soon.`);
  };

  const toggleDockCollapsed = () => {
    setDockCollapsed((v) => !v);
  };

  const dockBottomOffset = Math.max(0, (insets?.bottom || 0) - 26);
  const dockPaddingBottom = 12;
  const visibleDockHeight = dockHeight
    ? dockHeight + dockBottomOffset
    : (dockCollapsed ? 72 : 220) + dockBottomOffset;
  const scrollPaddingBottom = visibleDockHeight + 0;

  const onDockLayout = (e) => {
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
          <View style={styles.header}>
            <View style={styles.headerTopRow}>
              <View style={styles.headerTitles}>
                <Text style={styles.brand}>Trinity</Text>
                {/* <Text style={styles.subtitle}>{firstName ? `Hi, ${firstName}` : 'Welcome'}</Text> */}
              </View>

              <TouchableOpacity
                onPress={handleLogout}
                accessibilityRole="button"
                style={styles.logoutPill}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                activeOpacity={0.8}
              >
                <Text style={styles.logoutPillText}>Log out</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.headerDivider} />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notifications</Text>
            {notifications.map((n) => (
              <TouchableOpacity
                key={n.id}
                style={styles.notificationCard}
                onPress={() => comingSoon('Notification details')}
                accessibilityRole="button"
                activeOpacity={0.85}
              >
                <Text style={styles.notificationTitle}>{n.title}</Text>
                <Text style={styles.notificationBody}>{n.body}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Deals & recommendations</Text>

            <View style={styles.promoRow}>
              <TouchableOpacity
                style={[styles.promoCard, styles.promoCardPrimary, styles.promoCardLeft]}
                onPress={() => comingSoon('Deals')}
                accessibilityRole="button"
                activeOpacity={0.85}
              >
                <Text style={styles.promoBadge}>PROMO</Text>
                <Text style={styles.promoTitle}>Save on essentials</Text>
                <Text style={styles.promoBody}>Deals tailored to your purchase history.</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.promoCard, styles.promoCardSecondary]}
                onPress={() => comingSoon('Recommendations')}
                accessibilityRole="button"
                activeOpacity={0.85}
              >
                <Text style={styles.promoBadgeAlt}>FOR YOU</Text>
                <Text style={styles.promoTitle}>Quick picks</Text>
                <Text style={styles.promoBody}>Add to your cart in one tap.</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.recoList}>
              {recommendations.map((r) => (
                <TouchableOpacity
                  key={r.id}
                  style={styles.recoItem}
                  onPress={() => comingSoon(r.title)}
                  accessibilityRole="button"
                  activeOpacity={0.85}
                >
                  <View style={styles.recoDot} />
                  <View style={styles.recoTexts}>
                    <Text style={styles.recoTitle}>{r.title}</Text>
                    <Text style={styles.recoReason}>{r.reason}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick access</Text>
          </View>
        </ScrollView>

        <View
          onLayout={onDockLayout}
          style={[
            styles.bottomDock,
            { paddingBottom: dockPaddingBottom, bottom: dockBottomOffset },
          ]}
        >
          <TouchableOpacity
            onPress={toggleDockCollapsed}
            accessibilityRole="button"
            style={[styles.dockToggle, dockCollapsed ? styles.dockToggleCollapsed : styles.dockToggleExpanded]}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            activeOpacity={0.85}
          >
            <Text
              style={[styles.dockToggleText, dockCollapsed ? styles.dockToggleTextCollapsed : null]}
            >
              {dockCollapsed ? 'Show actions' : 'Collapse'}
            </Text>
          </TouchableOpacity>

          {!dockCollapsed ? (
            <View style={styles.actionsGrid}>
              <ActionButton title="Scan" subtitle="Product" onPress={() => comingSoon('Scan a product')} />
              <ActionButton title="Cart" subtitle="View" onPress={() => comingSoon('View cart')} />
              <ActionButton title="History" subtitle="Purchases" onPress={() => comingSoon('Purchase history')} />
              <ActionButton title="Account" subtitle="Manage" onPress={() => comingSoon('Manage account')} />
            </View>
          ) : null}
        </View>
      </View>
    </SafeAreaView>
  );
}

function ActionButton({ title, subtitle, onPress }) {
  return (
    <TouchableOpacity
      style={styles.actionButton}
      onPress={onPress}
      accessibilityRole="button"
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      activeOpacity={0.85}
    >
      <View style={styles.actionIcon} />
      <Text style={styles.actionTitle}>{title}</Text>
      <Text style={styles.actionSubtitle}>{subtitle}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7F9',
  },
  screen: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: {
    padding: 20,
  },
  header: {
    marginBottom: 16,
  },
  headerDivider: {
    marginTop: 14,
    height: 1,
    backgroundColor: '#E6E6EA',
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitles: {
    flex: 1,
    paddingRight: 10,
  },
  brand: {
    fontSize: 34,
    fontWeight: '800',
    color: '#111',
    letterSpacing: -0.2,
  },
  subtitle: {
    marginTop: 2,
    fontSize: 15,
    color: '#555',
    fontWeight: '600',
  },
  overviewText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  logoutPill: {
    backgroundColor: '#fff',
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#e7e7e7',
  },
  logoutPillText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111',
  },

  section: {
    marginTop: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111',
    marginBottom: 10,
  },
  sectionHint: {
    fontSize: 13,
    color: '#666',
    fontWeight: '600',
    lineHeight: 18,
  },

  notificationCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ececec',
    marginBottom: 10,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111',
    marginBottom: 4,
  },
  notificationBody: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },

  promoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  promoCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    minHeight: 120,
  },
  promoCardLeft: {
    marginRight: 12,
  },
  promoCardPrimary: {
    backgroundColor: '#D4002A',
  },
  promoCardSecondary: {
    backgroundColor: '#111',
  },
  promoBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 10,
  },
  promoBadgeAlt: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 10,
  },
  promoTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '900',
    marginBottom: 6,
  },
  promoBody: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },

  recoList: {
    marginTop: 12,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ececec',
    padding: 8,
  },
  recoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  recoDot: {
    width: 10,
    height: 10,
    borderRadius: 10,
    backgroundColor: '#D4002A',
    marginRight: 10,
  },
  recoTexts: { flex: 1 },
  recoTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111',
    marginBottom: 2,
  },
  recoReason: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },

  bottomDock: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 0,
    backgroundColor: '#fff',
    borderRadius: 24,
    // paddingTop: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#e9e9e9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  dockToggle: {
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  dockToggleCollapsed: {
    paddingVertical: 6,
  },
  dockToggleExpanded: {
    paddingVertical: 10,
  },
  dockToggleText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#444',
    textAlign: 'center',
  },
  dockToggleTextCollapsed: {
    paddingTop: 8,
    fontSize: 14,
    lineHeight: 0,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
  },
  actionButton: {
    width: '48%',
    minHeight: 92,
    backgroundColor: '#f7f7f7',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#ededed',
  },
  actionIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: '#D4002A',
    marginBottom: 10,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#111',
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#666',
  },
});
