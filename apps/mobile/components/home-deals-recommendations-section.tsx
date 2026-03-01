import { Text, TouchableOpacity, View } from "react-native";

import { styles } from "@/styles/components/home-deals-recommendations-section.styles";

export type HomeRecommendation = {
	id: string;
	title: string;
	reason: string;
};

export function HomeDealsRecommendationsSection({
	title,
	recommendations,
	onPressDeals,
	onPressQuickPicks,
	onPressRecommendation,
}: {
	title: string;
	recommendations: HomeRecommendation[];
	onPressDeals: () => void;
	onPressQuickPicks: () => void;
	onPressRecommendation: (recommendation: HomeRecommendation) => void;
}) {
	return (
		<View style={styles.section}>
			<Text style={styles.sectionTitle}>{title}</Text>

			<View style={styles.promoRow}>
				<TouchableOpacity
					style={[
						styles.promoCard,
						styles.promoCardPrimary,
						styles.promoCardLeft,
					]}
					onPress={onPressDeals}
					accessibilityRole="button"
					activeOpacity={0.85}
				>
					<View style={[styles.promoPill, styles.promoPillPrimary]}>
						<Text style={[styles.promoPillText, styles.promoPillTextPrimary]}>
							PROMO
						</Text>
					</View>
					<Text style={styles.promoTitle}>Save on essentials</Text>
					<Text style={styles.promoBody}>
						Deals tailored to your purchase history.
					</Text>
				</TouchableOpacity>

				<TouchableOpacity
					style={[styles.promoCard, styles.promoCardSecondary]}
					onPress={onPressQuickPicks}
					accessibilityRole="button"
					activeOpacity={0.85}
				>
					<View style={[styles.promoPill, styles.promoPillSecondary]}>
						<Text style={[styles.promoPillText, styles.promoPillTextSecondary]}>
							FOR YOU
						</Text>
					</View>
					<Text style={[styles.promoTitle, styles.promoTitleAlt]}>
						Quick picks
					</Text>
					<Text style={[styles.promoBody, styles.promoBodyAlt]}>
						Add to your cart in one tap.
					</Text>
				</TouchableOpacity>
			</View>

			<View style={styles.recoList}>
				{recommendations.map((recommendation) => (
					<TouchableOpacity
						key={recommendation.id}
						style={styles.recoItem}
						onPress={() => onPressRecommendation(recommendation)}
						accessibilityRole="button"
						activeOpacity={0.85}
					>
						<View style={styles.recoDot} />
						<View style={styles.recoTexts}>
							<Text style={styles.recoTitle}>{recommendation.title}</Text>
							<Text style={styles.recoReason}>{recommendation.reason}</Text>
						</View>
					</TouchableOpacity>
				))}
			</View>
		</View>
	);
}
