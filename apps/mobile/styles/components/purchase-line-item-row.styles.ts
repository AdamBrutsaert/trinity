import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFF3',
  },
  left: {
    flex: 1,
  },
  name: {
    fontSize: 13,
    fontWeight: '900',
    color: '#111',
  },
  meta: {
    marginTop: 4,
    fontSize: 12,
    color: '#666',
  },
  total: {
    fontSize: 13,
    fontWeight: '900',
    color: '#111',
  },
});
