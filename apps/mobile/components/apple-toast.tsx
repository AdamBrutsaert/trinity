import { useEffect, useMemo, useRef } from "react";
import { Animated, Text, View } from "react-native";

import { styles } from "@/styles/components/apple-toast.styles";

export function AppleToast({
	visible,
	title = "SCAN",
	message,
	topInset,
	onDismiss,
	durationMs = 2200,
}: {
	visible: boolean;
	title?: string;
	message: string;
	topInset: number;
	onDismiss: () => void;
	durationMs?: number;
}) {
	const translateY = useRef(new Animated.Value(-24)).current;
	const opacity = useRef(new Animated.Value(0)).current;

	const top = useMemo(() => topInset + 10, [topInset]);

	useEffect(() => {
		if (!visible) return;

		const show = Animated.parallel([
			Animated.timing(translateY, {
				toValue: 0,
				duration: 220,
				useNativeDriver: true,
			}),
			Animated.timing(opacity, {
				toValue: 1,
				duration: 220,
				useNativeDriver: true,
			}),
		]);

		const hide = Animated.parallel([
			Animated.timing(translateY, {
				toValue: -24,
				duration: 220,
				useNativeDriver: true,
			}),
			Animated.timing(opacity, {
				toValue: 0,
				duration: 220,
				useNativeDriver: true,
			}),
		]);

		show.start();

		const timeout = setTimeout(() => {
			hide.start(({ finished }) => {
				if (finished) onDismiss();
			});
		}, durationMs);

		return () => {
			clearTimeout(timeout);
		};
	}, [durationMs, onDismiss, opacity, translateY, visible]);

	if (!visible) return null;

	return (
		<View style={[styles.wrapper, { top }]} pointerEvents="none">
			<Animated.View
				style={[styles.toast, { transform: [{ translateY }], opacity }]}
			>
				<Text style={styles.title}>{title}</Text>
				<Text style={styles.message}>{message}</Text>
			</Animated.View>
		</View>
	);
}
