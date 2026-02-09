import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7F9',
  },
  screen: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backPill: {
    backgroundColor: '#111',
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  backPillText: {
    color: '#fff',
    fontWeight: '800',
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    color: '#111',
  },
  spacer: {
    width: 90,
  },
  list: {
    flex: 1,
  },
  listContent: {
    flexGrow: 1,
    gap: 12,
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#EFEFF3',
    padding: 14,
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
    color: '#666',
  },
  summaryTitle: {
    marginTop: 6,
    fontSize: 16,
    fontWeight: '900',
    color: '#111',
  },
  summaryBody: {
    marginTop: 8,
    fontSize: 12,
    color: '#666',
    lineHeight: 17,
  },
  summaryEmphasis: {
    color: '#D4002A',
    fontWeight: '900',
  },
  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#EFEFF3',
    padding: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#111',
    marginBottom: 6,
  },
  emptyBody: {
    fontSize: 13,
    color: '#444',
    lineHeight: 18,
  },
});
