import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 100,
    alignItems: 'center',
  },
  toast: {
    width: '92%',
    maxWidth: 480,
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EFEFF3',
    paddingVertical: 12,
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 22,
    elevation: 8,
  },
  title: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
    color: '#666',
    marginBottom: 6,
  },
  message: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111',
  },
});
