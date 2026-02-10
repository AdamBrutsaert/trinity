import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F1F5',
  },
  left: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    flex: 1,
    fontSize: 14,
    fontWeight: '900',
    color: '#111',
  },
  subtitle: {
    marginTop: 3,
    fontSize: 12,
    color: '#666',
  },
  discountPill: {
    borderRadius: 999,
    paddingVertical: 3,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(212, 0, 42, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(212, 0, 42, 0.22)',
  },
  discountText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#D4002A',
    letterSpacing: 0.3,
  },
  right: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 8,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  price: {
    fontSize: 14,
    fontWeight: '900',
    color: '#111',
  },
  originalPrice: {
    fontSize: 12,
    color: '#666',
    textDecorationLine: 'line-through',
  },
  buttonWrap: {
    width: 96,
  },
});
