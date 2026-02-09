import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#EFEFF3',
    padding: 14,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  topLeft: {
    flex: 1,
  },
  store: {
    fontSize: 14,
    fontWeight: '900',
    color: '#111',
  },
  date: {
    marginTop: 4,
    fontSize: 12,
    color: '#666',
  },
  badge: {
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#EFEFF3',
    backgroundColor: '#F7F7F9',
  },
  badgePaid: {
    borderColor: '#D4002A',
    backgroundColor: 'rgba(212, 0, 42, 0.08)',
  },
  badgePending: {
    borderColor: '#111',
    backgroundColor: 'rgba(17, 17, 17, 0.06)',
  },
  badgeRefunded: {
    borderColor: '#666',
    backgroundColor: 'rgba(102, 102, 102, 0.08)',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.4,
    color: '#111',
  },
  midRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 12,
  },
  total: {
    fontSize: 18,
    fontWeight: '900',
    color: '#111',
  },
  itemsCount: {
    fontSize: 12,
    color: '#666',
  },
  preview: {
    marginTop: 8,
    fontSize: 12,
    color: '#444',
  },
  cta: {
    marginTop: 10,
    fontSize: 12,
    color: '#666',
  },
  ctaEmphasis: {
    color: '#D4002A',
    fontWeight: '900',
  },
});
