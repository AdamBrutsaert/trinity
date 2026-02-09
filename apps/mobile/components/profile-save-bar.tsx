import React, { useMemo } from 'react';
import { Text, View, type LayoutChangeEvent } from 'react-native';

import { PrimaryButton } from '@/components/primary-button';
import { styles } from '@/styles/components/profile-save-bar.styles';

export function ProfileSaveBar({
  enabled,
  saving,
  bottomInset,
  onSave,
  onLayout,
}: {
  enabled: boolean;
  saving: boolean;
  bottomInset: number;
  onSave: () => void;
  onLayout: (e: LayoutChangeEvent) => void;
}) {
  const bottom = useMemo(() => Math.max(12, bottomInset + 10), [bottomInset]);
  const label = useMemo(() => {
    if (saving) return 'Saving…';
    if (enabled) return 'Unsaved changes';
    return 'No changes';
  }, [enabled, saving]);

  return (
    <View style={[styles.wrapper, { bottom }]} onLayout={onLayout}>
      <View style={styles.bar}>
        <View style={styles.row}>
          <Text style={[styles.label, enabled ? styles.labelEnabled : null]}>{label}</Text>
          <View style={styles.buttonWrap}>
            <PrimaryButton
              title={saving ? 'Saving…' : 'Save changes'}
              onPress={onSave}
              disabled={!enabled || saving}
            />
          </View>
        </View>
      </View>
    </View>
  );
}
