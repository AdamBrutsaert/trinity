import React, { useCallback, useState } from 'react';
import { SafeAreaView, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppleToast } from '@/components/apple-toast';
import { ProductScanner } from '@/components/product-scanner';
import { styles } from '@/styles/screens/scan.styles';

export default function ScanScreen() {
  const insets = useSafeAreaInsets();

  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const onDismissToast = useCallback(() => {
    setToastVisible(false);
  }, []);

  const handleScanned = useCallback((result: { data: string; type: string }) => {
    const value = result.data?.trim() || '(empty)';
    setToastMessage(value);
    setToastVisible(true);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <AppleToast
        visible={toastVisible}
        title="SCAN"
        message={toastMessage}
        topInset={insets.top}
        onDismiss={onDismissToast}
      />

      <View style={styles.screen}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            accessibilityRole="button"
            style={styles.backPill}
            activeOpacity={0.85}
          >
            <Text style={styles.backPillText}>Back</Text>
          </TouchableOpacity>

          <Text style={styles.title}>Scan product</Text>

          <View style={styles.spacer} />
        </View>

        <View style={styles.scannerBlock}>
          <ProductScanner onScanned={handleScanned} scanningEnabled={!toastVisible} />
        </View>
      </View>
    </SafeAreaView>
  );
}
