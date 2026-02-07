import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
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
    color: '#666',
  },
  logoutPill: {
    backgroundColor: '#111',
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  logoutPillText: {
    color: '#fff',
    fontWeight: '700',
  },
});
