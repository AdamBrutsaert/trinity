import type React from "react";
import { Text, TouchableOpacity, View } from "react-native";

import { styles } from "@/styles/components/deals-section-card.styles";

export type DealsSectionVariant = "promo" | "forYou";

export function DealsSectionCard({
	variant,
	pillLabel,
	title,
	subtitle,
	open,
	onPress,
	children,
}: React.PropsWithChildren<{
	variant: DealsSectionVariant;
	pillLabel: string;
	title: string;
	subtitle: string;
	open: boolean;
	onPress: () => void;
}>) {
	return (
		<View
			style={[
				styles.card,
				variant === "promo" ? styles.cardPromo : styles.cardForYou,
			]}
		>
			<TouchableOpacity
				accessibilityRole="button"
				activeOpacity={0.85}
				onPress={onPress}
				style={styles.header}
			>
				<View style={styles.headerLeft}>
					<View
						style={[
							styles.pill,
							variant === "promo" ? styles.pillPromo : styles.pillForYou,
						]}
					>
						<Text
							style={[
								styles.pillText,
								variant === "promo"
									? styles.pillTextPromo
									: styles.pillTextForYou,
							]}
						>
							{pillLabel}
						</Text>
					</View>

					<Text style={styles.title}>{title}</Text>
					<Text style={styles.subtitle}>{subtitle}</Text>
				</View>

				<View style={styles.chevronWrap}>
					<Text style={[styles.chevron, open ? styles.chevronOpen : null]}>
						›
					</Text>
				</View>
			</TouchableOpacity>

			{open ? <View style={styles.body}>{children}</View> : null}
		</View>
	);
}
