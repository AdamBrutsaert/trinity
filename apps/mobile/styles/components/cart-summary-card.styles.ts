import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#EFEFF3',
    padding: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    fontWeight: '800',
    color: '#666',
    letterSpacing: 0.2,
  },
  total: {
    fontSize: 20,
    fontWeight: '900',
    color: '#111',
  },
  hint: {
    marginTop: 10,
    fontSize: 12,
    color: '#666',
  },
});
