import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  wrapper: {
    gap: 12,
  },
  title: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
    color: '#666',
  },
  row: {
    gap: 10,
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EFEFF3',
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  dropdownText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#111',
  },
  dropdownChevron: {
    fontSize: 28,
    lineHeight: 28,
    fontWeight: '900',
    color: '#666',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  cell: {
    width: 56,
    height: 56,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#EFEFF3',
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  cellSelected: {
    borderColor: '#D4002A',
    borderWidth: 2,
  },
  avatar: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    borderRadius: 999,
  },
});
