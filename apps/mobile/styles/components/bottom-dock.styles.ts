import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  bottomDock: {
    position: 'absolute',
    left: 12,
    right: 12,
    backgroundColor: '#fff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#EFEFF3',
    paddingTop: 12,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  dockToggle: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
  },
  dockToggleExpanded: {
    backgroundColor: '#111',
  },
  dockToggleCollapsed: {
    backgroundColor: '#F1F1F5',
  },
  dockToggleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dockToggleText: {
    fontWeight: '800',
    color: '#fff',
  },
  dockToggleTextCollapsed: {
    color: '#111',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingTop: 10,
  },
});
