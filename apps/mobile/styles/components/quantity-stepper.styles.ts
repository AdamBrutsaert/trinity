import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  button: {
    width: 34,
    height: 34,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EFEFF3',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#111',
    marginTop: -1,
  },
  value: {
    minWidth: 18,
    textAlign: 'center',
    fontWeight: '900',
    color: '#111',
  },
});
