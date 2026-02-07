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
    marginTop: 12,
  },
  listContent: {
    flexGrow: 1,
    justifyContent: 'flex-start',
    paddingBottom: 0,
    gap: 12,
  },
  listContentEmpty: {
    justifyContent: 'center',
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
