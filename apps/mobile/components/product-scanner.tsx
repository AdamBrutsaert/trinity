import React, { useCallback, useMemo, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import {
  CameraView,
  type BarcodeScanningResult,
  useCameraPermissions,
} from 'expo-camera';

import { styles } from '@/styles/components/product-scanner.styles';

export type ProductScanResult = {
  data: string;
  type: string;
};

export function ProductScanner({
  onScanned,
  scanningEnabled = true,
}: {
  onScanned: (result: ProductScanResult) => void;
  scanningEnabled?: boolean;
}) {
  const [permission, requestPermission] = useCameraPermissions();
  const [lastScannedAt, setLastScannedAt] = useState<number>(0);

  const canUseCamera = permission?.granted === true;

  const handleBarcodeScanned = useCallback(
    (result: BarcodeScanningResult) => {
      const now = Date.now();
      if (now - lastScannedAt < 1200) return;
      setLastScannedAt(now);

      const data = typeof result.data === 'string' ? result.data : '';
      const type = typeof result.type === 'string' ? result.type : 'unknown';

      onScanned({ data, type });
    },
    [lastScannedAt, onScanned],
  );

  const permissionUi = useMemo(() => {
    const title = "Camera required";
    const body =
      "To scan product barcodes, Trinity needs access to your camera. You can change this anytime in your phone settings.";

    return (
      <View style={styles.permissionContainer}>
        <View style={styles.permissionCard}>
          <Text style={styles.permissionTitle}>{title}</Text>
          <Text style={styles.permissionBody}>{body}</Text>

          <TouchableOpacity
            onPress={() => requestPermission()}
            accessibilityRole="button"
            style={styles.permissionButton}
            activeOpacity={0.85}
          >
            <Text style={styles.permissionButtonText}>Enable camera</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }, [requestPermission]);

  if (!permission) return permissionUi;
  if (!canUseCamera) return permissionUi;

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing="back"
        onBarcodeScanned={scanningEnabled ? handleBarcodeScanned : undefined}
      />
      <View style={styles.hintPill} pointerEvents="none">
        <Text style={styles.hintText}>Aim at a barcode to scan</Text>
      </View>
    </View>
  );
}
